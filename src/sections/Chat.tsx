// ─────────────────────────────────────────────────────────────────────────────
// sections/Chat.tsx — Messaging orchestrator
//
// State, data-fetching, and handlers live here.
// UI is delegated to:
//   chat/ConversationList.tsx — left panel
//   chat/MessageThread.tsx    — right panel
//   chat/NewChatModal.tsx     — new conversation modal
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { NAVY, NAVY2, WHITE, MUTED, FONT_BODY, FONT_DISPLAY, BP } from '../constants'
import ConversationList from './chat/ConversationList'
import MessageThread    from './chat/MessageThread'
import NewChatModal     from './chat/NewChatModal'
import type { Conversation, Message, MemberProfile, FriendItem } from './chat/types'

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

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load accepted friends (used by NewChatModal)
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

  // Load conversation list with last-message + unread counts
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
      supabase.from('messages')
        .select('id, conversation_id, user_id, body, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(300),
    ])

    const memberUserIds = [...new Set((allMembers || []).map((m: { user_id: string }) => m.user_id))]
    const { data: profiles } = await supabase
      .from('profiles').select('user_id, display_name, avatar_url').in('user_id', memberUserIds)

    const profileMap: Record<string, MemberProfile> = Object.fromEntries(
      (profiles || []).map((p: { user_id: string; display_name?: string | null; avatar_url?: string | null }) => [
        p.user_id,
        { name: p.display_name || 'Cruiser', avatarUrl: p.avatar_url || '' },
      ])
    )
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

    const enriched: Conversation[] = (convs || [])
      .map((conv: { id: string; type: string; name: string | null; created_at: string }) => {
        const members     = membersByConv[conv.id] || []
        const otherIds    = members.filter(id => id !== userId)
        const otherUser   = conv.type === 'direct' && otherIds.length === 1 ? profileMap[otherIds[0]] : null
        const displayName = conv.type === 'group' ? (conv.name || 'Group Chat') : (otherUser?.name || 'Unknown')
        return { ...conv, displayName, otherUser, members, otherMemberIds: otherIds, lastMessage: lastMsgMap[conv.id] || null, unreadCount: unreadMap[conv.id] || 0 }
      })
      .sort((a: Conversation, b: Conversation) => {
        const ta = a.lastMessage?.created_at || a.created_at
        const tb = b.lastMessage?.created_at || b.created_at
        return new Date(tb).getTime() - new Date(ta).getTime()
      })

    setConversations(enriched)
    setLoading(false)
  }, [userId])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Open a conversation: load messages + subscribe to realtime inserts
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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!newMsg.trim() || sending || !activeConvId) return
    const body   = newMsg.trim()
    const tempId = `temp-${Date.now()}`
    const temp: Message = { id: tempId, user_id: userId!, body, created_at: new Date().toISOString() }

    setNewMsg('')
    setSending(true)
    setMessages(prev => [...prev, temp])
    setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, lastMessage: temp } : c))

    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConvId, user_id: userId, body })
      .select('id, user_id, body, created_at')
      .single()

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
    const { error: convErr } = await supabase
      .from('conversations')
      .insert({ id: convId, type, name: groupName || null, created_by: userId })
    if (convErr) { console.error('conversation insert failed', convErr); setCreating(false); return }

    const { error: memberErr } = await supabase
      .from('conversation_members')
      .insert([userId!, ...selectedIds].map(uid => ({ conversation_id: convId, user_id: uid })))
    if (memberErr) { console.error('member insert failed', memberErr); setCreating(false); return }

    const otherUser = type === 'direct' ? friends.find(f => f.userId === selectedIds[0]) : null
    const newConv: Conversation = {
      id: convId, type, name: groupName || null, created_at: new Date().toISOString(),
      displayName:    type === 'group' ? (groupName || 'Group Chat') : (otherUser?.name || 'Cruiser'),
      otherUser:      otherUser ? { name: otherUser.name, avatarUrl: otherUser.avatarUrl } : null,
      members:        [userId!, ...selectedIds],
      otherMemberIds: selectedIds,
      lastMessage:    null,
      unreadCount:    0,
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

  // ── Layout ──────────────────────────────────────────────────────────────────

  const showList   = !isMobile || !activeConvId
  const showThread = !isMobile || !!activeConvId

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

      <div style={{ background: WHITE, border: '1px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', display: 'flex', height: isMobile ? 'calc(100dvh - 140px)' : '76vh', minHeight: 480 }}>
        {showList && (
          <ConversationList
            conversations={conversations}
            activeConvId={activeConvId}
            loading={loading}
            userId={userId ?? ''}
            isMobile={isMobile}
            onSelect={setActiveConvId}
            onNewChat={() => setShowNewChat(true)}
          />
        )}
        {showThread && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <MessageThread
              activeConv={activeConv}
              messages={messages}
              memberProfiles={memberProfiles}
              msgLoading={msgLoading}
              newMsg={newMsg}
              sending={sending}
              userId={userId ?? ''}
              isMobile={isMobile}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              onChange={setNewMsg}
              onSend={handleSend}
              onBack={() => setActiveConvId(null)}
            />
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal friends={friends} onCreate={handleCreate} onClose={() => setShowNewChat(false)} creating={creating} />
      )}
    </div>
  )
}
