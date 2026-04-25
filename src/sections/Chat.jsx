// ─────────────────────────────────────────────────────────────────────────────
// sections/Chat.jsx — WhatsApp-style messaging
//
// Layout:
//   Desktop — two-panel: conversation list (320px) | message thread (flex 1)
//   Mobile  — single panel: list → tap to open thread → back to return
//
// Features:
//   • Direct messages (1-to-1) and group chats
//   • Real-time new messages via Supabase postgres_changes subscription
//   • Unread badge per conversation
//   • Date separators in message thread
//   • Author labels for group chats
//   • Optimistic UI — message appears instantly, replaced by server id
//   • New conversation modal — pick friends for DM or group
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { NAVY, NAVY2, WHITE, BORDER, TEXT, MUTED, GOLD, FONT_BODY, FONT_DISPLAY } from '../constants'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(ts) {
  if (!ts) return ''
  const d   = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return 'Yesterday'
  if (diff < 604800000) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtFull(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateLabel(ts) {
  const d   = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getInitials(name) {
  const words = (name || '?').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return (words[0] || '?').slice(0, 2).toUpperCase()
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 36, fontSize = 13 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: NAVY2, flexShrink: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY }}>{getInitials(name)}</span>
      }
    </div>
  )
}

function GroupIcon({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${GOLD}, #F97316)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.45),
    }}>👥</div>
  )
}

// ── Conversation list item ─────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick, userId }) {
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
          <div style={{
            fontSize: 14, fontWeight: unread > 0 ? 700 : 600,
            color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{conv.displayName}</div>
          {last && <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{fmtTime(last.created_at)}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontSize: 13, color: unread > 0 ? TEXT : MUTED,
            fontWeight: unread > 0 ? 600 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {last
              ? `${last.user_id === userId ? 'You: ' : ''}${last.body}`
              : <span style={{ fontStyle: 'italic' }}>No messages yet</span>}
          </div>
          {unread > 0 && (
            <div style={{
              background: NAVY, color: WHITE, borderRadius: 10,
              minWidth: 20, height: 20, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 8, flexShrink: 0, padding: '0 5px',
            }}>{unread}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MsgBubble({ msg, isOwn, showAuthor, authorName, authorAvatar }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 7, marginBottom: 3,
    }}>
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

// ── New Chat Modal ─────────────────────────────────────────────────────────────
function NewChatModal({ friends, onCreate, onClose, creating }) {
  const [selected,   setSelected]   = useState([])
  const [groupName,  setGroupName]  = useState('')

  const toggle = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const isGroup  = selected.length > 1
  const canStart = selected.length > 0 && (!isGroup || groupName.trim())

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
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

        {/* Group name input — appears when 2+ friends selected */}
        {isGroup && (
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, background: 'var(--t-bg)' }}>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name…"
              autoFocus
              style={{
                width: '100%', border: `1.5px solid ${NAVY}`, borderRadius: 10,
                padding: '9px 14px', fontSize: 14, fontFamily: FONT_BODY,
                outline: 'none', color: TEXT, boxSizing: 'border-box',
              }}
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 20px', cursor: 'pointer',
                    background: checked ? 'var(--t-bg)' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                >
                  <Avatar url={f.avatarUrl} name={f.name} size={40} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: TEXT }}>{f.name}</div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${checked ? NAVY : BORDER}`,
                    background: checked ? NAVY : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
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
            style={{
              background: canStart ? NAVY : BORDER,
              color: canStart ? WHITE : MUTED,
              border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13,
              fontWeight: 700, cursor: canStart && !creating ? 'pointer' : 'default',
              fontFamily: FONT_BODY, transition: 'background 0.15s',
              opacity: creating ? 0.6 : 1,
            }}
          >{creating ? 'Creating…' : isGroup ? 'Create Group' : 'Start Chat'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Chat component ────────────────────────────────────────────────────────
export default function Chat() {
  const userId = useUserId()
  const w      = useW()
  const isMobile = w < 768

  const [conversations,  setConversations]  = useState([])
  const [activeConvId,   setActiveConvId]   = useState(null)
  const [messages,       setMessages]       = useState([])
  const [memberProfiles, setMemberProfiles] = useState({}) // { userId: { name, avatarUrl } }
  const [loading,        setLoading]        = useState(true)
  const [msgLoading,     setMsgLoading]     = useState(false)
  const [newMsg,         setNewMsg]         = useState('')
  const [sending,        setSending]        = useState(false)
  const [showNewChat,    setShowNewChat]     = useState(false)
  const [friends,        setFriends]        = useState([])
  const [creating,       setCreating]       = useState(false)

  const channelRef     = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Load accepted friends (for new chat modal) ────────────────────────────
  useEffect(() => {
    if (!userId) return
    async function load() {
      const { data: reqs } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!reqs?.length) return
      const ids = reqs.map(r => r.from_user_id === userId ? r.to_user_id : r.from_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', ids)

      setFriends((profiles || []).map(p => ({
        userId:    p.user_id,
        name:      p.display_name || 'Cruiser',
        avatarUrl: p.avatar_url   || '',
      })))
    }
    load()
  }, [userId])

  // ── Load conversations ────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    // 1. My memberships
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    if (!memberships?.length) { setLoading(false); return }

    const convIds    = memberships.map(m => m.conversation_id)
    const lastReadMap = Object.fromEntries(memberships.map(m => [m.conversation_id, m.last_read_at]))

    // 2. Conversation details + all members + recent messages in parallel
    const [{ data: convs }, { data: allMembers }, { data: recentMsgs }] = await Promise.all([
      supabase.from('conversations').select('id, type, name, created_at').in('id', convIds),
      supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds),
      supabase.from('messages').select('id, conversation_id, user_id, body, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(300),
    ])

    // 3. Profiles for every member
    const memberUserIds = [...new Set((allMembers || []).map(m => m.user_id))]
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, avatar_url').in('user_id', memberUserIds)

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, {
      name:      p.display_name || 'Cruiser',
      avatarUrl: p.avatar_url   || '',
    }]))
    setMemberProfiles(profileMap)

    // 4. Last message per conversation
    const lastMsgMap = {}
    ;(recentMsgs || []).forEach(m => { if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m })

    // 5. Unread counts — messages after my last_read_at that aren't mine
    const unreadMap = {}
    ;(recentMsgs || []).forEach(m => {
      if (m.user_id === userId) return
      const lr = lastReadMap[m.conversation_id]
      if (!lr || new Date(m.created_at) > new Date(lr))
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1
    })

    // 6. Members grouped by conversation
    const membersByConv = {}
    ;(allMembers || []).forEach(m => {
      if (!membersByConv[m.conversation_id]) membersByConv[m.conversation_id] = []
      membersByConv[m.conversation_id].push(m.user_id)
    })

    // 7. Enrich + sort newest-first
    const enriched = (convs || []).map(conv => {
      const members       = membersByConv[conv.id] || []
      const otherIds      = members.filter(id => id !== userId)
      const otherUser     = conv.type === 'direct' && otherIds.length === 1 ? profileMap[otherIds[0]] : null
      const displayName   = conv.type === 'group'
        ? (conv.name || 'Group Chat')
        : (otherUser?.name || 'Unknown')

      return {
        ...conv, displayName, otherUser,
        members, otherMemberIds: otherIds,
        lastMessage:  lastMsgMap[conv.id]  || null,
        unreadCount:  unreadMap[conv.id]   || 0,
      }
    }).sort((a, b) => {
      const ta = a.lastMessage?.created_at || a.created_at
      const tb = b.lastMessage?.created_at || b.created_at
      return new Date(tb) - new Date(ta)
    })

    setConversations(enriched)
    setLoading(false)
  }, [userId])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ── Open a conversation — load messages + subscribe ───────────────────────
  useEffect(() => {
    if (!activeConvId) return

    // Tear down previous subscription
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }

    setMsgLoading(true)
    setMessages([])

    // Load history
    supabase.from('messages')
      .select('id, user_id, body, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || [])
        setMsgLoading(false)
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 60)
      })

    // Mark as read
    supabase.from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', activeConvId)
      .eq('user_id', userId)
      .then()

    // Clear unread badge
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c))

    // Real-time subscription
    const ch = supabase
      .channel(`chat:${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, ({ new: msg }) => {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        setConversations(prev => prev.map(c =>
          c.id === activeConvId ? { ...c, lastMessage: msg } : c
        ))
      })
      .subscribe()

    channelRef.current = ch
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [activeConvId, userId])

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMsg.trim() || sending || !activeConvId) return
    const body  = newMsg.trim()
    const tempId = `temp-${Date.now()}`
    const tempMsg = { id: tempId, user_id: userId, body, created_at: new Date().toISOString() }

    setNewMsg('')
    setSending(true)

    // Optimistic
    setMessages(prev => [...prev, tempMsg])
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, lastMessage: tempMsg } : c))

    const { data } = await supabase.from('messages')
      .insert({ conversation_id: activeConvId, user_id: userId, body })
      .select('id, user_id, body, created_at').single()

    if (data) setMessages(prev => prev.map(m => m.id === tempId ? data : m))
    setSending(false)
    inputRef.current?.focus()
  }

  // ── Create a new conversation ─────────────────────────────────────────────
  const handleCreate = async (selectedIds, groupName) => {
    setCreating(true)
    const type = selectedIds.length > 1 ? 'group' : 'direct'

    // Reuse existing DM if one already exists
    if (type === 'direct') {
      const existing = conversations.find(c =>
        c.type === 'direct' && c.otherMemberIds.includes(selectedIds[0])
      )
      if (existing) {
        setActiveConvId(existing.id)
        setShowNewChat(false)
        setCreating(false)
        return
      }
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({ type, name: groupName || null, created_by: userId })
      .select('id, type, name, created_at').single()

    if (!conv) { setCreating(false); return }

    await supabase.from('conversation_members').insert(
      [userId, ...selectedIds].map(uid => ({ conversation_id: conv.id, user_id: uid }))
    )

    // Enrich and prepend to list
    const otherUser = type === 'direct' ? friends.find(f => f.userId === selectedIds[0]) : null
    const newConv = {
      ...conv,
      displayName:    type === 'group' ? (groupName || 'Group Chat') : (otherUser?.name || 'Cruiser'),
      otherUser:      otherUser ? { name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
      members:        [userId, ...selectedIds],
      otherMemberIds: selectedIds,
      lastMessage:    null,
      unreadCount:    0,
    }

    setConversations(prev => [newConv, ...prev])
    setActiveConvId(conv.id)
    setShowNewChat(false)
    setCreating(false)
  }

  // ── Group messages by date for date separators ────────────────────────────
  function withDateSeparators(msgs) {
    const out = []; let lastDate = null
    msgs.forEach((m, idx) => {
      const d = new Date(m.created_at).toDateString()
      if (d !== lastDate) { out.push({ type: 'date', label: fmtDateLabel(m.created_at), key: `d-${idx}` }); lastDate = d }
      out.push({ type: 'msg', data: m })
    })
    return out
  }

  // ── Panels ────────────────────────────────────────────────────────────────
  const showList   = !isMobile || !activeConvId
  const showThread = !isMobile ||  activeConvId

  return (
    <div style={{ fontFamily: FONT_BODY }}>

      {/* Page header (hidden on mobile when inside a thread) */}
      {(!isMobile || !activeConvId) && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>Messages</h1>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
              {loading ? 'Loading…' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            style={{
              background: NAVY, color: WHITE, border: 'none',
              borderRadius: 12, padding: '9px 18px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>✏️</span> New Chat
          </button>
        </div>
      )}

      {/* Chat shell */}
      <div style={{
        background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20,
        overflow: 'hidden', display: 'flex',
        height: isMobile ? 'calc(100dvh - 140px)' : '76vh', minHeight: 480,
      }}>

        {/* ── Left: conversation list ──────────────────────────────────── */}
        {showList && (
          <div style={{
            width: isMobile ? '100%' : 320, flexShrink: 0,
            borderRight: isMobile ? 'none' : `1px solid ${BORDER}`,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🔍</span>
                <span style={{ fontSize: 13, color: MUTED }}>Search conversations…</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: MUTED, fontSize: 13 }}>Loading…</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>No messages yet</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginBottom: 20 }}>
                    Start a conversation with a friend or create a group chat.
                  </div>
                  <button
                    onClick={() => setShowNewChat(true)}
                    style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY }}
                  >Start chatting</button>
                </div>
              ) : (
                conversations.map(conv => (
                  <ConvItem
                    key={conv.id}
                    conv={conv}
                    active={conv.id === activeConvId}
                    userId={userId}
                    onClick={() => setActiveConvId(conv.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Right: message thread ────────────────────────────────────── */}
        {showThread && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {!activeConvId ? (
              /* Desktop empty state */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>⛵</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Select a conversation</div>
                <div style={{ fontSize: 13, color: MUTED }}>Choose one on the left or start a new chat.</div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div style={{
                  padding: '12px 18px', borderBottom: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                  background: 'linear-gradient(to right, var(--t-bg), white)',
                }}>
                  {isMobile && (
                    <button
                      onClick={() => setActiveConvId(null)}
                      style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: NAVY, padding: '0 4px 0 0', lineHeight: 1 }}
                    >←</button>
                  )}
                  {activeConv?.type === 'group' ? <GroupIcon size={40} /> : (
                    <Avatar url={activeConv?.otherUser?.avatarUrl} name={activeConv?.displayName} size={40} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{activeConv?.displayName}</div>
                    {activeConv?.type === 'group' && (
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
                        {activeConv.members.length} members
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {msgLoading ? (
                    <div style={{ textAlign: 'center', color: MUTED, fontSize: 13, marginTop: 48 }}>Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: MUTED, marginTop: 48 }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                      <div style={{ fontSize: 14 }}>Say hello to {activeConv?.displayName}!</div>
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
                      const m      = item.data
                      const isOwn  = m.user_id === userId
                      const author = memberProfiles[m.user_id] || { name: 'Unknown', avatarUrl: '' }
                      const prevMsg = messages[messages.findIndex(x => x.id === m.id) - 1]
                      const showAuthor = !isOwn && activeConv?.type === 'group' && (!prevMsg || prevMsg.user_id !== m.user_id)
                      return (
                        <MsgBubble
                          key={m.id}
                          msg={m}
                          isOwn={isOwn}
                          showAuthor={showAuthor}
                          authorName={author.name}
                          authorAvatar={author.avatarUrl}
                        />
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div style={{
                  padding: '10px 14px', borderTop: `1px solid ${BORDER}`,
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                  background: '#FAFAFA', flexShrink: 0,
                }}>
                  <textarea
                    ref={inputRef}
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={`Message ${activeConv?.displayName || ''}…`}
                    rows={1}
                    style={{
                      flex: 1, border: `1px solid ${BORDER}`, borderRadius: 22,
                      padding: '10px 16px', fontSize: 14, fontFamily: FONT_BODY,
                      resize: 'none', outline: 'none', lineHeight: 1.5,
                      color: TEXT, background: WHITE,
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = NAVY }}
                    onBlur={e => { e.target.style.borderColor = BORDER }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim() || sending}
                    style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: newMsg.trim() ? NAVY : BORDER,
                      color: newMsg.trim() ? WHITE : MUTED,
                      border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default',
                      fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >↑</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          friends={friends}
          onCreate={handleCreate}
          onClose={() => setShowNewChat(false)}
          creating={creating}
        />
      )}
    </div>
  )
}
