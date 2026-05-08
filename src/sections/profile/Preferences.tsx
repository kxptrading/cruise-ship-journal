// ─────────────────────────────────────────────────────────────────────────────
// profile/Preferences.tsx — Editable travel preferences
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useUserId } from '../../context'
import { WHITE, BORDER, NAVY2, MUTED, LIGHT, TEXT, TEAL, FONT_DISPLAY, FONT_BODY } from '../../constants'
import FE from '../../components/FE'

interface PrefDef {
  key:     string
  label:   string
  icon:    string
  options: string[]
}

const PREFS: PrefDef[] = [
  { key: 'cabin_preference', label: 'Cabin preference', icon: '🛏️', options: ['Inside', 'Oceanview', 'Balcony · mid-ship', 'Balcony · aft', 'Balcony · forward', 'Suite', 'No preference'] },
  { key: 'dining_time',      label: 'Dining time',       icon: '🍽️', options: ['Early · 18:00', 'Early · 18:30', 'Standard · 19:00', 'Standard · 19:30', 'Late · 20:00', 'Late · 20:30', 'Anytime dining'] },
  { key: 'dietary',          label: 'Dietary',           icon: '🥗', options: ['No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Halal', 'Kosher', 'Nut allergy', 'Dairy-free'] },
  { key: 'currency',         label: 'Default currency',  icon: '💰', options: ['GBP (£)', 'USD ($)', 'EUR (€)', 'AUD (A$)', 'CAD (C$)', 'JPY (¥)', 'CHF', 'NOK', 'SEK', 'DKK'] },
  { key: 'home_airport',     label: 'Home airport',      icon: '🛫', options: ['LHR – London Heathrow', 'LGW – London Gatwick', 'MAN – Manchester', 'EDI – Edinburgh', 'BHX – Birmingham', 'BRS – Bristol', 'GLA – Glasgow', 'LTN – London Luton', 'STN – London Stansted', 'NCL – Newcastle', 'LBA – Leeds Bradford', 'JFK – New York JFK', 'LAX – Los Angeles', 'ORD – Chicago O\'Hare', 'MIA – Miami', 'DXB – Dubai', 'SYD – Sydney', 'AMS – Amsterdam', 'CDG – Paris Charles de Gaulle', 'FRA – Frankfurt'] },
  { key: 'units',            label: 'Units',             icon: '📏', options: ['Metric', 'Imperial'] },
]

type PrefValues = Record<string, string>
const EMPTY: PrefValues = Object.fromEntries(PREFS.map(p => [p.key, '']))

interface PrefRowProps {
  pref:    PrefDef
  value:   string
  onSave:  (key: string, value: string) => Promise<void>
  isLast:  boolean
}

function PrefRow({ pref, value, onSave, isLast }: PrefRowProps) {
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
    await onSave(pref.key, newVal)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 4px',
        borderBottom: isLast ? 'none' : `1px solid ${BORDER}`,
        cursor: editing ? 'default' : 'pointer',
        borderRadius: 6,
        transition: 'background 0.12s',
      }}
      onClick={() => { if (!editing) setEditing(true) }}
      onMouseEnter={e => { if (!editing) e.currentTarget.style.background = LIGHT }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: LIGHT, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FE emoji={pref.icon} size={15} />
      </div>

      <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: TEXT, fontWeight: 500, fontFamily: FONT_BODY }}>
        {pref.label}
      </div>

      {editing ? (
        <select
          ref={selectRef}
          defaultValue={value}
          onChange={handleChange}
          onBlur={() => setEditing(false)}
          style={{
            border: `1px solid var(--t-primary)`, borderRadius: 8,
            padding: '5px 8px', fontSize: 12, fontFamily: FONT_BODY,
            fontWeight: 600, color: NAVY2, background: WHITE, outline: 'none',
            cursor: 'pointer', maxWidth: 180, boxShadow: '0 0 0 2px var(--t-primary)22',
          }}
          onClick={e => e.stopPropagation()}
        >
          <option value="">Select…</option>
          {pref.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {saved ? (
            <span style={{ fontSize: 11, color: TEAL, fontWeight: 700 }}>✓ Saved</span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: value ? NAVY2 : MUTED }}>
              {value || 'Not set'}
            </span>
          )}
          <span style={{ fontSize: 13, color: MUTED }}>›</span>
        </div>
      )}
    </div>
  )
}

interface Props {
  onSave: (patch: Record<string, string | null>) => Promise<void>
}

export default function Preferences({ onSave }: Props) {
  const userId = useUserId()
  const [prefs,   setPrefs]   = useState<PrefValues>(EMPTY)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('cabin_preference, dining_time, dietary, currency, home_airport, units')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Preferences load error:', error)
        if (data) setPrefs({
          cabin_preference: (data as PrefValues).cabin_preference ?? '',
          dining_time:      (data as PrefValues).dining_time      ?? '',
          dietary:          (data as PrefValues).dietary          ?? '',
          currency:         (data as PrefValues).currency         ?? '',
          home_airport:     (data as PrefValues).home_airport     ?? '',
          units:            (data as PrefValues).units            ?? '',
        })
        setLoading(false)
      })
  }, [userId])

  const handleSave = async (key: string, value: string) => {
    setPrefs(p => ({ ...p, [key]: value }))
    await onSave({ [key]: value || null })
  }

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', flex: '1 1 0', minWidth: 0 }}>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>AUTO-FILL FOR NEW VOYAGES</div>
        <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Preferences</h2>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: MUTED, padding: '12px 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PREFS.map((pref, i) => (
            <PrefRow
              key={pref.key}
              pref={pref}
              value={prefs[pref.key]}
              onSave={handleSave}
              isLast={i === PREFS.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
