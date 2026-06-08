// dashboard/VoyageMemoryWall.tsx — Masonry photo wall for the voyage dashboard

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { WHITE, BORDER, MUTED, GOLD, NAVY2, FONT_DISPLAY, FONT_BODY, BP } from '@/constants'
import { useW } from '@/context'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'

interface MemoryEntry {
  url:      string
  path:     string
  postId:   string
  title:    string
  date:     string | null
  location: string
  isPoD:    boolean
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

// ── Memory lightbox — photo + entry metadata strip ────────────────────────────

interface LightboxProps {
  entries:  MemoryEntry[]
  startIdx: number
  voyageId: string
  onClose:  () => void
}

function MemoryLightbox({ entries, startIdx, voyageId, onClose }: LightboxProps) {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(startIdx)
  const [dir, setDir] = useState(0)
  const entry = entries[idx]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const go = (delta: number) => {
    const next = idx + delta
    if (next < 0 || next >= entries.length) return
    setDir(delta)
    setIdx(next)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); go(-1) }} style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {idx < entries.length - 1 && (
        <button onClick={e => { e.stopPropagation(); go(1) }} style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={22} />
        </button>
      )}

      {/* Photo */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.img
          key={idx}
          custom={dir}
          initial={{ x: dir * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -dir * 60, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          src={entry.url}
          alt={entry.title || 'Memory'}
          onClick={e => e.stopPropagation()}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); if (info.offset.x > 60) go(-1) }}
          style={{ maxWidth: 'min(90vw, 900px)', maxHeight: '68vh', objectFit: 'contain', borderRadius: 10, cursor: 'default', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', userSelect: 'none' }}
        />
      </AnimatePresence>

      {/* Entry metadata strip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`meta-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          style={{ marginTop: 16, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '12px 18px', maxWidth: 'min(90vw, 620px)', width: '100%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
        >
          <div style={{ minWidth: 0 }}>
            {entry.title && (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: FONT_DISPLAY, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.title}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
              {entry.location && <span style={{ fontSize: 12, color: GOLD, fontFamily: FONT_BODY }}>📍 {entry.location}</span>}
              {entry.date    && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: FONT_BODY }}>📅 {formatDate(entry.date)}</span>}
              {entry.isPoD   && <span style={{ fontSize: 12, color: GOLD, fontFamily: FONT_BODY }}>⭐ Photo of the Day</span>}
            </div>
          </div>
          <button
            onClick={() => { onClose(); navigate(`/voyages/${voyageId}/posts/${entry.postId}`) }}
            style={{ flexShrink: 0, background: 'none', border: `1px solid ${GOLD}60`, borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: GOLD, fontFamily: FONT_BODY, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            View Post →
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {entries.length > 1 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {entries.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setDir(i > idx ? 1 : -1); setIdx(i) }}
              style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── VoyageMemoryWall ──────────────────────────────────────────────────────────

interface Props {
  voyageId:    string
  limit?:      number
  onViewAll?:  () => void
}

export default function VoyageMemoryWall({ voyageId, limit = 16, onViewAll }: Props) {
  const { data: posts = [], isLoading } = usePostsByVoyage(voyageId)
  const w = useW()
  const [lightbox, setLightbox] = useState<{ idx: number } | null>(null)

  const cols = w < BP.mobile ? 2 : w < BP.tablet ? 3 : 4

  const entries = useMemo<MemoryEntry[]>(() =>
    posts
      .slice()
      .sort((a, b) => (b.post_date ?? '').localeCompare(a.post_date ?? ''))
      .flatMap(post =>
        (post.media_paths ?? []).map(path => ({
          url:      publicUrl(path),
          path,
          postId:   post.id,
          title:    post.title ?? '',
          date:     post.post_date,
          location: post.location ?? '',
          isPoD:    post.metadata?.is_photo_of_day === true,
        }))
      )
      .slice(0, limit),
    [posts, limit]
  )

  if (isLoading || entries.length === 0) return null

  const totalPhotos = posts.flatMap(p => p.media_paths ?? []).length
  const hasMore     = totalPhotos > limit

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
              Voyage Memories
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
              {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} from this voyage
            </p>
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: MUTED, fontFamily: FONT_BODY, fontWeight: 600 }}
            >
              View All →
            </button>
          )}
        </div>

        {/* Masonry grid — CSS columns for organic layout */}
        <div style={{ columns: cols, columnGap: 8 }}>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.path}
              whileHover={{ scale: 1.02, zIndex: 1 }}
              transition={{ duration: 0.15 }}
              onClick={() => setLightbox({ idx: i })}
              style={{
                breakInside:   'avoid',
                marginBottom:  8,
                borderRadius:  10,
                overflow:      'hidden',
                cursor:        'zoom-in',
                border:        `1px solid ${BORDER}`,
                position:      'relative',
                display:       'block',
              }}
            >
              <img
                src={entry.url}
                alt={entry.title || 'Memory'}
                loading="lazy"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              {/* Hover info overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.65))',
                padding: '20px 8px 8px',
              }}>
                {entry.isPoD && (
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY, marginBottom: 2 }}>⭐ POTD</div>
                )}
                {entry.location && (
                  <div style={{ fontSize: 10, color: '#fff', fontFamily: FONT_BODY, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {entry.location}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all CTA when truncated */}
        {hasMore && onViewAll && (
          <button
            onClick={onViewAll}
            style={{ display: 'block', width: '100%', marginTop: 4, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 13, color: MUTED, fontFamily: FONT_BODY, fontWeight: 600, textAlign: 'center' }}
          >
            View all {totalPhotos} photos in Gallery →
          </button>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <MemoryLightbox
            entries={entries}
            startIdx={lightbox.idx}
            voyageId={voyageId}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
