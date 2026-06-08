// features/safety/hooks.ts — React Query hooks for Trust & Safety

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

// ── useMyBlocks ───────────────────────────────────────────────────────────────

export function useMyBlocks() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['my-blocks', userId],
    queryFn: async () => {
      if (!userId) return [] as string[]
      const { data } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', userId)
      return (data ?? []).map(r => r.blocked_id as string)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}

// ── useMyMutes ────────────────────────────────────────────────────────────────

export function useMyMutes() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['my-mutes', userId],
    queryFn: async () => {
      if (!userId) return [] as string[]
      const { data } = await supabase
        .from('user_mutes')
        .select('muted_id')
        .eq('muter_id', userId)
      return (data ?? []).map(r => r.muted_id as string)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}

// ── useBlock ──────────────────────────────────────────────────────────────────

export function useBlock() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ targetId, isBlocked }: { targetId: string; isBlocked: boolean }) => {
      if (!userId) return
      if (isBlocked) {
        await supabase.from('user_blocks').delete().eq('blocker_id', userId).eq('blocked_id', targetId)
      } else {
        await supabase.from('user_blocks').insert({ blocker_id: userId, blocked_id: targetId })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-blocks'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

// ── useMute ───────────────────────────────────────────────────────────────────

export function useMute() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ targetId, isMuted }: { targetId: string; isMuted: boolean }) => {
      if (!userId) return
      if (isMuted) {
        await supabase.from('user_mutes').delete().eq('muter_id', userId).eq('muted_id', targetId)
      } else {
        await supabase.from('user_mutes').insert({ muter_id: userId, muted_id: targetId })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-mutes'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

// ── useReport ─────────────────────────────────────────────────────────────────

export interface ReportPayload {
  reportedUserId?:    string
  reportedContentId?: string
  reportType:         'post' | 'comment' | 'photo' | 'profile'
  reason:             string
  description?:       string
}

export function useReport() {
  const userId = useUserId()
  return useMutation({
    mutationFn: async (payload: ReportPayload) => {
      if (!userId) throw new Error('Not authenticated')
      const { error } = await supabase.from('reports').insert({
        reporter_id:          userId,
        reported_user_id:     payload.reportedUserId    ?? null,
        reported_content_id:  payload.reportedContentId ?? null,
        report_type:          payload.reportType,
        reason:               payload.reason,
        description:          payload.description ?? null,
      })
      if (error) throw error
    },
  })
}

// ── useIsAdmin ────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['is-admin', userId],
    queryFn: async () => {
      if (!userId) return false
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .maybeSingle()
      return (data as { is_admin?: boolean } | null)?.is_admin === true
    },
    enabled: !!userId,
    staleTime: 300_000,
  })
}

// ── useReports (admin queue) ──────────────────────────────────────────────────

export interface ReportRow {
  id:                   string
  reporter_id:          string
  reported_user_id:     string | null
  reported_content_id:  string | null
  report_type:          string
  reason:               string
  description:          string | null
  status:               string
  created_at:           string
  resolved_at:          string | null
  resolved_by:          string | null
}

export function useReports(statusFilter = 'all') {
  return useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as ReportRow[]
    },
    staleTime: 30_000,
  })
}

// ── useModerationAction (admin) ───────────────────────────────────────────────

export function useModerationAction() {
  const userId = useUserId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      action:        'update_status' | 'suspend' | 'ban' | 'restore'
      reportId?:     string
      targetUserId?: string
      status?:       string
      notes?:        string
    }) => {
      if (!userId) throw new Error('Not authenticated')

      if (payload.action === 'update_status' && payload.reportId) {
        const isResolved = payload.status === 'resolved' || payload.status === 'dismissed'
        await supabase.from('reports').update({
          status:       payload.status,
          resolved_at:  isResolved ? new Date().toISOString() : null,
          resolved_by:  isResolved ? userId : null,
        }).eq('id', payload.reportId)
      }

      if (payload.action === 'suspend' && payload.targetUserId) {
        await supabase.from('profiles').update({
          is_suspended:    true,
          suspension_until: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        }).eq('user_id', payload.targetUserId)
      }

      if (payload.action === 'ban' && payload.targetUserId) {
        await supabase.from('profiles').update({
          is_banned:  true,
          ban_reason: payload.notes ?? 'Violation of community guidelines',
        }).eq('user_id', payload.targetUserId)
      }

      if (payload.action === 'restore' && payload.targetUserId) {
        await supabase.from('profiles').update({
          is_suspended:    false,
          is_banned:       false,
          suspension_until: null,
          ban_reason:       null,
        }).eq('user_id', payload.targetUserId)
      }

      await supabase.from('moderation_audit_log').insert({
        admin_id:    userId,
        action:      payload.action,
        target_type: payload.reportId ? 'report' : 'user',
        target_id:   payload.reportId ?? payload.targetUserId ?? '',
        notes:       payload.notes ?? null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })
}
