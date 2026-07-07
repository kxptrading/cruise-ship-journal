// ─────────────────────────────────────────────────────────────────────────────
// sections/dailylog/JournalEntry.tsx — The daily Check-in for the Daily Log
//
// A prompted, eye-catching daily ritual you look forward to filling in:
//   1. Sea-state mood slider (calm ↔ stormy) — the mental-health centrepiece
//   2. Feeling tags — how you felt emotionally today
//   3. Energy level + weather + a day rating — quick capture
//   4. Today's story — warm serif prose blocks + inline photos + guided prompts
//   5. "Your voyage in feelings" — a chart of your emotional arc across the days
//
// mood/energy/feelings persist on daily_logs (offline-first via onChange). The
// story body is an ORDERED list of blocks in daily_logs.canvas (CanvasItem[]);
// deriveStructured() folds prose back into the structured columns so dashboard /
// metrics / export keep working.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { NAVY, NAVY2, WHITE, BORDER, TEXT, MUTED, GOLD, PLUM, FONT_DISPLAY, FONT_BODY, FONT_LABEL, BP } from '../../constants'
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

// 1 (glassy calm) → 5 (stormy). Calm is a settled day; stormy a turbulent one.
const SEA_STATES = [
  { v: 1, label: 'Glassy calm',  emoji: '🌅', color: '#0D9488', note: 'Settled and easy' },
  { v: 2, label: 'Gentle swell', emoji: '🌤️', color: '#3E9C7E', note: 'Mostly smooth' },
  { v: 3, label: 'Choppy',       emoji: '🌊', color: '#C9A227', note: 'A few waves' },
  { v: 4, label: 'Rough seas',   emoji: '🌧️', color: '#D97706', note: 'Hard going' },
  { v: 5, label: 'Stormy',       emoji: '⛈️', color: '#DB2777', note: 'Weathering a lot' },
]
const seaState = (v: number) => SEA_STATES.find(s => s.v === v) ?? null

const FEELINGS = [
  { id: 'Grateful', emoji: '🙏' }, { id: 'Relaxed', emoji: '😌' }, { id: 'Excited', emoji: '🤩' },
  { id: 'Joyful', emoji: '😄' },   { id: 'Peaceful', emoji: '🕊️' }, { id: 'Adventurous', emoji: '🧭' },
  { id: 'Reflective', emoji: '💭' },{ id: 'Content', emoji: '🫶' },  { id: 'Tired', emoji: '😴' },
  { id: 'Homesick', emoji: '🏠' }, { id: 'Anxious', emoji: '😰' },   { id: 'Overwhelmed', emoji: '🌀' },
]

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
  { label: 'Grateful for',     emoji: '🙏', seed: "Today I'm grateful for ",        field: 'highlights' },
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

  const cur     = data[day] ?? ({} as DailyLog)
  const dayInfo = itinerary[day]
  const port    = cur.port || dayInfo?.port || ''
  const dateStr = cur.date || dayInfo?.date || ''

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
    const c = cur.weather ?? []
    setHeader({ weather: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
  }
  const toggleFeeling = (id: string) => {
    const c = cur.feelings ?? []
    setHeader({ feelings: c.includes(id) ? c.filter(x => x !== id) : [...c, id] })
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

  const mood   = cur.mood ?? 0
  const energy = cur.energy ?? 0
  const ss     = seaState(mood)

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      {/* ── Day selector ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <select value={day} onChange={e => setDay(Number(e.target.value))}
          style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: FONT_BODY, color: NAVY2, background: WHITE, fontWeight: 600 }}>
          {data.map((d, i) => {
            const p = d.port || itinerary[i]?.port || ''
            return <option key={i} value={i}>Day {i + 1}{p ? ` · ${p.split(',')[0]}` : ''}</option>
          })}
        </select>
        <div style={{ flex: 1, minWidth: 40 }} />
        <span style={{ ...lbl, color: MUTED }}>Day {day + 1}</span>
      </div>

      {/* ── Check-in card (mood + feelings + energy) ── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 18,
        border: `1px solid ${BORDER}`,
        background: ss
          ? `linear-gradient(150deg, ${ss.color}14 0%, ${WHITE} 55%)`
          : `linear-gradient(150deg, var(--t-bg) 0%, ${WHITE} 60%)`,
        padding: mobile ? '20px 18px' : '26px 30px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      }}>
        <div style={{ ...lbl, color: NAVY, marginBottom: 4 }}>Daily check-in</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, color: NAVY2, fontSize: mobile ? 25 : 31, lineHeight: 1.1 }}>
          {port || 'A day at sea'}
        </div>
        {dateStr && <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{dateStr}</div>}

        {/* Sea-state mood */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...lbl }}>How were the seas today?</span>
            {ss && <span style={{ fontSize: 13, color: ss.color, fontWeight: 700 }}>{ss.note}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 12 : 16, marginTop: 12 }}>
            <div style={{ fontSize: mobile ? 34 : 42, lineHeight: 1, minWidth: mobile ? 40 : 50, textAlign: 'center' }}>
              {ss ? <FE emoji={ss.emoji} size={mobile ? 34 : 42} /> : <span style={{ color: MUTED, fontSize: 26 }}>—</span>}
            </div>
            <div style={{ flex: 1 }}>
              {/* Segmented 1–5 stops with a sea gradient track */}
              <div style={{ display: 'flex', gap: mobile ? 6 : 8 }}>
                {SEA_STATES.map(s => {
                  const on = mood === s.v
                  return (
                    <button key={s.v} onClick={() => setHeader({ mood: s.v })} title={s.label}
                      style={{
                        flex: 1, height: mobile ? 40 : 46, borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${on ? s.color : BORDER}`,
                        background: on ? s.color : WHITE,
                        color: on ? WHITE : MUTED,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: mobile ? 15 : 17, fontFamily: FONT_DISPLAY,
                        transition: 'all .15s ease',
                        boxShadow: on ? `0 3px 10px ${s.color}55` : 'none',
                      }}>
                      {s.v}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>Calm</span>
                <span style={{ fontSize: mobile ? 13 : 15, color: ss ? ss.color : MUTED, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
                  {ss ? ss.label : 'Tap to set'}
                </span>
                <span style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>Stormy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feelings */}
        <div style={{ marginTop: 22 }}>
          <span style={{ ...lbl }}>How are you feeling?</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
            {FEELINGS.map(f => {
              const on = (cur.feelings ?? []).includes(f.id)
              return (
                <button key={f.id} onClick={() => toggleFeeling(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, borderRadius: 999, cursor: 'pointer',
                    padding: '6px 12px', fontSize: 13, fontFamily: FONT_BODY,
                    background: on ? NAVY : WHITE, color: on ? WHITE : TEXT,
                    border: `1px solid ${on ? NAVY : BORDER}`, fontWeight: on ? 700 : 500,
                  }}>
                  <FE emoji={f.emoji} size={14} /> {f.id}
                </button>
              )
            })}
          </div>
        </div>

        {/* Energy + rating row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobile ? 18 : 34, marginTop: 22, alignItems: 'flex-start' }}>
          <div>
            <span style={{ ...lbl }}>Energy</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {[1, 2, 3, 4, 5].map(n => {
                const on = energy >= n
                return (
                  <button key={n} onClick={() => setHeader({ energy: energy === n ? 0 : n })} title={`${n}/5`}
                    style={{
                      width: mobile ? 24 : 28, height: mobile ? 24 : 28, borderRadius: 7, cursor: 'pointer',
                      border: `1.5px solid ${on ? PLUM : BORDER}`,
                      background: on ? PLUM : WHITE, transition: 'all .12s ease',
                    }} />
                )
              })}
            </div>
          </div>
          <div>
            <span style={{ ...lbl }}>Day rating</span>
            <div style={{ marginTop: 8 }}>
              <StarRating value={cur.rating ?? 0} onChange={n => setHeader({ rating: n })} size={mobile ? 20 : 22} />
            </div>
          </div>
        </div>

        {/* Weather */}
        <div style={{ marginTop: 22 }}>
          <span style={{ ...lbl }}>Weather</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {WX_CHIPS.map(c => {
              const on = (cur.weather ?? []).includes(c.id)
              return (
                <button key={c.id} onClick={() => toggleWeather(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: on ? 'var(--t-bg)' : WHITE, border: `1px solid ${on ? GOLD : BORDER}`, borderRadius: 999, padding: '5px 11px', cursor: 'pointer', fontSize: 12.5, fontFamily: FONT_BODY, color: on ? NAVY2 : MUTED, fontWeight: on ? 700 : 400 }}>
                  <FE emoji={c.emoji} size={13} /> {c.id}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Today's story ── */}
      <div style={{ background: '#FCFAF4', border: `1px solid ${BORDER}`, borderRadius: 16, padding: mobile ? '20px 18px' : '30px 34px', boxShadow: '0 2px 14px rgba(0,0,0,0.05)', marginTop: 16 }}>
        <div style={{ ...lbl, color: NAVY, marginBottom: 4 }}>Today's story</div>
        {blocks.length === 0 && (
          <div style={{ color: MUTED, fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: mobile ? 17 : 19, lineHeight: 1.7, marginTop: 6 }}>
            Tell the story of today… start writing below, or tap a prompt.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: blocks.length ? 12 : 6 }}>
          {blocks.map(b => b.type === 'photo'
            ? <PhotoBlock key={b.id} url={b.storagePath ? urlMap[b.storagePath] : undefined} onRemove={() => removeBlock(b.id)} />
            : <TextBlock key={b.id} value={b.text ?? ''} mobile={mobile} onChange={t => updateText(b.id, t)} onRemove={() => removeBlock(b.id)} />)}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => addText()} style={addBtn}><Plus size={15} /> Write</button>
          <button onClick={() => fileRef.current?.click()} style={addBtn}><ImageIcon size={15} /> Photo</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); e.target.value = '' }} />
        </div>
        <div data-swipe-ignore style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'thin', padding: '12px 2px 4px' }}>
          {PROMPTS.map(p => (
            <button key={p.label} onClick={() => addText(p.seed, p.field)}
              style={{ flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', gap: 6, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 999, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: NAVY2, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <FE emoji={p.emoji} size={14} /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Your voyage in feelings ── */}
      <MoodChart data={data} current={day} mobile={mobile} onPick={setDay} />
    </div>
  )
}

// ── Voyage mood chart ─────────────────────────────────────────────────────────
function MoodChart({ data, current, mobile, onPick }:
  { data: DailyLog[]; current: number; mobile: boolean; onPick: (i: number) => void }) {
  const logged = data.filter(d => (d.mood ?? 0) > 0)
  const avg = logged.length ? logged.reduce((s, d) => s + (d.mood ?? 0), 0) / logged.length : 0
  const avgSs = avg ? seaState(Math.round(avg)) : null

  // Most common feeling across the voyage
  const tally: Record<string, number> = {}
  data.forEach(d => (d.feelings ?? []).forEach(f => { tally[f] = (tally[f] ?? 0) + 1 }))
  const topFeeling = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topEmoji   = topFeeling ? FEELINGS.find(f => f.id === topFeeling)?.emoji : undefined

  const maxH = mobile ? 92 : 116

  return (
    <div style={{ background: NAVY2, borderRadius: 16, padding: mobile ? '20px 16px' : '26px 30px', marginTop: 16, color: WHITE }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ ...lbl, color: GOLD }}>Your voyage in feelings</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: mobile ? 20 : 24, marginTop: 2 }}>
            The emotional arc of the trip
          </div>
        </div>
        <div style={{ display: 'flex', gap: mobile ? 16 : 26 }}>
          <Stat label="Avg sea-state" value={avgSs ? avgSs.label : '—'} sub={avgSs ? <FE emoji={avgSs.emoji} size={16} /> : undefined} />
          <Stat label="Most felt" value={topFeeling ?? '—'} sub={topEmoji ? <FE emoji={topEmoji} size={16} /> : undefined} />
        </div>
      </div>

      {logged.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontSize: 16, marginTop: 18 }}>
          Set today's sea-state above and your voyage's mood chart will grow here, day by day.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: mobile ? 4 : 7, alignItems: 'flex-end', marginTop: 22, overflowX: 'auto', paddingBottom: 6 }} data-swipe-ignore>
          {data.map((d, i) => {
            const m  = d.mood ?? 0
            const s  = seaState(m)
            const h  = m ? Math.max(10, (m / 5) * maxH) : 6
            const on = i === current
            return (
              <button key={i} onClick={() => onPick(i)} title={s ? `Day ${i + 1} · ${s.label}` : `Day ${i + 1}`}
                style={{ flex: '1 0 auto', minWidth: mobile ? 20 : 26, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: maxH }}>
                  <div style={{
                    width: mobile ? 16 : 22, height: h, borderRadius: 6,
                    background: s ? s.color : 'rgba(255,255,255,0.15)',
                    outline: on ? `2px solid ${GOLD}` : 'none', outlineOffset: 2,
                    transition: 'height .2s ease',
                  }} />
                </div>
                <span style={{ fontSize: 10.5, color: on ? GOLD : 'rgba(255,255,255,0.6)', fontWeight: on ? 800 : 600 }}>
                  {i + 1}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobile ? 8 : 14, marginTop: 16 }}>
        {SEA_STATES.map(s => (
          <span key={s.v} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block' }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div>
      <div style={{ ...lbl, color: 'rgba(255,255,255,0.55)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 17, marginTop: 3 }}>
        {sub}{value}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontFamily: FONT_LABEL, fontWeight: 600, fontSize: 11, letterSpacing: '0.16em',
  textTransform: 'uppercase', color: MUTED, display: 'block',
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
