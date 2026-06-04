// ─────────────────────────────────────────────────────────────────────────────
// features/posts/hooks.ts — React Query hooks for the posts table
//
// CACHE KEY DESIGN:
//   ['posts', voyageId]     — all posts for one voyage (used by PostList, VoyageDetailPage)
//   ['post', postId]        — single post by id (used by PostDetailPage, PostEditorPage)
//   ['feed']                — multi-user feed via get_feed() RPC (used by FeedPage)
//   ['voyage-post-counts']  — aggregated counts per voyage (used by VoyageCard badges)
//
// Including voyageId as the second element means React Query caches a separate
// result per voyage, so switching voyages shows the right posts instantly from
// cache without a loading flash.
//
// INVALIDATION RULES (spec §9):
//   useCreatePost  → invalidate ['posts', voyageId], ['voyage-post-counts']
//   useUpdatePost  → invalidate ['posts', voyageId], ['post', id], ['feed']
//   useDeletePost  → invalidate ['posts', voyageId], ['voyage-post-counts'], ['feed']
//
// 'feed' is invalidated after any content mutation because the feed aggregates
// posts from multiple voyages and the live-edit/delete must be reflected
// immediately for the author viewing their own feed.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import type { Audience } from '@/types/models'

// ── Row shape ─────────────────────────────────────────────────────────────────
// This mirrors the DB schema exactly. Camel-case fields are used everywhere else
// in the app; converters translate between these shapes where needed.

export interface PostRow {
  id:          string
  voyage_id:   string
  user_id:     string
  title:       string | null
  body:        string
  post_date:   string | null
  location:    string | null
  media_ids:   string[]
  media_paths: string[]         // storage paths in daily-photos bucket
  audience:    Audience
  metadata:    Record<string, unknown> | null
  created_at:  string
  updated_at:  string
}

// CreatePostInput omits server-controlled fields (id, user_id, created_at, updated_at).
// voyage_id, body, and audience are required; everything else is optional.
export type CreatePostInput = Pick<PostRow, 'voyage_id' | 'body' | 'audience'> &
  Partial<Pick<PostRow, 'title' | 'post_date' | 'location' | 'media_ids' | 'media_paths' | 'metadata'>>

// UpdatePostInput allows editing any field except the immutable identifiers.
export type UpdatePostInput = Partial<Omit<PostRow, 'id' | 'voyage_id' | 'user_id' | 'created_at'>>

// ── usePostsByVoyage ──────────────────────────────────────────────────────────
// Primary read hook for the PostList tab inside VoyageDetailPage.
// Ordered by post_date descending (most recent day first), with a secondary sort
// on created_at to break ties when multiple posts share the same post_date.
// nullsFirst: false puts posts without a post_date at the bottom.

export function usePostsByVoyage(voyageId: string | null | undefined) {
  return useQuery({
    queryKey: ['posts', voyageId],
    queryFn: async () => {
      if (!voyageId) return [] as PostRow[]
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('voyage_id', voyageId)
        .order('post_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as PostRow[]
    },
    // enabled guard prevents a query with a null voyageId from being dispatched
    // (would return all posts or throw an RLS error).
    enabled: !!voyageId,
  })
}

// ── usePost ───────────────────────────────────────────────────────────────────
// Single-post fetch for PostDetailPage and PostEditorPage.
// The cache key ['post', postId] is also invalidated by useUpdatePost so that
// the detail view reflects edits made in the editor immediately.

export function usePost(postId: string | null | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) return null
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()
      if (error) throw error
      return data as PostRow
    },
    enabled: !!postId,
  })
}

// ── useCreatePost ─────────────────────────────────────────────────────────────
// Injects the current user's id from UserCtx so callers don't have to pass it.
// media_ids defaults to [] rather than undefined to satisfy the DB NOT NULL check.

export function useCreatePost() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!userId) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...input, user_id: userId, media_ids: input.media_ids ?? [] })
        .select()
        .single()
      if (error) throw error
      return data as PostRow
    },
    onSuccess: (post) => {
      // Invalidate the voyage's post list so the new post appears immediately.
      client.invalidateQueries({ queryKey: ['posts', post.voyage_id] })
      // Invalidate post counts so VoyageCard badges reflect the new total.
      client.invalidateQueries({ queryKey: ['voyage-post-counts'] })
    },
  })
}

// ── useUpdatePost ─────────────────────────────────────────────────────────────
// Always stamps updated_at so the DB trigger doesn't need to do it and the
// sort order in the list refreshes predictably.

export function useUpdatePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePostInput & { id: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PostRow
    },
    onSuccess: (post) => {
      // Invalidate both the list and the single-item cache to keep all views
      // of this post consistent after an edit.
      client.invalidateQueries({ queryKey: ['posts', post.voyage_id] })
      client.invalidateQueries({ queryKey: ['post', post.id] })
      client.invalidateQueries({ queryKey: ['feed'] })   // live-edit propagation
    },
  })
}

// ── useDeletePost ─────────────────────────────────────────────────────────────
// voyageId is passed alongside postId so onSuccess can invalidate the correct
// per-voyage cache key (the deleted post row no longer contains voyage_id
// after deletion, so we can't read it from the mutation result).

export function useDeletePost() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ postId }: { postId: string; voyageId: string }) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
    },
    onSuccess: (_, { voyageId }) => {
      client.invalidateQueries({ queryKey: ['posts', voyageId] })
      client.invalidateQueries({ queryKey: ['voyage-post-counts'] })
      client.invalidateQueries({ queryKey: ['feed'] })   // live-delete propagation
    },
  })
}
