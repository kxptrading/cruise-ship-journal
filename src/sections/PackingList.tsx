// ─────────────────────────────────────────────────────────────────────────────
// sections/PackingList.tsx — Pre-departure packing checklist
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, GOLD, MUTED, TEXT, BORDER, TEAL, ROSE, PLUM, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'
import type { Packing } from '../types'

const CATS: Record<string, string[]> = {
  'DOCUMENTS & ESSENTIALS': ['Passport / ID', 'Boarding pass', 'Travel insurance', 'Credit cards / cash', 'Phone & charger', 'Medication'],
  'CLOTHING':               ['Swimsuits', 'Casual daywear', 'Formal night outfit', 'Light jacket', 'Walking shoes', 'Flip flops'],
  'TOILETRIES & HEALTH':    ['Sunscreen SPF 50+', 'After-sun lotion', 'Seasickness remedy', 'Hand sanitiser', 'Insect repellent', 'First aid basics'],
  'ENTERTAINMENT & EXTRAS': ['Book / e-reader', 'Journal & pen', 'Camera', 'Binoculars', 'Water bottle', 'Lanyard for card'],
}

const CAT_COLOR: Record<string, string> = {
  'DOCUMENTS & ESSENTIALS': TEAL,
  'CLOTHING':               ROSE,
  'TOILETRIES & HEALTH':    PLUM,
  'ENTERTAINMENT & EXTRAS': GOLD,
}

interface Props {
  data:     Packing
  onChange: (updated: Packing) => void
}

export default function PackingList({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const toggle = (cat: string, item: string) => {
    const checked = data[cat] || []
    onChange({ ...data, [cat]: checked.includes(item) ? checked.filter(x => x !== item) : [...checked, item] })
  }

  const allItems     = Object.values(CATS).flat()
  const checkedItems = Object.values(data || {}).flat()
  const pct          = allItems.length > 0 ? Math.round((checkedItems.length / allItems.length) * 100) : 0

  return (
    <div>
      <PgHdr icon="🧳" title="Packing Checklist" sub={`${checkedItems.length} of ${allItems.length} items packed`} />

      <div style={{ ...cs, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Packing progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#22C55E' : NAVY }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: BORDER, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : GOLD, borderRadius: 5 }} />
        </div>
      </div>

      {Object.entries(CATS).map(([cat, items]) => {
        const accent  = CAT_COLOR[cat] || NAVY
        const checked = (data[cat] || []).length
        return (
          <div key={cat} style={{ ...cs, borderLeft: `4px solid ${accent}`, paddingLeft: w < BP.mobile ? 14 : 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cat}</h3>
              <span style={{ fontSize: 11, color: MUTED }}>{checked} / {items.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: w < BP.mobile ? '10px 16px' : '10px 32px' }}>
              {items.map(item => {
                const done = (data[cat] || []).includes(item)
                return (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={done} onChange={() => toggle(cat, item)}
                      style={{ accentColor: accent, width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: done ? MUTED : TEXT, textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
