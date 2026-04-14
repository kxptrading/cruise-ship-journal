// ─────────────────────────────────────────────────────────────────────────────
// sections/DailyLog.jsx — Day-by-day voyage journal
//
// Lets the user log one entry per day of the voyage. The day selector at the
// top scrolls horizontally on mobile so all 14 days are always reachable. Each
// day's entry captures weather, highlights, meals, excursion details,
// entertainment, a best moment, and a 1–5 star rating.
//
// Data is an array of exactly 14 objects (index = day - 1), always the same
// length as the itinerary array so the two can be cross-referenced by index.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { NAVY, WHITE, BORDER, TEXT, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr, Box, Fld, Row2, Inp, TA, Stars } from '../components/ui'
import { addPhoto, getPhotos, deletePhoto, updateCaption } from '../lib/photoStorage'

export default function DailyLog({ data, onChange, itinerary }) {
  const w   = useW()
  const cs  = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // day is the zero-based index into the data array (0 = Day 1)
  const [day, setDay]         = useState(0)
  const [photos, setPhotos]   = useState([])
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox]   = useState(null)
  const fileRef = useRef(null)

  const log = data[day] || {}

  // Update a single field on the current day without mutating the array
  const set = (f, v) => { const u = [...data]; u[day] = { ...log, [f]: v }; onChange(u) }

  // Load photos from IndexedDB whenever the active day changes
  useEffect(() => {
    getPhotos(day).then(setPhotos).catch(() => setPhotos([]))
  }, [day])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const photo = await addPhoto(day, file)
      setPhotos(prev => [...prev, photo])
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (id) => {
    await deletePhoto(id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    if (lightbox?.id === id) setLightbox(null)
  }

  const handleCaption = (id, caption) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption } : p))
  }

  const WX  = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Hot', 'Mild', 'Cool']

  return (
    <div>
      <PgHdr title="Daily Log" sub="Record every moment of your voyage day by day" />

      {/* ── Day selector ───────────────────────────────────────────────────────
          Pill buttons for each of the 14 days. On mobile they scroll
          horizontally (nowrap + overflowX auto) to avoid wrapping into a
          multi-line block. The port name is appended when available.       */}
      <div style={{ display: 'flex', flexWrap: w < BP.mobile ? 'nowrap' : 'wrap', gap: 8, marginBottom: 24, overflowX: w < BP.mobile ? 'auto' : 'visible', paddingBottom: w < BP.mobile ? 8 : 0 }}>
        {data.map((_, i) => (
          <button key={i} onClick={() => setDay(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${day === i ? NAVY : BORDER}`, background: day === i ? NAVY : WHITE, color: day === i ? WHITE : TEXT, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: day === i ? 700 : 400 }}>
            Day {i + 1}{itinerary[i]?.port ? ` · ${itinerary[i].port.split(',')[0]}` : ''}
          </button>
        ))}
      </div>

      <div style={cs}>
        {/* Day heading: port name from itinerary + star rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 22 }}>
            Day {day + 1}{itinerary[day]?.port ? ` — ${itinerary[day].port}` : ''}
          </h2>
          <Stars value={log.rating || 0} onChange={v => set('rating', v)} />
        </div>

        {/* Date and port fields — port pre-fills from itinerary but can be overridden */}
        <Row2>
          <Fld label="Date" half><Inp type="date" value={log.date} onChange={v => set('date', v)} /></Fld>
          <Fld label="Port / At Sea" half><Inp value={log.port} onChange={v => set('port', v)} placeholder="Port name or At Sea" /></Fld>
        </Row2>

        {/* Weather: multi-select checkboxes — multiple conditions can apply */}
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

        {/* Free-text highlights — this field counts toward the "Days Logged" metric */}
        <Box title="TODAY'S HIGHLIGHTS">
          <TA value={log.highlights} onChange={v => set('highlights', v)} placeholder="What happened today? Best moments, discoveries, experiences..." rows={5} />
        </Box>

        {/* Four quick meal fields for the day — deeper logging goes in Food Log */}
        <Box title="MEALS & DRINKS">
          {[['Breakfast', 'breakfast'], ['Lunch', 'lunch'], ['Dinner', 'dinner'], ['Best Drink', 'drink']].map(([lbl, key]) => (
            <Fld key={key} label={lbl}><Inp value={log[key]} onChange={v => set(key, v)} placeholder="What did you have?" /></Fld>
          ))}
        </Box>

        {/* Shore excursion or activity for the day */}
        <Box title="EXCURSION / SHORE ACTIVITY">
          <Fld label="Activity"><Inp value={log.activity} onChange={v => set('activity', v)} /></Fld>
          <Row2>
            <Fld label="Duration" half><Inp value={log.duration} onChange={v => set('duration', v)} placeholder="e.g. 3 hours" /></Fld>
            <Fld label="Cost" half><Inp value={log.excCost} onChange={v => set('excCost', v)} placeholder="£0.00" /></Fld>
          </Row2>
          <Fld label="Notes"><TA value={log.excNotes} onChange={v => set('excNotes', v)} rows={3} /></Fld>
        </Box>

        {/* Brief note on evening shows, deck events, etc. Deeper logging goes in Entertainment Log */}
        <Box title="ONBOARD ENTERTAINMENT">
          <TA value={log.entertainment} onChange={v => set('entertainment', v)} placeholder="Shows, activities, events, games..." rows={3} />
        </Box>

        {/* Single standout memory — counts toward "Days Logged" metric alongside highlights */}
        <Box title="BEST MOMENT OF THE DAY">
          <TA value={log.bestMoment} onChange={v => set('bestMoment', v)} rows={3} />
        </Box>

        {/* Photo memory slots — stored in IndexedDB, one collection per day */}
        <Box title="PHOTOS">
          <input
            type="file" accept="image/*" multiple
            ref={fileRef} style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ ...sty.btn, fontSize: 13, padding: '8px 16px', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Uploading…' : '📷 Add Photos'}
            </button>
          </div>
          {photos.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 13, fontStyle: 'italic' }}>
              No photos yet — add some to remember this day
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 10 }}>
              {photos.map(photo => (
                <div key={photo.id}>
                  <div style={{ position: 'relative' }}>
                    <div
                      onClick={() => setLightbox(photo)}
                      style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 8, cursor: 'pointer', border: `1px solid ${BORDER}` }}
                    >
                      <img src={photo.dataUrl} alt={photo.caption || `Day ${day + 1} photo`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: WHITE, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                    >×</button>
                  </div>
                  <input
                    type="text"
                    value={photo.caption || ''}
                    onChange={e => handleCaption(photo.id, e.target.value)}
                    onBlur={e => updateCaption(photo.id, e.target.value)}
                    placeholder="Add caption…"
                    style={{ ...sty.inp, fontSize: 12, padding: '6px 10px', marginTop: 6 }}
                  />
                </div>
              ))}
            </div>
          )}
        </Box>
      </div>

      {/* Lightbox — full-size photo viewer */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw' }}>
            <img src={lightbox.dataUrl} alt={lightbox.caption || ''}
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 10, objectFit: 'contain', display: 'block' }} />
            {lightbox.caption && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', marginTop: 10, fontSize: 14 }}>
                {lightbox.caption}
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: -14, right: -14, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: WHITE, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        </div>
      )}
    </div>
  )
}
