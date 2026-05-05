// ─────────────────────────────────────────────────────────────────────────────
// sections/BudgetTracker.tsx — Voyage expense tracker
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, NAVY2, GOLD, WHITE, LIGHT, BORDER, TEXT, MUTED, TEAL, ROSE, PLUM, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Inp, Lbl, Donut } from '../components/ui'
import type { Budget, BudgetItem } from '../types'

const CAT_COLORS: Record<string, string> = {
  'Food & Drink':  GOLD,
  'Shopping':      TEAL,
  'Excursions':    '#3B82F6',
  'Entertainment': ROSE,
  'Spa':           PLUM,
  'Tips':          '#F97316',
  'Transport':     '#64748B',
  'Other':         MUTED,
}

const CATS = ['Food & Drink', 'Shopping', 'Excursions', 'Entertainment', 'Spa', 'Tips', 'Transport', 'Other']

interface Props {
  data:     Budget
  onChange: (updated: Budget) => void
}

export default function BudgetTracker({ data, onChange }: Props) {
  const w     = useW()
  const cs    = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const items = data.items || []

  const add = () => onChange({ ...data, items: [...items, { date: '', item: '', category: '', amount: '' }] })
  const set = (i: number, f: keyof BudgetItem, v: string) => {
    const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u })
  }
  const del = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })

  const spent  = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budget = parseFloat(String(data.budget)) || 0
  const pct    = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0

  return (
    <div>
      <PgHdr icon="💳" title="Budget Tracker" sub="Every penny of your voyage, accounted for" />

      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={cs}>
          <Lbl c="Total Budget (£)" />
          <Inp type="number" value={String(data.budget)} onChange={(v: string) => onChange({ ...data, budget: v })} placeholder="0.00" />
        </div>
        <div style={{ ...cs, background: NAVY2, border: 'none', marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Spent</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif' }}>£{spent.toFixed(2)}</div>
          {budget > 0 && (
            <>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct > 100 ? '#EF4444' : GOLD, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {pct.toFixed(0)}% used · £{(budget - spent).toFixed(2)} remaining
              </div>
            </>
          )}
        </div>
      </div>

      {(budget > 0 || spent > 0) && (
        <div style={{ ...cs, display: 'flex', gap: w < BP.mobile ? 16 : 32, alignItems: 'flex-start', flexWrap: w < BP.mobile ? 'wrap' : 'nowrap' }}>
          {budget > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <Donut pct={Math.min(100, pct)} size={110} color={pct > 100 ? '#EF4444' : GOLD} thick={10} bg={BORDER} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: pct > 100 ? '#EF4444' : NAVY, fontFamily: 'Georgia,serif', lineHeight: 1 }}>
                    {Math.round(pct)}%
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>used</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 8, textAlign: 'center' }}>
                £{spent.toFixed(0)} of £{budget.toFixed(0)}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              By Category
            </div>
            {(() => {
              const catTotals: { cat: string; total: number }[] = CATS.reduce<{ cat: string; total: number }[]>((acc, cat) => {
                const total = items.filter(i => i.category === cat).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
                if (total > 0) acc.push({ cat, total })
                return acc
              }, []).sort((a, b) => b.total - a.total)

              if (catTotals.length === 0) return (
                <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>No expenses logged yet</div>
              )

              const maxTotal = catTotals[0].total
              return catTotals.map(({ cat, total }) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: TEXT }}>{cat}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>£{total.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 5, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(total / maxTotal) * 100}%`, background: CAT_COLORS[cat] || MUTED, borderRadius: 3 }} />
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      <div style={cs}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {(w < BP.mobile ? ['Item', 'Cat', '£', ''] : ['Date', 'Item / Description', 'Category', 'Amount (£)', '']).map(h => (
                  <th key={h} style={{ padding: w < BP.mobile ? '9px 8px' : '10px 12px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  {w >= BP.mobile && (
                    <td style={{ padding: '6px 8px' }}>
                      <input type="date" value={item.date || ''} onChange={e => set(i, 'date', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer' }} />
                    </td>
                  )}
                  <td style={{ padding: w < BP.mobile ? '6px 8px' : '6px 10px' }}>
                    <input value={item.item || ''} onChange={e => set(i, 'item', e.target.value)} placeholder="Description"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: w < BP.mobile ? 100 : 140 }} />
                  </td>
                  <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                    <select value={item.category || ''} onChange={e => set(i, 'category', e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer', maxWidth: w < BP.mobile ? 80 : undefined }}>
                      <option value="">—</option>
                      {CATS.map(c => <option key={c} value={c}>{w < BP.mobile ? c.split(' ')[0] : c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                    <input type="number" value={item.amount || ''} onChange={e => set(i, 'amount', e.target.value)} placeholder="0.00"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: w < BP.mobile ? 60 : 80 }} />
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
          <button onClick={add} style={sty.btn}>+ Add Expense</button>
          <div style={{ fontSize: w < BP.mobile ? 15 : 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>TOTAL: £{spent.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
