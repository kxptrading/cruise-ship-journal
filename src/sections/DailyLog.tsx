// ─────────────────────────────────────────────────────────────────────────────
// sections/DailyLog.tsx — Day-by-day voyage journal (Phase 6 redesign)
//
// Layout: tabbed day card — Weather | Food | Activity | Highlight | Rating
// Navigation: top day-picker strip + bottom prev/next pager + mobile swipe
// Photos: drag-and-drop dropzone + lightbox gallery
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY, NAVY2, WHITE, BORDER, TEXT, MUTED, GOLD, TEAL, ROSE, BP, sty, FONT_DISPLAY, FONT_BODY, WX_EMOJI, WX_STYLE } from '../constants'
import { useW, useVoyageId, useUserId } from '../context'
import { PgHdr, Fld, Inp, TA } from '../components/ui'
import { StarRating } from '../components/ui/star-rating'
import { addPhoto, getPhotos, deletePhoto, updateCaption } from '../lib/photoStorage'
import type { DailyLog, ItineraryDay, Voyage } from '../types'
import type { PhotoRecord } from '../types'
import FE from '../components/FE'

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = 'highlight' | 'food' | 'weather' | 'activity' | 'rating' | 'photos'

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'highlight', emoji: '✨', label: 'Highlights' },
  { id: 'food',      emoji: '🍽️', label: 'Food'       },
  { id: 'weather',   emoji: '🌤️', label: 'Weather'    },
  { id: 'activity',  emoji: '🚤', label: 'Activity'   },
  { id: 'rating',    emoji: '⭐', label: 'Rating'     },
  { id: 'photos',    emoji: '📷', label: 'Photos'     },
]

const WX_CHIPS = [
  { id: 'Sunny', emoji: '☀️' }, { id: 'Cloudy', emoji: '☁️' },
  { id: 'Rainy', emoji: '🌧️' }, { id: 'Windy',  emoji: '💨' },
  { id: 'Hot',   emoji: '🌡️' }, { id: 'Mild',   emoji: '🌤️' },
  { id: 'Cool',  emoji: '❄️'  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  data:        DailyLog[]
  onChange:    (updated: DailyLog[]) => void
  itinerary:   ItineraryDay[]
  voyage:      Voyage
  initialDay?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DailyLogSection({ data, onChange, itinerary, voyage, initialDay }: Props) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()

  const [day,      setDay]      = useState<number>(initialDay ?? 0)
  const [tab,      setTab]      = useState<Tab>('highlight')
  const [tabDir,   setTabDir]   = useState<1 | -1>(1)
  const [dayDir,   setDayDir]   = useState<1 | -1>(1)
  const [photos,   setPhotos]   = useState<PhotoRecord[]>([])
  const [uploading,setUploading]= useState<boolean>(false)
  const [lightbox, setLightbox] = useState<PhotoRecord | null>(null)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  const fileRef         = useRef<HTMLInputElement>(null)
  const touchStartX     = useRef(0)
  const touchStartY     = useRef(0)
  const dayStripRef     = useRef<HTMLDivElement>(null)

  const log = data[day] || {} as Partial<DailyLog>

  // ── Auto-pad days from voyage dates ──────────────────────────────────────────
  useEffect(() => {
    const nights = parseInt(voyage?.totalNights) || 0
    if (nights <= 0 || nights === data.length) return
    const depDate = voyage?.departureDate ? new Date(voyage.departureDate + 'T00:00:00') : null
    if (nights > data.length) {
      const padded = [...data]
      for (let i = data.length; i < nights; i++) {
        const date = depDate ? new Date(depDate.getTime() + i * 86400000).toISOString().split('T')[0] : ''
        padded.push({ date, port: '', weather: [], highlights: '', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 0, isPublic: false })
      }
      onChange(padded)
    } else {
      const hasContent = (d: Partial<DailyLog>) =>
        d.highlights || d.bestMoment || d.activity || d.excNotes || d.entertainment ||
        d.breakfast || d.lunch || d.dinner || d.drink || ((d.weather?.length ?? 0) > 0)
      const trimmed = [...data]
      while (trimmed.length > nights && !hasContent(trimmed[trimmed.length - 1])) trimmed.pop()
      if (trimmed.length !== data.length) onChange(trimmed)
    }
  }, [voyage?.totalNights, voyage?.departureDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field setter ──────────────────────────────────────────────────────────────
  const set = (f: keyof DailyLog, v: unknown) => {
    const u = [...data]; u[day] = { ...log, [f]: v } as DailyLog; onChange(u)
  }

  // ── Photos ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!voyageId) return
    getPhotos(day + 1, { voyageId }).then(setPhotos).catch(() => setPhotos([]))
  }, [day, voyageId])

  const handleUpload = async (files: File[]) => {
    if (!files.length || !voyageId || !userId) return
    setUploading(true)
    for (const file of files) {
      const photo = await addPhoto(day + 1, file, { voyageId, userId })
      setPhotos(prev => [...prev, photo])
    }
    setUploading(false)
  }

  const handleDelete = async (photo: PhotoRecord) => {
    await deletePhoto(photo.id, photo.storage_path)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (lightbox?.id === photo.id) setLightbox(null)
  }

  // ── Day navigation ────────────────────────────────────────────────────────────
  const goDay = useCallback((next: number) => {
    if (next < 0 || next >= data.length) return
    setDayDir(next > day ? 1 : -1)
    setDay(next)
    // Scroll the day pill into view
    window.setTimeout(() => {
      const pill = dayStripRef.current?.querySelector(`[data-day="${next}"]`) as HTMLElement
      pill?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
    }, 30)
  }, [day, data.length])

  // ── Tab navigation ────────────────────────────────────────────────────────────
  const switchTab = (next: Tab) => {
    const oldIdx = TABS.findIndex(t => t.id === tab)
    const newIdx = TABS.findIndex(t => t.id === next)
    setTabDir(newIdx > oldIdx ? 1 : -1)
    setTab(next)
  }

  // ── Swipe gestures (day navigation on mobile) ─────────────────────────────────
  const onCardTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onCardTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (Math.abs(dx) > 55 && dy < 40) {
      if (dx < 0) goDay(day + 1)
      else goDay(day - 1)
    }
  }

  // ── Photo drag-and-drop ───────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) handleUpload(files)
  }

  const addDay = () => {
    onChange([...data, { date: '', port: '', weather: [], highlights: '', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 0, isPublic: false }])
    setDay(data.length)
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayDate = log.date ? new Date(log.date + 'T00:00:00') : null
  const isToday = dayDate?.getTime() === today.getTime()
  const isPast  = dayDate ? dayDate < today : false
  const isSea   = !log.port || log.port.toLowerCase().includes('sea')

  const portLabel  = itinerary[day]?.port || log.port || ''
  const dayHeading = portLabel ? `Day ${day + 1} — ${portLabel}` : `Day ${day + 1}`

  // ── Tab content ───────────────────────────────────────────────────────────────
  const renderTab = () => {
    switch (tab) {
      case 'highlight':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Fld label="Today's Highlights">
              <TA value={log.highlights || ''} onChange={(v: string) => set('highlights', v)}
                placeholder="What happened today? Best moments, discoveries, experiences..." rows={5} />
            </Fld>
            <Fld label="Best Moment of the Day">
              <TA value={log.bestMoment || ''} onChange={(v: string) => set('bestMoment', v)} rows={3} />
            </Fld>
          </div>
        )

      case 'food':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([['Breakfast', 'breakfast', '🍳'], ['Lunch', 'lunch', '🥗'], ['Dinner', 'dinner', '🍝'], ['Best Drink', 'drink', '🍷']] as [string, keyof DailyLog, string][]).map(([lbl, key, emoji]) => (
              <Fld key={key} label={`${emoji} ${lbl}`}>
                <Inp value={(log[key] as string) || ''} onChange={(v: string) => set(key, v)} placeholder="What did you have?" />
              </Fld>
            ))}
          </div>
        )

      case 'weather':
        return (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, fontFamily: FONT_BODY }}>
              Select today's weather
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {WX_CHIPS.map(wx => {
                const selected = (log.weather || []).includes(wx.id)
                return (
                  <motion.button
                    key={wx.id}
                    onClick={() => set('weather', selected
                      ? (log.weather || []).filter(x => x !== wx.id)
                      : [...(log.weather || []), wx.id]
                    )}
                    animate={selected ? { scale: 1.06 } : { scale: 1 }}
                    whileHover={{ scale: selected ? 1.08 : 1.04 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 380 }}
                    style={{
                      display:     'flex', alignItems: 'center', gap: 6,
                      padding:     '8px 16px', borderRadius: 24,
                      border:      `1.5px solid ${selected ? (WX_STYLE[wx.id]?.border?.replace('1px solid ','') || GOLD) : BORDER}`,
                      background:  selected ? (WX_STYLE[wx.id]?.background || `${GOLD}18`) : WHITE,
                      cursor:      'pointer', fontFamily: FONT_BODY,
                      fontSize:    14, color: selected ? (WX_STYLE[wx.id]?.color || NAVY2) : MUTED,
                      fontWeight:  selected ? 700 : 400,
                      boxShadow:   selected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                      transition:  'border-color 0.12s, background 0.12s, color 0.12s',
                    }}
                  >
                    <FE emoji={wx.emoji} size={18} />
                    {wx.id}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )

      case 'activity':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Fld label="🚤 Excursion / Shore Activity">
              <Inp value={log.activity || ''} onChange={(v: string) => set('activity', v)} placeholder="What did you do ashore?" />
            </Fld>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Fld label="Duration">
                <Inp type="time" value={log.duration || ''} onChange={(v: string) => set('duration', v)} />
              </Fld>
              <Fld label="Cost">
                <Inp value={log.excCost || ''} onChange={(v: string) => set('excCost', v)} placeholder="£0.00" />
              </Fld>
            </div>
            <Fld label="Activity Notes">
              <TA value={log.excNotes || ''} onChange={(v: string) => set('excNotes', v)} rows={3} />
            </Fld>
            <Fld label="🎭 Onboard Entertainment">
              <TA value={log.entertainment || ''} onChange={(v: string) => set('entertainment', v)} placeholder="Shows, activities, events, games…" rows={3} />
            </Fld>
          </div>
        )

      case 'rating':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', paddingTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: FONT_BODY }}>
                How was your day?
              </div>
              <StarRating value={log.rating || 0} onChange={v => set('rating', v)} size={36} />
              {(log.rating || 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 8, fontSize: 14, color: GOLD, fontFamily: FONT_DISPLAY }}
                >
                  {['', 'Not great', 'It was okay', 'Pretty good', 'Really good', 'Absolutely amazing!'][log.rating || 0]}
                </motion.div>
              )}
            </div>
            <div style={{ width: '100%', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, fontFamily: FONT_BODY }}>
                Feed visibility
              </div>
              <motion.button
                onClick={() => set('isPublic', !log.isPublic)}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: log.isPublic ? '#ECFDF5' : '#F9FAFB',
                  border: `1.5px solid ${log.isPublic ? '#34D399' : '#D1D5DB'}`,
                  borderRadius: 20, padding: '8px 18px',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  color: log.isPublic ? '#065F46' : '#6B7280',
                  fontFamily: FONT_BODY,
                }}
              >
                {log.isPublic ? <><FE emoji="🌐" size={16} /> Visible in Feed</> : <><FE emoji="🔒" size={16} /> Private</>}
              </motion.button>
            </div>
          </div>
        )

      case 'photos':
        return (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
          >
            <input type="file" accept="image/*" multiple ref={fileRef} style={{ display: 'none' }}
              onChange={e => { const files = Array.from(e.target.files || []); if (files.length) handleUpload(files); e.target.value = '' }} />

            {/* Drop zone */}
            <motion.div
              onClick={() => fileRef.current?.click()}
              animate={{ borderColor: isDragOver ? 'var(--t-primary)' : BORDER, background: isDragOver ? 'var(--t-bg)' : WHITE }}
              style={{ border: `2px dashed ${isDragOver ? 'var(--t-primary)' : BORDER}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}><FE emoji={uploading ? '⏳' : '📷'} size={28} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDragOver ? 'var(--t-primary)' : NAVY2, fontFamily: FONT_BODY }}>
                {uploading ? 'Uploading…' : isDragOver ? 'Drop to add' : 'Drop photos here, or click to browse'}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 3, fontFamily: FONT_BODY }}>
                {photos.length > 0 ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} for Day ${day + 1}` : 'No photos yet'}
              </div>
            </motion.div>

            {/* Gallery grid */}
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 10 }}>
                {photos.map(photo => (
                  <div key={photo.id}>
                    <div style={{ position: 'relative' }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setLightbox(photo)}
                        style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 10, cursor: 'zoom-in', border: `1px solid ${BORDER}` }}
                      >
                        <img src={photo.dataUrl} alt={photo.caption || `Day ${day + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </motion.div>
                      <button onClick={() => handleDelete(photo)}
                        style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: WHITE, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                    <input type="text" value={photo.caption || ''} placeholder="Add caption…"
                      onChange={e => setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption: e.target.value } : p))}
                      onBlur={e => updateCaption(photo.id, e.target.value)}
                      style={{ ...sty.inp, fontSize: 11, padding: '5px 9px', marginTop: 5, borderRadius: 7 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PgHdr icon="📅" title="Daily Log" sub={
        voyage?.totalNights
          ? `${data.length} day${data.length !== 1 ? 's' : ''} — synced from voyage dates`
          : 'Set departure and return dates in Voyage Details to auto-populate'
      } />

      {/* Day selector strip */}
      <div ref={dayStripRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {data.map((d, i) => {
          const active   = i === day
          const dDate    = d.date ? new Date(d.date + 'T00:00:00') : null
          const dayToday = dDate?.getTime() === today.getTime()
          const dayPast  = dDate ? dDate < today : false
          const logged   = !!(d.highlights || d.bestMoment || d.activity)
          return (
            <button key={i} data-day={i} onClick={() => goDay(i)}
              style={{
                padding:    '6px 12px', borderRadius: 20, flexShrink: 0,
                border:     `1.5px solid ${active ? NAVY : dayToday ? GOLD : BORDER}`,
                background: active ? NAVY : dayToday ? `${GOLD}18` : WHITE,
                color:      active ? WHITE : dayToday ? GOLD : TEXT,
                cursor:     'pointer', fontSize: 12, fontFamily: FONT_BODY,
                fontWeight: active || dayToday ? 700 : 400, whiteSpace: 'nowrap',
                boxShadow:  active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s',
                position:   'relative',
              }}>
              Day {i + 1}{itinerary[i]?.port ? ` · ${itinerary[i].port.split(',')[0]}` : ''}
              {logged && !active && (
                <span style={{ position: 'absolute', top: 1, right: 3, width: 5, height: 5, borderRadius: '50%', background: TEAL }} />
              )}
            </button>
          )
        })}
        <button onClick={addDay}
          style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px dashed ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Day
        </button>
      </div>

      {data.length === 0 ? (
        <div style={{ ...sty.card, textAlign: 'center', color: MUTED, padding: '48px 24px' }}>
          No days logged yet — hit "+ Day" above to add your first entry.
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={dayDir}>
          <motion.div
            key={day}
            custom={dayDir}
            initial={{ opacity: 0, x: dayDir * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -dayDir * 30 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onTouchStart={onCardTouchStart}
            onTouchEnd={onCardTouchEnd}
            style={{ background: WHITE, borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: `1px solid ${BORDER}` }}
          >
            {/* Card header */}
            <div style={{ padding: '16px 20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div>
                  {/* Date + status pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {log.date && (
                      <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
                        {new Date(log.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {isToday && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '1px 7px', fontFamily: FONT_BODY }}>TODAY</span>
                    )}
                    {isPast && !isToday && log.date && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: TEAL, background: `${TEAL}12`, border: `1px solid ${TEAL}40`, borderRadius: 10, padding: '1px 7px', fontFamily: FONT_BODY }}>PAST</span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: w < BP.mobile ? 18 : 22, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.1 }}>
                    {dayHeading}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {(log.rating || 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: `${GOLD}18`, borderRadius: 20, padding: '3px 8px' }}>
                      <span style={{ color: GOLD, fontSize: 11 }}>★</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{log.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date + port quick edit row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <input type="date" value={log.date || ''} onChange={e => set('date', e.target.value)}
                  style={{ ...sty.inp, fontSize: 12, padding: '7px 10px' }} />
                <input value={log.port || itinerary[day]?.port || ''} onChange={e => set('port', e.target.value)}
                  placeholder="Port or At Sea"
                  style={{ ...sty.inp, fontSize: 12, padding: '7px 10px' }} />
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, position: 'relative' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => switchTab(t.id)}
                    style={{
                      flex: 1, background: 'none', border: 'none', padding: w < BP.mobile ? '8px 2px' : '10px 6px',
                      cursor: 'pointer', fontSize: w < BP.mobile ? 10 : 11, fontFamily: FONT_BODY,
                      fontWeight: tab === t.id ? 700 : 400,
                      color: tab === t.id ? 'var(--t-primary)' : MUTED,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      transition: 'color 0.15s',
                    }}>
                    <FE emoji={t.emoji} size={16} />
                    {!w || w >= 360 ? t.label : ''}
                    {/* Animated underline */}
                    {tab === t.id && (
                      <motion.div layoutId="tab-underline"
                        style={{ position: 'absolute', bottom: -1, height: 2, background: 'var(--t-primary)', borderRadius: 1, left: `${(TABS.findIndex(x => x.id === t.id) / TABS.length) * 100}%`, width: `${100 / TABS.length}%` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ padding: '18px 20px' }}>
              <AnimatePresence mode="wait" custom={tabDir}>
                <motion.div
                  key={tab}
                  custom={tabDir}
                  initial={{ x: tabDir * 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -tabDir * 20, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom pager */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
              <motion.button
                onClick={() => goDay(day - 1)}
                disabled={day === 0}
                whileTap={{ scale: 0.94 }}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 14px', cursor: day === 0 ? 'default' : 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: day === 0 ? BORDER : MUTED, opacity: day === 0 ? 0.35 : 1 }}
              >
                ← {day > 0 ? `Day ${day}` : 'Prev'}
              </motion.button>

              <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY }}>
                {day + 1} / {data.length}
              </span>

              <motion.button
                onClick={() => goDay(day + 1)}
                disabled={day === data.length - 1}
                whileTap={{ scale: 0.94 }}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 14px', cursor: day === data.length - 1 ? 'default' : 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: day === data.length - 1 ? BORDER : MUTED, opacity: day === data.length - 1 ? 0.35 : 1 }}
              >
                {day < data.length - 1 ? `Day ${day + 2}` : 'Next'} →
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Photo lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw' }}
            >
              <img src={lightbox.dataUrl} alt={lightbox.caption || ''}
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain', display: 'block', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }} />
              {lightbox.caption && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', marginTop: 10, fontSize: 14 }}>
                  {lightbox.caption}
                </div>
              )}
              <button onClick={() => setLightbox(null)}
                style={{ position: 'fixed', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: WHITE, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
