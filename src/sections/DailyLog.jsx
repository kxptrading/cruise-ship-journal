import { useState } from 'react'
import { NAVY, WHITE, BORDER, TEXT, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, Fld, Row2, Inp, TA, Stars } from '../components/ui'

export default function DailyLog({ data, onChange, itinerary }) {
  const w   = useW()
  const cs  = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const [day, setDay] = useState(0)
  const log = data[day] || {}
  const set = (f, v) => { const u = [...data]; u[day] = { ...log, [f]: v }; onChange(u) }
  const WX  = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Hot', 'Mild', 'Cool']

  return (
    <div>
      <PgHdr title="Daily Log" sub="Record every moment of your voyage day by day" />

      <div style={{ display: 'flex', flexWrap: w < BP.mobile ? 'nowrap' : 'wrap', gap: 8, marginBottom: 24, overflowX: w < BP.mobile ? 'auto' : 'visible', paddingBottom: w < BP.mobile ? 8 : 0 }}>
        {data.map((_, i) => (
          <button key={i} onClick={() => setDay(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${day === i ? NAVY : BORDER}`, background: day === i ? NAVY : WHITE, color: day === i ? WHITE : TEXT, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: day === i ? 700 : 400 }}>
            Day {i + 1}{itinerary[i]?.port ? ` · ${itinerary[i].port.split(',')[0]}` : ''}
          </button>
        ))}
      </div>

      <div style={cs}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 22 }}>
            Day {day + 1}{itinerary[day]?.port ? ` — ${itinerary[day].port}` : ''}
          </h2>
          <Stars value={log.rating || 0} onChange={v => set('rating', v)} />
        </div>

        <Row2>
          <Fld label="Date" half><Inp type="date" value={log.date} onChange={v => set('date', v)} /></Fld>
          <Fld label="Port / At Sea" half><Inp value={log.port} onChange={v => set('port', v)} placeholder="Port name or At Sea" /></Fld>
        </Row2>

        <Box title="WEATHER">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {WX.map(wx => (
              <label key={wx} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: TEXT }}>
                <input type="checkbox" checked={(log.weather || []).includes(wx)}
                  onChange={e => set('weather', e.target.checked ? [...(log.weather || []), wx] : (log.weather || []).filter(x => x !== wx))}
                  style={{ accentColor: NAVY, width: 15, height: 15 }} />
                {wx}
              </label>
            ))}
          </div>
        </Box>

        <Box title="TODAY'S HIGHLIGHTS">
          <TA value={log.highlights} onChange={v => set('highlights', v)} placeholder="What happened today? Best moments, discoveries, experiences..." rows={5} />
        </Box>

        <Box title="MEALS & DRINKS">
          {[['Breakfast', 'breakfast'], ['Lunch', 'lunch'], ['Dinner', 'dinner'], ['Best Drink', 'drink']].map(([lbl, key]) => (
            <Fld key={key} label={lbl}><Inp value={log[key]} onChange={v => set(key, v)} placeholder="What did you have?" /></Fld>
          ))}
        </Box>

        <Box title="EXCURSION / SHORE ACTIVITY">
          <Fld label="Activity"><Inp value={log.activity} onChange={v => set('activity', v)} /></Fld>
          <Row2>
            <Fld label="Duration" half><Inp value={log.duration} onChange={v => set('duration', v)} placeholder="e.g. 3 hours" /></Fld>
            <Fld label="Cost" half><Inp value={log.excCost} onChange={v => set('excCost', v)} placeholder="£0.00" /></Fld>
          </Row2>
          <Fld label="Notes"><TA value={log.excNotes} onChange={v => set('excNotes', v)} rows={3} /></Fld>
        </Box>

        <Box title="ONBOARD ENTERTAINMENT">
          <TA value={log.entertainment} onChange={v => set('entertainment', v)} placeholder="Shows, activities, events, games..." rows={3} />
        </Box>

        <Box title="BEST MOMENT OF THE DAY">
          <TA value={log.bestMoment} onChange={v => set('bestMoment', v)} rows={3} />
        </Box>
      </div>
    </div>
  )
}
