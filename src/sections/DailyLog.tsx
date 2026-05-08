// ─────────────────────────────────────────────────────────────────────────────
// sections/DailyLog.tsx — Day-by-day voyage journal
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { NAVY, WHITE, BORDER, TEXT, MUTED, BP, sty } from '../constants'
import { useW, useVoyageId, useUserId } from '../context'
import { PgHdr, Box, Fld, Row2, Inp, TA, Stars } from '../components/ui'
import { addPhoto, getPhotos, deletePhoto, updateCaption } from '../lib/photoStorage'
import type { DailyLog, ItineraryDay, Voyage } from '../types'
import type { PhotoRecord } from '../types'
import FE from '../components/FE'

interface Props {
  data:        DailyLog[]
  onChange:    (updated: DailyLog[]) => void
  itinerary:   ItineraryDay[]
  voyage:      Voyage
  initialDay?: number
}

const WX = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Hot', 'Mild', 'Cool']

export default function DailyLogSection({ data, onChange, itinerary, voyage, initialDay }: Props) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()
  const cs       = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const [day,       setDay]       = useState<number>(initialDay ?? 0)
  const [photos,    setPhotos]    = useState<PhotoRecord[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [lightbox,  setLightbox]  = useState<PhotoRecord | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const log = data[day] || {} as Partial<DailyLog>

  useEffect(() => {
    const nights = parseInt(voyage?.totalNights) || 0
    if (nights <= 0 || nights === data.length) return

    const depDate = voyage?.departureDate ? new Date(voyage.departureDate + 'T00:00:00') : null

    if (nights > data.length) {
      const padded = [...data]
      for (let i = data.length; i < nights; i++) {
        const date = depDate
          ? new Date(depDate.getTime() + i * 86400000).toISOString().split('T')[0]
          : ''
        padded.push({ date, port: '', weather: [], highlights: '', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 0, isPublic: false })
      }
      onChange(padded)
    } else {
      const hasContent = (d: Partial<DailyLog>) =>
        d.highlights || d.bestMoment || d.activity || d.excNotes || d.entertainment ||
        d.breakfast || d.lunch || d.dinner || d.drink || ((d.weather?.length ?? 0) > 0)
      const trimmed = [...data]
      while (trimmed.length > nights && !hasContent(trimmed[trimmed.length - 1])) {
        trimmed.pop()
      }
      if (trimmed.length !== data.length) onChange(trimmed)
    }
  }, [voyage?.totalNights, voyage?.departureDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const addDay = () => {
    onChange([...data, { date: '', port: '', weather: [], highlights: '', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 0, isPublic: false }])
    setDay(data.length)
  }

  const delDay = () => {
    const next = data.filter((_, idx) => idx !== day)
    onChange(next)
    setDay(Math.max(0, Math.min(day, next.length - 1)))
  }

  const set = (f: keyof DailyLog, v: unknown) => {
    const u = [...data]; u[day] = { ...log, [f]: v } as DailyLog; onChange(u)
  }

  useEffect(() => {
    if (!voyageId) return
    getPhotos(day + 1, { voyageId }).then(setPhotos).catch(() => setPhotos([]))
  }, [day, voyageId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !voyageId || !userId) return
    setUploading(true)
    for (const file of files) {
      const photo = await addPhoto(day + 1, file, { voyageId, userId })
      setPhotos(prev => [...prev, photo])
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (photo: PhotoRecord) => {
    await deletePhoto(photo.id, photo.storage_path)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (lightbox?.id === photo.id) setLightbox(null)
  }

  const handleCaption = (id: string, caption: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, caption } : p))
  }

  return (
    <div>
      <PgHdr icon="📅" title="Daily Log" sub={
        voyage?.totalNights
          ? `${data.length} day${data.length !== 1 ? 's' : ''} — synced from your voyage dates`
          : 'Set your departure and return dates in Voyage Details to auto-populate days'
      } />

      <div style={{ display: 'flex', flexWrap: w < BP.mobile ? 'nowrap' : 'wrap', gap: 8, marginBottom: 24, overflowX: w < BP.mobile ? 'auto' : 'visible', paddingBottom: w < BP.mobile ? 8 : 0 }}>
        {data.map((_, i) => (
          <button key={i} onClick={() => setDay(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${day === i ? NAVY : BORDER}`, background: day === i ? NAVY : WHITE, color: day === i ? WHITE : TEXT, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: day === i ? 700 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Day {i + 1}{itinerary[i]?.port ? ` · ${itinerary[i].port.split(',')[0]}` : ''}
          </button>
        ))}
        <button onClick={addDay}
          style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px dashed ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Day
        </button>
      </div>

      {data.length === 0 ? (
        <div style={{ ...cs, textAlign: 'center', color: MUTED, padding: '48px 24px' }}>
          No days logged yet — hit "+ Day" above to add your first entry.
        </div>
      ) : (
        <div style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 22 }}>
              Day {day + 1}{itinerary[day]?.port ? ` — ${itinerary[day].port}` : ''}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Stars value={log.rating || 0} onChange={(v: number) => set('rating', v)} />

              <button
                onClick={() => set('isPublic', !log.isPublic)}
                title={log.isPublic ? 'Visible in Feed — click to make private' : 'Private — click to share to Feed'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: log.isPublic ? '#ECFDF5' : '#F9FAFB',
                  border: `1.5px solid ${log.isPublic ? '#34D399' : '#D1D5DB'}`,
                  borderRadius: 20, padding: '4px 12px',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  color: log.isPublic ? '#065F46' : '#6B7280',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
              >
                {log.isPublic ? <><FE emoji="🌐" size={13} /> Public</> : <><FE emoji="🔒" size={13} /> Private</>}
              </button>

              <button onClick={delDay} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Remove day
              </button>
            </div>
          </div>

          <Row2>
            <Fld label="Date" half><Inp type="date" value={log.date || ''} onChange={(v: string) => set('date', v)} /></Fld>
            <Fld label="Port / Sea" half>
              <select value={log.port || ''} onChange={e => set('port', e.target.value)} style={sty.inp}>
                <option value="">Select…</option>
                <option value="Port">Port</option>
                <option value="Sea">Sea</option>
              </select>
            </Fld>
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
            <TA value={log.highlights || ''} onChange={(v: string) => set('highlights', v)} placeholder="What happened today? Best moments, discoveries, experiences..." rows={5} />
          </Box>

          <Box title="MEALS & DRINKS">
            {([['Breakfast', 'breakfast'], ['Lunch', 'lunch'], ['Dinner', 'dinner'], ['Best Drink', 'drink']] as [string, keyof DailyLog][]).map(([lbl, key]) => (
              <Fld key={key} label={lbl}><Inp value={(log[key] as string) || ''} onChange={(v: string) => set(key, v)} placeholder="What did you have?" /></Fld>
            ))}
          </Box>

          <Box title="EXCURSION / SHORE ACTIVITY">
            <Fld label="Activity"><Inp value={log.activity || ''} onChange={(v: string) => set('activity', v)} /></Fld>
            <Row2>
              <Fld label="Duration (hh:mm)" half><Inp type="time" value={log.duration || ''} onChange={(v: string) => set('duration', v)} /></Fld>
              <Fld label="Cost" half><Inp value={log.excCost || ''} onChange={(v: string) => set('excCost', v)} placeholder="£0.00" /></Fld>
            </Row2>
            <Fld label="Notes"><TA value={log.excNotes || ''} onChange={(v: string) => set('excNotes', v)} rows={3} /></Fld>
          </Box>

          <Box title="ONBOARD ENTERTAINMENT">
            <TA value={log.entertainment || ''} onChange={(v: string) => set('entertainment', v)} placeholder="Shows, activities, events, games..." rows={3} />
          </Box>

          <Box title="BEST MOMENT OF THE DAY">
            <TA value={log.bestMoment || ''} onChange={(v: string) => set('bestMoment', v)} rows={3} />
          </Box>

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
                {uploading ? 'Uploading…' : <><FE emoji="📷" size={13} /> Add Photos</>}
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
                        onClick={() => handleDelete(photo)}
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
      )}

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
