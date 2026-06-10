// features/admin/hooks.ts — React Query hooks for the admin console

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id:               string
  user_id:          string
  email:            string | null
  display_name:     string | null
  first_name:       string | null
  last_name:        string | null
  avatar_url:       string | null
  created_at:       string | null
  is_admin:         boolean
  is_suspended:     boolean
  is_banned:        boolean
  suspension_until: string | null
  ban_reason:       string | null
  voyage_count:     number
  post_count:       number
}

export interface AdminStats {
  total_users:     number
  banned_users:    number
  suspended_users: number
  total_posts:     number
  total_voyages:   number
  open_reports:    number
}

export interface AdminPostRow {
  id:         string
  user_id:    string
  voyage_id:  string
  title:      string | null
  body:       string
  post_date:  string | null
  audience:   string
  media_paths: string[]
  created_at: string
  author_name:  string | null
  author_email: string | null
}

export interface AuditRow {
  id:          string
  admin_id:    string
  action:      string
  target_type: string
  target_id:   string
  notes:       string | null
  created_at:  string
}

// ── useAdminStats ─────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, posts, voyages, reports] = await Promise.all([
        supabase.from('profiles').select('is_banned, is_suspended', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('voyages').select('id', { count: 'exact' }),
        supabase.from('reports').select('status').eq('status', 'open'),
      ])
      const allUsers    = users.data ?? []
      return {
        total_users:     users.count     ?? 0,
        banned_users:    allUsers.filter((u: { is_banned: boolean }) => u.is_banned).length,
        suspended_users: allUsers.filter((u: { is_suspended: boolean }) => u.is_suspended).length,
        total_posts:     posts.count     ?? 0,
        total_voyages:   voyages.count   ?? 0,
        open_reports:    reports.data?.length ?? 0,
      }
    },
    staleTime: 30_000,
  })
}

// ── useAdminUsers ─────────────────────────────────────────────────────────────

export function useAdminUsers(filter: string, search: string) {
  return useQuery<AdminUserRow[]>({
    queryKey: ['admin-users', filter, search],
    queryFn: async () => {
      // Fetch profiles
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (filter === 'banned')    q = q.eq('is_banned', true)
      if (filter === 'suspended') q = q.eq('is_suspended', true)
      if (filter === 'admins')    q = q.eq('is_admin', true)
      if (search.trim()) q = q.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
      const { data: profiles, error } = await q
      if (error) throw error

      // Fetch voyage counts and post counts for each user in batch
      const userIds = (profiles ?? []).map((p: { user_id: string }) => p.user_id)
      const [voyageCounts, postCounts] = await Promise.all([
        supabase.from('voyages').select('user_id').in('user_id', userIds),
        supabase.from('posts').select('user_id').in('user_id', userIds),
      ])
      const vMap: Record<string, number> = {}
      const pMap: Record<string, number> = {}
      for (const v of voyageCounts.data ?? []) vMap[v.user_id] = (vMap[v.user_id] ?? 0) + 1
      for (const p of postCounts.data ?? [])   pMap[p.user_id] = (pMap[p.user_id] ?? 0) + 1

      return (profiles ?? []).map((p: AdminUserRow) => ({
        ...p,
        voyage_count: vMap[p.user_id] ?? 0,
        post_count:   pMap[p.user_id] ?? 0,
      })) as AdminUserRow[]
    },
    staleTime: 30_000,
  })
}

// ── useAdminPosts ─────────────────────────────────────────────────────────────

export function useAdminPosts(audienceFilter: string) {
  return useQuery<AdminPostRow[]>({
    queryKey: ['admin-posts', audienceFilter],
    queryFn: async () => {
      let q = supabase
        .from('posts')
        .select('id, user_id, voyage_id, title, body, post_date, audience, media_paths, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
      if (audienceFilter !== 'all') q = q.eq('audience', audienceFilter)
      const { data: posts, error } = await q
      if (error) throw error

      // Fetch author names
      const userIds = [...new Set((posts ?? []).map((p: { user_id: string }) => p.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds)
      const authorMap: Record<string, { name: string | null; email: string | null }> = {}
      for (const pr of profiles ?? []) authorMap[pr.user_id] = { name: pr.display_name, email: pr.email }

      return (posts ?? []).map((p) => ({
        ...p,
        author_name:  authorMap[p.user_id]?.name  ?? null,
        author_email: authorMap[p.user_id]?.email ?? null,
      })) as AdminPostRow[]
    },
    staleTime: 30_000,
  })
}

// ── useAdminAuditLog ──────────────────────────────────────────────────────────

export function useAdminAuditLog() {
  return useQuery<AuditRow[]>({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as AuditRow[]
    },
    staleTime: 30_000,
  })
}

// ── useAdminDeletePost ────────────────────────────────────────────────────────

export function useAdminDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-posts'] }),
  })
}

// ── useAdminUserAction ────────────────────────────────────────────────────────

export function useAdminUserAction() {
  const adminId = useUserId()
  const qc      = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      action:  'suspend' | 'ban' | 'restore' | 'grant_admin' | 'revoke_admin'
      userId:  string
      notes?:  string
    }) => {
      if (!adminId) throw new Error('Not authenticated')
      let update: Record<string, unknown> = {}

      if (payload.action === 'suspend') {
        update = { is_suspended: true, suspension_until: new Date(Date.now() + 7 * 86_400_000).toISOString() }
      } else if (payload.action === 'ban') {
        update = { is_banned: true, ban_reason: payload.notes ?? 'Violation of community guidelines' }
      } else if (payload.action === 'restore') {
        update = { is_suspended: false, is_banned: false, suspension_until: null, ban_reason: null }
      } else if (payload.action === 'grant_admin') {
        update = { is_admin: true }
      } else if (payload.action === 'revoke_admin') {
        update = { is_admin: false }
      }

      const { error } = await supabase.from('profiles').update(update).eq('user_id', payload.userId)
      if (error) throw error

      await supabase.from('moderation_audit_log').insert({
        admin_id:    adminId,
        action:      payload.action,
        target_type: 'user',
        target_id:   payload.userId,
        notes:       payload.notes ?? null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      qc.invalidateQueries({ queryKey: ['admin-audit-log'] })
    },
  })
}
