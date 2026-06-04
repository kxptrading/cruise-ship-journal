// ─────────────────────────────────────────────────────────────────────────────
// sections/DiningLog.tsx — Restaurant and dining venue log
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp, TA, Stars, Lbl } from '../components/ui'
import FE from '../components/FE'
import type { DiningEntry } from '../types'

interface Props {
  data:     DiningEntry[]
  onChange: (updated: DiningEntry[]) => void
}

export default function DiningLog({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add = () => onChange([...data, { id: crypto.randomUUID(), venue: '', date: '', meal: '', ordered: '', rating: 0, notes: '' }])
  const set = (i: number, f: keyof DiningEntry, v: string | number) => {
    const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u)
  }
  const del = (i: number) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr icon="🍽️" title="Restaurant & Dining Log" sub="Rate every dining experience across the ship and in port" />

      {data.length === 0 && (
        <div style={{ ...sty.card, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ marginBottom: 14 }}><FE emoji="🍽️" size={48} /></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 8 }}>No restaurants logged yet</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Rate every dining experience across the ship and in port.</div>
        </div>
      )}

      {data.map((r, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>Restaurant {i + 1}</h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>

          <Fld label="Venue Name"><Inp value={r.venue} onChange={(v: string) => set(i, 'venue', v)} placeholder="Restaurant name" /></Fld>

          <Row2>
            <Fld label="Date" half><Inp type="date" value={r.date} onChange={(v: string) => set(i, 'date', v)} /></Fld>
            <Fld label="Meal" half>
              <select value={r.meal || ''} onChange={e => set(i, 'meal', e.target.value)} style={sty.inp}>
                <option value="">Select…</option>
                {['Breakfast', 'Lunch', 'Tea', 'Dinner', 'Snack', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fld>
          </Row2>

          <Fld label="What I Ordered"><Inp value={r.ordered} onChange={(v: string) => set(i, 'ordered', v)} /></Fld>

          <div style={{ marginBottom: 16 }}>
            <Lbl c="Rating" />
            <Stars value={r.rating || 0} onChange={(v: number) => set(i, 'rating', v)} />
          </div>

          <Fld label="Notes"><TA value={r.notes} onChange={(v: string) => set(i, 'notes', v)} rows={3} /></Fld>
        </div>
      ))}

      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Restaurant</button>
    </div>
  )
}
