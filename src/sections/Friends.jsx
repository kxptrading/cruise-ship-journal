// ─────────────────────────────────────────────────────────────────────────────
// sections/Friends.jsx — Social friends management
//
// Three panels:
//   1. Search — find another user by email and send a friend request
//   2. Pending requests — incoming requests with Accept / Decline
//   3. Friends list — accepted connections
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, TEXT, MUTED, LIGHT, TEAL, ROSE, BP } from '../constants'
import { PgHdr } from '../components/ui'
import { useUserId, useW } from '../context'
import FriendProfile from './FriendProfile'



// ── Avatar bubble ─────────────────────────────────────────────────────────────
function Avatar({ name, avatarUrl, size = 40, bg = NAVY }) {
  const initials = (name || '?').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${BORDER}`,
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: WHITE,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
      fontFamily: 'inherit',
    }}>
      {initials}
    </div>
  )
}

// ── Small status pill ─────────────────────────────────────────────────────────
function Pill({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', padding: '3px 8px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  )
}

// ── Shared card style — built in the component so it can read width ──────────
function useCard() {
  const w = useW()
  return {
    background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`,
    padding: w < BP.mobile ? '14px 16px' : '18px 20px', marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
  }
}

export default function Friends({ initialFriend = null, onClearInitialFriend }) {
  const currentUserId = useUserId()
  const w             = useW()
  const card          = useCard()
  const isMobile      = w < BP.mobile

  const [viewingFriend, setViewingFriend]  = useState(initialFriend)  // friend object | null

  const [searchQuery, setSearchQuery]      = useState('')
  const [searchResult, setSearchResult]   = useState(null)   // profile[] | 'not_found' | null
  const [searching, setSearching]         = useState(false)

  const [incoming, setIncoming]           = useState([])  // pending requests sent TO me
  const [friends, setFriends]             = useState([])  // accepted connections
  const [loading, setLoading]             = useState(true)

  // ── Load incoming requests + friends ────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    if (!currentUserId) return
    setLoading(true)

    // All requests involving this user
    const { data: rows } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, status, created_at')
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)

    if (!rows) { setLoading(false); return }

    // Split into pending-incoming and accepted
    const pendingIncoming = rows.filter(r => r.status === 'pending' && r.to_user_id === currentUserId)
    const accepted        = rows.filter(r => r.status === 'accepted')

    // Collect all peer user_ids we need profiles for
    const peerIds = [
      ...pendingIncoming.map(r => r.from_user_id),
      ...accepted.map(r => r.from_user_id === currentUserId ? r.to_user_id : r.from_user_id),
    ]

    let profileMap = {}
    if (peerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, avatar_url')
        .in('user_id', peerIds)
      ;(profiles || []).forEach(p => { profileMap[p.user_id] = p })
    }

    setIncoming(pendingIncoming.map(r => ({
      requestId:   r.id,
      userId:      r.from_user_id,
      displayName: profileMap[r.from_user_id]?.display_name || 'Unknown',
      email:       profileMap[r.from_user_id]?.email        || '',
      avatarUrl:   profileMap[r.from_user_id]?.avatar_url   || '',
    })))

    setFriends(accepted.map(r => {
      const peerId = r.from_user_id === currentUserId ? r.to_user_id : r.from_user_id
      return {
        requestId:   r.id,
        userId:      peerId,
        displayName: profileMap[peerId]?.display_name || 'Unknown',
        email:       profileMap[peerId]?.email        || '',
        avatarUrl:   profileMap[peerId]?.avatar_url   || '',
      }
    }))

    setLoading(false)
  }, [currentUserId])

  useEffect(() => { loadConnections() }, [loadConnections])

  // ── Search by name ───────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSearchResult(null)

    const { data } = await supabase
      .from('profiles')
      .select('user_id, email, display_name, avatar_url')
      .ilike('display_name', `%${q}%`)
      .neq('user_id', currentUserId)
      .limit(8)

    setSearchResult(data && data.length > 0 ? data : 'not_found')
    setSearching(false)
  }

  // ── Send friend request ──────────────────────────────────────────────────────
  const sendRequest = async (toUserId) => {
    await supabase.from('friend_requests').insert({
      from_user_id: currentUserId,
      to_user_id:   toUserId,
    })
    setSearchResult(null)
    setSearchQuery('')
    loadConnections()
  }

  // ── Accept incoming request ──────────────────────────────────────────────────
  const acceptRequest = async (requestId) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
    loadConnections()
  }

  // ── Decline / remove ─────────────────────────────────────────────────────────
  const removeRequest = async (requestId) => {
    await supabase.from('friend_requests').delete().eq('id', requestId)
    loadConnections()
  }

  // ── Derive search button state ───────────────────────────────────────────────
  // Is this profile already a friend or has a pending request?
  const getRelationship = (userId) => {
    if (friends.find(f => f.userId === userId))   return 'friends'
    if (incoming.find(f => f.userId === userId))  return 'incoming'
    return 'none'
  }

  // ── Colours per avatar (simple hash) ─────────────────────────────────────────
  const avatarColors = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#B03060']
  const avatarColor  = (id = '') => avatarColors[id.charCodeAt(0) % avatarColors.length]

  if (viewingFriend) {
    return <FriendProfile friend={viewingFriend} onBack={() => { setViewingFriend(null); onClearInitialFriend?.() }} />
  }

  return (
    <div>
      <PgHdr icon="👥" title="Friends" />

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: w < BP.mobile ? 16 : '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Find a Friend
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name…"
            style={{
              flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8,
              padding: '10px 14px', fontSize: 16, fontFamily: 'inherit',
              background: CREAM, color: TEXT, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            style={{
              background: NAVY2, color: WHITE, border: 'none', borderRadius: 8,
              padding: '10px 18px', fontSize: 14, fontWeight: 600,
              cursor: searching ? 'default' : 'pointer', fontFamily: 'inherit',
              opacity: !searchQuery.trim() ? 0.45 : 1,
            }}
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {searchResult === 'not_found' && (
          <div style={{ marginTop: 12, fontSize: 13, color: MUTED }}>
            No users found with that name.
          </div>
        )}
        {Array.isArray(searchResult) && (
          <div style={{ marginTop: 14 }}>
            {searchResult.map(profile => {
              const rel = getRelationship(profile.user_id)
              return (
                <div key={profile.user_id} style={{ ...card, marginBottom: 8, background: LIGHT, flexWrap: 'nowrap' }}>
                  <Avatar name={profile.display_name} avatarUrl={profile.avatar_url} bg={avatarColor(profile.user_id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{profile.display_name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{profile.email}</div>
                  </div>
                  {rel === 'friends'  && <Pill label="Already friends" color={TEAL} />}
                  {rel === 'incoming' && <Pill label="Request pending" color={GOLD} />}
                  {rel === 'none' && (
                    <button
                      onClick={() => sendRequest(profile.user_id)}
                      style={{
                        background: NAVY2, color: WHITE, border: 'none', borderRadius: 8,
                        padding: '8px 16px', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                      }}
                    >
                      + Add Friend
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pending incoming requests ────────────────────────────────────────── */}
      {incoming.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Friend Requests · {incoming.length}
          </div>
          {incoming.map(req => (
            <div key={req.requestId} style={card}>
              <Avatar name={req.displayName} avatarUrl={req.avatarUrl} bg={avatarColor(req.userId)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{req.displayName}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={() => acceptRequest(req.requestId)}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    background: TEAL, color: WHITE, border: 'none', borderRadius: 8,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => removeRequest(req.requestId)}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    background: 'transparent', color: MUTED,
                    border: `1px solid ${BORDER}`, borderRadius: 8,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Friends list ─────────────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Your Friends {friends.length > 0 ? `· ${friends.length}` : ''}
        </div>

        {loading && (
          <div style={{ color: MUTED, fontSize: 13, padding: '20px 0' }}>Loading…</div>
        )}

        {!loading && friends.length === 0 && (
          <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌊</div>
            <div style={{ fontWeight: 600, color: TEXT, marginBottom: 6 }}>No friends yet</div>
            <div style={{ fontSize: 13, color: MUTED }}>Search for a fellow traveller above to get started.</div>
          </div>
        )}

        {friends.map(f => (
          <div key={f.requestId} style={card}>
            <Avatar name={f.displayName} avatarUrl={f.avatarUrl} bg={avatarColor(f.userId)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{f.displayName}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Pill label="Friend" color={TEAL} />
              <button
                onClick={() => setViewingFriend(f)}
                style={{
                  background: NAVY2, color: WHITE, border: 'none', borderRadius: 8,
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                View Profile
              </button>
              <button
                onClick={() => removeRequest(f.requestId)}
                style={{
                  background: 'transparent', color: MUTED,
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  padding: '6px 12px', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                title="Remove friend"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
