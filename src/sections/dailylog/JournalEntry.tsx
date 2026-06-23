// ─────────────────────────────────────────────────────────────────────────────
// sections/dailylog/JournalEntry.tsx — Narrative journal page for the Daily Log
//
// A warm, flowing entry you write down the page (not a scrapbook): a date headline,
// serif prose blocks, photos inline in the story, and gentle prompt chips that
// append a seeded paragraph. Weather + rating live in a slim header. The body is an
// ORDERED list of blocks stored in daily_logs.canvas (CanvasItem[], rendered in
// array order — xPct/y are unused here). deriveStructured() folds the prose back
// into the structured columns so dashboard / metrics / export keep working.
// Persists offline-first via onChange → update('dailyLogs').
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { NAVY2, WHITE, BORDER, TEXT, MUTED, GOLD, FONT_DISPLAY, FONT_BODY, BP } from '../../constants'
import { useW, useVoyageId, useUserId } from '../../context'
import { StarRating } from '../../components/ui/star-rating'
import { addPhoto, getPhotos } from '../../lib/photoStorage'
import FE from '../../components/FE'
import { Plus, X, Image as ImageIcon } from 'lucide-react'
import type { DailyLog, ItineraryDay, Voyage } from '../../types'
import { deriveStructured } from './deriveStructured'
import type { CanvasItem, WriteThroughField } from './canvasTypes'

interface Props {
  data:        DailyLog[]
  onChange:    (updated: DailyLog[]) => void
  itinerary:   ItineraryDay[]
  voyage:      Voyage
  initialDay?: number
}

const WX_CHIPS = [
  { id: 'Sunny', emoji: '☀️' }, { id: 'Cloudy', emoji: '☁️' }, { id: 'Rainy', emoji: '🌧️' },
  { id: 'Windy', emoji: '💨' }, { id: 'Hot', emoji: '🌡️' }, { id: 'Mild', emoji: '🌤️' }, { id: 'Cool', emoji: '❄️' },
]

const PROMPTS: { label: string; emoji: string; seed: string; field?: WriteThroughField }[] = [
  { label: 'Best thing I ate', emoji: '😋', seed: 'The best thing I ate today was ', field: 'highlights' },
  { label: 'Funniest moment',  emoji: '😂', seed: 'The funniest moment was ',       field: 'highlights' },
  { label: "Won't forget",     emoji: '✨', seed: "What I won't forget: ",          field: 'bestMoment' },
  { label: 'Best view',        emoji: '🌅', seed: 'The best view was ',             field: 'highlights' },
  { label: 'Dinner',           emoji: '🍽️', seed: 'For dinner we had ',             field: 'dinner' },
]

export default function JournalEntry({ data, onChange, itinerary, voyage: _voyage, initialDay }: Props) {
  const w        = useW()
  const mobile   = w < BP.mobile
  const voyageId = useVoyageId()
  const userId   = useUserId()

  const [day, setDay] = useState<number>(initialDay ?? 0)
  const [blocks, setBlocks] = useState<CanvasItem[]>(() => data[day]?.canvas ?? [])
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setBlocks(data[day]?.canvas ?? []) }, [day, voyageId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const incoming = data[day]?.canvas ?? []
    setBlocks(prev => (prev.length === 0 && incoming.length > 0 ? incoming : prev))
  }, [data, day])

  useEffect(() => {
    if (!voyageId) return
    getPhotos(day + 1, { voyageId })
      .then(rows => setUrlMap(m => ({ ...m, ...Object.fromEntries(rows.map(r => [r.storage_path, r.dataUrl])) })))
      .catch(() => {})
  }, [day, voyageId])

  const dayInfo = itinerary[day]
  const port    = data[day]?.port || dayInfo?.port || ''
  const dateStr = data[day]?.date || dayInfo?.date || ''

  // Write blocks + derived structured fields (+ header patch) back via onChange.
  const commit = (next: CanvasItem[], headerPatch?: Partial<DailyLog>) => {
    setBlocks(next)
    const base    = data[day] ?? ({} as DailyLog)
    const derived = deriveStructured(next)
    const merged: DailyLog = { ...base, ...derived, ...headerPatch, canvas: next }
    onChange(data.map((d, i) => (i === day ? merged : d)))
  }
  const setHeader = (patch: Partial<DailyLog>) => commit(blocks, patch)

  const toggleWeather = (id: string) => {
    const cur = data[day]?.weather ?? []
    setHeader({ weather: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] })
  }

  const addText = (seed = '', field?: WriteThroughField) =>
    commit([...blocks, { id: crypto.randomUUID(), type: 'note', xPct: 0, y: 0, text: seed, field }])
  const updateText = (id: string, text: string) => commit(blocks.map(b => (b.id === id ? { ...b, text } : b)))
  const removeBlock = (id: string) => commit(blocks.filter(b => b.id !== id))

  const handlePhotoFile = async (file: File) => {
    if (!voyageId || !userId) return
    try {
      const rec = await addPhoto(day + 1, file, { voyageId, userId })
      setUrlMap(m => ({ ...m, [rec.storage_path]: rec.dataUrl }))
      commit([...blocks, { id: crypto.randomUUID(), type: 'photo', xPct: 0, y: 0, storagePath: rec.storage_path }])
    } catch { /* non-fatal */ }
  }

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      {/* ── Slim header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <select value={day} onChange={e => setDay(Number(e.target.value))}
          style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: FONT_BODY, color: NAVY2, background: WHITE, fontWeight: 600 }}>
          {data.map((d, i) => {
            const p = d.port || itinerary[i]?.port || ''
            return <option key={i} value={i}>Day {i + 1}{p ? ` · ${p.split(',')[0]}` : ''}</option>
          })}
        </select>
        <div style={{ flex: 1, minWidth: 100 }} />
        <StarRating value={data[day]?.rating ?? 0} onChange={n => setHeader({ rating: n })} size={20} />
      </div>

      {/* ── Journal page ── */}
      <div style={{ background: '#FCFAF4', border: `1px solid ${BORDER}`, borderRadius: 16, padding: mobile ? '22px 18px' : '34px 38px', boxShadow: '0 2px 14px rgba(0,0,0,0.05)' }}>
        {/* Date headline */}
        <div style={{ borderBottom: `2px solid ${GOLD}`, paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 24 : 30, lineHeight: 1.15 }}>
            {port || 'A day at sea'}
          </div>
          {dateStr && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{dateStr}</div>}
        </div>

        {/* Weather chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {WX_CHIPS.map(c => {
            const on = (data[day]?.weather ?? []).includes(c.id)
            return (
              <button key={c.id} onClick={() => toggleWeather(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: on ? 'var(--t-bg)' : WHITE, border: `1px solid ${on ? GOLD : BORDER}`, borderRadius: 999, padding: '4px 11px', cursor: 'pointer', fontSize: 12.5, fontFamily: FONT_BODY, color: on ? NAVY2 : MUTED, fontWeight: on ? 700 : 400 }}>
                <FE emoji={c.emoji} size={13} /> {c.id}
              </button>
            )
          })}
        </div>

        {/* Flowing blocks */}
        {blocks.length === 0 && (
          <div style={{ color: MUTED, fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: mobile ? 17 : 19, lineHeight: 1.7 }}>
            Tell the story of today… start writing below, or tap a prompt.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {blocks.map(b => b.type === 'photo'
            ? <PhotoBlock key={b.id} url={b.storagePath ? urlMap[b.storagePath] : undefined} onRemove={() => removeBlock(b.id)} />
            : <TextBlock key={b.id} value={b.text ?? ''} mobile={mobile} onChange={t => updateText(b.id, t)} onRemove={() => removeBlock(b.id)} />)}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => addText()} style={addBtn}><Plus size={15} /> Write</button>
        <button onClick={() => fileRef.current?.click()} style={addBtn}><ImageIcon size={15} /> Photo</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = '' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'thin', padding: '12px 2px 4px' }}>
        {PROMPTS.map(p => (
          <button key={p.label} onClick={() => addText(p.seed, p.field)}
            style={{ flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', gap: 6, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: NAVY2, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <FE emoji={p.emoji} size={14} /> {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const addBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, background: NAVY2, color: WHITE,
  border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY,
}

// Auto-growing prose paragraph — always editable, styled like journal writing.
function TextBlock({ value, mobile, onChange, onRemove }: { value: string; mobile: boolean; onChange: (t: string) => void; onRemove: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }
  useEffect(resize, [value])

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => { onChange(e.target.value); resize() }}
        placeholder="Write…"
        rows={1}
        style={{
          width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'none',
          background: 'transparent', fontFamily: FONT_DISPLAY, fontSize: mobile ? 16 : 18,
          lineHeight: 1.75, color: TEXT, overflow: 'hidden', paddingRight: 22,
        }}
      />
      <button onClick={onRemove} title="Remove" style={{ position: 'absolute', top: 2, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: MUTED, opacity: 0.5, display: 'flex', padding: 2 }}>
        <X size={14} />
      </button>
    </div>
  )
}

function PhotoBlock({ url, onRemove }: { url?: string; onRemove: () => void }) {
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#0001', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
        : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}><ImageIcon size={24} /></div>}
      <button onClick={onRemove} title="Remove" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: WHITE, border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} />
      </button>
    </div>
  )
}
