// ─────────────────────────────────────────────────────────────────────────────
// features/posts/engagement.ts — comments + reactions for spec posts (post_id)
//
// Backed by post_comments / post_reactions (RLS: readable/insertable only for
// posts you can see — see can_view_post). Reactions are one-per-user-per-post
// (toggle / switch emoji). Comment @mentions fire notifications client-side; the
// "commented/reacted on your post" notification to the author is a DB trigger.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import { extractMentions } from '@/features/social/richText'
import { useMentionPeople } from '@/features/social/useMentionPeople'
import { notifyMentions } from '@/features/notifications/hooks'
import type { Person } from '@/features/social/richText'

export const POST_REACTIONS: { id: string; emoji: string; label: string }[] = [
  { id: 'love',   emoji: '❤️', label: 'Love' },
  { id: 'wow',    emoji: '😍', label: 'Wow' },
  { id: 'haha',   emoji: '😂', label: 'Haha' },
  { id: 'clap',   emoji: '👏', label: 'Bravo' },
  { id: 'anchor', emoji: '⚓', label: 'Anchor' },
]

export interface PostComment {
  id:          string
  userId:      string
  body:        string
  createdAt:   string
  authorName:  string
  authorAvatar: string | null
}

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-comments', postId],
    enabled: !!postId,
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, user_id, body, created_at')
        .eq('post_id', postId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      const rows = data ?? []
      const ids = [...new Set(rows.map(r => r.user_id))]
      const profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids)
        for (const p of profs ?? []) profiles[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      }
      return rows.map(r => ({
        id: r.id, userId: r.user_id, body: r.body, createdAt: r.created_at,
        authorName: profiles[r.user_id]?.display_name || 'Cruiser',
        authorAvatar: profiles[r.user_id]?.avatar_url || null,
      }))
    },
  })
}

export function useAddComment(postId: string, opts?: { voyageId?: string | null }) {
  const qc = useQueryClient()
  const userId = useUserId()
  const people: Person[] = useMentionPeople()
  return useMutation({
    mutationFn: async (body: string) => {
      const trimmed = body.trim()
      if (!trimmed || !userId) return
      const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, body: trimmed })
      if (error) throw error
      // Notify any @mentioned contacts (the author is notified by a DB trigger).
      const recipientIds = extractMentions(trimmed, people)
      if (recipientIds.length) {
        try { await notifyMentions({ recipientIds, postId, voyageId: opts?.voyageId ?? null, preview: trimmed.slice(0, 140) }) } catch { /* non-fatal */ }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', postId] })
      qc.invalidateQueries({ queryKey: ['post-comment-count', postId] })
    },
  })
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post-comments', postId] })
      qc.invalidateQueries({ queryKey: ['post-comment-count', postId] })
    },
  })
}

// Lightweight count for feed cards (avoids fetching every comment body).
export function useCommentCount(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-comment-count', postId],
    enabled: !!postId,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId!)
      if (error) throw error
      return count ?? 0
    },
  })
}

export interface ReactionState {
  counts: Record<string, number>   // emoji → count
  total:  number
  mine:   string | null            // the emoji I reacted with, if any
}

export function usePostReactions(postId: string | undefined) {
  const userId = useUserId()
  return useQuery({
    queryKey: ['post-reactions', postId],
    enabled: !!postId,
    queryFn: async (): Promise<ReactionState> => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('user_id, reaction')
        .eq('post_id', postId!)
      if (error) throw error
      const rows = data ?? []
      const counts: Record<string, number> = {}
      let mine: string | null = null
      for (const r of rows) {
        counts[r.reaction] = (counts[r.reaction] ?? 0) + 1
        if (r.user_id === userId) mine = r.reaction
      }
      return { counts, total: rows.length, mine }
    },
  })
}

export function useToggleReaction(postId: string) {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    // Pass the emoji tapped; same emoji un-reacts, a different one switches.
    mutationFn: async (emoji: string) => {
      if (!userId) return
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('reaction')
        .eq('post_id', postId).eq('user_id', userId).maybeSingle()
      if (existing?.reaction === emoji) {
        const { error } = await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('post_reactions')
          .upsert({ post_id: postId, user_id: userId, reaction: emoji }, { onConflict: 'post_id,user_id' })
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['post-reactions', postId] }) },
  })
}
