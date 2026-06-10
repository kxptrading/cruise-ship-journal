// ─────────────────────────────────────────────────────────────────────────────
// sections/Highlights.tsx — Cruise highlight moments
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY2, MUTED, WHITE, BORDER, GOLD, FONT_BODY, BP } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'
import type { Highlights } from '../types'

const FIELDS: { key: keyof Highlights; label: string; emoji: string; placeholder: string }[] = [
  { key: 'port',      emoji: '📍', label: 'Favourite Port',                    placeholder: 'Which port stole your heart?' },
  { key: 'meal',      emoji: '🍽️', label: 'Most Memorable Meal',              placeholder: 'That dish you\'re still thinking about…' },
  { key: 'funny',     emoji: '😂', label: 'Funniest Moment',                   placeholder: 'The story you\'ll be telling for years…' },
  { key: 'view',      emoji: '🏔️', label: 'Best View',                        placeholder: 'Describe the view that took your breath away…' },
  { key: 'friends',   emoji: '👨‍👩‍👧', label: 'Best Moment with Friends & Family', placeholder: 'A shared memory worth keeping…' },
  { key: 'firstTime', emoji: '✨', label: 'Something I Did for the First Time', placeholder: 'A new experience on this voyage…' },
  { key: 'moment',    emoji: '💫', label: 'The Moment I\'ll Never Forget',      placeholder: 'If you could bottle one moment from this trip…' },
]

interface Props {
  data:     Partial<Highlights>
  onChange: (updated: Partial<Highlights>) => void
}

export default function HighlightsSection({ data, onChange }: Props) {
  const w   = useW()
  const cols = w < BP.mobile ? 1 : 2

  const set = (f: keyof Highlights, v: string) => onChange({ ...data, [f]: v })

  return (
    <div>
      <PgHdr icon="🏆" title="Cruise Highlights" sub="The moments you'll tell stories about for years" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: 'minmax(200px, auto)',
        gap: 14,
      }}>
        {FIELDS.map(({ key, label, emoji, placeholder }) => {
          const filled = !!(data[key] && (data[key] as string).trim())
          return (
            <div
              key={key}
              style={{
                background:   WHITE,
                border:       `1px solid ${filled ? GOLD + '60' : BORDER}`,
                borderRadius: 16,
                padding:      '16px 18px 18px',
                display:      'flex',
                flexDirection:'column',
                gap:           8,
                boxShadow:    filled
                  ? `0 2px 8px ${GOLD}22`
                  : '0 1px 4px rgba(0,0,0,0.05)',
                transition:   'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
                <span style={{
                  fontSize:      12,
                  fontWeight:    700,
                  color:         filled ? NAVY2 : MUTED,
                  fontFamily:    FONT_BODY,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  lineHeight:    1.2,
                }}>
                  {label}
                </span>
                {filled && (
                  <span style={{
                    marginLeft:    'auto',
                    fontSize:       9,
                    fontWeight:     700,
                    color:          GOLD,
                    fontFamily:     FONT_BODY,
                    textTransform:  'uppercase',
                    letterSpacing:  '0.08em',
                    background:     GOLD + '18',
                    borderRadius:   6,
                    padding:        '2px 7px',
                    flexShrink:     0,
                  }}>
                    Logged
                  </span>
                )}
              </div>

              {/* Textarea — fills remaining card height */}
              <textarea
                value={(data[key] as string) || ''}
                onChange={e => set(key, e.target.value)}
                rows={4}
                placeholder={placeholder}
                style={{
                  flex:         1,
                  resize:       'none',
                  border:       `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding:      '10px 12px',
                  fontSize:     14,
                  fontFamily:   FONT_BODY,
                  color:        '#1C2B3A',
                  background:   filled ? GOLD + '08' : '#FAFAFA',
                  lineHeight:   1.6,
                  outline:      'none',
                  transition:   'border-color 0.15s, background 0.15s',
                  width:        '100%',
                  boxSizing:    'border-box',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
