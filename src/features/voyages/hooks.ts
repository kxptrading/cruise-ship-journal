// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/hooks.ts — React Query hooks for voyages
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient as qc } from '@/lib/queryClient'
import { useUserId } from '@/context'

// ── Row shape returned from Supabase ─────────────────────────────────────────

export interface VoyageRow {
  id:               string
  user_id:          string
  ship_name:        string | null
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
  cover_photo_url:  string | null
  created_at:       string
}

// ── Voyage list (all voyages for the current user) ────────────────────────────

export function useVoyages() {
  const userId = useUserId()
  return useQuery({
    queryKey: ['voyages', userId],
    queryFn: async () => {
      if (!userId) return [] as VoyageRow[]
      const { data, error } = await supabase
        .from('voyages')
        .select('id, user_id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url, created_at')
        .eq('user_id', userId)
        .order('departure_date', { ascending: false, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as VoyageRow[]
    },
    enabled: !!userId,
  })
}

// ── Post counts per voyage (used by VoyageCard badges) ────────────────────────

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
      client.invalidateQueries({ queryKey: ['voyages', userId] })
    },
  })
}

// ── Update voyage ─────────────────────────────────────────────────────────────

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
      client.invalidateQueries({ queryKey: ['voyages'] })
      client.setQueryData(['voyages', row.id], row)
    },
  })
}

// ── Delete voyage ─────────────────────────────────────────────────────────────

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

export function invalidateVoyages(userId: string) {
  qc.invalidateQueries({ queryKey: ['voyages', userId] })
}
