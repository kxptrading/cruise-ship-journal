// ─────────────────────────────────────────────────────────────────────────────
// sections/notes/NotesBoard.tsx — Voyage-wide draggable sticky-note board
//
// Each sticky is a `notes` row carrying its board position (xPct/y) + colour, so
// dragging just updates a row — and it rides the existing per-row notes sync, which
// is co-author-safe (concurrent stickies from different people don't clobber).
// A sticky can be a text note OR a photo + caption (a "journal this later" prompt):
// photos are storage-only (uploadVoyageImage), referenced by note.photoPath, never
// in the photos table so they don't leak into the Daily-Log gallery / export.
// Persists offline-first via onChange → update('notes').
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { WHITE, BORDER, NAVY2, MUTED, FONT_BODY, BP } from '../../constants'
import { useW, useVoyageId, useUserId } from '../../context'
import { PgHdr } from '../../components/ui'
import FE from '../../components/FE'
import { Plus } from 'lucide-react'
import { uploadVoyageImage, boardPhotoUrl, removeImage } from '../../lib/photoStorage'
import DraggableSticky from './DraggableSticky'
import type { Note } from '../../types'

interface Props {
  data:     Note[]
  onChange: (updated: Note[]) => void
}

// Sticky-paper colours (cream/gold-leaning palette).
const COLORS = ['#FFF7D6', '#FDE9E4', '#E4F0FD', '#E8F5E9', '#F3E9FD', '#FFF1E6']

// Stable gentle tilt derived from the note id (no DB column needed).
const rotationFor = (id: string) => ((id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 7) - 3

export default function NotesBoard({ data, onChange }: Props) {
  const w        = useW()
  const mobile   = w < BP.mobile
  const voyageId = useVoyageId()
  const userId   = useUserId()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})
  const boardRef = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const attachTargetId = useRef<string | null>(null)  // note awaiting a photo attach
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

  // Resolve signed URLs for any photo stickies not already cached.
  useEffect(() => {
    const missing = data.filter(n => n.photoPath && !(n.photoPath in urlMap))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(missing.map(async n => [n.photoPath!, await boardPhotoUrl(n.photoPath!)] as const))
      .then(pairs => { if (!cancelled) setUrlMap(m => ({ ...m, ...Object.fromEntries(pairs) })) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [data, urlMap])

  const update = (id: string, patch: Partial<Note>) =>
    onChange(data.map(n => (n.id === id ? { ...n, ...patch } : n)))

  const cascade = (n: number) => ({ xPct: (mobile ? 0.06 : 0.10) + (n % 3) * 0.05, y: 20 + (n % 6) * 28 })

  const addNote = () => {
    const { xPct, y } = cascade(data.length)
    const note: Note = { id: crypto.randomUUID(), title: '', content: '', xPct, y, color: COLORS[data.length % COLORS.length] }
    onChange([...data, note])
    setEditingId(note.id)
  }

  // Attach a photo to an existing note: remember which note, then open the picker.
  const requestAttach = (noteId: string) => { attachTargetId.current = noteId; fileRef.current?.click() }

  const handleFile = async (file: File) => {
    const noteId = attachTargetId.current
    attachTargetId.current = null
    if (!noteId || !voyageId || !userId) return
    try {
      const { path, url } = await uploadVoyageImage(file, { voyageId, userId })
      setUrlMap(m => ({ ...m, [path]: url }))
      update(noteId, { photoPath: path })
    } catch { /* upload failure is non-fatal; user can retry */ }
  }

  const deleteNote = (note: Note) => {
    if (note.photoPath) removeImage(note.photoPath)  // best-effort storage cleanup
    onChange(data.filter(n => n.id !== note.id))
  }

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <PgHdr icon="📌" title="Notes" sub="Pin notes & photos — tips, reminders, things to journal later. Drag to arrange." />
        <button onClick={addNote}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: NAVY2, color: WHITE, border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY }}>
          <Plus size={15} /> Add note
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
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
            Pin a note or a photo, then drag it anywhere on the board.
          </div>
        )}
        {boardW > 0 && data.map((note, i) => (
          <DraggableSticky
            key={note.id}
            text={note.content}
            color={note.color || COLORS[i % COLORS.length]}
            rotation={rotationFor(note.id)}
            xPct={note.xPct ?? cascade(i).xPct}
            y={note.y ?? cascade(i).y}
            boardW={boardW}
            constraintsRef={boardRef}
            editing={editingId === note.id}
            photoUrl={note.photoPath ? (urlMap[note.photoPath] ?? '') : undefined}
            onStartEdit={() => setEditingId(note.id)}
            onEndEdit={() => setEditingId(null)}
            onText={t => update(note.id, { content: t })}
            onMove={(xPct, y) => update(note.id, { xPct, y })}
            onAttachPhoto={() => requestAttach(note.id)}
            onDelete={() => deleteNote(note)}
          />
        ))}
      </div>
    </div>
  )
}
