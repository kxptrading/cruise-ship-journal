// ─────────────────────────────────────────────────────────────────────────────
// sections/Itinerary.jsx — 14-day itinerary table
//
// A fixed-length table with one row per day of the voyage. Each row stores the
// date, port name (or "At Sea"), and arrival/departure times. The data array is
// always exactly 14 entries — index 0 = Day 1.
//
// The Dashboard reads this data to build the port timeline and sea day count.
// The Daily Log reads it to show the port name beside each day's heading.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, WHITE, LIGHT, BORDER, TEXT, GOLD, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'

export default function Itinerary({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add    = () => onChange([...data, {}])
  const del    = (i) => onChange(data.filter((_, idx) => idx !== i))
  const setDay = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }

  return (
    <div>
      <PgHdr icon="🗺️" title="Itinerary Overview" sub="Add each day of your voyage as you go" />
      <div style={cs}>
        {data.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUTED, padding: '32px 0' }}>
            No days added yet — hit the button below to start.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: NAVY }}>
                  {['Day', 'Date', 'Port / At Sea', 'Arrive', 'Depart', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((day, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: GOLD, fontSize: 16, textAlign: 'center', fontFamily: 'Georgia,serif' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <input type="date" value={day.date || ''} onChange={e => setDay(i, 'date', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer', width: 130 }} />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input value={day.port || ''} onChange={e => setDay(i, 'port', e.target.value)} placeholder="Port or At Sea"
                        style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%' }} />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input type="time" value={day.arrive || ''} onChange={e => setDay(i, 'arrive', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT }} />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input type="time" value={day.depart || ''} onChange={e => setDay(i, 'depart', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT }} />
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={add} style={{ ...sty.btn, marginTop: 16 }}>+ Add Day</button>
      </div>
    </div>
  )
}
