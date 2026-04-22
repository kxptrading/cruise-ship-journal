// ─────────────────────────────────────────────────────────────────────────────
// sections/Notes.jsx — Sticky-note style personal notepad
// ─────────────────────────────────────────────────────────────────────────────

import { MUTED, BORDER, FONT_BODY, BP } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'

// Five pastel sticky-note colour schemes
const NOTE_COLORS = [
  { bg: '#FEF08A', pin: '#CA8A04', line: 'rgba(0,0,0,0.08)' }, // yellow
  { bg: '#BBF7D0', pin: '#16A34A', line: 'rgba(0,0,0,0.07)' }, // mint
  { bg: '#BAE6FD', pin: '#0284C7', line: 'rgba(0,0,0,0.07)' }, // sky
  { bg: '#FBCFE8', pin: '#DB2777', line: 'rgba(0,0,0,0.07)' }, // pink
  { bg: '#FED7AA', pin: '#EA580C', line: 'rgba(0,0,0,0.08)' }, // peach
]

// Slight alternating tilt — adds organic feel without being distracting
const ROTATIONS = ['-1.2deg', '0.8deg', '-0.5deg', '1.1deg', '-0.7deg']

export default function Notes({ data, onChange }) {
  const w     = useW()
  const notes = Array.isArray(data) ? data : []

  const add = () => onChange([...notes, { title: '', content: '' }])
  const set = (i, f, v) => { const u = [...notes]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(notes.filter((_, idx) => idx !== i))

  const cols = w < BP.mobile ? 1 : w < 900 ? 2 : 3

  return (
    <div>
      <PgHdr icon="📝" title="Notes" sub="Your personal notepad — tips, thoughts, anything you want to remember" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 28,
        alignItems: 'start',
        paddingTop: 12,
      }}>
        {notes.map((note, i) => {
          const color = NOTE_COLORS[i % NOTE_COLORS.length]
          const rot   = ROTATIONS[i % ROTATIONS.length]

          return (
            <div
              key={i}
              className="sticky-note"
              style={{
                position: 'relative',
                background: color.bg,
                borderRadius: '2px 2px 2px 2px',
                padding: '36px 18px 28px',
                boxShadow: '3px 6px 16px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08)',
                minHeight: 240,
                display: 'flex',
                flexDirection: 'column',
                transform: `rotate(${rot})`,
              }}
            >
              {/* Push-pin */}
              <div style={{
                position: 'absolute', top: -11, left: '50%',
                transform: 'translateX(-50%)',
                width: 20, height: 20, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, #fff4, transparent 60%), ${color.pin}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                zIndex: 2,
              }} />

              {/* Ruled lines */}
              <div style={{ position: 'absolute', left: 18, right: 18, top: 68, bottom: 36, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Array.from({ length: 7 }).map((_, l) => (
                  <div key={l} style={{ height: 1, background: color.line }} />
                ))}
              </div>

              {/* Delete × */}
              <button
                onClick={() => del(i)}
                style={{
                  position: 'absolute', top: 8, right: 10,
                  background: 'transparent', border: 'none',
                  fontSize: 20, color: 'rgba(0,0,0,0.25)',
                  lineHeight: 1, padding: '0 3px',
                  cursor: 'pointer', fontFamily: FONT_BODY,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,0,0,0.55)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.25)'}
              >×</button>

              {/* Title */}
              <input
                value={note.title || ''}
                onChange={e => set(i, 'title', e.target.value)}
                placeholder="Title…"
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  borderBottom: '2px solid rgba(0,0,0,0.15)',
                  fontWeight: 700, fontSize: 15,
                  width: '100%', marginBottom: 14,
                  color: 'rgba(0,0,0,0.72)',
                  fontFamily: FONT_BODY,
                  paddingBottom: 6,
                }}
              />

              {/* Content */}
              <textarea
                value={note.content || ''}
                onChange={e => set(i, 'content', e.target.value)}
                placeholder="Write anything here…"
                rows={6}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  resize: 'vertical', width: '100%',
                  fontSize: 13, lineHeight: '24px',
                  color: 'rgba(0,0,0,0.62)',
                  fontFamily: FONT_BODY,
                  flex: 1,
                }}
              />

              {/* Folded corner */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 32, height: 32,
                background: `linear-gradient(225deg, rgba(0,0,0,0.14) 50%, ${color.bg} 50%)`,
                borderTopLeftRadius: 2,
              }} />
            </div>
          )
        })}

        {/* Add note card */}
        <div
          onClick={add}
          className="sticky-note-add"
          style={{
            borderRadius: 2,
            padding: '36px 18px 28px',
            minHeight: 240,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${BORDER}`,
            cursor: 'pointer',
            color: MUTED,
            background: 'rgba(255,255,255,0.4)',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 38, opacity: 0.45 }}>📝</div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>Add a note</div>
        </div>
      </div>
    </div>
  )
}
