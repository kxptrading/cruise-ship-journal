// ─────────────────────────────────────────────────────────────────────────────
// features/contacts/hooks.ts — React Query hooks for contacts / friend_requests
//
// The friend_requests table IS the contacts table (spec §3 Contact maps
// to friend_requests + is_family column added in Phase 1).
//
// Cache invalidation:
//   useToggleFamily → invalidates ['feed'] (spec §9 requirement)
//   useAcceptRequest / useDeclineRequest → invalidates ['contacts']
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

// ── Enriched contact row ──────────────────────────────────────────────────────

export interface ContactRow {
  requestId:   string          // friend_requests.id
  userId:      string          // the other user's id
  displayName: string
  email:       string
  avatarUrl:   string | null
  isFamily:    boolean
  status:      'accepted' | 'pending'
  direction:   'sent' | 'received'
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function fetchContactsForUser(userId: string): Promise<ContactRow[]> {
  const { data: rows, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status, is_family')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .in('status', ['pending', 'accepted'])
  if (error) throw error
  if (!rows?.length) return []

  // Collect all peer user IDs
  type Row = { id: string; from_user_id: string; to_user_id: string; status: string; is_family: boolean }
  const peerIds = [...new Set((rows as Row[]).map(r =>
    r.from_user_id === userId ? r.to_user_id : r.from_user_id
  ))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, avatar_url')
    .in('user_id', peerIds)

  type ProfileRow = { user_id: string; email: string | null; display_name: string | null; avatar_url: string | null }
  const profileMap: Record<string, ProfileRow> = {}
  ;(profiles ?? []).forEach((p: ProfileRow) => { profileMap[p.user_id] = p })

  return (rows as Row[]).map(r => {
    const peerId = r.from_user_id === userId ? r.to_user_id : r.from_user_id
    const p      = profileMap[peerId] ?? {}
    return {
      requestId:   r.id,
      userId:      peerId,
      displayName: (p as ProfileRow).display_name ?? 'Unknown',
      email:       (p as ProfileRow).email        ?? '',
      avatarUrl:   (p as ProfileRow).avatar_url   ?? null,
      isFamily:    r.is_family ?? false,
      status:      r.status as 'accepted' | 'pending',
      direction:   r.from_user_id === userId ? 'sent' : 'received',
    }
  })
}

// ── useContacts ───────────────────────────────────────────────────────────────

export function useContacts() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['contacts', userId],
    queryFn: () => fetchContactsForUser(userId!),
    enabled: !!userId,
    select: (data) => ({
      accepted: data.filter(c => c.status === 'accepted'),
      incoming: data.filter(c => c.status === 'pending' && c.direction === 'received'),
      outgoing: data.filter(c => c.status === 'pending' && c.direction === 'sent'),
    }),
  })
}

// ── useToggleFamily ───────────────────────────────────────────────────────────

export function useToggleFamily() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async ({ requestId, isFamily }: { requestId: string; isFamily: boolean }) => {
      const { error } = await supabase
        .from('friend_requests')
        .update({ is_family: isFamily })
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['contacts', userId] })
      client.invalidateQueries({ queryKey: ['feed'] })   // spec §9 — family resolution changes
    },
  })
}

// ── useSendFriendRequest ──────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (toUserId: string) => {
      const { error } = await supabase
        .from('friend_requests')
        .insert({ from_user_id: userId, to_user_id: toUserId })
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['contacts', userId] })
    },
  })
}

// ── useAcceptRequest ──────────────────────────────────────────────────────────

export function useAcceptRequest() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['contacts', userId] })
      client.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

// ── useDeclineRequest ─────────────────────────────────────────────────────────

export function useDeclineRequest() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['contacts', userId] })
    },
  })
}

// ── useSearchUsers ────────────────────────────────────────────────────────────

export interface SearchResult {
  userId:      string
  displayName: string | null
  email:       string | null
  avatarUrl:   string | null
}

export function useSearchUsers(query: string) {
  const userId = useUserId()
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (!query.trim()) return [] as SearchResult[]
      const { data } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, avatar_url')
        .or(`display_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
        .neq('user_id', userId ?? '')
        .limit(8)
      return (data ?? []).map((p: { user_id: string; email: string | null; display_name: string | null; avatar_url: string | null }) => ({
        userId:      p.user_id,
        displayName: p.display_name,
        email:       p.email,
        avatarUrl:   p.avatar_url,
      }))
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 30,
  })
}
