// hooks/useUnreadCounts.ts — Lightweight badge counts for nav (chat unread + feed new)

import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUserId } from '../context'

const FEED_KEY  = 'dd_feed_last_visited'
const POLL_CHAT = 30_000   // 30 s
const POLL_FEED = 60_000   // 1 min

export interface UnreadCounts {
  chat:           number
  feed:           boolean
  clearFeedBadge: () => void
}

export function useUnreadCounts(): UnreadCounts {
  const userId   = useUserId()
  const location = useLocation()

  const [chatUnread, setChatUnread] = useState(0)
  const [feedNew,    setFeedNew]    = useState(false)

  // ── Chat unread ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function checkChat() {
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)

      if (!memberships?.length) { if (!cancelled) setChatUnread(0); return }

      let total = 0
      for (const m of memberships) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', m.conversation_id)
          .neq('user_id', userId)
          .gt('created_at', m.last_read_at ?? '1970-01-01T00:00:00Z')
        total += count ?? 0
      }

      if (!cancelled) setChatUnread(total)
    }

    checkChat()
    const timer = setInterval(checkChat, POLL_CHAT)
    return () => { cancelled = true; clearInterval(timer) }
  }, [userId])

  // ── Feed new posts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function checkFeed() {
      const lastVisit = localStorage.getItem(FEED_KEY) ?? '1970-01-01T00:00:00Z'

      const { data: reqs } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!reqs?.length) { if (!cancelled) setFeedNew(false); return }

      const contactIds = reqs.map((r: { from_user_id: string; to_user_id: string }) =>
        r.from_user_id === userId ? r.to_user_id : r.from_user_id
      )

      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .in('user_id', contactIds)
        .in('audience', ['public', 'family'])
        .gt('created_at', lastVisit)

      if (!cancelled) setFeedNew((count ?? 0) > 0)
    }

    checkFeed()
    const timer = setInterval(checkFeed, POLL_FEED)
    return () => { cancelled = true; clearInterval(timer) }
  }, [userId])

  // Clear feed badge when user navigates to /feed
  useEffect(() => {
    if (location.pathname === '/feed') {
      localStorage.setItem(FEED_KEY, new Date().toISOString())
      setFeedNew(false)
    }
  }, [location.pathname])

  const clearFeedBadge = useCallback(() => {
    localStorage.setItem(FEED_KEY, new Date().toISOString())
    setFeedNew(false)
  }, [])

  return { chat: chatUnread, feed: feedNew, clearFeedBadge }
}
