// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/VoyageHero.tsx — Voyage hero banner
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { GOLD, WHITE, BP, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { Donut } from '../../components/ui'
import { getTimeGradient, getVignetteRGB } from '../../lib/atmosphere'
import type { TimeOfDay } from '../../lib/atmosphere'
import type { Voyage } from '../../types'
import FE from '../../components/FE'

interface Star {
  id:       number | string
  x:        number
  y:        number
  size:     number
  delay:    number
  duration: number
}

interface Props {
  w:            number
  voyage:       Voyage
  voyagePct:    number | null
  currentDay:   number | null
  voyageNights: number
  daysLeft:     number
  barPct:       number
  timeOfDay:    TimeOfDay
  stars:        Star[]
  onNav:        (id: string) => void
  scrollY?:     MotionValue<number>
}

export default function VoyageHero({ w, voyage, voyagePct, currentDay, voyageNights, daysLeft, barPct, timeOfDay, stars, onNav, scrollY }: Props) {
  const HERO_H = w < BP.mobile ? 210 : 250
  const tg = getTimeGradient(timeOfDay)
  const [vr, vg, vb] = getVignetteRGB(timeOfDay)

  // Fallback MotionValues when scrollY isn't provided (e.g. during SSR or tests)
  const defaultScrollY = useTransform(() => 0)
  const sy = scrollY ?? defaultScrollY
  const heroOpacity = useTransform(sy, [0, 160], [1, 0.4])
  const heroFilter  = useTransform(sy, [0, 160], ['blur(0px)', 'blur(4px)'])

  return (
    <motion.div style={{ opacity: heroOpacity, filter: heroFilter, willChange: 'opacity, filter' }}>
    <div style={{
      position: 'relative', height: HERO_H, borderRadius: 20,
      marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(3,105,161,0.3)',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: tg || 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 50%, var(--t-primary) 100%)',
      }} />

      {/* Night sky */}
      {timeOfDay === 'night' && (
        <>
          {stars.map(s => (
            <div key={s.id} className="night-star" style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size, borderRadius: '50%', background: 'white',
              animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
            }} />
          ))}
          <div className="moon-icon" style={{ position: 'absolute', top: 14, right: 58, pointerEvents: 'none' }}><FE emoji="🌙" size={28} /></div>
        </>
      )}

      {/* Cover photo */}
      {voyage.coverPhotoUrl && (
        <img src={voyage.coverPhotoUrl} alt="Voyage cover" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        }} />
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(to bottom, rgba(${vr},${vg},${vb},0.0) 0%, rgba(${vr},${vg},${vb},0.6) 100%)`,
      }} />

      {/* Decorative rings (no cover photo) */}
      {!voyage.coverPhotoUrl && (
        <>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.13)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.08)', pointerEvents: 'none' }} />
        </>
      )}

      {/* Waves */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', lineHeight: 0, pointerEvents: 'none' }}>
        <svg className="hero-wave-1" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '150%', height: 38, display: 'block', marginLeft: '-10%' }}>
          <path d="M0,40 C240,0 480,60 720,30 C960,0 1200,50 1440,20 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.07)" />
        </svg>
        <svg className="hero-wave-2" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '150%', height: 24, display: 'block', marginLeft: '-10%' }}>
          <path d="M0,20 C300,40 600,0 900,20 C1100,35 1280,10 1440,20 L1440,40 L0,40 Z" fill="rgba(255,255,255,0.05)" />
        </svg>
        <svg className="hero-wave-3" viewBox="0 0 1440 30" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '160%', height: 16, display: 'block', marginLeft: '-5%' }}>
          <path d="M0,15 C200,30 500,0 800,15 C1050,28 1300,5 1440,15 L1440,30 L0,30 Z" fill="rgba(255,255,255,0.03)" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${w < BP.mobile ? 18 : 28}px 22px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {(voyage.cruiseLine || voyage.shipName) && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, fontFamily: FONT_BODY, marginBottom: 5 }}>
                {voyage.cruiseLine || 'Cruise Ship Log'}
              </div>
            )}

            <h1 style={{ margin: '0 0 10px', fontSize: w < BP.mobile ? 28 : 36, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.05, textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
              {voyage.shipName || 'Your Voyage Awaits'}
            </h1>

            {(voyage.departurePort || voyage.departureDate) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: voyagePct !== null ? 12 : 0 }}>
                {voyage.departurePort && <span style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}><FE emoji="📍" size={13} /> {voyage.departurePort}</span>}
                {voyage.departureDate && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                    <FE emoji="📅" size={13} /> {voyage.departureDate}{voyage.returnDate ? ` → ${voyage.returnDate}` : ''}
                  </span>
                )}
                {voyage.cabin && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}><FE emoji="🚪" size={13} /> Cabin {voyage.cabin}</span>}
              </div>
            )}

            {!voyage.shipName && (
              <button onClick={() => onNav('voyage')} style={{ background: GOLD, color: '#1C2B3A', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, marginBottom: 10 }}>
                Set Up Your Voyage →
              </button>
            )}

            {voyagePct !== null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 600 }}>Voyage Progress</span>
                  <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY }}>
                    {daysLeft === 0 ? 'Voyage Complete ✓' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barPct}%`, background: GOLD, borderRadius: 2, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            )}

            {(voyage.companion1 || voyage.companion2) && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>With:</span>
                {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{c}</div>
                ))}
              </div>
            )}
          </div>

          {w >= BP.mobile && voyageNights > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <Donut pct={voyagePct || 0} size={80} color={GOLD} bg="rgba(255,255,255,0.15)" thick={6} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: currentDay ? 24 : 18, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                    {currentDay || voyageNights}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: 600 }}>
                    {currentDay ? `of ${voyageNights}` : 'nights'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, fontWeight: 600 }}>
                {currentDay ? 'Current Day' : 'Duration'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </motion.div>
  )
}
