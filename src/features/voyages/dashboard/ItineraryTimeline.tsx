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
  itinerary:  ItineraryDay[]
  dailyLogs:  DailyLog[]
  currentDay: number | null
  onViewDay:  (dayIndex: number) => void
}

export default function ItineraryTimeline({ itinerary, dailyLogs, currentDay, onViewDay }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentDay || !scrollRef.current) return
    const card = scrollRef.current.querySelector(`[data-day="${currentDay}"]`) as HTMLElement | null
    if (card) card.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [currentDay])

  const hasPorts = itinerary.some(d => d.port)
  if (!hasPorts) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>
          Itinerary Timeline
        </div>
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

          return (
            <button
              key={i}
              data-day={dayNum}
              onClick={() => onViewDay(i)}
              style={{
                flexShrink:      0,
                width:           120,
                padding:         '12px 12px 10px',
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
              {/* Day badge + weather */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? GOLD : MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Day {dayNum}
                </div>
                {weather && <span style={{ fontSize: 14, lineHeight: 1 }}>{WX_EMOJI[weather] || '🌤️'}</span>}
              </div>

              {/* Port name */}
              <div style={{ fontSize: 12, fontWeight: 600, color: isSea ? MUTED : 'var(--t-primary-dk)', lineHeight: 1.25, marginBottom: 3 }}>
                {isSea ? <span style={{ color: '#60A5FA' }}>🌊 At Sea</span> : day.port}
              </div>

              {/* Date */}
              {day.date && (
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.3 }}>{formatDate(day.date)}</div>
              )}

              {/* Arrive / depart */}
              {!isSea && (day.arrive || day.depart) && (
                <div style={{ fontSize: 9, color: MUTED, marginTop: 3, fontFamily: FONT_BODY }}>
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

              {/* Today pill */}
              {isCurrent && (
                <div style={{ marginTop: 5, display: 'inline-block', fontSize: 9, fontWeight: 700, color: GOLD, border: `1px solid ${GOLD}60`, borderRadius: 8, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Today
                </div>
              )}

              {/* Logged indicator */}
              {logged && !isCurrent && (
                <div style={{ marginTop: 4, width: 6, height: 6, borderRadius: '50%', background: TEAL }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
