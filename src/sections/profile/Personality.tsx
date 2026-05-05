// ─────────────────────────────────────────────────────────────────────────────
// profile/Personality.tsx — Editable cruise personality traits
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserId } from '../../context'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, TEAL, FONT_DISPLAY, FONT_BODY } from '../../constants'

interface TraitOption {
  name: string
  sub:  string
}

const TRAIT_OPTIONS: TraitOption[] = [
  { name: 'Balcony Lover',          sub: 'Sea views every morning, no exceptions' },
  { name: 'Excursion Maximalist',   sub: 'Every port, every adventure, every time' },
  { name: 'Formal Night Regular',   sub: 'Black tie? Already packed. Twice.' },
  { name: 'Trivia Enthusiast',      sub: 'Top of the leaderboard or it didn\'t happen' },
  { name: 'Buffet Strategist',      sub: 'First in line, last to leave' },
  { name: 'Sea Day Champion',       sub: 'Nothing beats a day with nowhere to be' },
  { name: 'Port Collector',         sub: 'Ticking off destinations one gangway at a time' },
  { name: 'Spa Devotee',            sub: 'Thermal suite, hot stone, repeat' },
  { name: 'Casino Regular',         sub: 'One more hand — then bed' },
  { name: 'Deck Chair Philosopher', sub: 'Best thoughts happen at sea' },
  { name: 'Photo Chronicler',       sub: 'Every moment captured for posterity' },
  { name: 'Show Fan',               sub: 'Front row for every performance' },
  { name: 'Late Night Reveller',    sub: 'The night is young at every port' },
  { name: 'Early Riser',            sub: 'Sunrises at sea are unmatched' },
  { name: 'Foodie Explorer',        sub: 'Every meal is an adventure' },
  { name: 'Drinks Package Champion', sub: 'Getting full value, every day' },
  { name: 'Pool Lounger',           sub: 'Claimed this sunbed at 7am' },
  { name: 'Shopping Enthusiast',    sub: 'Duty-free is a sport' },
  { name: 'Cocktail Hour Regular',  sub: '5pm somewhere in the world' },
  { name: 'Ship Historian',         sub: 'Knows every deck and corridor by heart' },
]

const TRAIT_MAP: Record<string, string> = Object.fromEntries(TRAIT_OPTIONS.map(t => [t.name, t.sub]))

const COLORS = [
  'var(--t-primary)',
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
]

const SLOTS = ['trait_1', 'trait_2', 'trait_3', 'trait_4'] as const
type SlotKey = typeof SLOTS[number]
type Traits  = Record<SlotKey, string>

const EMPTY: Traits = Object.fromEntries(SLOTS.map(s => [s, ''])) as Traits

interface TraitRowProps {
  slotKey: SlotKey
  value:   string
  color:   string
  onSave:  (key: SlotKey, value: string) => Promise<void>
  isLast:  boolean
}

function TraitRow({ slotKey, value, color, onSave, isLast }: TraitRowProps) {
  const [editing, setEditing] = useState<boolean>(false)
  const [saved,   setSaved]   = useState<boolean>(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editing && selectRef.current) selectRef.current.focus()
  }, [editing])

  const handleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value
    setEditing(false)
    if (newVal === value) return
    await onSave(slotKey, newVal)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const sub = value ? TRAIT_MAP[value] : null

  return (
    <div
      onClick={() => { if (!editing) setEditing(true) }}
      onMouseEnter={e => { if (!editing) e.currentTarget.style.background = `${color}18` }}
      onMouseLeave={e => { e.currentTarget.style.background = value ? `${color}0F` : 'transparent' }}
      style={{
        borderLeft: `3px solid ${value ? color : BORDER}`,
        background: value ? `${color}0F` : 'transparent',
        borderRadius: '0 10px 10px 0',
        padding: '10px 14px',
        marginBottom: isLast ? 0 : 10,
        cursor: 'pointer',
        transition: 'background 0.15s',
        outline: 'none',
        minHeight: 52,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' && !editing) setEditing(true) }}
    >
      {editing ? (
        <select
          ref={selectRef}
          defaultValue={value}
          onChange={handleChange}
          onBlur={() => setEditing(false)}
          onClick={e => e.stopPropagation()}
          style={{
            border: `1px solid ${color}`, borderRadius: 8, padding: '6px 10px',
            fontSize: 13, fontFamily: FONT_BODY, fontWeight: 600, color: NAVY2,
            background: WHITE, outline: 'none', width: '100%', cursor: 'pointer',
            boxShadow: `0 0 0 2px ${color}22`,
          }}
        >
          <option value="">— Choose a trait —</option>
          {TRAIT_OPTIONS.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: value ? color : MUTED }}>
              {value || 'Click to set a trait…'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {saved && <span style={{ fontSize: 10, color: TEAL, fontWeight: 700 }}>✓</span>}
              <span style={{ fontSize: 12, color: MUTED }}>›</span>
            </div>
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY, marginTop: 2 }}>{sub}</div>
          )}
        </>
      )}
    </div>
  )
}

interface Props {
  onSave: (patch: Record<string, string | null>) => Promise<void>
}

export default function Personality({ onSave }: Props) {
  const userId = useUserId()
  const [traits,  setTraits]  = useState<Traits>(EMPTY)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('trait_1, trait_2, trait_3, trait_4')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Personality load error:', error)
        if (data) setTraits({
          trait_1: (data as Traits).trait_1 ?? '',
          trait_2: (data as Traits).trait_2 ?? '',
          trait_3: (data as Traits).trait_3 ?? '',
          trait_4: (data as Traits).trait_4 ?? '',
        })
        setLoading(false)
      })
  }, [userId])

  const handleSave = async (key: SlotKey, value: string) => {
    setTraits(t => ({ ...t, [key]: value }))
    await onSave({ [key]: value || null })
  }

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>YOUR CRUISE DNA</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Personality</h2>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: MUTED, padding: '12px 0' }}>Loading…</div>
      ) : (
        <div>
          {SLOTS.map((slot, i) => (
            <TraitRow
              key={slot}
              slotKey={slot}
              value={traits[slot]}
              color={COLORS[i]}
              onSave={handleSave}
              isLast={i === SLOTS.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
