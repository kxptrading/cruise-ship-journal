// ─────────────────────────────────────────────────────────────────────────────
// features/contacts/hooks.ts — React Query hooks for contacts / friend_requests
//
// DATA MODEL:
//   The friend_requests table IS the contacts table (spec §3 Contact maps
//   to friend_requests + is_family column added in Phase 1).
//
//   Each row represents a directional request:
//     from_user_id  →  to_user_id,  status ∈ {'pending', 'accepted'}
//
//   An accepted friend_requests row is a bidirectional contact — both users
//   see each other. The hook normalises direction via the `direction` field.
//
// is_family FLAG:
//   The single boolean is_family on the friend_requests row drives spec §7
//   visibility. When true, the contact can see 'family' audience posts from
//   the other user. Toggling it invalidates ['feed'] because the set of visible
//   posts may change immediately.
//
// CACHE KEY DESIGN:
//   ['contacts', userId]    — contact list for the current user
//   ['user-search', query]  — autocomplete search results (stale after 30 s)
//
// INVALIDATION RULES:
//   useToggleFamily   → invalidate ['contacts', userId], ['feed']
//   useAcceptRequest  → invalidate ['contacts', userId], ['feed']
//   useDeclineRequest → invalidate ['contacts', userId]
//   useSendFriendRequest → invalidate ['contacts', userId]
//
//   ['feed'] is invalidated after accept/family-toggle because new contacts
//   may bring new visible posts into the feed (or remove family posts if
//   is_family is toggled off).
//
// FETCH STRATEGY:
//   fetchContactsForUser() does two sequential queries:
//     1. All friend_requests rows where the current user is from or to.
//     2. A single profiles lookup for all peer user IDs.
//   This avoids N+1 queries while keeping the code simple (no PostgREST joins
//   on a self-referential table). Two queries is the minimum for this shape.
//
// RLS IMPLICATIONS:
//   friend_requests has a policy that allows users to SELECT only rows where
//   they are from_user_id OR to_user_id. The OR clause in the query mirrors
//   this so no cross-user data is returned even if the policy were missing.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

// ── Enriched contact row ──────────────────────────────────────────────────────
// The raw friend_requests row is merged with the peer's profile data into this
// flat shape that components can use directly without further lookups.

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
// Extracted from useContacts() so it can be called imperatively if needed
// (e.g. from a background sync or a Supabase realtime callback).

async function fetchContactsForUser(userId: string): Promise<ContactRow[]> {
  const { data: rows, error } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status, is_family')
    // The OR clause returns rows where this user is either the sender or receiver.
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .in('status', ['pending', 'accepted'])
  if (error) throw error
  if (!rows?.length) return []

  // ── Batch profile lookup ────────────────────────────────────────────────────
  // Collect all unique peer user IDs from the request rows, then fetch their
  // profiles in a single query. Using a Set ensures each peer id appears once.
  type Row = { id: string; from_user_id: string; to_user_id: string; status: string; is_family: boolean }
  const peerIds = [...new Set((rows as Row[]).map(r =>
    r.from_user_id === userId ? r.to_user_id : r.from_user_id
  ))]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, avatar_url')
    .in('user_id', peerIds)

  // Build a map for O(1) lookups when joining below.
  type ProfileRow = { user_id: string; email: string | null; display_name: string | null; avatar_url: string | null }
  const profileMap: Record<string, ProfileRow> = {}
  ;(profiles ?? []).forEach((p: ProfileRow) => { profileMap[p.user_id] = p })

  // ── Merge and normalise ─────────────────────────────────────────────────────
  // Determine direction relative to the current user so UI can distinguish
  // "you sent" vs "they sent" for pending requests.
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
// The `select` transformer splits the flat array into three named groups so
// components can render them in separate sections (accepted friends, incoming
// requests, outgoing requests) without doing their own Array.filter calls.

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
// Writes is_family on the friend_requests row. This is the key action that
// controls whether a contact can see 'family' audience posts.
// ['feed'] is invalidated because family visibility changes propagate immediately
// to the feed — the get_feed() RPC reads is_family in real time.

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
// Inserts a new pending friend_requests row. The receiving user will see this in
// their ContactsPage under 'Pending — received'. No feed invalidation needed
// because pending contacts cannot see each other's posts yet.

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
// Updates the friend_requests row status to 'accepted'. Both users now appear in
// each other's accepted contacts list. Feed is invalidated because the newly
// accepted contact's public posts should appear in the feed immediately.

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
      // Invalidate feed so new contact's public posts appear immediately.
      client.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

// ── useDeclineRequest ─────────────────────────────────────────────────────────
// Hard-deletes the request row (not a status update). This removes it from both
// users' views. Declining does not affect the feed (no new visibility granted).

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
// Powers the 'Add friend' autocomplete in ContactsPage.
// Requires at least 2 characters before firing to avoid expensive ilike queries
// on short strings. The 30-second staleTime keeps typeahead results fresh without
// re-querying on every keystroke (React Query deduplicates by queryKey).

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
        // Case-insensitive search across both display_name and email fields.
        .or(`display_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
        // Exclude the current user from results — you can't friend yourself.
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
