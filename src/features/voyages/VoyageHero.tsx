// ─────────────────────────────────────────────────────────────────────────────
// sections/feed/VoyageHero.tsx — Voyage hero banner
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { GOLD, WHITE, TEXT, BP, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { Donut } from '../../components/ui'
import { getTimeGradient, getVignetteRGB } from '../../lib/atmosphere'
import type { TimeOfDay } from '../../lib/atmosphere'
import type { Voyage, ItineraryDay } from '../../types'
import { MapPin, CalendarDays, DoorClosed } from 'lucide-react'

interface Star {
  id:       number | string
  x:        number
  y:        number
  size:     number
  delay:    number
  duration: number
}

interface Props {
  w:             number
  voyage:        Voyage
  voyagePct:     number | null
  currentDay:    number | null
  voyageNights:  number
  daysLeft:      number
  barPct:        number
  timeOfDay:     TimeOfDay
  stars:         Star[]
  onNav:         (id: string) => void
  scrollY?:      MotionValue<number>
  itinerary?:    ItineraryDay[]
  heroPhotoUrl?: string
}

export default function VoyageHero({ w, voyage, voyagePct, currentDay, voyageNights, daysLeft, barPct, timeOfDay, stars, onNav, scrollY, itinerary, heroPhotoUrl }: Props) {
  const [showProgressTooltip, setShowProgressTooltip] = useState(false)

  const currentPort = (itinerary && currentDay && currentDay >= 1)
    ? (itinerary[currentDay - 1]?.port || null)
    : null
  const currentPortIsSea = currentPort ? currentPort.toLowerCase().includes('sea') : false

  const seaDays = itinerary
    ? itinerary.filter(d => !d.port || d.port.toLowerCase() === 'at sea').length
    : null
  const HERO_H = w < BP.mobile ? 260 : 340
  const tg = getTimeGradient(timeOfDay)
  const [vr, vg, vb] = getVignetteRGB(timeOfDay)

  const defaultScrollY = useTransform(() => 0)
  const sy = scrollY ?? defaultScrollY
  const heroOpacity = useTransform(sy, [0, 220], [1, 0.5])
  // Parallax: background moves at 40% of scroll speed
  const bgY = useTransform(sy, [0, 300], [0, 120])

  return (
    <motion.div style={{ opacity: heroOpacity, willChange: 'opacity' }}>
    <div style={{
      position: 'relative', height: HERO_H, borderRadius: 24,
      marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(3,105,161,0.25), 0 4px 16px rgba(0,0,0,0.08)',
    }}>
      {/* Parallax background layer — extends beyond bounds so parallax shift doesn't show edges */}
      <motion.div
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
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
        </>
      )}

      {/* Cover photo — falls back to first post photo from journal */}
      {(voyage.coverPhotoUrl || heroPhotoUrl) && (
        <motion.img
          src={voyage.coverPhotoUrl || heroPhotoUrl}
          alt="Voyage cover"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', left: 0, right: 0, top: '-15%', width: '100%', height: '130%',
            objectFit: 'cover', display: 'block', y: bgY, willChange: 'transform',
          }}
        />
      )}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(to bottom, rgba(${vr},${vg},${vb},0.0) 0%, rgba(${vr},${vg},${vb},0.55) 55%, rgba(${vr},${vg},${vb},0.92) 100%)`,
        zIndex: 1,
      }} />

      {/* Decorative rings (no cover photo) */}
      {!voyage.coverPhotoUrl && !heroPhotoUrl && (
        <>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.13)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.08)', pointerEvents: 'none', zIndex: 1 }} />
        </>
      )}

      {/* ── Floating content card ────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 3,
        padding: `${w < BP.mobile ? 14 : 20}px ${w < BP.mobile ? 14 : 24}px`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {(voyage.cruiseLine || voyage.shipName) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, fontFamily: FONT_BODY, marginBottom: 6, textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.7)' }}
              >
                {voyage.cruiseLine || 'Deck Days'}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ margin: '0 0 8px', fontSize: w < BP.mobile ? 30 : 40, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.08, textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.7)' }}
            >
              {voyage.shipName || 'Your Voyage Awaits'}
            </motion.h1>


            {(voyage.departurePort || voyage.departureDate) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: voyagePct !== null ? 14 : 0, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                {voyage.departurePort && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: 500, fontFamily: FONT_BODY }}>
                    <MapPin size={14} strokeWidth={2} /> {voyage.departurePort}
                  </span>
                )}
                {voyage.departureDate && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: 500, fontFamily: FONT_BODY }}>
                    <CalendarDays size={14} strokeWidth={2} /> {voyage.departureDate}{voyage.returnDate ? ` — ${voyage.returnDate}` : ''}
                  </span>
                )}
                {voyage.cabin && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: 500, fontFamily: FONT_BODY }}>
                    <DoorClosed size={14} strokeWidth={2} /> Cabin {voyage.cabin}
                  </span>
                )}
              </div>
            )}

            {!voyage.shipName && (
              <button onClick={() => onNav('voyage')} style={{ background: GOLD, color: TEXT, border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, marginBottom: 10 }}>
                Set Up Your Voyage →
              </button>
            )}

            {voyagePct !== null && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'relative',
                  background: 'rgba(12,22,38,0.38)',
                  backdropFilter: 'blur(18px) saturate(1.5)',
                  WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 16,
                  padding: '12px 16px',
                  maxWidth: 520,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: WHITE, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Voyage Progress</span>
                  <span style={{ fontSize: 11, color: WHITE, fontWeight: 700, fontFamily: FONT_BODY, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
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
              </motion.div>
            )}

            {(voyage.companion1 || voyage.companion2) && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: WHITE, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>With:</span>
                {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: WHITE, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{c}</div>
                ))}
              </div>
            )}
          </div>

          {w >= BP.mobile && voyageNights > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <Donut pct={voyagePct || 0} size={80} color={GOLD} bg="rgba(255,255,255,0.15)" thick={6} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: currentDay ? 24 : 18, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                    {currentDay || voyageNights}
                  </div>
                  <div style={{ fontSize: 9, color: WHITE, marginTop: 2, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    {currentDay ? `of ${voyageNights}` : 'nights'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: WHITE, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
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
