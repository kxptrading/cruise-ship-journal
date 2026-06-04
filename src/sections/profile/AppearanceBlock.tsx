// ─────────────────────────────────────────────────────────────────────────────
// profile/AppearanceBlock.tsx — Theme selector card on the Profile page
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { WHITE, BORDER, NAVY2, MUTED, TEXT, TEAL, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { THEMES } from '../../themes'
import type { Theme } from '../../themes'
import FE from '../../components/FE'
import { CalendarDays, Trophy, Luggage, FileText } from 'lucide-react'

interface ThemeGroup {
  label: string
  ids:   string[]
}

const GROUPS: ThemeGroup[] = [
  { label: 'Blues',   ids: ['ocean', 'midnight', 'cobalt', 'steel'] },
  { label: 'Purples', ids: ['violet', 'lavender', 'indigo', 'periwinkle'] },
  { label: 'Reds',    ids: ['rose', 'coral', 'blush', 'bubblegum'] },
  { label: 'Greens',  ids: ['emerald', 'teal', 'sage', 'forest'] },
  { label: 'Orange',  ids: ['sunset', 'peach', 'tangerine', 'terracotta'] },
  { label: 'Yellow',  ids: ['gold', 'lemon', 'amber', 'saffron'] },
]

interface SwatchProps {
  t:             Theme
  active:        boolean
  onThemeChange?: (id: string) => void
}

function ThemeSwatch({ t, active, onThemeChange }: SwatchProps) {
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
        <FE emoji={t.emoji} size={13} />
        <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? NAVY2 : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
      </div>
    </button>
  )
}

type IconPack = 'fluent' | 'native' | 'lucide'

interface Props {
  theme:              string
  onThemeChange?:     (id: string) => void
  age:                number | null
  onAgeChange?:       (n: number) => void
  iconPack?:          IconPack
  onIconPackChange?:  (pack: IconPack) => void
}

const LUCIDE_PREVIEW = [CalendarDays, Trophy, Luggage, FileText]

export default function AppearanceBlock({ theme, onThemeChange, age, onAgeChange, iconPack = 'fluent', onIconPackChange }: Props) {
  const [ageInput, setAgeInput] = useState<string>('')
  const [ageSaved, setAgeSaved] = useState<boolean>(false)

  const handleAgeBlur = () => {
    const n = parseInt(ageInput)
    if (!ageInput) return
    if (!isNaN(n) && n >= 1 && n <= 120) {
      onAgeChange?.(n)
      setAgeSaved(true)
      window.setTimeout(() => setAgeSaved(false), 1500)
    }
  }

  const isAdult = age === null || age >= 18

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>PERSONALISATION</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Appearance</h2>
      </div>

      {/* Age / profile type */}
      <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Profile Type</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isAdult ? 'rgba(14,165,233,0.08)' : 'rgba(139,92,246,0.08)', border: `1px solid ${isAdult ? 'rgba(14,165,233,0.3)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 20, padding: '4px 14px' }}>
            <FE emoji={isAdult ? '🧑' : '🧒'} size={15} />
            <span style={{ fontSize: 12, fontWeight: 700, color: NAVY2 }}>{isAdult ? 'Adult' : 'Junior'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min="1" max="120"
              placeholder={age !== null ? String(age) : 'Age'}
              value={ageInput}
              onChange={e => setAgeInput(e.target.value)}
              onBlur={handleAgeBlur}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur() } }}
              style={{ width: 72, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 13, fontFamily: FONT_BODY, color: TEXT, outline: 'none', textAlign: 'center' }}
            />
            {ageSaved && <span style={{ fontSize: 11, fontWeight: 700, color: TEAL }}>✓ Saved</span>}
          </div>
          {age !== null && !isAdult && (
            <span style={{ fontSize: 11, color: MUTED }}>Budget tracking is hidden for Junior profiles.</span>
          )}
        </div>
      </div>

      {/* Icon pack selector */}
      <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Icon Style</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(['fluent', 'native', 'lucide'] as IconPack[]).map(id => {
            const active = iconPack === id
            const labels: Record<IconPack, [string, string]> = {
              fluent:  ['Fluent',  'Colourful Fluent Emoji'],
              native:  ['Classic', 'Device native emoji'],
              lucide:  ['Lucide',  'Clean line icons'],
            }
            const [label, desc] = labels[id]
            return (
              <button
                key={id}
                onClick={() => onIconPackChange?.(id)}
                style={{
                  border: active ? `2px solid ${NAVY2}` : `1px solid ${BORDER}`,
                  borderRadius: 12, padding: '10px 10px', cursor: 'pointer',
                  background: active ? 'rgba(20,41,63,0.06)' : WHITE,
                  outline: 'none', textAlign: 'left',
                  boxShadow: active ? `0 0 0 3px rgba(20,41,63,0.12)` : 'none',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  fontFamily: FONT_BODY,
                }}
              >
                <div style={{ display: 'flex', gap: 3, marginBottom: 7, flexWrap: 'wrap' }}>
                  {id === 'lucide'
                    ? LUCIDE_PREVIEW.map((Icon, i) => <Icon key={i} size={20} strokeWidth={1.75} color={NAVY2} />)
                    : ['📅', '🏆', '🧳', '📝'].map((em, i) =>
                        id === 'fluent'
                          ? <FE key={i} emoji={em} size={20} />
                          : <span key={i} style={{ fontSize: 20, lineHeight: 1 }}>{em}</span>
                      )
                  }
                </div>
                <div style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? NAVY2 : TEXT }}>{label}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{desc}</div>
                {active && <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, marginTop: 4 }}>✓ Active</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grouped theme swatches */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {group.label}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.ids.length}, 1fr)`, gap: 8 }}>
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
