// ─────────────────────────────────────────────────────────────────────────────
// features/posts/hooks.ts — React Query hooks for the posts table
//
// Cache invalidation rules (spec §9):
//   useUpdatePost + useDeletePost → invalidate ['feed'] (live-edit propagation)
//   useCreatePost + useDeletePost → invalidate ['voyage-post-counts']
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import type { Audience } from '@/types/models'

// ── Row shape ─────────────────────────────────────────────────────────────────

export interface PostRow {
  id:         string
  voyage_id:  string
  user_id:    string
  title:      string | null
  body:       string
  post_date:  string | null
  location:   string | null
  media_ids:  string[]
  audience:   Audience
  metadata:   Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type CreatePostInput = Pick<PostRow, 'voyage_id' | 'body' | 'audience'> &
  Partial<Pick<PostRow, 'title' | 'post_date' | 'location' | 'media_ids' | 'metadata'>>

export type UpdatePostInput = Partial<Omit<PostRow, 'id' | 'voyage_id' | 'user_id' | 'created_at'>>

// ── usePostsByVoyage ──────────────────────────────────────────────────────────

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
    enabled: !!voyageId,
  })
}

// ── usePost ───────────────────────────────────────────────────────────────────

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
      client.invalidateQueries({ queryKey: ['posts', post.voyage_id] })
      client.invalidateQueries({ queryKey: ['voyage-post-counts'] })
    },
  })
}

// ── useUpdatePost ─────────────────────────────────────────────────────────────

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
      client.invalidateQueries({ queryKey: ['posts', post.voyage_id] })
      client.invalidateQueries({ queryKey: ['post', post.id] })
      client.invalidateQueries({ queryKey: ['feed'] })   // live-edit propagation
    },
  })
}

// ── useDeletePost ─────────────────────────────────────────────────────────────

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
