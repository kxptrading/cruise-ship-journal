// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/BookOpenTransition.tsx — "open the book" navigation animation
//
// When a voyage book cover is tapped on My Voyages, this overlay lifts a copy of
// the book from the card's position to centre-screen, then swings the front cover
// open on its spine to reveal a title page — and calls onDone (→ navigate). The
// card aspect (2:3) matches the book, so the lift uses a uniform scale (smooth).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { NAVY2, WHITE, GOLD, FONT_DISPLAY, FONT_BODY } from '@/constants'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import type { VoyageRow } from './hooks'

interface Props {
  voyage: VoyageRow
  rect:   DOMRect
  onDone: (heroUrl?: string) => void
}

export default function BookOpenTransition({ voyage, rect, onDone }: Props) {
  const done = useRef(false)
  const heroUrlRef = useRef<string | undefined>(undefined)  // the chosen photo, for handoff
  const finish = () => { if (!done.current) { done.current = true; onDone(heroUrlRef.current) } }
  // Once the cover has opened, zoom into the title page and fade into the next page.
  const [zooming, setZooming] = useState(false)

  // First page mimics the landing hero: a random voyage photo (same source the
  // landing uses). We pick it here and hand it off so the landing shows the SAME one.
  const { data: posts = [] } = usePostsByVoyage(voyage.id)
  const photoUrls = useMemo(() => {
    const seen = new Set<string>()
    const urls: string[] = []
    for (const p of posts) for (const path of p.media_paths ?? []) {
      if (path && !seen.has(path)) { seen.add(path); urls.push(publicUrl(path)) }
    }
    return urls
  }, [posts])
  const [heroUrl, setHeroUrl] = useState<string | undefined>()
  const pickedRef = useRef(false)
  useEffect(() => {
    if (pickedRef.current || photoUrls.length === 0) return
    pickedRef.current = true
    const url = photoUrls[Math.floor(Math.random() * photoUrls.length)]
    setHeroUrl(url)
    heroUrlRef.current = url
  }, [photoUrls, voyage.id])

  // Safety net: navigate even if an animation-complete event is missed.
  useEffect(() => {
    const t = setTimeout(finish, 2000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const W  = Math.min(330, window.innerWidth * 0.78)
  const H  = W * 1.5
  const cx = (window.innerWidth  - W) / 2
  const cy = Math.max(24, (window.innerHeight - H) / 2)
  // Scale that makes the centred page grow to cover the whole viewport, so the
  // final frame is a full-bleed hero photo that flows straight into the landing.
  const fillScale = Math.max(window.innerWidth / W, window.innerHeight / H) * 1.08
  const title = voyage.destination || voyage.ship_name || 'Voyage'
  const coverBg = voyage.cover_photo_url ? NAVY2 : 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)'

  return (
    <motion.div
      initial={{ opacity: 1 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
    >
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.38 }}
        style={{ position: 'absolute', inset: 0, background: '#0A121E' }} />

      {/* Book — lifts from the card rect to centre, then the cover opens */}
      <motion.div
        initial={{ x: rect.left - cx, y: rect.top - cy, scale: rect.width / W }}
        animate={{ x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
        style={{ position: 'absolute', left: cx, top: cy, width: W, height: H, transformOrigin: 'top left' }}
      >
        {/* First page = the voyage landing (hero with the two entries). Revealed
            as the cover opens, then zooms/fades into the real, interactive page. */}
        <motion.div
          animate={zooming
            ? { scale: fillScale, opacity: 1, borderRadius: 0 }
            : { scale: 1, opacity: 1, borderRadius: 6 }}
          transition={{ duration: 0.62, ease: [0.32, 0, 0.2, 1] }}
          onAnimationComplete={() => { if (zooming) finish() }}
          style={{ position: 'absolute', inset: 0, transformOrigin: 'center', overflow: 'hidden', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
        >
          {heroUrl && (
            <img src={heroUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,16,28,0.45) 0%, rgba(8,16,28,0.18) 42%, rgba(8,16,28,0.78) 100%)' }} />
          {/* Title fades out as the page zooms — the landing supplies its own hero text. */}
          <motion.div
            animate={{ opacity: zooming ? 0 : 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 18px', color: WHITE }}
          >
            {voyage.cruise_line && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{voyage.cruise_line}</div>
            )}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1.14, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{title}</div>
            <div style={{ margin: '10px auto 0', height: 2, width: 36, background: GOLD, borderRadius: 2 }} />
          </motion.div>
        </motion.div>

        {/* Front cover — swings open around the spine (left edge), then the page
            behind zooms/fades into the next view. */}
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: -115, opacity: 0 }}
          transition={{
            // Per-element perspective + fade-as-it-opens — no preserve-3d /
            // backface-visibility, which mobile Safari renders unreliably.
            rotateY: { delay: 0.38, duration: 0.54, ease: [0.45, 0, 0.25, 1] },
            opacity: { delay: 0.74, duration: 0.18 },
          }}
          onAnimationComplete={() => setZooming(true)}
          style={{
            position: 'absolute', inset: 0, transformOrigin: 'left center', transformPerspective: 1200,
            borderRadius: '3px 9px 9px 3px', overflow: 'hidden',
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

