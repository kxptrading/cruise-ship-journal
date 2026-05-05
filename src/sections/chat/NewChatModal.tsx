import { useState } from 'react'
import { NAVY, WHITE, BORDER, TEXT, MUTED, FONT_BODY } from '../../constants'
import { Avatar } from './helpers'

interface Friend {
  userId:    string
  avatarUrl?: string | null
  name:      string
}

interface Props {
  friends:  Friend[]
  onCreate: (selectedIds: string[], groupName: string | null) => void
  onClose:  () => void
  creating: boolean
}

export default function NewChatModal({ friends, onCreate, onClose, creating }: Props) {
  const [selected,  setSelected]  = useState<string[]>([])
  const [groupName, setGroupName] = useState<string>('')

  const toggle   = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const isGroup  = selected.length > 1
  const canStart = selected.length > 0 && (!isGroup || groupName.trim())

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: WHITE, borderRadius: 20, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>New Conversation</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              {selected.length === 0 ? 'Pick a friend to message' : isGroup ? 'Group chat' : 'Direct message'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED, padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Group name input */}
        {isGroup && (
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, background: 'var(--t-bg)' }}>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name…"
              autoFocus
              style={{ width: '100%', border: `1.5px solid ${NAVY}`, borderRadius: 10, padding: '9px 14px', fontSize: 14, fontFamily: FONT_BODY, outline: 'none', color: TEXT, boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Friend list */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {friends.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
              No friends yet.<br />Add some from the Friends page first.
            </div>
          ) : (
            friends.map(f => {
              const checked = selected.includes(f.userId)
              return (
                <div
                  key={f.userId}
                  onClick={() => toggle(f.userId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', background: checked ? 'var(--t-bg)' : 'transparent', transition: 'background 0.12s' }}
                >
                  <Avatar url={f.avatarUrl} name={f.name} size={40} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT }}>{f.name}</div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${checked ? NAVY : BORDER}`, background: checked ? NAVY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                    {checked && <span style={{ color: WHITE, fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY }}>Cancel</button>
          <button
            onClick={() => canStart && onCreate(selected, isGroup ? groupName.trim() : null)}
            disabled={!canStart || creating}
            style={{ background: canStart ? NAVY : BORDER, color: canStart ? WHITE : MUTED, border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: canStart && !creating ? 'pointer' : 'default', fontFamily: FONT_BODY, transition: 'background 0.15s', opacity: creating ? 0.6 : 1 }}
          >{creating ? 'Creating…' : isGroup ? 'Create Group' : 'Start Chat'}</button>
        </div>
      </div>
    </div>
  )
}
