// ─────────────────────────────────────────────────────────────────────────────
// profile/Preferences.jsx — Auto-fill preferences for new voyages
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, MUTED, LIGHT, TEXT, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { PREFERENCES } from './profileData'

export default function Preferences() {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>AUTO-FILL FOR NEW VOYAGES</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Preferences</h2>
      </div>

      {/* Preference rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PREFERENCES.map((pref, i) => (
          <button
            key={pref.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'none', border: 'none', padding: '11px 4px',
              borderBottom: i < PREFERENCES.length - 1 ? `1px solid ${BORDER}` : 'none',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              borderRadius: 0, outline: 'none', fontFamily: FONT_BODY,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = LIGHT}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onFocus={e => e.currentTarget.style.background = LIGHT}
            onBlur={e => e.currentTarget.style.background = 'none'}
          >
            {/* Icon tile */}
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: LIGHT, border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, flexShrink: 0,
            }}>
              {pref.icon}
            </div>

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: TEXT, fontWeight: 500 }}>{pref.key}</div>
            </div>

            {/* Value */}
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY2, marginRight: 6, textAlign: 'right' }}>
              {pref.value}
            </div>

            {/* Chevron */}
            <div style={{ fontSize: 14, color: MUTED, flexShrink: 0 }}>›</div>
          </button>
        ))}
      </div>
    </div>
  )
}
