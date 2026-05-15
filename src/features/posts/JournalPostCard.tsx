// ─────────────────────────────────────────────────────────────────────────────
// features/posts/JournalPostCard.tsx — Post card for VoyageDetailPage list
//
// Distinct from PostCard.tsx (social feed card with reactions/comments).
// Shows: date, location, audience pill, title, body preview, metadata snippets.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY, TEXT } from '@/constants'
import AudiencePill from './AudiencePill'
import FE from '@/components/FE'
import { Pencil, Trash2 } from 'lucide-react'
import type { PostRow } from './hooks'
import { useDeletePost } from './hooks'

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
  const navigate     = useNavigate()
  const deletePost   = useDeletePost()
  const [confirmDel, setConfirmDel] = useState(false)

  const truncated    = post.body.length > BODY_LIMIT
  const bodyPreview  = truncated ? post.body.slice(0, BODY_LIMIT).trimEnd() + '…' : post.body

  // Metadata snippets from migrated daily-log fields
  const meta   = post.metadata ?? {}
  const rating = typeof meta.rating === 'number' ? meta.rating : null
  const weather: string[] = Array.isArray(meta.weather) ? (meta.weather as string[]) : []

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
        {/* Accent strip */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--t-primary-dk), var(--t-primary), var(--t-accent))', flexShrink: 0 }} />

        <div style={{ padding: '14px 16px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {post.post_date && (
                <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>{formatDate(post.post_date)}</span>
              )}
              {post.location && (
                <span style={{ fontSize: 12, color: TEAL, fontWeight: 600, fontFamily: FONT_BODY }}>
                  <FE emoji="📍" size={12} /> {post.location}
                </span>
              )}
              <AudiencePill audience={post.audience} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
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

          {/* Metadata snippets */}
          {(rating !== null || weather.length > 0) && (
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
