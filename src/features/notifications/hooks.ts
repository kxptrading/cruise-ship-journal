// ─────────────────────────────────────────────────────────────────────────────
// features/notifications/hooks.ts — in-app notification center data
//
// Reads the current user's notifications (RLS: recipient_id = auth.uid()),
// joined to the actor's profile for display. Also exposes helpers to mark
// notifications read and to fire mention notifications at write time.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

export type NotificationType = 'mention' | 'reaction' | 'comment'

export interface AppNotification {
  id:          string
  type:        NotificationType
  actorId:     string | null
  actorName:   string
  actorAvatar: string | null
  postId:      string | null
  voyageId:    string | null
  dayNumber:   number | null
  preview:     string | null
  createdAt:   string
  readAt:      string | null
}

export function useNotifications() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    refetchInterval: 60_000,          // poll (matches the app's other badge polling)
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, actor_id, post_id, voyage_id, day_number, preview, created_at, read_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const rows = data ?? []

      // Join actor profiles in one query.
      const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))] as string[]
      const profiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
      if (actorIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', actorIds)
        for (const p of profs ?? []) profiles[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      }

      return rows.map(r => ({
        id:          r.id,
        type:        r.type as NotificationType,
        actorId:     r.actor_id,
        actorName:   (r.actor_id && profiles[r.actor_id]?.display_name) || 'Someone',
        actorAvatar: (r.actor_id && profiles[r.actor_id]?.avatar_url) || null,
        postId:      r.post_id,
        voyageId:    r.voyage_id,
        dayNumber:   r.day_number,
        preview:     r.preview,
        createdAt:   r.created_at,
        readAt:      r.read_at,
      }))
    },
  })
}

export function useUnreadNotificationCount(): number {
  const { data } = useNotifications()
  return (data ?? []).filter(n => !n.readAt).length
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
      if (ids && ids.length) q = q.in('id', ids)
      const { error } = await q
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications', userId] }) },
  })
}

// Fire mention notifications (actor = current user, enforced server-side).
export async function notifyMentions(opts: {
  recipientIds: string[]
  postId?:      string | null
  voyageId?:    string | null
  dayNumber?:   number | null
  preview?:     string | null
}): Promise<void> {
  if (!opts.recipientIds.length) return
  const { error } = await supabase.rpc('notify_mentions', {
    p_recipients: opts.recipientIds,
    p_post_id:    opts.postId ?? null,
    p_voyage_id:  opts.voyageId ?? null,
    p_day:        opts.dayNumber ?? null,
    p_preview:    opts.preview ?? null,
  })
  if (error) throw error
}
