// ─────────────────────────────────────────────────────────────────────────────
// sections/dashboard/ItineraryTimeline.tsx — Horizontal scroll-snap day cards
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useEffect } from 'react'
import { WHITE, BORDER, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY } from '@/constants'
import type { ItineraryDay, DailyLog } from '@/types'

const WX_EMOJI: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️',
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return iso }
}

interface Props {
  itinerary:    ItineraryDay[]
  dailyLogs:    DailyLog[]
  currentDay:   number | null
  onViewDay:    (dayIndex: number) => void
  photosByDate?: Record<string, string>  // date (YYYY-MM-DD) → resolved photo URL
}

export default function ItineraryTimeline({ itinerary, dailyLogs, currentDay, onViewDay, photosByDate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentDay || !scrollRef.current) return
    const container = scrollRef.current
    const card = container.querySelector(`[data-day="${currentDay}"]`) as HTMLElement | null
    if (!card) return
    // Scroll only the horizontal container — never call scrollIntoView here because
    // it walks the full ancestor chain and scrolls <main> vertically on page load.
    const target = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2)
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [currentDay])

  const hasPorts = itinerary.some(d => d.port)
  if (!hasPorts) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: '#14293F', fontFamily: FONT_DISPLAY }}>
          Itinerary Timeline
        </h2>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>Click any day to open log</span>
      </div>

      <div
        ref={scrollRef}
        style={{
          display:           'flex',
          gap:               10,
          overflowX:         'auto',
          paddingBottom:     6,
          scrollSnapType:    'x mandatory',
          scrollPadding:     '0 10px',
          msOverflowStyle:   'none',
          scrollbarWidth:    'none',
        }}
      >
        {itinerary.map((day, i) => {
          const dayNum    = i + 1
          const isCurrent = currentDay === dayNum
          const isPast    = currentDay !== null && dayNum < currentDay
          const isSea     = !day.port || day.port.toLowerCase().includes('sea')
          const log       = dailyLogs[i]
          const weather   = log?.weather?.[0]
          const rating    = log?.rating || 0
          const logged    = !!(log?.highlights || log?.bestMoment || log?.activity)

          const photoUrl = day.date && photosByDate ? photosByDate[day.date] : undefined

          return (
            <button
              key={i}
              data-day={dayNum}
              onClick={() => onViewDay(i)}
              style={{
                flexShrink:      0,
                width:           130,
                padding:         0,
                borderRadius:    12,
                cursor:          'pointer',
                border:          isCurrent ? `2px solid ${GOLD}` : `1px solid ${BORDER}`,
                background:      isCurrent ? `${GOLD}12` : WHITE,
                textAlign:       'left',
                fontFamily:      FONT_BODY,
                scrollSnapAlign: 'start',
                boxShadow:       isCurrent ? `0 0 0 3px ${GOLD}28` : 'none',
                transition:      'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
                opacity:         isPast && !logged ? 0.6 : 1,
                outline:         'none',
                overflow:        'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = isCurrent ? `0 4px 14px ${GOLD}44` : '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = isCurrent ? `0 0 0 3px ${GOLD}28` : 'none'
              }}
            >
              {/* Photo or themed placeholder */}
              <div style={{ position: 'relative', height: 72, overflow: 'hidden' }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={day.port || `Day ${dayNum}`}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    background: isSea
                      ? 'linear-gradient(135deg, #0C4A6E 0%, #0369A1 60%, #0EA5E9 100%)'
                      : 'linear-gradient(135deg, #064E3B 0%, #059669 60%, #34D399 100%)',
                  }}>
                    {isSea ? '🌊' : '📍'}
                  </div>
                )}
                {/* Day badge overlay */}
                <div style={{ position: 'absolute', top: 5, left: 6, fontSize: 9, fontWeight: 700, color: isCurrent ? GOLD : '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                  Day {dayNum}
                </div>
                {weather && (
                  <div style={{ position: 'absolute', top: 4, right: 5, fontSize: 13, lineHeight: 1 }}>
                    {WX_EMOJI[weather] || '🌤️'}
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: 'absolute', bottom: 5, left: 6, fontSize: 8, fontWeight: 700, color: '#1C2B3A', background: GOLD, borderRadius: 6, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Today
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '8px 10px 10px' }}>
                {/* Port name */}
                <div style={{ fontSize: 12, fontWeight: 600, color: isSea ? '#60A5FA' : 'var(--t-primary-dk)', lineHeight: 1.25, marginBottom: 3 }}>
                  {isSea ? 'At Sea' : day.port}
                </div>

                {/* Date */}
                {day.date && (
                  <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.3 }}>{formatDate(day.date)}</div>
                )}

                {/* Arrive / depart */}
                {!isSea && (day.arrive || day.depart) && (
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>
                    {day.arrive && <span>In {day.arrive}</span>}
                    {day.arrive && day.depart && <span> · </span>}
                    {day.depart && <span>Out {day.depart}</span>}
                  </div>
                )}

                {/* Star rating */}
                {rating > 0 && (
                  <div style={{ marginTop: 5, fontSize: 10, color: GOLD, lineHeight: 1 }}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </div>
                )}

                {/* Logged indicator */}
                {logged && !isCurrent && (
                  <div style={{ marginTop: 4, width: 6, height: 6, borderRadius: '50%', background: TEAL }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
