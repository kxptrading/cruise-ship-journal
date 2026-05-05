// ─────────────────────────────────────────────────────────────────────────────
// sections/Notes.tsx — Sticky-note freeform journal
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, WHITE, BORDER, TEXT, MUTED, BP, sty } from '../constants'
import { useW } from '../context'
import { PgHdr } from '../components/ui'
import type { Note } from '../types'

interface NoteColor {
  bg:   string
  pin:  string
  line: string
}

const NOTE_COLORS: NoteColor[] = [
  { bg: '#FFFDE7', pin: '#F59E0B', line: '#FDE68A' },
  { bg: '#E3F2FD', pin: '#3B82F6', line: '#BFDBFE' },
  { bg: '#F3E8FF', pin: '#8B5CF6', line: '#DDD6FE' },
  { bg: '#ECFDF5', pin: '#10B981', line: '#A7F3D0' },
  { bg: '#FFF1F2', pin: '#F43F5E', line: '#FECDD3' },
  { bg: '#FFF7ED', pin: '#F97316', line: '#FED7AA' },
]

const ROTATIONS = ['-1.2deg', '0.8deg', '-0.5deg', '1.1deg', '-0.7deg', '0.4deg']

interface Props {
  data:     Note[]
  onChange: (updated: Note[]) => void
}

export default function Notes({ data, onChange }: Props) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  const add = () => onChange([...data, { id: crypto.randomUUID(), title: '', content: '' }])
  const set = (i: number, f: keyof Note, v: string) => {
    const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u)
  }
  const del = (i: number) => onChange(data.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr icon="📝" title="Notes" sub="Jot down anything that doesn't fit elsewhere" />

      {data.length === 0 && (
        <div style={{ ...cs, textAlign: 'center', padding: '56px 32px', color: MUTED }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', marginBottom: 8 }}>No notes yet</div>
          <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Jot down anything — tips, memories, quotes, reminders.</div>
          <button onClick={add} style={sty.btn}>+ Add Note</button>
        </div>
      )}

      {data.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: w < BP.mobile ? '1fr' : w < 900 ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: 20, marginBottom: 20,
          }}>
            {data.map((note, i) => {
              const colors = NOTE_COLORS[i % NOTE_COLORS.length]
              const rot    = ROTATIONS[i % ROTATIONS.length]
              return (
                <div key={i} style={{
                  background: colors.bg,
                  borderRadius: 4,
                  padding: '32px 16px 16px',
                  position: 'relative',
                  boxShadow: '2px 3px 10px rgba(0,0,0,0.12)',
                  transform: `rotate(${rot})`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: `1px solid ${colors.line}`,
                }}>
                  {/* Pin */}
                  <div style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: colors.pin,
                    boxShadow: `0 2px 6px ${colors.pin}88`,
                    zIndex: 1,
                  }} />

                  {/* Delete */}
                  <button
                    onClick={() => del(i)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1 }}
                  >×</button>

                  {/* Ruled lines */}
                  <div style={{ position: 'absolute', inset: '48px 0 0', backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${colors.line} 28px)`, pointerEvents: 'none', borderRadius: '0 0 4px 4px' }} />

                  {/* Title */}
                  <input
                    value={note.title}
                    onChange={e => set(i, 'title', e.target.value)}
                    placeholder="Title…"
                    style={{
                      display: 'block', width: '100%', border: 'none', background: 'transparent',
                      fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 8,
                      outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box',
                      position: 'relative', zIndex: 1,
                    }}
                  />

                  {/* Content */}
                  <textarea
                    value={note.content}
                    onChange={e => set(i, 'content', e.target.value)}
                    placeholder="Write your note…"
                    rows={6}
                    style={{
                      display: 'block', width: '100%', border: 'none', background: 'transparent',
                      fontSize: 13, color: TEXT, resize: 'vertical', outline: 'none',
                      fontFamily: 'inherit', lineHeight: '28px',
                      position: 'relative', zIndex: 1, boxSizing: 'border-box',
                    }}
                  />
                </div>
              )
            })}
          </div>

          <button onClick={add} style={{ ...sty.btn, width: '100%' }}>+ Add Note</button>
        </>
      )}
    </div>
  )
}
