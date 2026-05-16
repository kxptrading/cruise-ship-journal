// ─────────────────────────────────────────────────────────────────────────────
// features/feed/hooks.ts — React Query hooks for the spec Feed
//
// useFeed() calls the get_feed() Supabase RPC (Phase 4) which implements
// the spec §7 canSeeInFeed visibility logic server-side.
//
// VISIBILITY ENFORCEMENT:
//   The RPC enforces the same rules as feedVisibility.ts#canSeeInFeed, but
//   running them inside PostgreSQL means:
//     - Private posts NEVER reach the client (not even encrypted).
//     - Family posts are filtered by the is_family column in friend_requests.
//     - The viewer only sees their own posts and those of accepted contacts.
//   This is the authoritative enforcement layer. The client-side canSeeInFeed
//   function exists only for unit tests and optimistic UI.
//
// CACHE KEY:
//   ['feed', userId] — user-scoped so different accounts in the same tab
//   get separate cached feeds.
//
//   The 'feed' key is also invalidated by:
//     - useUpdatePost / useDeletePost   (posts/hooks.ts)
//     - useToggleFamily / useAcceptRequest  (contacts/hooks.ts)
//   Any mutation that could change what posts are visible in the feed
//   must invalidate ['feed'] to keep the feed current.
//
// PAGINATION:
//   pageLimit defaults to 50. Cursor-based pagination is not implemented yet;
//   page_offset is always 0. When pagination is added, the query key should
//   include the page/cursor so each page has its own cache entry.
//
// STALE TIME:
//   1 minute (shorter than the global 2-minute default) because the feed
//   aggregates multiple users' activity and goes stale faster than
//   single-voyage data that only one user writes to.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'
import type { Audience } from '@/types/models'

// ── Feed row (enriched by the RPC) ───────────────────────────────────────────
// The RPC JOINs posts with profiles and voyages so the feed item has everything
// needed for display without additional queries in the component layer.

export interface FeedRow {
  id:          string
  voyage_id:   string
  user_id:     string
  title:       string | null
  body:        string
  post_date:   string | null
  location:    string | null
  media_ids:    string[]
  media_paths:  string[]
  audience:     Audience
  metadata:    Record<string, unknown> | null
  created_at:  string
  updated_at:  string
  // enriched fields — sourced from the voyages and profiles tables by the RPC
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
