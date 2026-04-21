// ─────────────────────────────────────────────────────────────────────────────
// profile/SettingsBlock.jsx — Settings, export actions, and sign-out
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, MUTED, LIGHT, TEXT, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { SETTINGS } from './profileData'

export default function SettingsBlock({ onSignOut }) {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>YOUR DATA</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Settings & Export</h2>
      </div>

      {/* Action rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SETTINGS.map(s => (
          <button
            key={s.title}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: `${s.color}08`, border: `1px solid ${s.color}22`,
              borderRadius: 12, padding: '12px 14px',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              outline: 'none', fontFamily: FONT_BODY,
              transition: 'background 0.15s, transform 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${s.color}14`; e.currentTarget.style.transform = 'translateX(2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = `${s.color}08`; e.currentTarget.style.transform = 'none' }}
            onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${s.color}44` }}
            onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
          >
            {/* Coloured icon tile */}
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: s.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>
              {s.emoji}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY2, fontFamily: FONT_BODY }}>{s.title}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{s.sub}</div>
            </div>

            {/* Chevron */}
            <div style={{ fontSize: 16, color: MUTED, flexShrink: 0 }}>›</div>
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        style={{
          marginTop: 20, width: '100%',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#991B1B', borderRadius: 11, padding: '12px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: FONT_BODY, textAlign: 'center',
          transition: 'background 0.15s',
          outline: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
        onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
        onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #FCA5A5'}
        onBlur={e => e.currentTarget.style.boxShadow = 'none'}
      >
        Sign out
      </button>
    </div>
  )
}
