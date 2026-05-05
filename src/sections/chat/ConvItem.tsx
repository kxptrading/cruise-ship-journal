import { NAVY, TEXT, MUTED, WHITE, BORDER } from '../../constants'
import { fmtTime, Avatar, GroupIcon } from './helpers'

interface LastMessage {
  created_at: string
  user_id:    string
  body:       string
}

interface OtherUser {
  avatarUrl?: string | null
}

interface Conversation {
  lastMessage:  LastMessage | null
  unreadCount?: number
  type:         string
  otherUser?:   OtherUser | null
  displayName:  string
}

interface Props {
  conv:    Conversation
  active:  boolean
  onClick: () => void
  userId:  string
}

export default function ConvItem({ conv, active, onClick, userId }: Props) {
  const last   = conv.lastMessage
  const unread = conv.unreadCount || 0

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        background: active ? 'var(--t-bg)' : 'transparent',
        borderLeft: `3px solid ${active ? NAVY : 'transparent'}`,
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      {conv.type === 'group' ? <GroupIcon size={44} /> : (
        <Avatar url={conv.otherUser?.avatarUrl} name={conv.displayName} size={44} fontSize={15} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <div style={{ fontSize: 14, fontWeight: unread > 0 ? 700 : 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conv.displayName}
          </div>
          {last && <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{fmtTime(last.created_at)}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: unread > 0 ? TEXT : MUTED, fontWeight: unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {last
              ? `${last.user_id === userId ? 'You: ' : ''}${last.body}`
              : <span style={{ fontStyle: 'italic' }}>No messages yet</span>}
          </div>
          {unread > 0 && (
            <div style={{ background: NAVY, color: WHITE, borderRadius: 10, minWidth: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0, padding: '0 5px' }}>
              {unread}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
