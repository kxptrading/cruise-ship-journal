// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/coauthors.ts — React Query hooks for voyage co-authors
//
// DATA MODEL (see migration voyage_coauthors):
//   voyage_members(voyage_id, user_id, role, status, invited_by)
//     status ∈ {'pending','accepted'}; role 'editor'. The owner is implicit via
//     voyages.user_id and is NOT stored here.
//
//   Co-authors are "additive contributors": once accepted they can upload photos
//   and write posts on the shared voyage (RLS via is_voyage_member). They do not
//   edit the owner's structured journal sections.
//
// CACHE KEYS:
//   ['voyage-members', voyageId]  — members (accepted + pending) of a voyage
//   ['voyage-invites', userId]    — pending invites addressed to the current user
//   ['voyages', userId]           — voyage list (shared voyages now appear here)
//
// PROFILE LOOKUPS mirror features/contacts/hooks.ts: fetch rows, then one batched
// profiles query (no PostgREST join, since user_id has no FK to profiles).
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

export interface VoyageMember {
  id:          string          // voyage_members.id
  userId:      string
  displayName: string
  email:       string
  avatarUrl:   string | null
  status:      'pending' | 'accepted'
}

export interface VoyageInvite {
  id:          string          // voyage_members.id
  voyageId:    string
  shipName:    string
  ownerName:   string
}

type ProfileRow = { user_id: string; email: string | null; display_name: string | null; avatar_url: string | null }

async function fetchProfiles(userIds: string[]): Promise<Record<string, ProfileRow>> {
  if (userIds.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, avatar_url')
    .in('user_id', [...new Set(userIds)])
  const map: Record<string, ProfileRow> = {}
  ;(data ?? []).forEach((p: ProfileRow) => { map[p.user_id] = p })
  return map
}

// ── Members of a voyage (for the owner's manage panel) ───────────────────────
export function useVoyageMembers(voyageId: string | null | undefined) {
  return useQuery({
    queryKey: ['voyage-members', voyageId],
    enabled: !!voyageId,
    queryFn: async (): Promise<VoyageMember[]> => {
      if (!voyageId) return []
      const { data: rows, error } = await supabase
        .from('voyage_members')
        .select('id, user_id, status')
        .eq('voyage_id', voyageId)
      if (error) throw error
      if (!rows?.length) return []
      type Row = { id: string; user_id: string; status: 'pending' | 'accepted' }
      const profileMap = await fetchProfiles((rows as Row[]).map(r => r.user_id))
      return (rows as Row[]).map(r => {
        const p = profileMap[r.user_id]
        return {
          id:          r.id,
          userId:      r.user_id,
          displayName: p?.display_name ?? 'Unknown',
          email:       p?.email        ?? '',
          avatarUrl:   p?.avatar_url   ?? null,
          status:      r.status,
        }
      })
    },
  })
}

// ── Pending invites addressed to the current user ────────────────────────────
export function useMyVoyageInvites() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['voyage-invites', userId],
    enabled: !!userId,
    queryFn: async (): Promise<VoyageInvite[]> => {
      if (!userId) return []
      const { data: rows, error } = await supabase
        .from('voyage_members')
        .select('id, voyage_id')
        .eq('user_id', userId)
        .eq('status', 'pending')
      if (error) throw error
      if (!rows?.length) return []
      type Row = { id: string; voyage_id: string }
      const voyageIds = (rows as Row[]).map(r => r.voyage_id)
      const { data: voyages } = await supabase
        .from('voyages')
        .select('id, ship_name, user_id')
        .in('id', voyageIds)
      type VRow = { id: string; ship_name: string | null; user_id: string }
      const vMap: Record<string, VRow> = {}
      ;(voyages ?? []).forEach((v: VRow) => { vMap[v.id] = v })
      const ownerMap = await fetchProfiles((voyages ?? []).map((v: VRow) => v.user_id))
      return (rows as Row[]).map(r => {
        const v = vMap[r.voyage_id]
        return {
          id:        r.id,
          voyageId:  r.voyage_id,
          shipName:  v?.ship_name ?? 'a voyage',
          ownerName: (v && ownerMap[v.user_id]?.display_name) ?? 'Someone',
        }
      })
    },
  })
}

// ── Invite a co-author (owner only; RLS enforces ownership) ──────────────────
export function useInviteCoAuthor() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async ({ voyageId, inviteeId }: { voyageId: string; inviteeId: string }) => {
      const { error } = await supabase
        .from('voyage_members')
        .insert({ voyage_id: voyageId, user_id: inviteeId, invited_by: userId, status: 'pending' })
      if (error) throw error
    },
    onSuccess: (_d, { voyageId }) => {
      client.invalidateQueries({ queryKey: ['voyage-members', voyageId] })
    },
  })
}

// ── Accept / decline an invite addressed to me ───────────────────────────────
export function useAcceptVoyageInvite() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('voyage_members')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['voyage-invites', userId] })
      client.invalidateQueries({ queryKey: ['voyages', userId] })
    },
  })
}

export function useDeclineVoyageInvite() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from('voyage_members').delete().eq('id', inviteId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['voyage-invites', userId] })
    },
  })
}

// ── Remove a co-author (owner), or leave a shared voyage (member) ────────────
export function useRemoveCoAuthor() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId }: { memberId: string; voyageId: string }) => {
      const { error } = await supabase.from('voyage_members').delete().eq('id', memberId)
      if (error) throw error
    },
    onSuccess: (_d, { voyageId }) => {
      client.invalidateQueries({ queryKey: ['voyage-members', voyageId] })
    },
  })
}

export function useLeaveVoyage() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (voyageId: string) => {
      if (!userId) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('voyage_members')
        .delete()
        .eq('voyage_id', voyageId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['voyages', userId] })
    },
  })
}

// ── Imperative helper: accepted shared-voyage ids for the current user ───────
// Used by useVoyages() and useVoyageData to union shared voyages into the list.
export async function fetchSharedVoyageIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('voyage_members')
    .select('voyage_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')
  return (data ?? []).map((r: { voyage_id: string }) => r.voyage_id)
}
