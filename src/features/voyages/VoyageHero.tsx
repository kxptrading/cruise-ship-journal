// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/VoyageHero.tsx — Voyage hero banner
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { GOLD, WHITE, BP, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { Donut } from '../../components/ui'
import { getTimeGradient, getVignetteRGB } from '../../lib/atmosphere'
import type { TimeOfDay } from '../../lib/atmosphere'
import type { Voyage, ItineraryDay } from '../../types'
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
  itinerary?:   ItineraryDay[]
}

export default function VoyageHero({ w, voyage, voyagePct, currentDay, voyageNights, daysLeft, barPct, timeOfDay, stars, onNav, scrollY, itinerary }: Props) {
  const [showProgressTooltip, setShowProgressTooltip] = useState(false)

  const currentPort = (itinerary && currentDay && currentDay >= 1)
    ? (itinerary[currentDay - 1]?.port || null)
    : null
  const currentPortIsSea = currentPort ? currentPort.toLowerCase().includes('sea') : false

  const seaDays = itinerary
    ? itinerary.filter(d => !d.port || d.port.toLowerCase() === 'at sea').length
    : null
  const HERO_H = w < BP.mobile ? 210 : 260
  const tg = getTimeGradient(timeOfDay)
  const [vr, vg, vb] = getVignetteRGB(timeOfDay)

  const defaultScrollY = useTransform(() => 0)
  const sy = scrollY ?? defaultScrollY
  const heroOpacity = useTransform(sy, [0, 180], [1, 0.4])
  const heroFilter  = useTransform(sy, [0, 180], ['blur(0px)', 'blur(4px)'])
  // Parallax: background moves at 40% of scroll speed
  const bgY = useTransform(sy, [0, 300], [0, 120])

  return (
    <motion.div style={{ opacity: heroOpacity, filter: heroFilter, willChange: 'opacity, filter' }}>
    <div style={{
      position: 'relative', height: HERO_H, borderRadius: 20,
      marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(3,105,161,0.3)',
    }}>
      {/* Parallax background layer — extends beyond bounds so parallax shift doesn't show edges */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, top: '-15%', bottom: '-15%',
          background: tg || 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 50%, var(--t-primary) 100%)',
          y: bgY,
          willChange: 'transform',
        }}
      />

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

      {/* Cover photo — parallax applied */}
      {voyage.coverPhotoUrl && (
        <motion.img
          src={voyage.coverPhotoUrl}
          alt="Voyage cover"
          style={{
            position: 'absolute', left: 0, right: 0, top: '-15%', width: '100%', height: '130%',
            objectFit: 'cover', display: 'block', y: bgY, willChange: 'transform',
          }}
        />
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(to bottom, rgba(${vr},${vg},${vb},0.0) 15%, rgba(${vr},${vg},${vb},0.75) 100%)`,
        zIndex: 1,
      }} />

      {/* Decorative rings (no cover photo) */}
      {!voyage.coverPhotoUrl && (
        <>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.13)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.08)', pointerEvents: 'none', zIndex: 1 }} />
        </>
      )}

      {/* Waves */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', lineHeight: 0, pointerEvents: 'none', zIndex: 2 }}>
        <svg className="hero-wave-1" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '150%', height: 38, display: 'block', marginLeft: '-10%' }}>
          <path d="M0,40 C240,0 480,60 720,30 C960,0 1200,50 1440,20 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.07)" />
        </svg>
        <svg className="hero-wave-2" viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '150%', height: 24, display: 'block', marginLeft: '-10%' }}>
          <path d="M0,20 C300,40 600,0 900,20 C1100,35 1280,10 1440,20 L1440,40 L0,40 Z" fill="rgba(255,255,255,0.05)" />
        </svg>
      </div>

      {/* ── Floating glass content card ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 3,
        background: 'rgba(10,22,38,0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 16,
        padding: `${w < BP.mobile ? 14 : 18}px ${w < BP.mobile ? 14 : 20}px`,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {(voyage.cruiseLine || voyage.shipName) && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, fontFamily: FONT_BODY, marginBottom: 5 }}>
                {voyage.cruiseLine || 'SwellDays'}
              </div>
            )}

            <h1 style={{ margin: '0 0 8px', fontSize: w < BP.mobile ? 26 : 32, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.05, textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
              {voyage.shipName || 'Your Voyage Awaits'}
            </h1>

            {/* "Currently in [port]" pill — only when voyage is actively sailing today */}
            {currentDay !== null && currentPort && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8 }}
              >
                <div style={{ background: 'rgba(201,162,39,0.25)', border: '1px solid rgba(201,162,39,0.5)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'pulse 1.6s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT_BODY }}>
                    {currentPortIsSea ? 'Currently at sea' : `Currently in ${currentPort}`}
                  </span>
                </div>
              </motion.div>
            )}

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
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 600 }}>Voyage Progress</span>
                  <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY }}>
                    {daysLeft === 0 ? 'Voyage Complete ✓' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                  </span>
                </div>
                {/* Interactive progress bar */}
                <div
                  style={{ height: 8, background: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'visible', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={() => setShowProgressTooltip(true)}
                  onMouseLeave={() => setShowProgressTooltip(false)}
                  onClick={() => setShowProgressTooltip(v => !v)}
                >
                  <div style={{ height: '100%', width: `${barPct}%`, background: GOLD, borderRadius: 4, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
                    {/* Thumb dot */}
                    <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: GOLD, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
                {/* Tooltip */}
                {showProgressTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
                      background: 'rgba(20,41,63,0.95)', backdropFilter: 'blur(8px)',
                      borderRadius: 10, padding: '10px 14px', zIndex: 10,
                      border: `1px solid rgba(201,162,39,0.3)`,
                      minWidth: 190,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 5 }}>
                      {currentDay && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FONT_BODY }}>Day</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{currentDay} of {voyageNights}</span>
                        </div>
                      )}
                      {currentPort && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FONT_BODY }}>Location</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT_BODY }}>{currentPort}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FONT_BODY }}>Remaining</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>
                          {daysLeft === 0 ? 'Complete' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                      {seaDays !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FONT_BODY }}>Sea days</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{seaDays}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
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
