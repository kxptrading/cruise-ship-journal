import { NAVY, BORDER, TEXT, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp, TA, Stars, Lbl } from '../components/ui'

export default function FoodLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const add = () => onChange([...data, {}])
  const set = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr title="Food Log" sub="Track every delicious bite — from buffet discoveries to specialty dining gems" />
      {data.map((meal, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>Meal {i + 1}</h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>
          <Row2>
            <Fld label="Day" half><Inp value={meal.day} onChange={v => set(i, 'day', v)} placeholder="Day #" /></Fld>
            <Fld label="Date" half><Inp type="date" value={meal.date} onChange={v => set(i, 'date', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Meal Type" half>
              <select value={meal.meal || ''} onChange={e => set(i, 'meal', e.target.value)} style={{ ...sty.inp }}>
                <option value="">Select...</option>
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="Ship / Port" half><Inp value={meal.port} onChange={v => set(i, 'port', v)} /></Fld>
          </Row2>
          <Fld label="Venue"><Inp value={meal.venue} onChange={v => set(i, 'venue', v)} placeholder="Restaurant or location name" /></Fld>
          <Fld label="What I Had"><Inp value={meal.what} onChange={v => set(i, 'what', v)} /></Fld>
          <Fld label="Standout Dish"><Inp value={meal.standout} onChange={v => set(i, 'standout', v)} /></Fld>
          <Fld label="Drinks"><Inp value={meal.drinks} onChange={v => set(i, 'drinks', v)} /></Fld>
          <Fld label="Tasting Notes"><TA value={meal.notes} onChange={v => set(i, 'notes', v)} rows={3} /></Fld>
          <Row2>
            <div style={{ flex: 1 }}><Lbl c="Rating" /><Stars value={meal.rating || 0} onChange={v => set(i, 'rating', v)} /></div>
            <Fld label="Cost" half><Inp value={meal.cost} onChange={v => set(i, 'cost', v)} placeholder="£0.00" /></Fld>
            <div>
              <Lbl c="Order Again?" />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {['Yes', 'No'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: TEXT }}>
                    <input type="radio" checked={meal.orderAgain === opt} onChange={() => set(i, 'orderAgain', opt)} style={{ accentColor: NAVY }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </Row2>
        </div>
      ))}
      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Meal Entry</button>
    </div>
  )
}
