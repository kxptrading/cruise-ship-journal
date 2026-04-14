// ─────────────────────────────────────────────────────────────────────────────
// sections/ShoppingLog.jsx — Souvenirs and shopping tracker
//
// A simple table for logging purchases made on board or in port. Each row
// records the item name, where it was bought, and the cost in GBP. The running
// total is shown at the bottom. Data is stored under "csj-shopping" as
// { items: Array<{ item, port, cost }> }.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, WHITE, LIGHT, BORDER, TEXT, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'

export default function ShoppingLog({ data, onChange }) {
  const w     = useW()
  const cs    = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const items = data.items || []

  const add   = () => onChange({ ...data, items: [...items, {}] })
  // Update a single field on row i without mutating the items array
  const set   = (i, f, v) => { const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u }) }
  const del   = (i) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })

  // Running total across all items
  const total = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)

  return (
    <div>
      <PgHdr icon="🛍️" title="Souvenirs & Shopping Log" sub="Every purchase, port by port" />
      <div style={cs}>
        {/* Horizontally scrollable on mobile */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Item', 'Port / Location', 'Cost (£)', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                // Alternating row backgrounds for readability
                <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '6px 10px' }}>
                    <input value={item.item || ''} onChange={e => set(i, 'item', e.target.value)} placeholder="Item name"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: 180 }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input value={item.port || ''} onChange={e => set(i, 'port', e.target.value)} placeholder="Port or ship"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: 140 }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="number" value={item.cost || ''} onChange={e => set(i, 'cost', e.target.value)} placeholder="0.00"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: 90 }} />
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer: add button (left) + running total (right) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={add} style={sty.btn}>+ Add Item</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>TOTAL: £{total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
