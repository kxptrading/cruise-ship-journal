// ─────────────────────────────────────────────────────────────────────────────
// features/social/richText.tsx — render #hashtags and @mentions as links
//
// Shared across every text surface (feed, post detail, journal cards, comments).
// Parsing is render-time and needs no stored references:
//   • #hashtags  — matched by regex; click → /search seeded with the tag.
//   • @mentions  — matched against a supplied `people` list (the viewer's accepted
//                  contacts); click → opens that contact's profile. Because the
//                  composer's @ autocomplete inserts the exact contact name, these
//                  resolve reliably. An @name that isn't a known contact stays as
//                  plain text.
// Links stopPropagation so they work inside clickable cards (e.g. FeedItem).
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { GOLD } from '@/constants'

export interface Person { id: string; name: string }

type Segment =
  | { type: 'text'; value: string }
  | { type: 'tag'; value: string; tag: string }
  | { type: 'mention'; value: string; person: Person }

const HASHTAG = /^#([\p{L}\p{N}_]+)/u
const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}_]/u.test(ch)

// Left-to-right scan so we never have to regex-escape names or worry about
// overlapping tokens. Mentions are tried longest-name-first.
export function parseRichText(text: string, people: Person[] = []): Segment[] {
  const byLongest = [...people].sort((a, b) => b.name.length - a.name.length)
  const segments: Segment[] = []
  let buffer = ''
  const flush = () => { if (buffer) { segments.push({ type: 'text', value: buffer }); buffer = '' } }

  let i = 0
  while (i < text.length) {
    const ch   = text[i]
    const prev = i > 0 ? text[i - 1] : undefined

    // @mention — only at a boundary (avoids emails like you@host.com)
    if (ch === '@' && !isWordChar(prev)) {
      const rest = text.slice(i + 1)
      const restLower = rest.toLowerCase()
      const match = byLongest.find(p => {
        const n = p.name
        if (!n) return false
        if (!restLower.startsWith(n.toLowerCase())) return false
        return !isWordChar(rest[n.length])   // full-name boundary, not a prefix
      })
      if (match) {
        flush()
        segments.push({ type: 'mention', value: '@' + text.substr(i + 1, match.name.length), person: match })
        i += 1 + match.name.length
        continue
      }
    }

    // #hashtag
    if (ch === '#' && !isWordChar(prev)) {
      const m = text.slice(i).match(HASHTAG)
      if (m) {
        flush()
        segments.push({ type: 'tag', value: m[0], tag: m[1] })
        i += m[0].length
        continue
      }
    }

    buffer += ch
    i++
  }
  flush()
  return segments
}

// Resolve the @mentions in `text` to contact user-ids (deduped). Used at write
// time to fire notifications (parseRichText only links what matches `people`).
export function extractMentions(text: string, people: Person[] = []): string[] {
  const ids = new Set<string>()
  for (const seg of parseRichText(text, people)) {
    if (seg.type === 'mention') ids.add(seg.person.id)
  }
  return [...ids]
}

const linkStyle: React.CSSProperties = { color: GOLD, fontWeight: 600, cursor: 'pointer' }

interface Props {
  text:    string
  people?: Person[]
  style?:  React.CSSProperties   // wrapper style (defaults to preserving line breaks)
}

export default function RichText({ text, people = [], style }: Props) {
  const navigate = useNavigate()
  const segments = parseRichText(text, people)

  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'tag') {
          return (
            <span key={idx} role="link" tabIndex={0} style={linkStyle}
              onClick={e => { e.stopPropagation(); navigate(`/search?q=${encodeURIComponent('#' + seg.tag)}`) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/search?q=${encodeURIComponent('#' + seg.tag)}`) } }}
            >{seg.value}</span>
          )
        }
        if (seg.type === 'mention') {
          return (
            <span key={idx} role="link" tabIndex={0} style={linkStyle}
              onClick={e => { e.stopPropagation(); navigate('/contacts', { state: { viewUserId: seg.person.id } }) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); navigate('/contacts', { state: { viewUserId: seg.person.id } }) } }}
            >{seg.value}</span>
          )
        }
        return <Fragment key={idx}>{seg.value}</Fragment>
      })}
    </span>
  )
}
