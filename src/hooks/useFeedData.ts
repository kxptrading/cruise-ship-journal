// ─────────────────────────────────────────────────────────────────────────────
// hooks/useFeedData.ts — Data layer for the social feed
//
// Manages: own profile, friend posts, own day photos, reactions, comments.
// Returns: combined feedItems + all interaction handlers.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getPhotos, getSignedUrls } from '../lib/photoStorage'
import type { Voyage, ItineraryDay, DailyLog, FeedItem, FeedAuthor, ReactionsMap, CommentsMap, Comment } from '../types'

// ── Shared initials helper ─────────────────────────────────────────────────────

function toInitials(data: { display_name?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined): string {
  const name  = data?.display_name || `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || '?'
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  return (words[0] || '?').slice(0, 2).toUpperCase()
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Options {
  userId:    string | null
  voyageId:  string | null
  dailyLogs: DailyLog[]
  itinerary: ItineraryDay[]
  voyage:    Voyage
}

export interface UseFeedDataReturn {
  avatarUrl:         string
  userInitials:      string
  userDisplayName:   string
  feedItems:         FeedItem[]
  reactionsMap:      ReactionsMap
  commentsMap:       CommentsMap
  handleReact:       (postVoyageId: string, dayNumber: number, reactionId: string) => Promise<void>
  handleAddComment:  (postVoyageId: string, dayNumber: number, body: string) => Promise<void>
  handleEditComment: (commentId: string, newBody: string) => Promise<void>
  reload:            () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFeedData({ userId, voyageId, dailyLogs, itinerary, voyage }: Options): UseFeedDataReturn {

  // ── Reload trigger — incrementing this re-runs all fetch effects ─────────────
  const [loadKey, setLoadKey] = useState(0)
  const reload = useCallback(() => setLoadKey(k => k + 1), [])

  // ── Own profile ─────────────────────────────────────────────────────────────
  const [avatarUrl,       setAvatarUrl]       = useState<string>('')
  const [userInitials,    setUserInitials]     = useState<string>('?')
  const [userDisplayName, setUserDisplayName]  = useState<string>('Cruiser')

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('avatar_url, display_name, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }: { data: { avatar_url?: string | null; display_name?: string | null; first_name?: string | null; last_name?: string | null } | null }) => {
        if (!data) return
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        setUserInitials(toInitials(data))
        setUserDisplayName(data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Cruiser')
      })
  }, [userId, loadKey])

  // ── Friend posts ─────────────────────────────────────────────────────────────
  const [friendPosts, setFriendPosts] = useState<FeedItem[]>([])

  useEffect(() => {
    if (!userId) return

    async function loadFriendFeeds() {
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!requests?.length) return

      const friendIds = requests.map((r: { from_user_id: string; to_user_id: string }) =>
        r.from_user_id === userId ? r.to_user_id : r.from_user_id
      )

      const [{ data: profiles }, { data: voyages }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, first_name, last_name, avatar_url').in('user_id', friendIds),
        supabase.from('voyages').select('id, user_id, ship_name').in('user_id', friendIds),
      ])

      const voyageIds = (voyages || []).map((v: { id: string }) => v.id)
      if (!voyageIds.length) return

      const [{ data: logs }, { data: itineraryRows }, { data: photoRows }] = await Promise.all([
        supabase.from('daily_logs')
          .select('voyage_id, day_number, date, port, highlights, best_moment, weather, breakfast, lunch, dinner, drink, activity, rating')
          .in('voyage_id', voyageIds)
          .eq('is_public', true),
        supabase.from('itinerary').select('voyage_id, day_number, port').in('voyage_id', voyageIds),
        supabase.from('photos').select('voyage_id, day_number, storage_path, caption').in('voyage_id', voyageIds),
      ])

      type ProfileRow = { user_id: string; display_name?: string | null; first_name?: string | null; last_name?: string | null; avatar_url?: string | null }
      type VoyageRow  = { id: string; user_id: string; ship_name?: string | null }
      type ItinRow    = { voyage_id: string; day_number: number; port?: string | null }
      type PhotoRow   = { voyage_id: string; day_number: number; storage_path: string; caption?: string | null }
      type LogRow     = { voyage_id: string; day_number: number; date?: string | null; port?: string | null; highlights?: string | null; best_moment?: string | null; weather?: string[] | null; breakfast?: string | null; lunch?: string | null; dinner?: string | null; drink?: string | null; activity?: string | null; rating?: number | null }

      const profileMap = Object.fromEntries((profiles || []).map((p: ProfileRow) => [p.user_id, p]))
      const voyageMap  = Object.fromEntries((voyages  || []).map((v: VoyageRow)  => [v.id, v]))

      const itineraryMap: Record<string, Record<number, string>> = {}
      ;(itineraryRows || []).forEach((r: ItinRow) => {
        if (!itineraryMap[r.voyage_id]) itineraryMap[r.voyage_id] = {}
        if (r.port) itineraryMap[r.voyage_id][r.day_number] = r.port
      })

      const photoPaths = (photoRows || []).map((r: PhotoRow) => r.storage_path)
      const urlMap     = await getSignedUrls(photoPaths)
      const photoMap: Record<string, { dataUrl: string; caption: string }> = {}
      ;(photoRows || []).forEach((r: PhotoRow) => {
        const key = `${r.voyage_id}-${r.day_number}`
        if (!photoMap[key]) photoMap[key] = { dataUrl: urlMap[r.storage_path] || '', caption: r.caption || '' }
      })

      const posts: FeedItem[] = (logs || [])
        .filter((log: LogRow) => log.highlights || log.best_moment || log.activity || log.rating)
        .map((log: LogRow) => {
          const v       = voyageMap[log.voyage_id] as VoyageRow || {}
          const profile = profileMap[v.user_id]    as ProfileRow || {}
          const port    = log.port || itineraryMap[log.voyage_id]?.[log.day_number] || ''
          const author: FeedAuthor = {
            userId:    profile.user_id,
            name:      profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cruiser',
            avatarUrl: profile.avatar_url || '',
            initials:  toInitials(profile),
            shipName:  v.ship_name || '',
          }
          return {
            dayIndex: log.day_number - 1, dayNumber: log.day_number,
            voyageId: log.voyage_id,
            date: log.date || '', port: log.port || '', resolvedPort: port,
            highlights: log.highlights || '', bestMoment: log.best_moment || '',
            weather: log.weather || [],
            breakfast: log.breakfast || '', lunch: log.lunch || '', dinner: log.dinner || '', drink: log.drink || '',
            activity: log.activity || '', duration: '', excCost: '', excNotes: '', entertainment: '',
            rating: log.rating || 0, isPublic: true,
            photo: photoMap[`${log.voyage_id}-${log.day_number}`] || null,
            author,
          }
        })

      setFriendPosts(posts)
    }

    loadFriendFeeds()
  }, [userId, loadKey])

  // ── Own day photos ────────────────────────────────────────────────────────────
  const [photosByDay, setPhotosByDay] = useState<Record<number, { dataUrl: string; caption: string }>>({})

  useEffect(() => {
    if (!dailyLogs.length || !voyageId) return
    Promise.all(
      dailyLogs.map((_, i) =>
        getPhotos(i + 1, { voyageId })
          .then(photos => ({ day: i, photo: photos[0] || null }))
          .catch(() => ({ day: i, photo: null }))
      )
    ).then(results => {
      const map: Record<number, { dataUrl: string; caption: string }> = {}
      results.forEach(({ day, photo }) => { if (photo) map[day] = photo })
      setPhotosByDay(map)
    })
  }, [dailyLogs.length, voyageId, loadKey])

  // ── Combined feed items ───────────────────────────────────────────────────────
  const feedItems = useMemo<FeedItem[]>(() => {
    const genericLabel = (v: string | undefined) => v === 'Port' || v === 'Sea'
    const own: FeedItem[] = dailyLogs
      .map((log, i) => ({
        ...log,
        dayIndex:     i,
        dayNumber:    i + 1,
        voyageId:     voyageId || '',
        resolvedPort: (log.port && !genericLabel(log.port)) ? log.port : (itinerary[i]?.port || ''),
        photo:        photosByDay[i] || null,
        author:       null,
      }))
      .filter(log => log.isPublic && (log.highlights || log.bestMoment || log.activity || log.photo))

    return [...own, ...friendPosts].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : null
      const db = b.date ? new Date(b.date).getTime() : null
      if (da && db) return db - da
      if (da) return -1
      if (db) return 1
      return b.dayIndex - a.dayIndex
    })
  }, [dailyLogs, itinerary, photosByDay, voyageId, friendPosts])

  // ── Reactions ─────────────────────────────────────────────────────────────────
  const [reactionsMap, setReactionsMap] = useState<ReactionsMap>({})

  useEffect(() => {
    if (!feedItems.length || !userId) return
    const ids = [...new Set(feedItems.map(i => i.voyageId).filter(Boolean))]
    if (!ids.length) return
    supabase
      .from('reactions')
      .select('voyage_id, day_number, reaction, user_id')
      .in('voyage_id', ids)
      .then(({ data }: { data: { voyage_id: string; day_number: number; reaction: string; user_id: string }[] | null }) => {
        if (!data) return
        const map: ReactionsMap = {}
        data.forEach(row => {
          const key = `${row.voyage_id}-${row.day_number}`
          if (!map[key]) map[key] = {}
          if (!map[key][row.reaction]) map[key][row.reaction] = { count: 0, mine: false }
          map[key][row.reaction].count++
          if (row.user_id === userId) map[key][row.reaction].mine = true
        })
        setReactionsMap(map)
      })
  }, [feedItems.length, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Comments ──────────────────────────────────────────────────────────────────
  const [commentsMap, setCommentsMap] = useState<CommentsMap>({})

  useEffect(() => {
    if (!feedItems.length || !userId) return
    const ids = [...new Set(feedItems.map(i => i.voyageId).filter(Boolean))]
    if (!ids.length) return

    async function loadComments() {
      const { data: rows } = await supabase
        .from('comments')
        .select('id, voyage_id, day_number, user_id, body, created_at')
        .in('voyage_id', ids)
        .order('created_at', { ascending: true })

      if (!rows?.length) return

      type CommentRow = { id: string; voyage_id: string; day_number: number; user_id: string; body: string; created_at: string }
      const commenterIds = [...new Set(rows.map((r: CommentRow) => r.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', commenterIds)

      type ProfileRow = { user_id: string; display_name?: string | null; avatar_url?: string | null }
      const profileMap = Object.fromEntries((profiles || []).map((p: ProfileRow) => [p.user_id, p]))
      const map: CommentsMap = {}
      rows.forEach((r: CommentRow) => {
        const key  = `${r.voyage_id}-${r.day_number}`
        if (!map[key]) map[key] = []
        const prof = profileMap[r.user_id] as ProfileRow || {}
        const name = prof.display_name || 'Cruiser'
        const words = name.trim().split(/\s+/).filter(Boolean)
        const inits = words.length >= 2
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : (words[0] || '?').slice(0, 2).toUpperCase()
        map[key].push({ id: r.id, user_id: r.user_id, body: r.body, created_at: r.created_at, authorName: name, authorAvatar: prof.avatar_url || '', authorInitials: inits })
      })
      setCommentsMap(map)
    }

    loadComments()
  }, [feedItems.length, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleAddComment = async (postVoyageId: string, dayNumber: number, body: string) => {
    if (!userId || !postVoyageId || !body.trim()) return
    const key      = `${postVoyageId}-${dayNumber}`
    const tempId   = `temp-${Date.now()}`
    const temp: Comment = { id: tempId, user_id: userId, body, created_at: new Date().toISOString(), authorName: userDisplayName, authorAvatar: avatarUrl, authorInitials: userInitials }
    setCommentsMap(prev => ({ ...prev, [key]: [...(prev[key] || []), temp] }))

    const { data, error } = await supabase
      .from('comments')
      .insert({ voyage_id: postVoyageId, day_number: dayNumber, user_id: userId, body })
      .select('id').single()

    if (data && !error) {
      setCommentsMap(prev => ({
        ...prev,
        [key]: (prev[key] || []).map(c => c.id === tempId ? { ...c, id: (data as { id: string }).id } : c),
      }))
    }
  }

  const handleEditComment = async (commentId: string, newBody: string) => {
    setCommentsMap(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = next[key].map(c => c.id === commentId ? { ...c, body: newBody } : c)
      }
      return next
    })
    await supabase.from('comments').update({ body: newBody }).eq('id', commentId)
  }

  const handleReact = async (postVoyageId: string, dayNumber: number, reactionId: string) => {
    if (!userId || !postVoyageId) return
    const key           = `${postVoyageId}-${dayNumber}`
    const postReactions = reactionsMap[key] || {}
    const prevId        = Object.entries(postReactions).find(([, v]) => v.mine)?.[0]
    const adding        = prevId !== reactionId

    setReactionsMap(prev => {
      const current = { ...(prev[key] || {}) }
      if (prevId && current[prevId]) current[prevId] = { count: Math.max(0, current[prevId].count - 1), mine: false }
      if (adding) current[reactionId] = { count: (current[reactionId]?.count || 0) + 1, mine: true }
      return { ...prev, [key]: current }
    })

    if (prevId) {
      await supabase.from('reactions').delete()
        .eq('voyage_id', postVoyageId).eq('day_number', dayNumber)
        .eq('user_id', userId).eq('reaction', prevId)
    }
    if (adding) {
      await supabase.from('reactions')
        .insert({ voyage_id: postVoyageId, day_number: dayNumber, user_id: userId, reaction: reactionId })
    }
  }

  return {
    avatarUrl, userInitials, userDisplayName,
    feedItems,
    reactionsMap, commentsMap,
    handleReact, handleAddComment, handleEditComment,
    reload,
  }
}
