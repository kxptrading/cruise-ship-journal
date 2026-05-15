// ─────────────────────────────────────────────────────────────────────────────
// pages/FeedPage.tsx — Spec Feed (spec §4: /feed)
//
// Self-contained — fetches via useFeed() which calls get_feed() RPC (Phase 4).
// Visibility is enforced server-side; no legacy props required.
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
  const { data: items = [], isLoading, error, refetch } = useFeed()

  const visible = filter === 'all' ? items : items.filter(i => i.audience === filter)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: w < BP.mobile ? 24 : 30, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            Feed
          </h1>
          {!isLoading && items.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
              {items.length} post{items.length !== 1 ? 's' : ''} from your contacts
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count  = f.value === 'all' ? items.length : items.filter(i => i.audience === f.value).length
            const active = filter === f.value
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

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '14px 16px', marginBottom: 16, fontFamily: FONT_BODY, fontSize: 13, color: '#DC2626' }}>
          Could not load feed.{' '}
          <button onClick={() => refetch()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 700, textDecoration: 'underline', fontFamily: FONT_BODY }}>Try again</button>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
          <EmptyState
            icon="📡"
            heading="Your feed is empty"
            body="When your contacts share posts with you — family or public — they'll appear here."
            action={{ label: 'Find Friends', onClick: () => navigate('/friends') }}
          />
        </div>
      )}

      {!isLoading && items.length > 0 && visible.length === 0 && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>No {filter} posts from your contacts yet.</p>
        </div>
      )}

      {!isLoading && visible.length > 0 && (
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
