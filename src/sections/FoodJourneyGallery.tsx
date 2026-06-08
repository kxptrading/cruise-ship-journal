// sections/FoodJourneyGallery.tsx — Visual food photo gallery for the Food Log tab

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { WHITE, BORDER, MUTED, GOLD, NAVY2, FONT_DISPLAY, FONT_BODY, BP } from '@/constants'
import { useW } from '@/context'
import { publicUrl } from '@/features/posts/mediaStorage'
import type { FoodLog } from '../types'

// ── Data shape ────────────────────────────────────────────────────────────────

interface FoodPhoto {
  url:        string
  path:       string
  venue:      string
  meal:       string
  rating:     number
  what:       string
  standout:   string
  date:       string
  port:       string
  orderAgain: string
}

const MEAL_EMOJI: Record<string, string> = {
  Breakfast: '🍳', Lunch: '🥗', Tea: '☕', Dinner: '🍽️', Snack: '🍪', Other: '🍴',
}

function formatDate(iso: string) {
  if (!iso) return ''
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  catch { return iso }
}

// ── Food lightbox ─────────────────────────────────────────────────────────────

interface LightboxProps {
  photos:  FoodPhoto[]
  startAt: number
  onClose: () => void
}

function FoodLightbox({ photos, startAt, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(startAt)
  const [dir, setDir] = useState(0)
  const photo = photos[idx]

  const go = (delta: number) => {
    const next = idx + delta
    if (next < 0 || next >= photos.length) return
    setDir(delta)
    setIdx(next)
  }

  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
    >
      <button onClick={onClose} style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); go(-1) }} style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} />
        </button>
      )}
      {idx < photos.length - 1 && (
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
          src={photo.url}
          alt={photo.venue || 'Food photo'}
          onClick={e => e.stopPropagation()}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); if (info.offset.x > 60) go(-1) }}
          style={{ maxWidth: 'min(90vw, 900px)', maxHeight: '68vh', objectFit: 'contain', borderRadius: 10, cursor: 'default', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', userSelect: 'none' }}
        />
      </AnimatePresence>

      {/* Food context card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`ctx-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          style={{ marginTop: 16, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '14px 18px', maxWidth: 'min(90vw, 580px)', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Venue + meal type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
            <div>
              {photo.venue && (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: FONT_DISPLAY, marginBottom: 3 }}>
                  {photo.venue}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                {photo.meal  && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: FONT_BODY }}>{MEAL_EMOJI[photo.meal] ?? '🍴'} {photo.meal}</span>}
                {photo.port  && <span style={{ fontSize: 12, color: GOLD, fontFamily: FONT_BODY }}>📍 {photo.port}</span>}
                {photo.date  && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY }}>📅 {formatDate(photo.date)}</span>}
              </div>
            </div>
            {photo.rating > 0 && (
              <span style={{ fontSize: 14, color: GOLD, flexShrink: 0 }}>{'★'.repeat(photo.rating)}{'☆'.repeat(5 - photo.rating)}</span>
            )}
          </div>

          {/* Dishes */}
          {(photo.what || photo.standout) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {photo.what     && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: FONT_BODY }}>🍴 {photo.what}</span>}
              {photo.standout && <span style={{ fontSize: 12, color: GOLD, fontFamily: FONT_BODY }}>⭐ {photo.standout}</span>}
              {photo.orderAgain === 'Yes' && <span style={{ fontSize: 12, color: '#4ADE80', fontFamily: FONT_BODY }}>✓ Would order again</span>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {photos.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setDir(i > idx ? 1 : -1); setIdx(i) }}
              style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── FoodJourneyGallery ────────────────────────────────────────────────────────

interface Props {
  foodLogs: FoodLog[]
}

export default function FoodJourneyGallery({ foodLogs }: Props) {
  const w = useW()
  const [lightbox, setLightbox] = useState<number | null>(null)

  const cols = w < BP.mobile ? 2 : 3

  const photos = useMemo<FoodPhoto[]>(() =>
    foodLogs.flatMap(entry =>
      (entry.photos ?? []).map(path => ({
        url:        publicUrl(path),
        path,
        venue:      entry.venue,
        meal:       entry.meal,
        rating:     entry.rating,
        what:       entry.what,
        standout:   entry.standout,
        date:       entry.date,
        port:       entry.port,
        orderAgain: entry.orderAgain,
      }))
    ),
    [foodLogs]
  )

  if (photos.length === 0) return null

  return (
    <>
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '16px 16px 12px', marginBottom: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
            Food Journey
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
            {photos.length} food photo{photos.length !== 1 ? 's' : ''} · tap to explore
          </p>
        </div>

        {/* Masonry grid */}
        <div style={{ columns: cols, columnGap: 8 }}>
          {photos.map((photo, i) => (
            <motion.div
              key={photo.path}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
              onClick={() => setLightbox(i)}
              style={{ breakInside: 'avoid', marginBottom: 8, borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', border: `1px solid ${BORDER}`, position: 'relative', display: 'block' }}
            >
              <img
                src={photo.url}
                alt={photo.venue || 'Food photo'}
                loading="lazy"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              {/* Overlay */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))', padding: '20px 8px 8px' }}>
                {photo.venue && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.venue}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  {photo.meal && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: FONT_BODY }}>
                      {MEAL_EMOJI[photo.meal] ?? '🍴'} {photo.meal}
                    </span>
                  )}
                  {photo.rating > 0 && (
                    <span style={{ fontSize: 10, color: GOLD }}>{'★'.repeat(photo.rating)}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <FoodLightbox photos={photos} startAt={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
