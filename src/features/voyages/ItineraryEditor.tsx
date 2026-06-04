// ─────────────────────────────────────────────────────────────────────────────
// sections/Itinerary.tsx — Visual voyage timeline (Phase 6 redesign)
//
// Mobile: vertical timeline (cards + connector line on left)
// Desktop: same vertical layout with wider cards
// Features: drag-to-reorder, inline editing, animated "Add day" form
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAVY2, WHITE, BORDER, TEXT, GOLD, MUTED, TEAL, BP, sty, FONT_DISPLAY, FONT_BODY } from '@/constants'
import { useW } from '@/context'
import { PgHdr } from '@/components/ui'
import FE from '@/components/FE'
import type { ItineraryDay } from '@/types'
import { FADE_UP, STAGGER } from '@/lib/motion'

interface Props {
  data:     ItineraryDay[]
  onChange: (updated: ItineraryDay[]) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date(); today.setHours(0, 0, 0, 0)

function dayStatus(date: string): 'today' | 'past' | 'future' | 'unknown' {
  if (!date) return 'unknown'
  const d = new Date(date + 'T00:00:00')
  if (d.getTime() === today.getTime()) return 'today'
  if (d < today) return 'past'
  return 'future'
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return iso }
}

function isAtSea(port: string): boolean {
  return !port || port.toLowerCase().includes('sea')
}

// ── Dot colour per status ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  today:   GOLD,
  past:    TEAL,
  future:  NAVY2,
  unknown: MUTED,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Itinerary({ data, onChange }: Props) {
  const w = useW()

  const [dragIdx,     setDragIdx]     = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [addingPort,  setAddingPort]  = useState<boolean>(false)
  const [editIdx,     setEditIdx]     = useState<number | null>(null)
  const [newDay,      setNewDay]      = useState<ItineraryDay>({ date: '', port: '', arrive: '', depart: '' })

  const dragItem = useRef<number | null>(null)

  const setDay = (i: number, f: keyof ItineraryDay, v: string) => {
    const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u)
  }

  const del = (i: number) => {
    onChange(data.filter((_, idx) => idx !== i))
    if (editIdx === i) setEditIdx(null)
  }

  const addNewDay = () => {
    onChange([...data, { ...newDay }])
    setNewDay({ date: '', port: '', arrive: '', depart: '' })
    setAddingPort(false)
  }

  // ── Drag-to-reorder ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, i: number) => {
    dragItem.current = i
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(i)
  }
  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    const from = dragItem.current
    if (from === null || from === i) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...data]
    const [item] = next.splice(from, 1)
    next.splice(i, 0, item)
    onChange(next)
    setDragIdx(null)
    setDragOverIdx(null)
    dragItem.current = null
  }
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); dragItem.current = null }

  // ── Render ────────────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div>
        <PgHdr icon="🗺️" title="Itinerary Overview" sub="Add each day of your voyage as you go" />
        <div style={{ ...sty.card, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ marginBottom: 14 }}><FE emoji="⚓" size={48} /></div>
          <div style={{ fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>No days added yet</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Add each port of call and sea day to build your voyage timeline.</div>
          <button onClick={() => setAddingPort(true)} style={{ ...sty.btn, fontSize: 13, padding: '10px 22px' }}>+ Add First Day</button>
        </div>

        <AnimatePresence>
          {addingPort && <AddDayForm day={newDay} onChange={setNewDay} onAdd={addNewDay} onCancel={() => setAddingPort(false)} />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div>
      <PgHdr icon="🗺️" title="Itinerary Overview"
        sub={`${data.length} day${data.length !== 1 ? 's' : ''} planned · drag to reorder`} />

      {/* ── Timeline ── */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        style={{ position: 'relative', paddingLeft: 32 }}
      >
        {/* Connecting line */}
        <div style={{
          position: 'absolute', left: 11, top: 20, bottom: 20,
          width: 2, background: `linear-gradient(to bottom, ${GOLD}40, ${TEAL}40)`,
          borderRadius: 1,
        }} />

        {data.map((day, i) => {
          const status    = dayStatus(day.date)
          const dotColor  = STATUS_COLOR[status]
          const sea       = isAtSea(day.port)
          const isDragged = dragIdx === i
          const isOver    = dragOverIdx === i && dragIdx !== null && dragIdx !== i
          const isEditing = editIdx === i

          return (
            <motion.div
              key={i}
              variants={FADE_UP}
              style={{ marginBottom: 12, position: 'relative' }}
            >
            <div
              draggable
              onDragStart={e => handleDragStart(e as unknown as React.DragEvent, i)}
              onDragOver={e => handleDragOver(e as unknown as React.DragEvent, i)}
              onDrop={e => handleDrop(e as unknown as React.DragEvent, i)}
              onDragEnd={handleDragEnd}
              style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        14,
                opacity:    isDragged ? 0.4 : 1,
                transform:  isOver ? 'translateY(-2px)' : undefined,
                transition: 'opacity 0.15s, transform 0.15s',
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position:   'absolute', left: -32, top: 18,
                display:    'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{
                  width:        status === 'today' ? 16 : 12,
                  height:       status === 'today' ? 16 : 12,
                  borderRadius: '50%',
                  background:   sea ? 'transparent' : dotColor,
                  border:       `2px solid ${sea ? MUTED : dotColor}`,
                  flexShrink:   0,
                  boxShadow:    status === 'today' ? `0 0 0 4px ${GOLD}28` : 'none',
                  transition:   'all 0.2s',
                  marginTop:    status === 'today' ? 1 : 3,
                }} />
              </div>

              {/* Day card */}
              <div style={{
                flex:         1,
                background:   isOver ? `${GOLD}08` : WHITE,
                border:       `1px solid ${isOver ? GOLD : isDragged ? 'var(--t-primary)' : BORDER}`,
                borderRadius: 14,
                overflow:     'hidden',
                boxShadow:    status === 'today' ? `0 2px 12px ${GOLD}28` : '0 1px 4px rgba(0,0,0,0.05)',
                transition:   'border-color 0.15s, box-shadow 0.15s, background 0.15s',
              }}>
                {/* Card header row */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Drag handle */}
                  <div style={{ color: MUTED, cursor: 'grab', fontSize: 14, flexShrink: 0, userSelect: 'none', lineHeight: 1 }} title="Drag to reorder">⠿</div>

                  {/* Day badge */}
                  <div style={{
                    minWidth:   32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: sea ? '#F0F9FF' : dotColor,
                    display:    'flex', alignItems: 'center', justifyContent: 'center',
                    border:     `1.5px solid ${sea ? '#BAE6FD' : dotColor}`,
                  }}>
                    {sea
                      ? <span style={{ fontSize: 14, lineHeight: 1 }}>🌊</span>
                      : <span style={{ fontSize: 11, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{i + 1}</span>
                    }
                  </div>

                  {/* Port name + date */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: w < BP.mobile ? 14 : 16, fontWeight: 400, color: sea ? MUTED : NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sea ? 'At Sea' : (day.port || <span style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: 13 }}>No port set</span>)}
                    </div>
                    {day.date && (
                      <div style={{ fontSize: 11, color: status === 'today' ? GOLD : MUTED, fontWeight: status === 'today' ? 700 : 400, marginTop: 1 }}>
                        {status === 'today' ? '📍 Today · ' : ''}{formatDate(day.date)}
                      </div>
                    )}
                  </div>

                  {/* Time chips */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {day.arrive && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: TEAL, background: `${TEAL}12`, border: `1px solid ${TEAL}30`, borderRadius: 10, padding: '2px 7px', fontFamily: FONT_BODY }}>
                        In {day.arrive}
                      </span>
                    )}
                    {day.depart && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, background: '#F9FAFB', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '2px 7px', fontFamily: FONT_BODY }}>
                        Out {day.depart}
                      </span>
                    )}
                  </div>

                  {/* Edit toggle */}
                  <button
                    onClick={() => setEditIdx(editIdx === i ? null : i)}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: MUTED, fontFamily: FONT_BODY, flexShrink: 0 }}
                  >
                    {isEditing ? 'Done' : 'Edit'}
                  </button>

                  <button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
                </div>

                {/* Inline editor */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '12px 14px', borderTop: `1px solid ${BORDER}`, background: '#FAFAFA', display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: FONT_BODY }}>Date</div>
                          <input type="date" value={day.date || ''} onChange={e => setDay(i, 'date', e.target.value)}
                            style={{ ...sty.inp, fontSize: 12, padding: '6px 9px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: FONT_BODY }}>Port / At Sea</div>
                          <input value={day.port || ''} onChange={e => setDay(i, 'port', e.target.value)} placeholder="Port name or At Sea"
                            style={{ ...sty.inp, fontSize: 12, padding: '6px 9px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: FONT_BODY }}>Arrive</div>
                          <input type="time" value={day.arrive || ''} onChange={e => setDay(i, 'arrive', e.target.value)}
                            style={{ ...sty.inp, fontSize: 12, padding: '6px 9px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: FONT_BODY }}>Depart</div>
                          <input type="time" value={day.depart || ''} onChange={e => setDay(i, 'depart', e.target.value)}
                            style={{ ...sty.inp, fontSize: 12, padding: '6px 9px' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            </motion.div>
          )
        })}

        {/* Add day inline form */}
        <AnimatePresence>
          {addingPort && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ overflow: 'hidden', marginBottom: 12 }}
            >
              <AddDayForm day={newDay} onChange={setNewDay} onAdd={addNewDay} onCancel={() => setAddingPort(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add day button */}
        {!addingPort && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ paddingLeft: 0, marginTop: 4 }}
          >
            <button
              onClick={() => setAddingPort(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: WHITE, border: `1.5px dashed ${BORDER}`,
                borderRadius: 14, padding: '12px 18px', cursor: 'pointer',
                fontSize: 13, color: MUTED, fontFamily: FONT_BODY,
                width: '100%', transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--t-primary)'; e.currentTarget.style.color = 'var(--t-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED }}
            >
              <FE emoji="+" size={16} /> Add Day {data.length + 1}
            </button>
          </motion.div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { color: TEAL, label: 'Visited' },
            { color: GOLD, label: 'Today'   },
            { color: NAVY2, label: 'Upcoming' },
            { color: MUTED, label: 'At Sea'   },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_BODY }}>{l.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ── Inline add-day form ────────────────────────────────────────────────────────

function AddDayForm({
  day, onChange, onAdd, onCancel,
}: {
  day: ItineraryDay
  onChange: (d: ItineraryDay) => void
  onAdd: () => void
  onCancel: () => void
}) {
  const w = useW()
  return (
    <div style={{ background: WHITE, border: `1.5px solid var(--t-primary)`, borderRadius: 14, padding: '16px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginLeft: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontFamily: FONT_BODY }}>
        New Day
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {([
          ['Date', 'date', 'date'],
          ['Port / At Sea', 'port', 'text'],
          ['Arrive', 'arrive', 'time'],
          ['Depart', 'depart', 'time'],
        ] as [string, keyof ItineraryDay, string][]).map(([lbl, key, type]) => (
          <div key={key}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: FONT_BODY }}>{lbl}</div>
            <input
              type={type}
              value={day[key] || ''}
              onChange={e => onChange({ ...day, [key]: e.target.value })}
              placeholder={key === 'port' ? 'e.g. Barcelona' : undefined}
              style={{ ...sty.inp, fontSize: 12, padding: '7px 10px' }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.96 }}
          style={{ ...sty.btn, fontSize: 12, padding: '7px 18px' }}
        >
          Add Day
        </motion.button>
        <button onClick={onCancel}
          style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, color: MUTED }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
