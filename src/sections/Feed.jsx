// ─────────────────────────────────────────────────────────────────────────────
// sections/Feed.jsx — Social-style voyage feed (home screen / "dashboard")
//
// Orchestrates the feed: loads own profile, friends' posts, reactions,
// comments, and photos, then renders them through sub-components.
//
// Sub-components:
//   VoyageHero    — hero banner with time-of-day atmosphere
//   QuickComposer — "What happened today?" composer
//   PostCard      — individual daily-log post card (reactions + comments)
//
// ── Data flow ─────────────────────────────────────────────────────────────────
// READS:  voyage, itinerary, dailyLogs, budget, sectionStatus (props)
//         + Supabase: friends, friend posts, reactions, comments, own profile
// WRITES: onChange(updatedDailyLogs) — only from QuickComposer
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react'
import { NAVY2, WHITE, BORDER, MUTED, TEAL, GOLD, BP, sty, FONT_DISPLAY, FONT_BODY } from '../constants'
import { useW, useVoyageId, useUserId } from '../context'
import { getPhotos } from '../lib/photoStorage'
import { supabase } from '../lib/supabase'
import { getTimeOfDay } from '../lib/atmosphere'
import PostCard    from './feed/PostCard'
import VoyageHero  from './feed/VoyageHero'
import QuickComposer from './feed/QuickComposer'

// ── Feed ──────────────────────────────────────────────────────────────────────
export default function Feed({ voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog, sectionStatus, onChange, onNav, showToast, onViewDay }) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()

  // ── Own profile ───────────────────────────────────────────────────────────
  const [avatarUrl,       setAvatarUrl]       = useState('')
  const [userInitials,    setUserInitials]    = useState('?')
  const [userDisplayName, setUserDisplayName] = useState('Cruiser')

  const toInitials = (data) => {
    const name  = data?.display_name || `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || '?'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return (words[0] || '?').slice(0, 2).toUpperCase()
  }

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('avatar_url, display_name, first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
        setUserInitials(toInitials(data))
        setUserDisplayName(data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Cruiser')
      })
  }, [userId])

  // ── Friend posts ──────────────────────────────────────────────────────────
  const [friendPosts, setFriendPosts] = useState([])

  useEffect(() => {
    if (!userId) return

    async function loadFriendFeeds() {
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!requests?.length) return

      const friendIds = requests.map(r => r.from_user_id === userId ? r.to_user_id : r.from_user_id)

      const [{ data: profiles }, { data: voyages }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, first_name, last_name, avatar_url').in('user_id', friendIds),
        supabase.from('voyages').select('id, user_id, ship_name').in('user_id', friendIds),
      ])

      const voyageIds = (voyages || []).map(v => v.id)
      if (!voyageIds.length) return

      const [{ data: logs }, { data: itineraryRows }, { data: photoRows }] = await Promise.all([
        supabase.from('daily_logs').select('voyage_id, day_number, date, port, highlights, best_moment, weather, breakfast, lunch, dinner, drink, activity, rating').in('voyage_id', voyageIds).eq('is_public', true),
        supabase.from('itinerary').select('voyage_id, day_number, port').in('voyage_id', voyageIds),
        supabase.from('photos').select('voyage_id, day_number, storage_path, caption').in('voyage_id', voyageIds),
      ])

      const profileMap   = Object.fromEntries((profiles || []).map(p => [p.user_id, p]))
      const voyageMap    = Object.fromEntries((voyages  || []).map(v => [v.id, v]))
      const itineraryMap = {}
      ;(itineraryRows || []).forEach(r => {
        if (!itineraryMap[r.voyage_id]) itineraryMap[r.voyage_id] = {}
        itineraryMap[r.voyage_id][r.day_number] = r.port
      })
      const photoMap = {}
      ;(photoRows || []).forEach(r => {
        const key = `${r.voyage_id}-${r.day_number}`
        if (!photoMap[key]) {
          const { data: { publicUrl } } = supabase.storage.from('daily-photos').getPublicUrl(r.storage_path)
          photoMap[key] = { dataUrl: publicUrl, caption: r.caption }
        }
      })

      const posts = (logs || [])
        .filter(log => log.highlights || log.best_moment || log.activity || log.rating)
        .map(log => {
          const v       = voyageMap[log.voyage_id] || {}
          const profile = profileMap[v.user_id]    || {}
          const port    = log.port || itineraryMap[log.voyage_id]?.[log.day_number] || ''
          return {
            dayIndex:     log.day_number - 1,
            dayNumber:    log.day_number,
            voyageId:     log.voyage_id,
            date:         log.date,
            port:         log.port,
            resolvedPort: port,
            highlights:   log.highlights,
            bestMoment:   log.best_moment,
            weather:      log.weather || [],
            breakfast:    log.breakfast,
            lunch:        log.lunch,
            dinner:       log.dinner,
            drink:        log.drink,
            activity:     log.activity,
            rating:       log.rating,
            photo:        photoMap[`${log.voyage_id}-${log.day_number}`] || null,
            author: {
              name:      profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cruiser',
              avatarUrl: profile.avatar_url || '',
              initials:  toInitials(profile),
              shipName:  v.ship_name || '',
            },
          }
        })

      setFriendPosts(posts)
    }

    loadFriendFeeds()
  }, [userId])

  // ── Atmosphere ────────────────────────────────────────────────────────────
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay)

  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000)
    return () => clearInterval(t)
  }, [])

  const stars = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id:          i,
      x:           Math.random() * 100,
      y:           Math.random() * 85,
      size:        Math.random() * 2.5 + 0.8,
      delay:       Math.random() * 4,
      duration:    Math.random() * 2.5 + 1.8,
      baseOpacity: Math.random() * 0.5 + 0.3,
    })), []
  )

  // ── Reactions & comments ──────────────────────────────────────────────────
  const [reactionsMap, setReactionsMap] = useState({})
  const [commentsMap,  setCommentsMap]  = useState({})

  // ── Photos (own days) ─────────────────────────────────────────────────────
  const [photosByDay, setPhotosByDay] = useState({})

  useEffect(() => {
    if (!dailyLogs.length || !voyageId) return
    Promise.all(
      dailyLogs.map((_, i) =>
        getPhotos(i + 1, { voyageId })
          .then(photos => ({ day: i, photo: photos[0] || null }))
          .catch(() => ({ day: i, photo: null }))
      )
    ).then(results => {
      const map = {}
      results.forEach(({ day, photo }) => { if (photo) map[day] = photo })
      setPhotosByDay(map)
    })
  }, [dailyLogs.length, voyageId])

  // ── Metrics ───────────────────────────────────────────────────────────────
  const spent      = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt  = parseFloat(budget.budget) || 0
  const budgetOver = budgetAmt > 0 && spent > budgetAmt
  const nights     = parseInt(voyage.totalNights) || itinerary.length || 0
  const ports      = itinerary.filter(d => d.port && d.port.trim() && d.port.toLowerCase() !== 'at sea').length
  const logged     = dailyLogs.filter(d => d.highlights || d.bestMoment).length

  // ── Voyage progress ───────────────────────────────────────────────────────
  const voyageNights = parseInt(voyage.totalNights) || 0
  const today        = new Date()
  const depDate      = voyage.departureDate ? new Date(voyage.departureDate) : null
  const rawDay       = (depDate && voyageNights > 0) ? Math.floor((today - depDate) / 86400000) + 1 : null
  const voyageOver   = rawDay !== null && rawDay > voyageNights
  const currentDay   = rawDay !== null ? Math.max(1, Math.min(voyageNights, rawDay)) : null
  const voyagePct    = rawDay !== null ? (voyageOver ? 100 : Math.round((currentDay / voyageNights) * 100)) : null
  const daysLeft     = voyageOver ? 0 : (currentDay ? Math.max(0, voyageNights - currentDay) : null)

  const [barPct, setBarPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarPct(voyagePct || 0), 120)
    return () => clearTimeout(t)
  }, [voyagePct])

  // ── Feed items ────────────────────────────────────────────────────────────
  const genericLabel = (v) => v === 'Port' || v === 'Sea'
  const ownItems = dailyLogs
    .map((log, i) => ({
      ...log,
      dayIndex:     i,
      dayNumber:    i + 1,
      voyageId,
      resolvedPort: (log.port && !genericLabel(log.port)) ? log.port : (itinerary[i]?.port || ''),
      photo:        photosByDay[i] || null,
      author:       null,
    }))
    .filter(log => log.isPublic && (log.highlights || log.bestMoment || log.activity || log.photo))

  const feedItems = [...ownItems, ...friendPosts].sort((a, b) => {
    const da = a.date ? new Date(a.date) : null
    const db = b.date ? new Date(b.date) : null
    if (da && db) return db - da
    if (da) return -1
    if (db) return 1
    return b.dayIndex - a.dayIndex
  })

  // ── Load reactions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!feedItems.length || !userId) return
    const ids = [...new Set(feedItems.map(i => i.voyageId).filter(Boolean))]
    if (!ids.length) return
    supabase
      .from('reactions')
      .select('voyage_id, day_number, reaction, user_id')
      .in('voyage_id', ids)
      .then(({ data }) => {
        if (!data) return
        const map = {}
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

  // ── Load comments ─────────────────────────────────────────────────────────
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

      const commenterIds = [...new Set(rows.map(r => r.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', commenterIds)

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]))
      const map = {}
      rows.forEach(r => {
        const key  = `${r.voyage_id}-${r.day_number}`
        if (!map[key]) map[key] = []
        const prof  = profileMap[r.user_id] || {}
        const name  = prof.display_name || 'Cruiser'
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

  // ── Add comment ───────────────────────────────────────────────────────────
  const handleAddComment = async (postVoyageId, dayNumber, body) => {
    if (!userId || !postVoyageId || !body.trim()) return
    const key     = `${postVoyageId}-${dayNumber}`
    const tempId  = `temp-${Date.now()}`
    const tempComment = { id: tempId, user_id: userId, body, created_at: new Date().toISOString(), authorName: userDisplayName, authorAvatar: avatarUrl, authorInitials: userInitials }
    setCommentsMap(prev => ({ ...prev, [key]: [...(prev[key] || []), tempComment] }))

    const { data, error } = await supabase
      .from('comments')
      .insert({ voyage_id: postVoyageId, day_number: dayNumber, user_id: userId, body })
      .select('id')
      .single()

    if (data && !error) {
      setCommentsMap(prev => ({
        ...prev,
        [key]: (prev[key] || []).map(c => c.id === tempId ? { ...c, id: data.id } : c),
      }))
    }
  }

  // ── Edit comment ──────────────────────────────────────────────────────────
  const handleEditComment = async (commentId, newBody) => {
    setCommentsMap(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = next[key].map(c => c.id === commentId ? { ...c, body: newBody } : c)
      }
      return next
    })
    await supabase.from('comments').update({ body: newBody }).eq('id', commentId)
  }

  // ── Toggle reaction ───────────────────────────────────────────────────────
  const handleReact = async (postVoyageId, dayNumber, reactionId) => {
    if (!userId || !postVoyageId) return
    const key           = `${postVoyageId}-${dayNumber}`
    const postReactions = reactionsMap[key] || {}
    const prevId        = Object.entries(postReactions).find(([, v]) => v.mine)?.[0]
    const adding        = prevId !== reactionId

    setReactionsMap(prev => {
      const current = { ...(prev[key] || {}) }
      if (prevId && current[prevId]) {
        current[prevId] = { count: Math.max(0, current[prevId].count - 1), mine: false }
      }
      if (adding) {
        current[reactionId] = { count: (current[reactionId]?.count || 0) + 1, mine: true }
      }
      return { ...prev, [key]: current }
    })

    if (prevId) {
      await supabase.from('reactions').delete()
        .eq('voyage_id', postVoyageId).eq('day_number', dayNumber)
        .eq('user_id', userId).eq('reaction', prevId)
    }
    if (adding) {
      await supabase.from('reactions').insert({ voyage_id: postVoyageId, day_number: dayNumber, user_id: userId, reaction: reactionId })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <VoyageHero
        w={w} voyage={voyage} voyagePct={voyagePct} currentDay={currentDay}
        voyageNights={voyageNights} daysLeft={daysLeft} barPct={barPct}
        timeOfDay={timeOfDay} stars={stars} onNav={onNav}
      />

      {/* ── Compact metrics strip ─────────────────────────────────────────── */}
      {(() => {
        const completedCount = sectionStatus?.size || 0
        const totalSections  = 12
        const metrics = [
          { icon: '📖', value: nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—', label: 'Days Logged',     color: NAVY2,                                           nav: 'daily' },
          { icon: '📍', value: ports > 0 ? String(ports) : '—',                                          label: 'Ports',            color: TEAL,                                            nav: 'itinerary' },
          { icon: '💳', value: spent > 0 ? `£${spent.toFixed(0)}` : '£—',                               label: budgetOver ? 'Over Budget!' : 'Spent', color: budgetOver ? '#DC2626' : TEAL, nav: 'budget' },
          { icon: '🏆', value: `${completedCount} / ${totalSections}`,                                   label: 'Journal Complete', color: completedCount === totalSections ? '#22C55E' : NAVY2, nav: 'highlights' },
        ]
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w < BP.mobile ? 2 : 4}, 1fr)`, gap: 10, marginBottom: 16 }}>
            {metrics.map(m => (
              <button
                key={m.label}
                onClick={() => onNav(m.nav)}
                style={{
                  background: `linear-gradient(135deg, ${WHITE} 60%, ${m.color}18 100%)`,
                  border: `1px solid ${BORDER}`, borderRadius: 16,
                  padding: w < BP.mobile ? '10px 8px' : '12px 14px',
                  textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${m.color}28`; e.currentTarget.style.borderColor = `${m.color}55` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = BORDER }}
              >
                <div style={{ fontSize: 20, marginBottom: 3 }}>{m.icon}</div>
                <div style={{ fontSize: w < BP.mobile ? 16 : 22, fontWeight: 400, color: m.color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3, fontFamily: FONT_BODY }}>{m.label}</div>
              </button>
            ))}
          </div>
        )
      })()}

      {/* ── Quick composer ────────────────────────────────────────────────── */}
      {dailyLogs.length > 0 && (
        <QuickComposer
          dailyLogs={dailyLogs}
          itinerary={itinerary}
          voyageId={voyageId}
          userId={userId}
          currentDay={currentDay}
          onChange={onChange}
          showToast={showToast}
        />
      )}

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      {feedItems.length === 0 ? (
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: w < BP.mobile ? '40px 20px' : '56px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🌊</div>
          <div style={{ fontSize: 24, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, marginBottom: 8 }}>
            Your voyage feed is empty
          </div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
            {dailyLogs.length === 0
              ? 'Add your first day in the Daily Log, then come back here to post your highlights.'
              : 'You\'ve got days added — write some highlights and they\'ll appear here as posts.'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNav('daily')} className="btn-primary" style={{ ...sty.btn, fontSize: 13, padding: '9px 20px' }}>
              Open Daily Log →
            </button>
            {dailyLogs.length === 0 && (
              <button onClick={() => onNav('itinerary')}
                style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '9px 20px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
                Set Up Itinerary
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {feedItems.map((item, i) => (
            <PostCard
              key={i}
              item={item}
              onViewDay={item.author ? null : onViewDay}
              avatarUrl={avatarUrl}
              initials={userInitials}
              displayName={userDisplayName}
              author={item.author}
              reactions={reactionsMap[`${item.voyageId}-${item.dayNumber}`] || {}}
              onReact={(rid) => handleReact(item.voyageId, item.dayNumber, rid)}
              comments={commentsMap[`${item.voyageId}-${item.dayNumber}`] || []}
              onAddComment={(body) => handleAddComment(item.voyageId, item.dayNumber, body)}
              onEditComment={handleEditComment}
              userId={userId}
            />
          ))}
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <button
              onClick={() => onNav('daily')}
              style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}
            >
              Open Daily Log for full details →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
