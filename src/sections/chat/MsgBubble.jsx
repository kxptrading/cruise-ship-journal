import { NAVY, WHITE, BORDER, TEXT, MUTED } from '../../constants'
import { fmtFull, Avatar } from './helpers'

export default function MsgBubble({ msg, isOwn, showAuthor, authorName, authorAvatar }) {
  return (
    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 7, marginBottom: 3 }}>
      {!isOwn && <Avatar url={authorAvatar} name={authorName} size={28} fontSize={10} />}

      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {showAuthor && (
          <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 3, paddingLeft: 4 }}>
            {authorName}
          </div>
        )}
        <div style={{
          background: isOwn ? NAVY : WHITE,
          color: isOwn ? WHITE : TEXT,
          border: isOwn ? 'none' : `1px solid ${BORDER}`,
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '9px 14px', fontSize: 14, lineHeight: 1.5,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {msg.body}
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3, paddingLeft: 2, paddingRight: 2 }}>
          {fmtFull(msg.created_at)}
        </div>
      </div>
    </div>
  )
}
