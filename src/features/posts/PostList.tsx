// ─────────────────────────────────────────────────────────────────────────────
// features/posts/PostList.tsx — Reverse-chron post list for VoyageDetailPage
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, MUTED, NAVY2, FONT_BODY, FONT_DISPLAY, sty } from '@/constants'
import { usePostsByVoyage } from './hooks'
import JournalPostCard from './JournalPostCard'
import { SkeletonCard } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { STAGGER, FADE_UP } from '@/lib/motion'
import { Plus } from 'lucide-react'
import type { Audience } from '@/types/models'

type Filter = 'all' | Audience

const FILTERS: { value: Filter; label: string; emoji: string }[] = [
  { value: 'all',     label: 'All',     emoji: '📋' },
  { value: 'private', label: 'Private', emoji: '🔒' },
  { value: 'family',  label: 'Family',  emoji: '👨‍👩‍👧' },
  { value: 'public',  label: 'Public',  emoji: '🌐' },
]

interface Props {
  voyageId: string
}

export default function PostList({ voyageId }: Props) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const { data: posts = [], isLoading, error } = usePostsByVoyage(voyageId)

  const visible = filter === 'all' ? posts : posts.filter(p => p.audience === filter)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: MUTED, fontFamily: FONT_BODY, fontSize: 14 }}>
        Could not load posts. Please try again.
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
        <EmptyState
          icon="✍️"
          heading="No posts yet"
          body="Write your first post for this voyage — capture your highlights, thoughts, and best moments."
          action={{ label: 'Write First Post', onClick: () => navigate(`/voyages/${voyageId}/posts/new`) }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar: count + filter chips + new button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count  = f.value === 'all' ? posts.length : posts.filter(p => p.audience === f.value).length
            const active = filter === f.value
            if (f.value !== 'all' && count === 0) return null
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  display:    'flex', alignItems: 'center', gap: 5,
                  padding:    '4px 11px', borderRadius: 20,
                  border:     `1.5px solid ${active ? 'var(--t-primary)' : BORDER}`,
                  background: active ? 'var(--t-bg)' : WHITE,
                  color:      active ? 'var(--t-primary)' : MUTED,
                  cursor:     'pointer', fontSize: 12,
                  fontWeight: active ? 700 : 400, fontFamily: FONT_BODY,
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ fontSize: 13 }}>{f.emoji}</span>
                {f.label}
                <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>
              </button>
            )
          })}
        </div>

        <motion.button
          onClick={() => navigate(`/voyages/${voyageId}/posts/new`)}
          whileTap={{ scale: 0.96 }}
          className="btn-primary"
          style={{ ...sty.btn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 16px' }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Post
        </motion.button>
      </div>

      {/* Filtered empty state */}
      {visible.length === 0 && filter !== 'all' && (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>
            {FILTERS.find(f => f.value === filter)?.emoji}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>
            No {filter} posts yet.
          </p>
        </div>
      )}

      {/* Post list */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={filter}
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {visible.map(post => (
            <motion.div key={post.id} variants={FADE_UP} layout="position">
              <JournalPostCard post={post} voyageId={voyageId} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
