// ─────────────────────────────────────────────────────────────────────────────
// profile/Companions.jsx — Horizontally scrollable travel companion cards
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, MUTED, LIGHT, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { COMPANIONS } from './profileData'

export default function Companions() {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>SHIPMATES</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Travel Companions</h2>
        </div>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: NAVY2,
            fontFamily: FONT_BODY, padding: '4px 0',
          }}
          onClick={() => {}}
          aria-label="Add companion"
        >
          + Add companion
        </button>
      </div>

      {/* Horizontally scrollable row */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {COMPANIONS.map(c => (
          <div
            key={c.name}
            tabIndex={0}
            style={{
              minWidth: 140, background: LIGHT, borderRadius: 14,
              border: `1px solid ${BORDER}`, padding: '16px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              flexShrink: 0, cursor: 'pointer', outline: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${c.color}66` }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: c.color,
              boxShadow: `0 3px 10px ${c.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_DISPLAY, fontSize: 17, color: WHITE,
            }}>
              {c.initials}
            </div>

            {/* Name */}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY2, textAlign: 'center', lineHeight: 1.3, fontFamily: FONT_BODY }}>
              {c.name}
            </div>

            {/* Relationship */}
            <div style={{ fontSize: 10, color: MUTED, fontFamily: FONT_BODY }}>{c.relation}</div>

            {/* Voyage count pill */}
            <div style={{
              fontSize: 10, fontWeight: 700, color: c.color,
              background: `${c.color}14`,
              borderRadius: 20, padding: '3px 10px',
              fontFamily: FONT_BODY,
            }}>
              {c.voyages} {c.voyages === 1 ? 'voyage' : 'voyages'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
