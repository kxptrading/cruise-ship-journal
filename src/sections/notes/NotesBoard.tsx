// ─────────────────────────────────────────────────────────────────────────────
// sections/notes/NotesBoard.tsx — Voyage-wide draggable sticky-note board
//
// Each sticky is a `notes` row carrying its board position (xPct/y) + colour, so
// dragging just updates a row — and it rides the existing per-row notes sync, which
// is co-author-safe (concurrent stickies from different people don't clobber).
// Text-only for v1. Persists offline-first via onChange → update('notes').
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { WHITE, BORDER, NAVY2, MUTED, FONT_BODY, BP } from '../../constants'
import { useW } from '../../context'
import { PgHdr } from '../../components/ui'
import FE from '../../components/FE'
import { Plus } from 'lucide-react'
import DraggableSticky from './DraggableSticky'
import type { Note } from '../../types'

interface Props {
  data:     Note[]
  onChange: (updated: Note[]) => void
}

// Sticky-paper colours (cream/gold-leaning palette).
const COLORS = ['#FFF7D6', '#FDE9E4', '#E4F0FD', '#E8F5E9', '#F3E9FD', '#FFF1E6']

export default function NotesBoard({ data, onChange }: Props) {
  const w      = useW()
  const mobile = w < BP.mobile

  const [editingId, setEditingId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardW, setBoardW] = useState(0)
  const [boardH, setBoardH] = useState(480)

  // Size the board to fill the viewport on whatever device loads it.
  useLayoutEffect(() => {
    const measure = () => {
      const el = boardRef.current
      if (!el) return
      setBoardW(el.clientWidth)
      const top = el.getBoundingClientRect().top
      setBoardH(Math.max(360, Math.round(window.innerHeight - top - (mobile ? 150 : 110))))
    }
    measure()
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [w, mobile])

  const update = (id: string, patch: Partial<Note>) =>
    onChange(data.map(n => (n.id === id ? { ...n, ...patch } : n)))

  const addNote = () => {
    const n = data.length
    const note: Note = {
      id: crypto.randomUUID(), title: '', content: '',
      xPct: (mobile ? 0.06 : 0.10) + (n % 3) * 0.05,
      y: 20 + (n % 6) * 28,
      color: COLORS[n % COLORS.length],
    }
    onChange([...data, note])
    setEditingId(note.id)
  }

  const deleteNote = (id: string) => onChange(data.filter(n => n.id !== id))

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <PgHdr icon="📌" title="Notes" sub="Pin anything — tips, reminders, quotes. Drag to arrange." />
        <button onClick={addNote}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: NAVY2, color: WHITE, border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY }}>
          <Plus size={15} /> Add note
        </button>
      </div>

      <div
        ref={boardRef}
        style={{
          position: 'relative', height: boardH, marginTop: 12, borderRadius: 16,
          border: `1px dashed ${BORDER}`, background: 'var(--t-bg, #F9F7F3)',
          overflow: 'hidden', touchAction: 'pan-y',
        }}
      >
        {data.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 14, gap: 6, pointerEvents: 'none', textAlign: 'center', padding: 20 }}>
            <FE emoji="📌" size={28} />
            Add a note, then drag it anywhere on the board.
          </div>
        )}
        {boardW > 0 && data.map((note, i) => (
          <DraggableSticky
            key={note.id}
            text={note.content}
            color={note.color || COLORS[i % COLORS.length]}
            xPct={note.xPct ?? ((mobile ? 0.06 : 0.10) + (i % 3) * 0.05)}
            y={note.y ?? (20 + (i % 6) * 28)}
            boardW={boardW}
            constraintsRef={boardRef}
            editing={editingId === note.id}
            onStartEdit={() => setEditingId(note.id)}
            onEndEdit={() => setEditingId(null)}
            onText={t => update(note.id, { content: t })}
            onMove={(xPct, y) => update(note.id, { xPct, y })}
            onDelete={() => deleteNote(note.id)}
          />
        ))}
      </div>
    </div>
  )
}
