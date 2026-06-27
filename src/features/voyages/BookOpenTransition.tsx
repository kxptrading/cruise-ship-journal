// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/BookOpenTransition.tsx — "open the book" navigation animation
//
// When a voyage book cover is tapped on My Voyages, this overlay lifts a copy of
// the book from the card's position to centre-screen, then swings the front cover
// open on its spine to reveal a title page — and calls onDone (→ navigate). The
// card aspect (2:3) matches the book, so the lift uses a uniform scale (smooth).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { NAVY2, WHITE, GOLD, CREAM, MUTED, FONT_DISPLAY, FONT_BODY } from '@/constants'
import type { VoyageRow } from './hooks'

interface Props {
  voyage: VoyageRow
  rect:   DOMRect
  onDone: () => void
}

export default function BookOpenTransition({ voyage, rect, onDone }: Props) {
  const done = useRef(false)
  const finish = () => { if (!done.current) { done.current = true; onDone() } }
  // Once the cover has opened, zoom into the title page and fade into the next page.
  const [zooming, setZooming] = useState(false)

  // Safety net: navigate even if an animation-complete event is missed.
  useEffect(() => {
    const t = setTimeout(finish, 1800)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const W  = Math.min(330, window.innerWidth * 0.78)
  const H  = W * 1.5
  const cx = (window.innerWidth  - W) / 2
  const cy = Math.max(24, (window.innerHeight - H) / 2)
  const title = voyage.destination || voyage.ship_name || 'Voyage'
  const coverBg = voyage.cover_photo_url ? NAVY2 : 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)'

  return (
    <motion.div
      initial={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.45 }}
        style={{ position: 'absolute', inset: 0, background: '#0A121E' }} />

      {/* Book — lifts from the card rect to centre, then the cover opens */}
      <motion.div
        initial={{ x: rect.left - cx, y: rect.top - cy, scale: rect.width / W }}
        animate={{ x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', left: cx, top: cy, width: W, height: H, transformOrigin: 'top left', perspective: 1600 }}
      >
        {/* Title page (revealed as the cover opens) — then zooms in and fades into
            the next page once the cover has finished opening. */}
        <motion.div
          animate={zooming ? { scale: 1.7, opacity: 0 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => { if (zooming) finish() }}
          style={{ position: 'absolute', inset: 0, transformOrigin: 'center', borderRadius: '3px 9px 9px 3px', background: CREAM, boxShadow: '0 24px 70px rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ textAlign: 'center' }}>
            {voyage.cruise_line && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>{voyage.cruise_line}</div>
            )}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1.2 }}>{title}</div>
            {voyage.ship_name && voyage.destination && (
              <div style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 12, color: MUTED, marginTop: 10 }}>aboard {voyage.ship_name}</div>
            )}
          </div>
        </motion.div>

        {/* Front cover — swings open around the spine (left edge), then the page
            behind zooms/fades into the next view. */}
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -164 }}
          transition={{ delay: 0.44, duration: 0.6, ease: [0.45, 0, 0.25, 1] }}
          onAnimationComplete={() => setZooming(true)}
          style={{
            position: 'absolute', inset: 0, transformOrigin: 'left center', transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden', borderRadius: '3px 9px 9px 3px', overflow: 'hidden',
            background: coverBg, boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
          }}
        >
          {voyage.cover_photo_url && (
            <img src={voyage.cover_photo_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,16,28,0.45) 0%, rgba(8,16,28,0.10) 40%, rgba(8,16,28,0.8) 100%)' }} />
          {/* Spine */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.08) 55%, rgba(0,0,0,0.05) 100%)' }} />
          {/* Title on the cover */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px 0 24px' }}>
            {voyage.cruise_line && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{voyage.cruise_line}</div>
            )}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: WHITE, lineHeight: 1.14, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{title}</div>
            <div style={{ marginTop: 10, height: 2, width: 36, background: GOLD, borderRadius: 2 }} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
