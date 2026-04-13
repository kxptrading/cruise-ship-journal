// ─────────────────────────────────────────────────────────────────────────────
// sections/PackingList.jsx — Pre-departure packing checklist
//
// A fixed list of 24 items organised into four categories. Checking an item
// stores its name in the data object under that category key. Unchecking
// removes it. The progress bar and "Items Packed" Dashboard metric are both
// driven by the count of checked items vs the fixed total of 24.
//
// Data is stored under "csj-packing" as { [categoryName]: string[] } where
// each array contains the names of checked items in that category.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, GOLD, MUTED, TEXT, BORDER, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'

// Fixed item list — 4 categories × 6 items = 24 total.
// The Dashboard hardcodes 24 as the total; update both if this list changes.
const CATS = {
  'DOCUMENTS & ESSENTIALS': ['Passport / ID', 'Boarding pass', 'Travel insurance', 'Credit cards / cash', 'Phone & charger', 'Medication'],
  'CLOTHING':               ['Swimsuits', 'Casual daywear', 'Formal night outfit', 'Light jacket', 'Walking shoes', 'Flip flops'],
  'TOILETRIES & HEALTH':    ['Sunscreen SPF 50+', 'After-sun lotion', 'Seasickness remedy', 'Hand sanitiser', 'Insect repellent', 'First aid basics'],
  'ENTERTAINMENT & EXTRAS': ['Book / e-reader', 'Journal & pen', 'Camera', 'Binoculars', 'Water bottle', 'Lanyard for card'],
}

export default function PackingList({ data, onChange }) {
  const w = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // Toggle an item: add it to the category array if unchecked, remove if checked
  const toggle = (cat, item) => {
    const checked = data[cat] || []
    onChange({ ...data, [cat]: checked.includes(item) ? checked.filter(x => x !== item) : [...checked, item] })
  }

  // Overall progress across all categories
  const allItems     = Object.values(CATS).flat()
  const checkedItems = Object.values(data || {}).flat()
  const pct          = allItems.length > 0 ? Math.round((checkedItems.length / allItems.length) * 100) : 0

  return (
    <div>
      {/* Sub-heading shows current count dynamically */}
      <PgHdr title="Packing Checklist" sub={`${checkedItems.length} of ${allItems.length} items packed`} />

      {/* Overall progress bar — turns green at 100% */}
      <div style={{ ...cs, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Packing progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#22C55E' : NAVY }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: BORDER, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : GOLD, borderRadius: 5 }} />
        </div>
      </div>

      {/* One card per category, each with a 2-column checkbox grid */}
      {Object.entries(CATS).map(([cat, items]) => (
        <div key={cat} style={cs}>
          <h3 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: NAVY, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cat}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
            {items.map(item => {
              const done = (data[cat] || []).includes(item)
              return (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={done} onChange={() => toggle(cat, item)}
                    style={{ accentColor: NAVY, width: 16, height: 16, flexShrink: 0 }} />
                  {/* Checked items are muted and struck through */}
                  <span style={{ fontSize: 14, color: done ? MUTED : TEXT, textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
