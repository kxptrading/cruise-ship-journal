// ─────────────────────────────────────────────────────────────────────────────
// sections/dashboard/RecentPosts.tsx — 3-up grid of latest daily log posts
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY, BP } from '../../constants'
import { useW } from '../../context'
import type { DailyLog, ItineraryDay } from '../../types'
import { motion } from 'framer-motion'
import { STAGGER, FADE_UP } from '../../lib/motion'

const WX_EMOJI: Record<string, string> = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️', Windy: '💨', Hot: '🌡️', Mild: '🌤️', Cool: '❄️',
}

interface Props {
  dailyLogs:  DailyLog[]
  itinerary:  ItineraryDay[]
  onNav:      (section: string) => void
  onViewDay?: (dayIndex: number) => void
}

export default function RecentPosts({ dailyLogs, itinerary, onNav, onViewDay }: Props) {
  const w = useW()

  const recentLogs = dailyLogs
    .map((log, i) => ({ log, idx: i }))
    .filter(({ log }) => log.highlights || log.bestMoment || log.activity)
    .slice(-3)
    .reverse()

  if (recentLogs.length === 0) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT_BODY }}>
          Recent Posts
        </div>
        <button
          onClick={() => onNav('feed')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t-primary)', fontFamily: FONT_BODY, fontWeight: 600, padding: 0 }}
        >
          View all posts →
        </button>
      </div>

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : `repeat(${Math.min(recentLogs.length, 3)}, 1fr)`, gap: 10 }}
      >
        {recentLogs.map(({ log, idx }) => {
          const port    = itinerary[idx]?.port || log.port || ''
          const isSea   = !port || port.toLowerCase().includes('sea')
          const weather = log.weather?.[0]
          const text    = log.highlights || log.bestMoment || log.activity || ''
          const rating  = log.rating || 0

          return (
            <motion.button
              key={idx}
              variants={FADE_UP}
              onClick={() => onViewDay?.(idx)}
              style={{
                background:  WHITE,
                border:      `1px solid ${BORDER}`,
                borderRadius: 14,
                padding:     '14px 16px',
                textAlign:   'left',
                cursor:      'pointer',
                fontFamily:  FONT_BODY,
                transition:  'transform 0.15s, box-shadow 0.15s',
                outline:     'none',
              }}
              whileHover={{ y: -2, boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}
            >
              {/* Port + weather */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isSea ? '#60A5FA' : TEAL, fontFamily: FONT_BODY }}>
                  {isSea ? '🌊 At Sea' : `📍 ${port}`}
                </span>
                {weather && <span style={{ fontSize: 15, lineHeight: 1 }}>{WX_EMOJI[weather] || ''}</span>}
              </div>

              {/* Day label */}
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Day {idx + 1}
              </div>

              {/* Post text */}
              <div style={{ fontSize: 13, color: '#1C2B3A', lineHeight: 1.5, marginBottom: 6,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
              }}>
                {text}
              </div>

              {/* Rating */}
              {rating > 0 && (
                <div style={{ fontSize: 11, color: GOLD }}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
