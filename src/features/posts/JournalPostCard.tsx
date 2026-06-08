// ─────────────────────────────────────────────────────────────────────────────
// features/posts/JournalPostCard.tsx — Post card for VoyageDetailPage list
//
// Distinct from PostCard.tsx (social feed card with reactions/comments).
// Shows: date, location, audience pill, title, body preview, metadata snippets.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY, TEXT } from '@/constants'
import AudiencePill from './AudiencePill'
import FE from '@/components/FE'
import { Pencil, Trash2 } from 'lucide-react'
import type { PostRow } from './hooks'
import { useDeletePost, useUpdatePost } from './hooks'
import type { Audience } from '@/types/models'
import PhotoHero from '@/ui/PhotoHero'

// ── Quick audience popover ────────────────────────────────────────────────────

const AUDIENCE_OPTIONS: { value: Audience; emoji: string; label: string }[] = [
  { value: 'private', emoji: '🔒', label: 'Private'  },
  { value: 'family',  emoji: '👨‍👩‍👧', label: 'Family'   },
  { value: 'public',  emoji: '🌐', label: 'Public'   },
]

function AudiencePopover({ current, onSelect, onClose }: { current: Audience; onSelect: (a: Audience) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 4 }}
      transition={{ type: 'spring', damping: 22, stiffness: 380 }}
      style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden', minWidth: 140 }}
    >
      {AUDIENCE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: current === opt.value ? '#F9FAFB' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: NAVY2, textAlign: 'left', fontWeight: current === opt.value ? 700 : 400 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
          onMouseLeave={e => { e.currentTarget.style.background = current === opt.value ? '#F9FAFB' : 'none' }}
        >
          <span style={{ fontSize: 15 }}>{opt.emoji}</span>
          {opt.label}
          {current === opt.value && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>✓</span>}
        </button>
      ))}
    </motion.div>
  )
}

const BODY_LIMIT = 200

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  post:     PostRow
  voyageId: string
}

export default function JournalPostCard({ post, voyageId }: Props) {
  const navigate       = useNavigate()
  const deletePost     = useDeletePost()
  const updatePost     = useUpdatePost()
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [audiencePop,  setAudiencePop]  = useState(false)

  const handleAudienceChange = async (audience: Audience) => {
    setAudiencePop(false)
    await updatePost.mutateAsync({ id: post.id, audience })
  }

  const truncated    = post.body.length > BODY_LIMIT
  const bodyPreview  = truncated ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body

  // Metadata snippets from migrated daily-log fields
  const meta   = post.metadata ?? {}
  const rating = typeof meta.rating === 'number' ? meta.rating : null
  const weather: string[] = Array.isArray(meta.weather) ? (meta.weather as string[]) : []

  const isPoD = meta.is_photo_of_day === true
  const togglePoD = async () => {
    await updatePost.mutateAsync({ id: post.id, metadata: { ...meta, is_photo_of_day: !isPoD } })
  }

  const photos      = post.media_paths ?? []
  const locationStr = (post.location ?? '').toLowerCase()
  const dayType     = locationStr.includes('sea') ? 'at-sea' : 'port'

  const handleDelete = async () => {
    await deletePost.mutateAsync({ postId: post.id, voyageId })
    setConfirmDel(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={{
          background:   WHITE,
          border:       `1px solid ${BORDER}`,
          borderRadius: 18,
          overflow:     'hidden',
          boxShadow:    '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Accent strip — only shown when no hero photo */}
        {photos.length === 0 && (
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--t-primary-dk), var(--t-primary), var(--t-accent))', flexShrink: 0 }} />
        )}

        {/* Hero photo — 16:9 with badge overlay */}
        {photos.length > 0 && (
          <div style={{ position: 'relative' }}>
            <PhotoHero
              paths={photos}
              badge={isPoD ? '⭐ Photo of the Day' : undefined}
              dayType={dayType}
              aspectRatio="16/9"
              borderRadius={0}
            />
            {/* Overlay badges: location · weather · rating */}
            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 5, flexWrap: 'wrap', pointerEvents: 'none' }}>
              {post.location && (
                <span style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, fontFamily: FONT_BODY }}>
                  📍 {post.location}
                </span>
              )}
              {weather[0] && (
                <span style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, fontFamily: FONT_BODY }}>
                  {({ Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️' } as Record<string, string>)[weather[0]] ?? ''} {weather[0]}
                </span>
              )}
              {rating !== null && rating > 0 && (
                <span style={{ background: 'rgba(201,162,39,0.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, fontFamily: FONT_BODY }}>
                  {'★'.repeat(rating)}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {post.post_date && (
                <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{formatDate(post.post_date)}</span>
              )}
              {/* Location shown on image badge when photo exists; show inline only for text-only posts */}
              {post.location && photos.length === 0 && (
                <span style={{ fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: FONT_BODY }}>
                  <FE emoji="📍" size={12} /> {post.location}
                </span>
              )}
              <AudiencePill audience={post.audience} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, position: 'relative' }}>
              {/* Photo of the Day toggle — only shown when post has photos */}
              {photos.length > 0 && (
                <button
                  onClick={togglePoD}
                  title={isPoD ? 'Remove Photo of the Day' : 'Mark as Photo of the Day'}
                  style={{ background: isPoD ? `${GOLD}22` : 'none', border: `1px solid ${isPoD ? GOLD : BORDER}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 14, color: isPoD ? GOLD : MUTED, lineHeight: 1 }}
                >
                  {isPoD ? '⭐' : '☆'}
                </button>
              )}

              {/* Quick audience toggle */}
              <button
                onClick={() => setAudiencePop(v => !v)}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}
                title="Change audience"
              >
                {({ private: '🔒', family: '👨‍👩‍👧', public: '🌐' } as Record<string, string>)[post.audience]} ▾
              </button>
              <AnimatePresence>
                {audiencePop && (
                  <AudiencePopover
                    current={post.audience}
                    onSelect={handleAudienceChange}
                    onClose={() => setAudiencePop(false)}
                  />
                )}
              </AnimatePresence>

              <button
                onClick={() => navigate(`/voyages/${voyageId}/posts/${post.id}/edit`)}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => setConfirmDel(true)}
                style={{ background: 'none', border: '1px solid #FECACA', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#DC2626', fontFamily: FONT_BODY }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h3
              onClick={() => navigate(`/voyages/${voyageId}/posts/${post.id}`)}
              style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, cursor: 'pointer', lineHeight: 1.3 }}
            >
              {post.title}
            </h3>
          )}

          {/* Body */}
          {post.body && (
            <p
              onClick={() => navigate(`/voyages/${voyageId}/posts/${post.id}`)}
              style={{ margin: '0 0 10px', fontSize: 14, color: TEXT, lineHeight: 1.7, cursor: 'pointer' }}
            >
              {bodyPreview}
              {truncated && (
                <span style={{ color: 'var(--t-primary)', fontWeight: 600 }}> Read more</span>
              )}
            </p>
          )}

          {/* Metadata snippets — only shown for text-only posts (photo posts show these as image badges) */}
          {photos.length === 0 && (rating !== null || weather.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {rating !== null && (
                <span style={{ fontSize: 12, color: GOLD }}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </span>
              )}
              {weather.slice(0, 2).map(w => (
                <span key={w} style={{ fontSize: 12, color: MUTED }}>
                  {({ Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️' } as Record<string, string>)[w] ?? ''} {w}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setConfirmDel(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: WHITE, borderRadius: 18, padding: '24px', maxWidth: 340, width: '100%' }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Delete post?</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: MUTED, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
                This will permanently remove the post from your journal and any feeds it appeared in.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDel(false)}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deletePost.isPending}
                  style={{ background: '#DC2626', color: WHITE, border: 'none', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY, opacity: deletePost.isPending ? 0.6 : 1 }}>
                  {deletePost.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
