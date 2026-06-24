// ─────────────────────────────────────────────────────────────────────────────
// sections/notes/DraggableSticky.tsx — A draggable pinned sticky note
//
// Looks like a real sticky note (paper, push-pin, slight tilt) and is movable on the
// board. One unified note: it always has editable text and can OPTIONALLY hold a
// photo (add a photo + a description to journal later). Its own Framer Motion values
// + drag controls mean dragging happens via the pin while the body stays editable.
// Position is reported back as xPct (0–1 fraction of board width) + y (px).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { TEXT, MUTED, WHITE, FONT_BODY } from '../../constants'
import { X, Image as ImageIcon } from 'lucide-react'

interface Props {
  text:           string
  color:          string
  rotation:       number
  xPct:           number
  y:              number
  boardW:         number
  constraintsRef: React.RefObject<HTMLDivElement>
  editing:        boolean
  photoUrl?:      string   // undefined = no photo; '' = uploading/resolving; url = ready
  onStartEdit:    () => void
  onEndEdit:      () => void
  onText:         (t: string) => void
  onMove:         (xPct: number, y: number) => void
  onAttachPhoto:  () => void
  onDelete:       () => void
}

const PIN = '#C0392B' // push-pin red

export default function DraggableSticky({
  text, color, rotation, xPct, y, boardW, constraintsRef, editing, photoUrl,
  onStartEdit, onEndEdit, onText, onMove, onAttachPhoto, onDelete,
}: Props) {
  const x = useMotionValue(xPct * boardW)
  const my = useMotionValue(y)
  const dragControls = useDragControls()

  useEffect(() => { x.set(xPct * boardW) }, [xPct, boardW]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { my.set(y) }, [y]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitMove = () => {
    const px = Math.max(0, x.get())
    onMove(boardW ? Math.min(1, px / boardW) : xPct, Math.max(0, my.get()))
  }

  const hasPhoto = photoUrl !== undefined

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={constraintsRef}
      dragElastic={0}
      whileDrag={{ scale: 1.03, zIndex: 5 }}
      onDragEnd={commitMove}
      style={{ position: 'absolute', top: 0, left: 0, x, y: my, width: 188, rotate: rotation, paddingTop: 12 }}
    >
      {/* Push-pin — also the drag handle */}
      <div
        onPointerDown={e => dragControls.start(e)}
        title="Drag"
        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: PIN, boxShadow: '0 2px 4px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.5)', cursor: 'grab', zIndex: 2, touchAction: 'none' }}
      />
      {/* Delete */}
      <button onClick={onDelete} title="Remove"
        style={{ position: 'absolute', top: 10, right: 4, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        <X size={12} />
      </button>

      <div style={{ background: color, padding: hasPhoto ? '12px 10px 10px' : '14px 12px 10px', boxShadow: '0 6px 16px rgba(0,0,0,0.16)', minHeight: hasPhoto ? undefined : 96 }}>
        {/* Optional photo */}
        {hasPhoto && (
          <div style={{ background: WHITE, padding: 4, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: '100%', height: 138, objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: 138, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, background: '#0001' }}><ImageIcon size={22} /></div>}
          </div>
        )}

        {/* Text — caption/description when there's a photo, otherwise the note body */}
        {editing ? (
          <textarea value={text} autoFocus onChange={e => onText(e.target.value)} onBlur={onEndEdit} rows={hasPhoto ? 2 : 4}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.5, color: TEXT }} />
        ) : (
          <div onClick={onStartEdit} style={{ fontSize: 13.5, lineHeight: 1.5, color: text ? TEXT : MUTED, whiteSpace: 'pre-wrap', minHeight: hasPhoto ? 18 : 72, cursor: 'text' }}>
            {text || (hasPhoto ? 'Add a description…' : 'Tap to write…')}
          </div>
        )}

        {/* Attach a photo (only when none yet) */}
        {!hasPhoto && (
          <button onClick={onAttachPhoto} title="Add a photo"
            style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, fontFamily: FONT_BODY, color: MUTED }}>
            <ImageIcon size={13} /> Add photo
          </button>
        )}
      </div>
    </motion.div>
  )
}
