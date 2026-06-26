// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/hooks.ts — React Query hooks for voyages
//
// CACHE KEY DESIGN:
//   ['voyages', userId]    — list of all voyages for the current user
//   ['voyages', voyageId]  — single voyage detail (note: same top-level key)
//   ['voyage-post-counts', ids.join(',')]  — post counts keyed by sorted voyage id list
//
// WHY one key prefix for list and single?
//   ['voyages'] as a prefix means invalidateQueries({ queryKey: ['voyages'] })
//   in useUpdateVoyage clears BOTH the list and all single-voyage caches at once,
//   which is the correct behaviour after an edit that might affect the list
//   (e.g. changing ship_name updates the VoyagesPage card label).
//
// WHY include userId in the list key?
//   If two accounts are used in the same browser tab (unlikely but possible),
//   each user gets a separate cache partition. Avoids stale data from a previous
//   session leaking into a fresh one after sign-in.
//
// RELATIONSHIP TO useVoyageData:
//   These hooks are used by new pages (VoyagesPage, VoyageDetailPage, VoyageEditorPage).
//   The legacy useVoyageData hook (hooks/useVoyageData.ts) manages the same
//   'voyages' Supabase table but via its own state. The two systems coexist:
//     - React Query hooks → new page-based routes
//     - useVoyageData     → legacy journal section tabs inside VoyageDetailPage
//   In the long run, useVoyageData should be replaced entirely by React Query.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient as qc } from '@/lib/queryClient'
import { useUserId } from '@/context'
import { fetchSharedVoyageIds } from './coauthors'

// ── Row shape returned from Supabase ─────────────────────────────────────────
// Full DB schema shape. VoyagesPage and VoyageCard use a subset;
// VoyageEditorPage uses the full shape.

export interface VoyageRow {
  id:               string
  user_id:          string
  ship_name:        string | null
  destination:      string | null
  cruise_line:      string | null
  cabin:            string | null
  deck:             string | null
  departure_date:   string | null
  return_date:      string | null
  departure_port:   string | null
  total_nights:     number | null
  companion_1:      string | null
  companion_2:      string | null
  companion_3:      string | null
  companion_4:      string | null
  emergency_contact:string | null
  phone:            string | null
  guest_services:   string | null
  muster_station:   string | null
  dining_time:      string | null
  cover_photo_url:      string | null
  cruise_description:   string | null
  created_at:           string
  // Client-only marker: true when the current user is a co-author (not the owner)
  // of this voyage. Set by useVoyages() for the "Shared" badge. Not a DB column.
  is_shared?:           boolean
}

// ── Voyage list (all voyages for the current user) ────────────────────────────
// Ordered by departure_date descending so the most recent voyage appears first.
// nullsFirst: false puts voyages with no date at the bottom (they are probably
// incomplete drafts and shouldn't dominate the list).

export function useVoyages() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['voyages', userId],
    queryFn: async () => {
      if (!userId) return [] as VoyageRow[]
      const cols = 'id, user_id, ship_name, destination, cruise_line, departure_date, return_date, total_nights, cover_photo_url, created_at'

      // Owned voyages + voyages shared with me as an accepted co-author.
      // Reads are open at the RLS layer, so a plain id filter returns shared rows.
      const sharedIds = await fetchSharedVoyageIds(userId)
      const [ownedRes, sharedRes] = await Promise.all([
        supabase.from('voyages').select(cols).eq('user_id', userId),
        sharedIds.length
          ? supabase.from('voyages').select(cols).in('id', sharedIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (ownedRes.error)  throw ownedRes.error
      if (sharedRes.error) throw sharedRes.error

      const merged = [
        ...(ownedRes.data ?? []).map(v => ({ ...v, is_shared: false })),
        ...(sharedRes.data ?? []).map(v => ({ ...v, is_shared: true })),
      ] as VoyageRow[]

      // Most recent first; undated drafts sink to the bottom.
      return merged.sort((a, b) =>
        (b.departure_date ?? '').localeCompare(a.departure_date ?? ''))
    },
    enabled: !!userId,
  })
}

// ── Post counts per voyage (used by VoyageCard badges) ────────────────────────
// Fetches voyage_id from the posts table and aggregates client-side.
// We don't use a COUNT query because Supabase PostgREST doesn't expose group-by
// aggregations without a dedicated RPC. The payload is small (one column per post).
//
// Cache key includes the serialised ids string so adding a new voyage invalidates
// the count for the new empty set without polluting existing count data.

export function useVoyagePostCounts(voyageIds: string[]) {
  return useQuery({
    queryKey: ['voyage-post-counts', voyageIds.join(',')],
    queryFn: async () => {
      if (!voyageIds.length) return {} as Record<string, number>
      const { data, error } = await supabase
        .from('posts')
        .select('voyage_id')
        .in('voyage_id', voyageIds)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        counts[row.voyage_id] = (counts[row.voyage_id] ?? 0) + 1
      }
      return counts
    },
    enabled: voyageIds.length > 0,
  })
}

// ── Single voyage ─────────────────────────────────────────────────────────────
// Used by VoyageDetailPage to fetch the full voyage row (cover photo, date range,
// cruise line) needed for the hero card. Shares the ['voyages'] key prefix so
// useUpdateVoyage's broad invalidation also clears this.

export function useVoyage(voyageId: string | null | undefined) {
  return useQuery({
    queryKey: ['voyages', voyageId],
    queryFn: async () => {
      if (!voyageId) return null
      const { data, error } = await supabase
        .from('voyages')
        .select('*')
        .eq('id', voyageId)
        .single()
      if (error) throw error
      return data as VoyageRow
    },
    enabled: !!voyageId,
  })
}

// ── Create voyage ─────────────────────────────────────────────────────────────
// Injects user_id from UserCtx so callers don't have to pass it.
// After creation, only the list cache is invalidated (not counts — no posts yet).

type CreateVoyageInput = Partial<Omit<VoyageRow, 'id' | 'user_id' | 'created_at'>>

export function useCreateVoyage() {
  const client  = useQueryClient()
  const userId  = useUserId()
  return useMutation({
    mutationFn: async (input: CreateVoyageInput) => {
      if (!userId) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('voyages')
        .insert({ ...input, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data as VoyageRow
    },
    onSuccess: () => {
      // Invalidate the user-scoped list so VoyagesPage re-fetches with the new entry.
      client.invalidateQueries({ queryKey: ['voyages', userId] })
    },
  })
}

// ── Update voyage ─────────────────────────────────────────────────────────────
// After a successful update, we optimistically seed the single-voyage cache with
// the returned row (setQueryData) for instant hero-card updates, then do a broad
// invalidation to ensure the list view's title/dates are also refreshed.

export function useUpdateVoyage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: CreateVoyageInput & { id: string }) => {
      const { data, error } = await supabase
        .from('voyages')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as VoyageRow
    },
    onSuccess: (row) => {
      // Broad invalidation clears both ['voyages', userId] list and all ['voyages', voyageId] singles.
      client.invalidateQueries({ queryKey: ['voyages'] })
      // Seed the single-voyage cache immediately so VoyageDetailPage doesn't flash a stale hero.
      client.setQueryData(['voyages', row.id], row)
    },
  })
}

// ── Delete voyage ─────────────────────────────────────────────────────────────
// Supabase RLS ensures only the owner can delete. Cascading deletes on the DB
// (voyage_id FK constraints) handle child rows (posts, itinerary, etc.).

export function useDeleteVoyage() {
  const client = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn: async (voyageId: string) => {
      const { error } = await supabase.from('voyages').delete().eq('id', voyageId)
      if (error) throw error
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['voyages', userId] })
    },
  })
}

// ── Imperative invalidation helper (for use outside components) ───────────────
// Called after operations that happen outside the React tree (e.g. a Supabase
// realtime event handler or a background sync). Uses the singleton queryClient
// instance from lib/queryClient.ts rather than the hook.

export function invalidateVoyages(userId: string) {
  qc.invalidateQueries({ queryKey: ['voyages', userId] })
}
