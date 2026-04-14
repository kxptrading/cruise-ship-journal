// ─────────────────────────────────────────────────────────────────────────────
// sections/EntertainmentLog.jsx — Shows, performances, and events log
//
// Records every entertainment experience on board: theatre shows, live music,
// comedy nights, deck parties, and more. Each entry has a name, type, venue,
// date, performers, duration, star rating, and review notes. Data is stored as
// a growing array under "csj-entertainmentLog".
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp, TA, Stars, Lbl } from '../components/ui'

// Full list of entertainment categories available in the type dropdown
const TYPES = ['Show', 'Live Music', 'Comedy', 'Game Show', 'Movie', 'Deck Party', 'Sport / Activity', 'Art Auction', 'Other']

export default function EntertainmentLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add = () => onChange([...data, {}])
  // Update a single field on entry i without mutating the array
  const set = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr icon="🎭" title="Entertainment Log" sub="Every show, performance, and event enjoyed on board" />

      {/* One card per entertainment entry. The card heading uses the event name
          once entered, falling back to "Event N" while the field is empty.  */}
      {data.map((entry, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>
              {entry.name || `Event ${i + 1}`}
            </h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>

          {/* Event name — doubles as the card heading once filled in */}
          <Fld label="Show / Event Name">
            <Inp value={entry.name} onChange={v => set(i, 'name', v)} placeholder="e.g. Thriller Live, Piano Bar Night" />
          </Fld>

          {/* Type dropdown and venue on one responsive row */}
          <Row2>
            <Fld label="Type" half>
              <select value={entry.type || ''} onChange={e => set(i, 'type', e.target.value)} style={{ ...sty.inp }}>
                <option value="">Select...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Fld>
            <Fld label="Venue / Location" half>
              <Inp value={entry.venue} onChange={v => set(i, 'venue', v)} placeholder="e.g. Royal Theatre, Pool Deck" />
            </Fld>
          </Row2>

          {/* Day number and calendar date */}
          <Row2>
            <Fld label="Day" half>
              <Inp type="number" value={entry.day} onChange={v => set(i, 'day', v)} placeholder="Day #" />
            </Fld>
            <Fld label="Date" half>
              <Inp type="date" value={entry.date} onChange={v => set(i, 'date', v)} />
            </Fld>
          </Row2>

          {/* Who performed and how long the event ran */}
          <Row2>
            <Fld label="Performers / Cast" half>
              <Inp value={entry.performers} onChange={v => set(i, 'performers', v)} placeholder="Who was on stage?" />
            </Fld>
            <Fld label="Duration" half>
              <Inp value={entry.duration} onChange={v => set(i, 'duration', v)} placeholder="e.g. 1 hour 30 mins" />
            </Fld>
          </Row2>

          {/* Star rating outside Fld to control bottom spacing independently */}
          <div style={{ marginBottom: 16 }}>
            <Lbl c="Rating" />
            <Stars value={entry.rating || 0} onChange={v => set(i, 'rating', v)} />
          </div>

          <Fld label="Review / Notes">
            <TA value={entry.notes} onChange={v => set(i, 'notes', v)} placeholder="What stood out? Would you see it again?" rows={3} />
          </Fld>
        </div>
      ))}

      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Entertainment Entry</button>
    </div>
  )
}
