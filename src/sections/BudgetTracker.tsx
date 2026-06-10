// ─────────────────────────────────────────────────────────────────────────────
// sections/BudgetTracker.tsx — Voyage expense tracker
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, NAVY2, GOLD, WHITE, LIGHT, BORDER, TEXT, MUTED, TEAL, ROSE, PLUM, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Inp, Lbl, Donut } from '../components/ui'
import type { Budget, BudgetItem } from '../types'

const CAT_META: { name: string; emoji: string; color: string }[] = [
  { name: 'Food & Drink',  emoji: '🍽️', color: GOLD },
  { name: 'Shopping',      emoji: '🛍️', color: TEAL },
  { name: 'Excursions',    emoji: '🗺️', color: '#3B82F6' },
  { name: 'Entertainment', emoji: '🎭', color: ROSE },
  { name: 'Spa',           emoji: '💆', color: PLUM },
  { name: 'Tips',          emoji: '💰', color: '#F97316' },
  { name: 'Transport',     emoji: '🚌', color: '#64748B' },
  { name: 'Other',         emoji: '📦', color: MUTED },
]
const CATS = CAT_META.map(c => c.name)

interface Props {
  data:     Budget
  onChange: (updated: Budget) => void
}

export default function BudgetTracker({ data, onChange }: Props) {
  const w     = useW()
  const items = data.items || []

  const add = () => onChange({ ...data, items: [...items, { id: crypto.randomUUID(), date: '', item: '', category: '', amount: '' }] })
  const set = (i: number, f: keyof BudgetItem, v: string) => {
    const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u })
  }
  const del = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) })

  const spent  = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budget = parseFloat(String(data.budget)) || 0
  const pct    = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over   = budget > 0 && spent > budget

  // ── Category totals ───────────────────────────────────────────────────────────
  const catTotals = CAT_META.reduce<{ name: string; emoji: string; color: string; total: number }[]>((acc, cat) => {
    const total = items.filter(i => i.category === cat.name).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    if (total > 0) acc.push({ ...cat, total })
    return acc
  }, []).sort((a, b) => b.total - a.total)

  const maxCatTotal = catTotals[0]?.total || 1
  const catCols     = w < BP.mobile ? 2 : 4

  return (
    <div>
      <PgHdr icon="💳" title="Budget Tracker" sub="Every penny of your voyage, accounted for" />

      {/* ── Top summary cards ──────────────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: w < BP.mobile ? '1fr' : '1fr 1fr',
        gridAutoRows:        'minmax(130px, auto)',
        gap:                 14,
        marginBottom:        14,
      }}>
        {/* Budget input */}
        <div style={{
          background:   WHITE,
          border:       `1px solid ${BORDER}`,
          borderRadius: 16,
          padding:      '16px 18px 18px',
          display:      'flex',
          flexDirection:'column',
          gap:          8,
          boxShadow:    '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Total Budget
            </span>
          </div>
          <Lbl c="Amount (£)" />
          <Inp type="number" value={String(data.budget)} onChange={(v: string) => onChange({ ...data, budget: v })} placeholder="0.00" />
        </div>

        {/* Total spent */}
        <div style={{
          background:   NAVY2,
          border:       'none',
          borderRadius: 16,
          padding:      '16px 18px 18px',
          display:      'flex',
          flexDirection:'column',
          gap:          4,
          boxShadow:    '0 1px 8px rgba(0,0,0,0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Total Spent
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: over ? '#EF4444' : GOLD, fontFamily: 'Georgia,serif', lineHeight: 1.1 }}>
            £{spent.toFixed(2)}
          </div>
          {budget > 0 && (
            <>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: over ? '#EF4444' : GOLD, borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {pct.toFixed(0)}% used · £{Math.abs(budget - spent).toFixed(2)} {over ? 'over' : 'remaining'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Donut + category breakdown ─────────────────────────────────────────── */}
      {(budget > 0 || spent > 0) && (
        <div style={{ marginBottom: 14 }}>
          {budget > 0 && (
            <div style={{
              background:   WHITE,
              border:       `1px solid ${BORDER}`,
              borderRadius: 16,
              padding:      '16px 18px',
              marginBottom: 14,
              display:      'flex',
              alignItems:   'center',
              gap:          20,
              boxShadow:    '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                <Donut pct={Math.min(100, pct)} size={100} color={over ? '#EF4444' : GOLD} thick={10} bg={BORDER} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: over ? '#EF4444' : NAVY, fontFamily: 'Georgia,serif', lineHeight: 1 }}>
                    {Math.round(pct)}%
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>used</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>£{spent.toFixed(2)} spent</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>of £{budget.toFixed(2)} budget</div>
                {over && <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 6 }}>⚠️ Over budget by £{(spent - budget).toFixed(2)}</div>}
              </div>
            </div>
          )}

          {/* Category cards grid */}
          {catTotals.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                By Category
              </div>
              <div style={{
                display:             'grid',
                gridTemplateColumns: `repeat(${catCols}, 1fr)`,
                gridAutoRows:        'minmax(90px, auto)',
                gap:                 10,
                marginBottom:        14,
              }}>
                {catTotals.map(({ name, emoji, color, total }) => (
                  <div
                    key={name}
                    style={{
                      background:   WHITE,
                      border:       `1px solid ${BORDER}`,
                      borderRadius: 14,
                      padding:      '12px 14px 14px',
                      display:      'flex',
                      flexDirection:'column',
                      gap:          6,
                      boxShadow:    '0 1px 4px rgba(0,0,0,0.04)',
                      borderTop:    `3px solid ${color}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.2 }}>{name}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1 }}>
                      £{total.toFixed(0)}
                    </div>
                    <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden', marginTop: 'auto' }}>
                      <div style={{ height: '100%', width: `${(total / maxCatTotal) * 100}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Expense table ──────────────────────────────────────────────────────── */}
      <div style={{ ...sty.card, padding: w < BP.mobile ? 14 : '22px 24px' }}>
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
              {items.length === 0 && (
                <tr>
                  <td colSpan={w < BP.mobile ? 4 : 5} style={{ padding: '24px 12px', textAlign: 'center', color: MUTED, fontSize: 13, fontStyle: 'italic' }}>
                    No expenses yet — add your first one below
                  </td>
                </tr>
              )}
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
