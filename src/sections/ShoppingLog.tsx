// ─────────────────────────────────────────────────────────────────────────────
// sections/ShoppingLog.tsx — Souvenirs and shopping tracker
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, MUTED, WHITE, LIGHT, BORDER, TEXT, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'
import type { Shopping, ShoppingItem } from '../types'

interface Props {
  data:     Shopping
  onChange: (updated: Shopping) => void
}

export default function ShoppingLog({ data, onChange }: Props) {
  const w     = useW()
  const cs    = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const items = data.items || []

  const add = () => onChange({ ...data, items: [...items, { id: crypto.randomUUID(), item: '', port: '', cost: '' }] })
  const set = (i: number, f: keyof ShoppingItem, v: string) => {
    const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u })
  }
  const del = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })

  const total = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)

  return (
    <div>
      <PgHdr icon="🛍️" title="Shopping & Souvenirs" sub="Every purchase and keepsake from port to port" />

      {items.length === 0 && (
        <div style={{ ...sty.card, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🛍️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 8 }}>No purchases yet</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Log every souvenir and shopping find from each port.</div>
          <button onClick={add} style={sty.btn}>+ Add Item</button>
        </div>
      )}

      {items.length > 0 && (
        <div style={cs}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  {(w < BP.mobile
                    ? ['Item', 'Port', '£', '']
                    : ['Item / Description', 'Port / Location', 'Cost (£)', '']
                  ).map(h => (
                    <th key={h} style={{ padding: w < BP.mobile ? '9px 8px' : '10px 12px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: w < BP.mobile ? '6px 8px' : '6px 10px' }}>
                      <input
                        value={item.item || ''}
                        onChange={e => set(i, 'item', e.target.value)}
                        placeholder="What did you buy?"
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: w < BP.mobile ? 100 : 160 }}
                      />
                    </td>
                    <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                      <input
                        value={item.port || ''}
                        onChange={e => set(i, 'port', e.target.value)}
                        placeholder="Port or ship"
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: w < BP.mobile ? 80 : 120 }}
                      />
                    </td>
                    <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                      <input
                        type="number"
                        value={item.cost || ''}
                        onChange={e => set(i, 'cost', e.target.value)}
                        placeholder="0.00"
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: w < BP.mobile ? 60 : 80 }}
                      />
                    </td>
                    <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                      <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            <button onClick={add} style={sty.btn}>+ Add Item</button>
            <div style={{ fontSize: w < BP.mobile ? 15 : 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>
              TOTAL: £{total.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
