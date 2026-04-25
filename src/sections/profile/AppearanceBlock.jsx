// ─────────────────────────────────────────────────────────────────────────────
// profile/AppearanceBlock.jsx — Theme selector card on the Profile page
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, BORDER, NAVY2, MUTED, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { THEMES } from '../../themes'

const GROUPS = [
  { label: 'Blues',   ids: ['ocean', 'indigo', 'periwinkle', 'violet'] },
  { label: 'Reds',    ids: ['rose', 'coral', 'blush'] },
  { label: 'Greens',  ids: ['emerald', 'teal', 'sage', 'forest'] },
  { label: 'Orange',  ids: ['sunset', 'peach', 'tangerine', 'terracotta'] },
  { label: 'Yellow',  ids: ['gold', 'lemon', 'amber', 'saffron'] },
]

function ThemeSwatch({ t, active, onThemeChange }) {
  return (
    <button
      onClick={() => onThemeChange?.(t.id)}
      style={{
        border: active ? `2px solid ${t.vars['--t-primary']}` : `1px solid ${BORDER}`,
        borderRadius: 14, padding: 0, cursor: 'pointer',
        overflow: 'hidden', background: 'transparent', outline: 'none',
        boxShadow: active ? `0 0 0 3px ${t.vars['--t-primary']}33` : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        fontFamily: FONT_BODY, textAlign: 'left',
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${t.vars['--t-primary']}44` }}
      onBlur={e => { if (!active) e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        height: 48,
        background: `linear-gradient(135deg, ${t.vars['--t-primary-dk']} 0%, ${t.vars['--t-primary']} 60%, ${t.vars['--t-primary-lt']} 100%)`,
        position: 'relative',
      }}>
        {active && (
          <div style={{
            position: 'absolute', top: 6, right: 8,
            width: 18, height: 18, borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: t.vars['--t-primary-dk'], fontWeight: 900,
          }}>✓</div>
        )}
      </div>
      <div style={{ padding: '6px 8px', height: 32, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{t.emoji}</span>
        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? NAVY2 : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
      </div>
    </button>
  )
}

export default function AppearanceBlock({ theme, onThemeChange }) {
  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>PERSONALISATION</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Appearance</h2>
      </div>

      {/* Grouped theme swatches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {group.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {group.ids.map(id => {
                const t = THEMES[id]
                if (!t) return null
                return <ThemeSwatch key={id} t={t} active={theme === id} onThemeChange={onThemeChange} />
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
