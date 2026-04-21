// ─────────────────────────────────────────────────────────────────────────────
// profile/Badges.jsx — Achievement badge grid (4 columns)
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, GOLD, MUTED, CREAM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { BADGES } from './profileData'
import { useW } from '../../context'

export default function Badges() {
  const w = useW()
  const cols = w < 480 ? 2 : w < 700 ? 3 : 4

  const earned = BADGES.filter(b => b.earned).length

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>ACHIEVEMENTS</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Badges</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: GOLD }}>{earned}</span>
          <span style={{ fontSize: 12, color: MUTED }}>of {BADGES.length} earned</span>
        </div>
      </div>

      {/* Badge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 13 }}>
        {BADGES.map(badge => (
          <div
            key={badge.name}
            tabIndex={0}
            style={{
              borderRadius: 14,
              border: badge.earned ? `1px solid ${badge.color}44` : `1px solid ${BORDER}`,
              background: badge.earned
                ? `linear-gradient(135deg, ${badge.color}0F, ${badge.color}22)`
                : CREAM,
              padding: '14px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              opacity: badge.earned ? 1 : 0.55,
              position: 'relative',
              cursor: 'default',
              outline: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${badge.color}66` }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
            aria-label={`${badge.name}${badge.earned ? ' — earned' : ' — locked'}`}
          >
            {/* Check mark for earned badges */}
            {badge.earned && (
              <div style={{
                position: 'absolute', top: 7, right: 7,
                width: 14, height: 14, borderRadius: '50%',
                background: badge.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: WHITE, fontWeight: 700,
              }}>
                ✓
              </div>
            )}
            <span style={{ fontSize: 28, filter: badge.earned ? 'none' : 'grayscale(1)' }}>
              {badge.emoji}
            </span>
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
              color: badge.earned ? NAVY2 : MUTED,
              textAlign: 'center', lineHeight: 1.3,
            }}>
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
