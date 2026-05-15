// ─────────────────────────────────────────────────────────────────────────────
// features/feed/hooks.ts — React Query hooks for the spec Feed
//
// useFeed() calls the get_feed() Supabase RPC (Phase 4) which implements
// the spec §7 canSeeInFeed visibility logic server-side.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import type { Audience } from '@/types/models'

// ── Feed row (enriched by the RPC) ───────────────────────────────────────────

export interface FeedRow {
  id:          string
  voyage_id:   string
  user_id:     string
  title:       string | null
  body:        string
  post_date:   string | null
  location:    string | null
  media_ids:   string[]
  audience:    Audience
  metadata:    Record<string, unknown> | null
  created_at:  string
  updated_at:  string
  // enriched
  ship_name:   string | null
  cruise_line: string | null
  author_display_name: string | null
  author_avatar_url:   string | null
}

// ── useFeed ───────────────────────────────────────────────────────────────────

export function useFeed(pageLimit = 50) {
  const userId = useUserId()

  return useQuery({
    queryKey: ['feed', userId],
    queryFn: async () => {
      if (!userId) return [] as FeedRow[]
      const { data, error } = await supabase.rpc('get_feed', {
        viewer_id:   userId,
        page_limit:  pageLimit,
        page_offset: 0,
      })
      if (error) throw error
      return (data ?? []) as FeedRow[]
    },
    enabled: !!userId,
    staleTime: 1000 * 60,   // 1 min — feed data refreshes more frequently than voyage data
  })
}
