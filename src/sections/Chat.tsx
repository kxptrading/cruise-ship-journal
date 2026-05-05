// ─────────────────────────────────────────────────────────────────────────────
// sections/Chat.tsx — WhatsApp-style messaging orchestrator
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { NAVY, NAVY2, WHITE, BORDER, TEXT, MUTED, FONT_BODY, FONT_DISPLAY, BP } from '../constants'
import ConvItem      from './chat/ConvItem'
import MsgBubble     from './chat/MsgBubble'
import NewChatModal  from './chat/NewChatModal'
import { Avatar, GroupIcon, fmtDateLabel } from './chat/helpers'

interface MemberProfile {
  name:      string
  avatarUrl: string
}

interface Message {
  id:           string
  user_id:      string
  body:         string
  created_at:   string
}

interface Conversation {
  id:             string
  type:           string
  name:           string | null
  created_at:     string
  displayName:    string
  otherUser:      MemberProfile | null
  members:        string[]
  otherMemberIds: string[]
  lastMessage:    Message | null
  unreadCount:    number
}

interface FriendItem {
  userId:    string
  name:      string
  avatarUrl: string
}

type DateSeparatorItem = { type: 'date'; label: string; key: string }
type MessageItem       = { type: 'msg';  data: Message }
type FeedRow           = DateSeparatorItem | MessageItem

export default function Chat() {
  const userId   = useUserId()
  const w        = useW()
  const isMobile = w < BP.tablet

  const [conversations,  setConversations]  = useState<Conversation[]>([])
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null)
  const [messages,       setMessages]       = useState<Message[]>([])
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({})
  const [loading,        setLoading]        = useState<boolean>(true)
  const [msgLoading,     setMsgLoading]     = useState<boolean>(false)
  const [newMsg,         setNewMsg]         = useState<string>('')
  const [sending,        setSending]        = useState<boolean>(false)
  const [showNewChat,    setShowNewChat]     = useState<boolean>(false)
  const [friends,        setFriends]        = useState<FriendItem[]>([])
  const [creating,       setCreating]       = useState<boolean>(false)

  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId) || null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!userId) return
    async function load() {
      const { data: reqs } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!reqs?.length) return
      const ids = reqs.map((r: { from_user_id: string; to_user_id: string }) =>
        r.from_user_id === userId ? r.to_user_id : r.from_user_id
      )
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', ids)

      setFriends((profiles || []).map((p: { user_id: string; display_name?: string | null; avatar_url?: string | null }) => ({
        userId:    p.user_id,
        name:      p.display_name || 'Cruiser',
        avatarUrl: p.avatar_url   || '',
      })))
    }
    load()
  }, [userId])

  const loadConversations = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    if (!memberships?.length) { setLoading(false); return }

    const convIds     = memberships.map((m: { conversation_id: string; last_read_at: string | null }) => m.conversation_id)
    const lastReadMap = Object.fromEntries(memberships.map((m: { conversation_id: string; last_read_at: string | null }) => [m.conversation_id, m.last_read_at]))

    const [{ data: convs }, { data: allMembers }, { data: recentMsgs }] = await Promise.all([
      supabase.from('conversations').select('id, type, name, created_at').in('id', convIds),
      supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', convIds),
      supabase.from('messages').select('id, conversation_id, user_id, body, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(300),
    ])

    const memberUserIds = [...new Set((allMembers || []).map((m: { user_id: string }) => m.user_id))]
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, avatar_url').in('user_id', memberUserIds)

    const profileMap: Record<string, MemberProfile> = Object.fromEntries((profiles || []).map((p: { user_id: string; display_name?: string | null; avatar_url?: string | null }) => [p.user_id, {
      name:      p.display_name || 'Cruiser',
      avatarUrl: p.avatar_url   || '',
    }]))
    setMemberProfiles(profileMap)

    const lastMsgMap: Record<string, Message> = {}
    ;(recentMsgs || []).forEach((m: Message & { conversation_id: string }) => {
      if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m
    })

    const unreadMap: Record<string, number> = {}
    ;(recentMsgs || []).forEach((m: Message & { conversation_id: string }) => {
      if (m.user_id === userId) return
      const lr = lastReadMap[m.conversation_id]
      if (!lr || new Date(m.created_at) > new Date(lr))
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1
    })

    const membersByConv: Record<string, string[]> = {}
    ;(allMembers || []).forEach((m: { conversation_id: string; user_id: string }) => {
      if (!membersByConv[m.conversation_id]) membersByConv[m.conversation_id] = []
      membersByConv[m.conversation_id].push(m.user_id)
    })

    const enriched: Conversation[] = (convs || []).map((conv: { id: string; type: string; name: string | null; created_at: string }) => {
      const members     = membersByConv[conv.id] || []
      const otherIds    = members.filter(id => id !== userId)
      const otherUser   = conv.type === 'direct' && otherIds.length === 1 ? profileMap[otherIds[0]] : null
      const displayName = conv.type === 'group' ? (conv.name || 'Group Chat') : (otherUser?.name || 'Unknown')
      return { ...conv, displayName, otherUser, members, otherMemberIds: otherIds, lastMessage: lastMsgMap[conv.id] || null, unreadCount: unreadMap[conv.id] || 0 }
    }).sort((a: Conversation, b: Conversation) => {
      const ta = a.lastMessage?.created_at || a.created_at
      const tb = b.lastMessage?.created_at || b.created_at
      return new Date(tb).getTime() - new Date(ta).getTime()
    })

    setConversations(enriched)
    setLoading(false)
  }, [userId])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    if (!activeConvId) return
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }

    setMsgLoading(true)
    setMessages([])

    supabase.from('messages')
      .select('id, user_id, body, created_at')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || [])
        setMsgLoading(false)
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 60)
      })

    supabase.from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', activeConvId)
      .eq('user_id', userId)
      .then()

    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unreadCount: 0 } : c))

    const ch = supabase
      .channel(`chat:${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        ({ new: msg }: { new: Message }) => {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, lastMessage: msg } : c))
        }
      )
      .subscribe()

    channelRef.current = ch
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [activeConvId, userId])

  const handleSend = async () => {
    if (!newMsg.trim() || sending || !activeConvId) return
    const body   = newMsg.trim()
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = { id: tempId, user_id: userId!, body, created_at: new Date().toISOString() }

    setNewMsg('')
    setSending(true)
    setMessages(prev => [...prev, tempMsg])
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, lastMessage: tempMsg } : c))

    const { data } = await supabase.from('messages')
      .insert({ conversation_id: activeConvId, user_id: userId, body })
      .select('id, user_id, body, created_at').single()

    if (data) setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m))
    setSending(false)
    inputRef.current?.focus()
  }

  const handleCreate = async (selectedIds: string[], groupName: string | null) => {
    setCreating(true)
    const type = selectedIds.length > 1 ? 'group' : 'direct'

    if (type === 'direct') {
      const existing = conversations.find(c => c.type === 'direct' && c.otherMemberIds.includes(selectedIds[0]))
      if (existing) { setActiveConvId(existing.id); setShowNewChat(false); setCreating(false); return }
    }

    const convId = crypto.randomUUID()
    const { error: convErr } = await supabase.from('conversations').insert({ id: convId, type, name: groupName || null, created_by: userId })
    if (convErr) { console.error('conversation insert failed', convErr); setCreating(false); return }

    const { error: memberErr } = await supabase.from('conversation_members').insert([userId!, ...selectedIds].map(uid => ({ conversation_id: convId, user_id: uid })))
    if (memberErr) { console.error('member insert failed', memberErr); setCreating(false); return }

    const otherUser = type === 'direct' ? friends.find(f => f.userId === selectedIds[0]) : null
    const newConv: Conversation = {
      id: convId, type, name: groupName || null, created_at: new Date().toISOString(),
      displayName:    type === 'group' ? (groupName || 'Group Chat') : (otherUser?.name || 'Cruiser'),
      otherUser:      otherUser ? { name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
      members:        [userId!, ...selectedIds],
      otherMemberIds: selectedIds,
      lastMessage:    null, unreadCount: 0,
    }

    const freshProfiles: Record<string, MemberProfile> = {}
    selectedIds.forEach(id => {
      const f = friends.find(x => x.userId === id)
      if (f) freshProfiles[id] = { name: f.name, avatarUrl: f.avatarUrl }
    })
    if (Object.keys(freshProfiles).length) setMemberProfiles(prev => ({ ...prev, ...freshProfiles }))

    setConversations(prev => [newConv, ...prev])
    setActiveConvId(convId)
    setShowNewChat(false)
    setCreating(false)
  }

  function withDateSeparators(msgs: Message[]): FeedRow[] {
    const out: FeedRow[] = []; let lastDate: string | null = null
    msgs.forEach((m, idx) => {
      const d = new Date(m.created_at).toDateString()
      if (d !== lastDate) { out.push({ type: 'date', label: fmtDateLabel(m.created_at), key: `d-${idx}` }); lastDate = d }
      out.push({ type: 'msg', data: m })
    })
    return out
  }

  const showList   = !isMobile || !activeConvId
  const showThread = !isMobile ||  !!activeConvId

  return (
    <div style={{ fontFamily: FONT_BODY }}>

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
            style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 12, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>✏️</span> New Chat
          </button>
        </div>
      )}

      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', display: 'flex', height: isMobile ? 'calc(100dvh - 140px)' : '76vh', minHeight: 480 }}>

        {showList && (
          <div style={{ width: isMobile ? '100%' : 320, flexShrink: 0, borderRight: isMobile ? 'none' : `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
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
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginBottom: 20 }}>Start a conversation with a friend or create a group chat.</div>
                  <button onClick={() => setShowNewChat(true)} style={{ background: NAVY, color: WHITE, border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY }}>Start chatting</button>
                </div>
              ) : (
                conversations.map(conv => (
                  <ConvItem key={conv.id} conv={conv} active={conv.id === activeConvId} userId={userId ?? ''} onClick={() => setActiveConvId(conv.id)} />
                ))
              )}
            </div>
          </div>
        )}

        {showThread && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {!activeConvId ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>⛵</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Select a conversation</div>
                <div style={{ fontSize: 13, color: MUTED }}>Choose one on the left or start a new chat.</div>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'linear-gradient(to right, var(--t-bg), white)' }}>
                  {isMobile && (
                    <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: NAVY, padding: '0 4px 0 0', lineHeight: 1 }}>←</button>
                  )}
                  {activeConv?.type === 'group' ? <GroupIcon size={40} /> : (
                    <Avatar url={activeConv?.otherUser?.avatarUrl} name={activeConv?.displayName} size={40} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{activeConv?.displayName}</div>
                    {activeConv?.type === 'group' && (
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{activeConv.members.length} members</div>
                    )}
                  </div>
                </div>

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
                      const m          = item.data
                      const isOwn      = m.user_id === userId
                      const author     = memberProfiles[m.user_id] || { name: 'Unknown', avatarUrl: '' }
                      const prevMsg    = messages[messages.findIndex(x => x.id === m.id) - 1]
                      const showAuthor = !isOwn && activeConv?.type === 'group' && (!prevMsg || prevMsg.user_id !== m.user_id)
                      return (
                        <MsgBubble key={m.id} msg={m} isOwn={isOwn} showAuthor={showAuthor} authorName={author.name} authorAvatar={author.avatarUrl} />
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '10px 14px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#FAFAFA', flexShrink: 0 }}>
                  <textarea
                    ref={inputRef}
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={`Message ${activeConv?.displayName || ''}…`}
                    rows={1}
                    style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 16px', fontSize: 14, fontFamily: FONT_BODY, resize: 'none', outline: 'none', lineHeight: 1.5, color: TEXT, background: WHITE, transition: 'border-color 0.15s' }}
                    onFocus={e => { e.target.style.borderColor = NAVY }}
                    onBlur={e => { e.target.style.borderColor = BORDER }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim() || sending}
                    style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: newMsg.trim() ? NAVY : BORDER, color: newMsg.trim() ? WHITE : MUTED, border: 'none', cursor: newMsg.trim() ? 'pointer' : 'default', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
                  >↑</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal friends={friends} onCreate={handleCreate} onClose={() => setShowNewChat(false)} creating={creating} />
      )}
    </div>
  )
}
