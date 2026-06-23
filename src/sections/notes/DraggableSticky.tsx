// ─────────────────────────────────────────────────────────────────────────────
// sections/notes/DraggableSticky.tsx — A draggable, editable sticky note
//
// Positioned card with its own Framer Motion values + drag controls (drag only via
// the handle, so editing text doesn't fight the drag). Position is reported back as
// xPct (0–1 fraction of board width) + y (px) so layout stays responsive. Used by
// NotesBoard; generalised from the Daily-Log canvas item.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { TEXT, MUTED, FONT_BODY } from '../../constants'
import { GripVertical, X } from 'lucide-react'

interface Props {
  text:           string
  color:          string
  xPct:           number
  y:              number
  boardW:         number
  constraintsRef: React.RefObject<HTMLDivElement>
  editing:        boolean
  onStartEdit:    () => void
  onEndEdit:      () => void
  onText:         (t: string) => void
  onMove:         (xPct: number, y: number) => void
  onDelete:       () => void
}

export default function DraggableSticky({
  text, color, xPct, y, boardW, constraintsRef, editing,
  onStartEdit, onEndEdit, onText, onMove, onDelete,
}: Props) {
  const x = useMotionValue(xPct * boardW)
  const my = useMotionValue(y)
  const dragControls = useDragControls()

  // Keep position synced if the board resizes or the row moves externally (sync).
  useEffect(() => { x.set(xPct * boardW) }, [xPct, boardW]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { my.set(y) }, [y]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitMove = () => {
    const px = Math.max(0, x.get())
    onMove(boardW ? Math.min(1, px / boardW) : xPct, Math.max(0, my.get()))
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0}
      onDragEnd={commitMove}
      style={{ position: 'absolute', top: 0, left: 0, x, y: my, width: 190 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.05)', borderRadius: '8px 8px 0 0', padding: '2px 4px' }}>
        <span onPointerDown={e => dragControls.start(e)} style={{ cursor: 'grab', color: MUTED, display: 'flex', touchAction: 'none' }} title="Drag">
          <GripVertical size={14} />
        </span>
        <button onClick={onDelete} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', padding: 2 }}>
          <X size={13} />
        </button>
      </div>
      <div style={{ background: color, borderRadius: '0 0 8px 8px', padding: '8px 10px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.14)', minHeight: 84 }}>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={e => onText(e.target.value)}
            onBlur={onEndEdit}
            rows={4}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.5, color: TEXT }}
          />
        ) : (
          <div onClick={onStartEdit} style={{ fontSize: 13, lineHeight: 1.5, color: text ? TEXT : MUTED, whiteSpace: 'pre-wrap', minHeight: 64, cursor: 'text' }}>
            {text || 'Tap to write…'}
          </div>
        )}
      </div>
    </motion.div>
  )
}
