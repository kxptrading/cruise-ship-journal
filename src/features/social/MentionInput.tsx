// ─────────────────────────────────────────────────────────────────────────────
// features/social/MentionInput.tsx — textarea with live @-mention autocomplete
//
// A drop-in replacement for a plain <textarea> on the compose surfaces (post
// composer, post editor, comment box). As the user types "@jay…", it shows a
// dropdown of matching accepted contacts; picking one inserts the contact's exact
// display name (so it later resolves in RichText) followed by a space.
//
// Hashtags need nothing here — they're plain text the user types and RichText
// linkifies on render.
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { WHITE, BORDER, TEXT, MUTED, NAVY2, FONT_BODY } from '@/constants'
import { useMentionPeople } from './useMentionPeople'

interface Props {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
  rows?:        number
  style?:       React.CSSProperties
  onKeyDown?:   (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

// Find an active "@token" ending at the caret (letters/digits/space allowed inside,
// but we stop the token at a newline). Returns the query after '@' and its start index.
function activeMention(text: string, caret: number): { query: string; start: number } | null {
  let i = caret - 1
  while (i >= 0) {
    const ch = text[i]
    if (ch === '@') {
      const before = i > 0 ? text[i - 1] : undefined
      if (before && /[\p{L}\p{N}_]/u.test(before)) return null   // part of an email/word
      return { query: text.slice(i + 1, caret), start: i }
    }
    if (ch === '\n' || ch === '@') return null
    i--
  }
  return null
}

const MentionInput = forwardRef<HTMLTextAreaElement, Props>(function MentionInput(
  { value, onChange, placeholder, rows = 4, style, onKeyDown }, ref,
) {
  const people = useMentionPeople()
  const innerRef = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, [])

  const [menu, setMenu] = useState<{ start: number; query: string } | null>(null)
  const [active, setActive] = useState(0)

  const matches = menu
    ? people.filter(p => p.name.toLowerCase().includes(menu.query.toLowerCase())).slice(0, 6)
    : []
  const open = !!menu && matches.length > 0

  const refreshMenu = (text: string, caret: number) => {
    const m = activeMention(text, caret)
    setMenu(m)
    setActive(0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    refreshMenu(e.target.value, e.target.selectionStart ?? e.target.value.length)
  }

  const pick = (name: string) => {
    if (!menu) return
    const el = innerRef.current
    const caret = el?.selectionStart ?? value.length
    const next = value.slice(0, menu.start) + '@' + name + ' ' + value.slice(caret)
    onChange(next)
    setMenu(null)
    // Restore caret just after the inserted mention.
    const pos = menu.start + name.length + 2
    requestAnimationFrame(() => { if (el) { el.focus(); el.setSelectionRange(pos, pos) } })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % matches.length); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => (a - 1 + matches.length) % matches.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[active].name); return }
      if (e.key === 'Escape')    { e.preventDefault(); setMenu(null); return }
    }
    onKeyDown?.(e)
  }

  return (
    <div style={{ position: 'relative', flex: style?.flex, width: style?.width, minWidth: 0 }}>
      <textarea
        ref={innerRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setMenu(null), 120)}
        onSelect={e => refreshMenu(value, (e.target as HTMLTextAreaElement).selectionStart ?? value.length)}
        placeholder={placeholder}
        rows={rows}
        style={style}
      />
      {open && (
        <div style={{
          position: 'absolute', left: 0, top: '100%', zIndex: 200, marginTop: 4,
          minWidth: 200, maxWidth: 300, background: WHITE, border: `1px solid ${BORDER}`,
          borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.14)', overflow: 'hidden',
        }}>
          {matches.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(p.name) }}
              onMouseEnter={() => setActive(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                padding: '9px 13px', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY,
                fontSize: 13.5, color: TEXT, background: idx === active ? '#F4F3EF' : WHITE,
              }}
            >
              <span style={{ color: NAVY2, fontWeight: 700 }}>@</span>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
            </button>
          ))}
          <div style={{ padding: '6px 13px', fontSize: 11, color: MUTED, fontFamily: FONT_BODY, borderTop: `1px solid ${BORDER}` }}>
            Mention a contact
          </div>
        </div>
      )}
    </div>
  )
})

export default MentionInput
