// ─────────────────────────────────────────────────────────────────────────────
// chat/MessageThread.tsx — Right-panel message thread (header + feed + input)
// ─────────────────────────────────────────────────────────────────────────────

import type { RefObject } from 'react'
import { NAVY, WHITE, BORDER, TEXT, MUTED, FONT_BODY } from '../../constants'
import MsgBubble from './MsgBubble'
import { Avatar, GroupIcon, fmtDateLabel } from './helpers'
import type { Conversation, Message, MemberProfile } from './types'

// ── Date-separator helpers ────────────────────────────────────────────────────

type DateSep = { type: 'date'; label: string; key: string }
type MsgRow  = { type: 'msg';  data: Message }
type FeedRow = DateSep | MsgRow

function withDateSeparators(msgs: Message[]): FeedRow[] {
  const out: FeedRow[] = []
  let lastDate: string | null = null
  msgs.forEach((m, idx) => {
    const d = new Date(m.created_at).toDateString()
    if (d !== lastDate) {
      out.push({ type: 'date', label: fmtDateLabel(m.created_at), key: `d-${idx}` })
      lastDate = d
    }
    out.push({ type: 'msg', data: m })
  })
  return out
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  activeConv:     Conversation | null
  messages:       Message[]
  memberProfiles: Record<string, MemberProfile>
  msgLoading:     boolean
  newMsg:         string
  sending:        boolean
  userId:         string
  isMobile:       boolean
  messagesEndRef: RefObject<HTMLDivElement>
  inputRef:       RefObject<HTMLTextAreaElement>
  onChange:       (msg: string) => void
  onSend:         () => void
  onBack:         () => void
}

export default function MessageThread({ activeConv, messages, memberProfiles, msgLoading, newMsg, sending, userId, isMobile, messagesEndRef, inputRef, onChange, onSend, onBack }: Props) {
  if (!activeConv) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>⛵</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Select a conversation</div>
        <div style={{ fontSize: 13, color: MUTED }}>Choose one on the left or start a new chat.</div>
      </div>
    )
  }

  return (
    <>
      {/* Thread header */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'linear-gradient(to right, var(--t-bg), white)' }}>
        {isMobile && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: NAVY, padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
        )}
        {activeConv.type === 'group'
          ? <GroupIcon size={40} />
          : <Avatar url={activeConv.otherUser?.avatarUrl} name={activeConv.displayName} size={40} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{activeConv.displayName}</div>
          {activeConv.type === 'group' && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{activeConv.members.length} members</div>
          )}
        </div>
      </div>

      {/* Message feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {msgLoading ? (
          <div style={{ textAlign: 'center', color: MUTED, fontSize: 13, marginTop: 48 }}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUTED, marginTop: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 14 }}>Say hello to {activeConv.displayName}!</div>
          </div>
        ) : (
          withDateSeparators(messages).map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={item.key} style={{ textAlign: 'center', margin: '12px 0 8px', fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.05em' }}>
                  — {item.label} —
                </div>
              )
            }
            const m          = item.data
            const isOwn      = m.user_id === userId
            const author     = memberProfiles[m.user_id] || { name: 'Unknown', avatarUrl: '' }
            const prevMsg    = messages[messages.findIndex(x => x.id === m.id) - 1]
            const showAuthor = !isOwn && activeConv.type === 'group' && (!prevMsg || prevMsg.user_id !== m.user_id)
            return (
              <MsgBubble key={m.id} msg={m} isOwn={isOwn} showAuthor={showAuthor} authorName={author.name} authorAvatar={author.avatarUrl} />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#FAFAFA', flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={newMsg}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={`Message ${activeConv.displayName}…`}
          rows={1}
          style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 16px', fontSize: 14, fontFamily: FONT_BODY, resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, background: WHITE, transition: 'border-color 0.15s' }}
          onFocus={e => { e.target.style.borderColor = NAVY }}
          onBlur={e => { e.target.style.borderColor = BORDER }}
        />
        <button
          onClick={onSend}
          disabled={!newMsg.trim() || sending}
          style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: newMsg.trim() ? NAVY : BORDER, color: newMsg.trim() ? WHITE : MUTED, border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
        >↑</button>
      </div>
    </>
  )
}
