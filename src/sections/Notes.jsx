import { NAVY, MUTED, BORDER, BP, sty } from '../constants'
import { IC } from '../constants'
import { useW } from '../context'
import { PgHdr, Fld, Inp, TA, SvgIcon } from '../components/ui'

export default function Notes({ data, onChange }) {
  const w     = useW()
  const cs    = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const notes = Array.isArray(data) ? data : []
  const add   = () => onChange([...notes, { title: '', content: '' }])
  const set   = (i, f, v) => { const u = [...notes]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del   = (i) => onChange(notes.filter((_, idx) => idx !== i))

  return (
    <div>
      <PgHdr title="Notes" sub="Your personal notepad — tips, thoughts, anything you want to remember" />

      {notes.length === 0 && (
        <div style={{ ...cs, textAlign: 'center', color: MUTED, padding: '48px 24px', marginBottom: 18 }}>
          <SvgIcon d={IC.calendar} size={32} color={BORDER} />
          <div style={{ marginTop: 12, fontSize: 14 }}>No notes yet — add your first one below.</div>
        </div>
      )}

      {notes.map((note, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>
              {note.title?.trim() || `Note ${i + 1}`}
            </h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>
          <Fld label="Title">
            <Inp value={note.title} onChange={v => set(i, 'title', v)} placeholder="e.g. Tips for next cruise, Port research..." />
          </Fld>
          <TA value={note.content} onChange={v => set(i, 'content', v)}
            placeholder="Write anything here — tips for next time, things to look up, conversations to remember, ideas, places to revisit..."
            rows={8} />
        </div>
      ))}

      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: notes.length > 0 ? 4 : 0 }}>+ Add Note</button>
    </div>
  )
}
