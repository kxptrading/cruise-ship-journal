// ─────────────────────────────────────────────────────────────────────────────
// profile/Personality.jsx — Cruise personality trait rows
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { TRAITS } from './profileData'

export default function Personality() {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>YOUR CRUISE DNA</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Personality</h2>
      </div>

      {/* Trait rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TRAITS.map(trait => (
          <div
            key={trait.name}
            style={{
              borderLeft: `3px solid ${trait.color}`,
              background: `${trait.color}0F`,
              borderRadius: '0 10px 10px 0',
              padding: '10px 14px',
              outline: 'none',
              transition: 'background 0.15s',
            }}
            tabIndex={0}
          >
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: trait.color, marginBottom: 2 }}>{trait.name}</div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>{trait.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
