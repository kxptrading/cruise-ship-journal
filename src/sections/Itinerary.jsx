import { NAVY, WHITE, LIGHT, BORDER, TEXT, GOLD, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'

export default function Itinerary({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const setDay = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }

  return (
    <div>
      <PgHdr title="Itinerary Overview" sub="Your 14-day voyage at a glance" />
      <div style={cs}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Day', 'Date', 'Port / At Sea', 'Arrive', 'Depart'].map(h => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
