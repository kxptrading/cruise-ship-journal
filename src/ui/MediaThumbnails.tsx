// ─────────────────────────────────────────────────────────────────────────────
// ui/MediaThumbnails.tsx — Responsive photo grid with swipe lightbox
//
// Usage:
//   <MediaThumbnails paths={post.media_paths} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BORDER } from '@/constants'
import { publicUrl } from '@/features/posts/mediaStorage'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  paths:   string[]
  startAt: number
  onClose: () => void
}

export function PhotoLightbox({ paths, startAt, onClose }: LightboxProps) {
  const [idx, setIdx]   = useState(startAt)
  const [dir, setDir]   = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const go = (delta: number) => {
    const next = idx + delta
    if (next < 0 || next >= paths.length) return
    setDir(delta)
    setIdx(next)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Close */}
      <button onClick={onClose}
        style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); go(-1) }}
          style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {idx < paths.length - 1 && (
        <button onClick={e => { e.stopPropagation(); go(1) }}
          style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={22} />
        </button>
      )}

      {/* Image — swipe or arrow-navigate */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.img
          key={idx}
          custom={dir}
          initial={{ x: dir * 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -dir * 60, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          src={publicUrl(paths[idx])}
          alt={`Photo ${idx + 1}`}
          onClick={e => e.stopPropagation()}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(1)
            if (info.offset.x >  60) go(-1)
          }}
          style={{ maxWidth: 'min(90vw, 900px)', maxHeight: '88vh', objectFit: 'contain', borderRadius: 10, cursor: 'default', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', userSelect: 'none' }}
        />
      </AnimatePresence>

      {/* Dot indicator */}
      {paths.length > 1 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {paths.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setDir(i > idx ? 1 : -1); setIdx(i) }}
              style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── MediaThumbnails ───────────────────────────────────────────────────────────

interface Props {
  paths:    string[]
  maxShow?: number     // cap visible thumbnails; show "+N more" overflow
  size?:    'sm' | 'md'
}

export default function MediaThumbnails({ paths, maxShow = 4, size = 'md' }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  if (!paths.length) return null

  const visible  = paths.slice(0, maxShow)
  const overflow = paths.length - visible.length
  const thumb    = size === 'sm' ? 70 : 100

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {visible.map((path, i) => (
          <motion.div
            key={path}
            whileHover={{ scale: 1.04 }}
            onClick={() => setLightbox(i)}
            style={{ width: thumb, height: thumb, borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in', border: `1px solid ${BORDER}`, flexShrink: 0, position: 'relative' }}
          >
            <img src={publicUrl(path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {/* Overflow badge on last visible */}
            {i === visible.length - 1 && overflow > 0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>
                +{overflow}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <PhotoLightbox paths={paths} startAt={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
