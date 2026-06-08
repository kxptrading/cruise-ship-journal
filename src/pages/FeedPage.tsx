// ─────────────────────────────────────────────────────────────────────────────
// pages/FeedPage.tsx — Spec Feed (spec §4: /feed)
//
// SELF-CONTAINED:
//   Fetches via useFeed() which calls the get_feed() Supabase RPC (Phase 4).
//   Visibility is enforced server-side; no legacy props required from App.tsx.
//   This page has no dependency on the useVoyageData hook.
//
// AUDIENCE FILTERING:
//   The server returns all posts the viewer is authorised to see (public +
//   family + own private). Client-side filtering by `filter` state then
//   shows a subset: 'all' | 'family' | 'public'.
//   'private' is intentionally excluded from the filter options — private posts
//   only appear in the author's own voyage page (PostList), not the shared feed.
//
// FILTER VISIBILITY:
//   Filter buttons are only shown when the corresponding audience has at least
//   one post. An empty 'family' bucket means the button is hidden (not grayed out)
//   to avoid cluttering the UI with inactive options.
//
// STALE TIME:
//   useFeed() uses a 1-minute staleTime (shorter than the 2-minute default).
//   The feed aggregates multiple users' data and is expected to update more
//   frequently than a single user's voyage journal data.
//
// CACHE INVALIDATION:
//   The ['feed'] cache key is invalidated by:
//     - useUpdatePost / useDeletePost (posts/hooks.ts) — content mutations
//     - useToggleFamily / useAcceptRequest (contacts/hooks.ts) — visibility changes
//   Any of these mutations will trigger an automatic background refetch the next
//   time the FeedPage is rendered.
//
// ERROR HANDLING:
//   On RPC failure the user sees an inline error with a manual retry button
//   (calls refetch()). React Query's built-in retry=1 (see queryClient.ts) means
//   one automatic retry already happens before the error state is shown.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY, BP } from '@/constants'
import { useW } from '@/context'
import { useFeed } from '@/features/feed/hooks'
import FeedItem from '@/features/feed/FeedItem'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import type { Audience } from '@/types/models'
import { useMyBlocks, useMyMutes } from '@/features/safety/hooks'

// Filter type includes 'all' in addition to the three Audience values.
// 'private' is omitted because private posts are never in this feed.
type Filter = 'all' | Audience

const FILTERS: { value: Filter; label: string; emoji: string }[] = [
  { value: 'all',    label: 'All',    emoji: '📋' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'public', label: 'Public', emoji: '🌐' },
]

export default function FeedPage() {
  const navigate            = useNavigate()
  const w                   = useW()
  const [filter, setFilter] = useState<Filter>('all')
  // useFeed() calls get_feed() RPC — returns only posts the viewer is allowed to see.
  const { data: items = [], isLoading, error, refetch } = useFeed()
  const { data: blockedIds = [] } = useMyBlocks()
  const { data: mutedIds   = [] } = useMyMutes()

  // Exclude blocked and muted users from the feed, then apply audience filter.
  const safe    = items.filter(i => !blockedIds.includes(i.user_id) && !mutedIds.includes(i.user_id))
  const visible = filter === 'all' ? safe : safe.filter(i => i.audience === filter)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: w < BP.mobile ? 24 : 30, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            Feed
          </h1>
          {!isLoading && safe.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
              {safe.length} post{safe.length !== 1 ? 's' : ''} from your contacts
            </p>
          )}
        </div>
        {/* Audience filter chips — hidden when the bucket is empty */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count  = f.value === 'all' ? safe.length : safe.filter(i => i.audience === f.value).length
            const active = filter === f.value
            // Hide empty audience buckets to avoid confusing inactive buttons.
            if (f.value !== 'all' && count === 0) return null
            return (
              <button key={f.value} onClick={() => setFilter(f.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`, background: active ? 'var(--t-bg)' : WHITE, color: active ? 'var(--t-primary)' : MUTED, cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 400, fontFamily: FONT_BODY, transition: 'all 0.12s' }}
              >
                <span style={{ fontSize: 14 }}>{f.emoji}</span>
                {f.label}
                <span style={{ fontSize: 11, opacity: 0.65 }}>({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Inline error — appears after React Query's built-in retry has failed */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '14px 16px', marginBottom: 16, fontFamily: FONT_BODY, fontSize: 13, color: '#DC2626' }}>
          Could not load feed.{' '}
          <button onClick={() => refetch()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 700, textDecoration: 'underline', fontFamily: FONT_BODY }}>Try again</button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty feed — guides user to find friends since feed requires contacts */}
      {!isLoading && safe.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
          <EmptyState
            icon="📡"
            heading="Your feed is empty"
            body="When your contacts share posts with you — family or public — they'll appear here."
            action={{ label: 'Find Friends', onClick: () => navigate('/friends') }}
          />
        </div>
      )}

      {/* Filter produced empty results — shown when items exist but none match the active filter */}
      {!isLoading && safe.length > 0 && visible.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>No {filter} posts from your contacts yet.</p>
        </div>
      )}

      {/* Feed items — staggered entrance animation; mode="popLayout" animates items
          in/out when the filter changes, giving a smooth removal/addition effect. */}
      {!isLoading && safe.length > 0 && visible.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div key={filter} variants={STAGGER} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visible.map(item => (
              <motion.div key={item.id} variants={FADE_UP}>
                <FeedItem item={item} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
