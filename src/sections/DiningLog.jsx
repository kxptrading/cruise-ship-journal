// ─────────────────────────────────────────────────────────────────────────────
// sections/DiningLog.jsx — Restaurant and dining venue log
//
// A simpler companion to Food Log, focused on the restaurant experience rather
// than individual dishes. Each entry records the venue, meal occasion, what was
// ordered, a star rating, and notes. Entries are stored under "csj-diningLog"
// and counted alongside foodLogs in the Dashboard's Dining Entries metric.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp, TA, Stars, Lbl } from '../components/ui'

export default function DiningLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add = () => onChange([...data, {}])
  // Update a single field on entry i without mutating the array
  const set = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr title="Restaurant & Dining Log" sub="Rate every dining experience across the ship and in port" />

      {/* One card per restaurant visit */}
      {data.map((r, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>Restaurant {i + 1}</h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>

          <Fld label="Venue Name"><Inp value={r.venue} onChange={v => set(i, 'venue', v)} placeholder="Restaurant name" /></Fld>

          <Row2>
            <Fld label="Date" half><Inp type="date" value={r.date} onChange={v => set(i, 'date', v)} /></Fld>
            <Fld label="Meal" half><Inp value={r.meal} onChange={v => set(i, 'meal', v)} placeholder="Breakfast / Lunch / Dinner" /></Fld>
          </Row2>

          <Fld label="What I Ordered"><Inp value={r.ordered} onChange={v => set(i, 'ordered', v)} /></Fld>

          {/* Star rating sits outside Fld to avoid the bottom margin from pushing it down */}
          <div style={{ marginBottom: 16 }}><Lbl c="Rating" /><Stars value={r.rating || 0} onChange={v => set(i, 'rating', v)} /></div>

          <Fld label="Notes"><TA value={r.notes} onChange={v => set(i, 'notes', v)} rows={3} /></Fld>
        </div>
      ))}

      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Restaurant</button>
    </div>
  )
}
