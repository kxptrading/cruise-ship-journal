// ─────────────────────────────────────────────────────────────────────────────
// sections/Itinerary.tsx — Port-by-port voyage itinerary
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, WHITE, LIGHT, BORDER, TEXT, GOLD, MUTED, TEAL, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'
import FE from '../components/FE'
import type { ItineraryDay } from '../types'

interface Props {
  data:     ItineraryDay[]
  onChange: (updated: ItineraryDay[]) => void
}

export default function Itinerary({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add    = () => onChange([...data, { date: '', port: '', arrive: '', depart: '' }])
  const del    = (i: number) => onChange(data.filter((_, idx) => idx !== i))
  const setDay = (i: number, f: keyof ItineraryDay, v: string) => {
    const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u)
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dotColor = (day: ItineraryDay): string => {
    if (!day.date) return NAVY
    const d = new Date(day.date + 'T00:00:00')
    if (d < today) return TEAL
    if (d.getTime() === today.getTime()) return GOLD
    return NAVY
  }

  const isAtSea = (day: ItineraryDay) => !day.port || day.port.toLowerCase().includes('sea')

  return (
    <div>
      <PgHdr icon="🗺️" title="Itinerary Overview" sub="Add each day of your voyage as you go" />

      {data.length === 0 ? (
        <div style={{ ...cs, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ marginBottom: 14 }}><FE emoji="⚓" size={48} /></div>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 8 }}>
            No days added yet
          </div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
            Add each port of call and sea day to build your voyage map.
          </div>
          <button onClick={add} style={{ ...sty.btn, fontSize: 13, padding: '10px 22px' }}>+ Add First Day</button>
        </div>
      ) : (
        <>
          <div style={{ ...cs, overflowX: 'auto', paddingBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              Journey Map
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: data.length * 90 }}>
              {data.map((day, i) => {
                const color  = dotColor(day)
                const atSea  = isAtSea(day)
                const port   = day.port || (atSea ? 'At Sea' : `Day ${i + 1}`)
                const label  = port.split(',')[0].trim()

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 80 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 5, letterSpacing: '0.05em' }}>D{i + 1}</div>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <div style={{ flex: 1, height: 2, background: i === 0 ? 'transparent' : BORDER }} />
                        <div style={{
                          width: atSea ? 10 : 14,
                          height: atSea ? 10 : 14,
                          borderRadius: '50%',
                          background: atSea ? 'transparent' : color,
                          border: `2px solid ${atSea ? BORDER : color}`,
                          flexShrink: 0,
                          boxShadow: !atSea && color === GOLD ? '0 0 0 3px rgba(201,162,39,0.25)' : 'none',
                        }} />
                        <div style={{ flex: 1, height: 2, background: i === data.length - 1 ? 'transparent' : BORDER }} />
                      </div>
                      <div style={{
                        marginTop: 8, fontSize: 10, color: atSea ? MUTED : color,
                        fontWeight: atSea ? 400 : 700, textAlign: 'center',
                        lineHeight: 1.3, maxWidth: 76,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
              {[{ color: TEAL, label: 'Visited' }, { color: GOLD, label: 'Today' }, { color: NAVY, label: 'Upcoming' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 11, color: MUTED }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={cs}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: NAVY }}>
                    {(w < BP.mobile ? ['#', 'Port', 'Arrive', 'Depart', ''] : ['Day', 'Date', 'Port / At Sea', 'Arrive', 'Depart', '']).map(h => (
                      <th key={h} style={{ padding: w < BP.mobile ? '9px 8px' : '11px 14px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((day, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: w < BP.mobile ? '6px 8px' : '8px 14px', fontWeight: 700, color: GOLD, fontSize: w < BP.mobile ? 13 : 16, textAlign: 'center', fontFamily: 'Georgia,serif' }}>{i + 1}</td>
                      {w >= BP.mobile && (
                        <td style={{ padding: '6px 8px' }}>
                          <input type="date" value={day.date || ''} onChange={e => setDay(i, 'date', e.target.value)}
                            style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer', width: 120 }} />
                        </td>
                      )}
                      <td style={{ padding: w < BP.mobile ? '6px 8px' : '6px 10px' }}>
                        <input value={day.port || ''} onChange={e => setDay(i, 'port', e.target.value)} placeholder="Port or At Sea"
                          style={{ border: 'none', background: 'transparent', fontSize: w < BP.mobile ? 12 : 13, color: TEXT, width: '100%', minWidth: w < BP.mobile ? 90 : 120 }} />
                      </td>
                      <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                        <input type="time" value={day.arrive || ''} onChange={e => setDay(i, 'arrive', e.target.value)}
                          style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, width: w < BP.mobile ? 80 : undefined }} />
                      </td>
                      <td style={{ padding: w < BP.mobile ? '6px 6px' : '6px 10px' }}>
                        <input type="time" value={day.depart || ''} onChange={e => setDay(i, 'depart', e.target.value)}
                          style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, width: w < BP.mobile ? 80 : undefined }} />
                      </td>
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                        <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={add} style={{ ...sty.btn, marginTop: 16 }}>+ Add Day</button>
          </div>
        </>
      )}
    </div>
  )
}
