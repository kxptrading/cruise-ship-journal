// ─────────────────────────────────────────────────────────────────────────────
// chat/ConversationList.tsx — Left-panel conversation list
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, WHITE, BORDER, TEXT, MUTED, FONT_BODY } from '../../constants'
import ConvItem from './ConvItem'
import type { Conversation } from './types'
import FE from '../../components/FE'

interface Props {
  conversations: Conversation[]
  activeConvId:  string | null
  loading:       boolean
  userId:        string
  isMobile:      boolean
  onSelect:      (id: string) => void
  onNewChat:     () => void
}

export default function ConversationList({ conversations, activeConvId, loading, userId, isMobile, onSelect, onNewChat }: Props) {
  return (
    <div style={{ width: isMobile ? '100%' : 320, flexShrink: 0, borderRight: isMobile ? 'none' : `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FE emoji="🔍" size={14} />
          <span style={{ fontSize: 13, color: MUTED }}>Search conversations…</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: MUTED, fontSize: 13 }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 12 }}><FE emoji="💬" size={44} /></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginBottom: 20 }}>Start a conversation with a friend or create a group chat.</div>
            <button onClick={onNewChat} style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY }}>
              Start chatting
            </button>
          </div>
        ) : (
          conversations.map(conv => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={conv.id === activeConvId}
              userId={userId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
