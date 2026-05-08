// ─────────────────────────────────────────────────────────────────────────────
// sections/EntertainmentLog.tsx — Shows, performances, and events log
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Row2, Inp, TA, Stars, Lbl } from '../components/ui'
import FE from '../components/FE'
import type { EntertainmentEntry } from '../types'

const TYPES = ['Show', 'Live Music', 'Comedy', 'Game Show', 'Movie', 'Deck Party', 'Sport / Activity', 'Art Auction', 'Other']

interface Props {
  data:     EntertainmentEntry[]
  onChange: (updated: EntertainmentEntry[]) => void
}

export default function EntertainmentLog({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add = () => onChange([...data, { id: crypto.randomUUID(), day: '', date: '', name: '', type: '', venue: '', performers: '', duration: '', rating: 0, notes: '' }])
  const set = (i: number, f: keyof EntertainmentEntry, v: string | number) => {
    const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u)
  }
  const del = (i: number) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr icon="🎭" title="Entertainment Log" sub="Every show, performance, and event enjoyed on board" />

      {data.length === 0 && (
        <div style={{ ...sty.card, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ marginBottom: 14 }}><FE emoji="🎭" size={48} /></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 8 }}>No shows logged yet</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Log every show, performance, and event enjoyed on board.</div>
        </div>
      )}

      {data.map((entry, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>
              {entry.name || `Event ${i + 1}`}
            </h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>

          <Fld label="Show / Event Name">
            <Inp value={entry.name} onChange={(v: string) => set(i, 'name', v)} placeholder="e.g. Thriller Live, Piano Bar Night" />
          </Fld>

          <Row2>
            <Fld label="Type" half>
              <select value={entry.type || ''} onChange={e => set(i, 'type', e.target.value)} style={{ ...sty.inp }}>
                <option value="">Select...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Fld>
            <Fld label="Venue / Location" half>
              <Inp value={entry.venue} onChange={(v: string) => set(i, 'venue', v)} placeholder="e.g. Royal Theatre, Pool Deck" />
            </Fld>
          </Row2>

          <Row2>
            <Fld label="Day" half>
              <Inp type="number" value={entry.day} onChange={(v: string) => set(i, 'day', v)} placeholder="Day #" />
            </Fld>
            <Fld label="Date" half>
              <Inp type="date" value={entry.date} onChange={(v: string) => set(i, 'date', v)} />
            </Fld>
          </Row2>

          <Row2>
            <Fld label="Performers / Cast" half>
              <Inp value={entry.performers} onChange={(v: string) => set(i, 'performers', v)} placeholder="Who was on stage?" />
            </Fld>
            <Fld label="Duration (hh:mm)" half>
              <Inp type="time" value={entry.duration} onChange={(v: string) => set(i, 'duration', v)} />
            </Fld>
          </Row2>

          <div style={{ marginBottom: 16 }}>
            <Lbl c="Rating" />
            <Stars value={entry.rating || 0} onChange={(v: number) => set(i, 'rating', v)} />
          </div>

          <Fld label="Review / Notes">
            <TA value={entry.notes} onChange={(v: string) => set(i, 'notes', v)} placeholder="What stood out? Would you see it again?" rows={3} />
          </Fld>
        </div>
      ))}

      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Entertainment Entry</button>
    </div>
  )
}
