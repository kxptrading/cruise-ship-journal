// ─────────────────────────────────────────────────────────────────────────────
// sections/Feed.jsx — Social-style voyage feed (home screen)
//
// Replaces the metrics-only Dashboard with a Facebook-esque scrolling feed.
// Daily log entries appear as post cards in reverse-chronological order.
// A quick composer at the top lets users post highlights without navigating
// away to the full Daily Log section.
//
// Data is read-only for all sections except dailyLogs — the composer calls
// onChange('dailyLogs', updatedArray) to post a highlight to a day.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useMemo } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, TEAL, ROSE, CORAL, BP, sty, FONT_DISPLAY, FONT_BODY, SECTION_COLORS } from '../constants'
import { useW, useVoyageId, useUserId } from '../context'
import { Donut, Stars } from '../components/ui'
import { getPhotos } from '../lib/photoStorage'
import { supabase } from '../lib/supabase'
import { getTimeOfDay, getTimeGradient, getVignetteRGB, playShipHorn } from '../lib/atmosphere'
import Confetti from '../components/Confetti'

// ── Reaction definitions ──────────────────────────────────────────────────────
const REACTIONS = [
  { id: 'love',      emoji: '🚢', label: 'Love This' },
  { id: 'epic',      emoji: '🌊', label: 'Epic Memory' },
  { id: 'wish',      emoji: '🍹', label: 'Wish I Was There' },
  { id: 'hilarious', emoji: '😂', label: 'Hilarious' },
  { id: 'shot',      emoji: '📸', label: 'Great Shot' },
]

// ── Weather chip styles — per-condition colour tinting ───────────────────────
const WX_EMOJI = {
  Sunny: '☀️', Cloudy: '☁️', Rainy: '🌧️',
  Windy: '💨', Hot:  '🌡️', Mild:  '🌤️', Cool: '❄️',
}
const WX_STYLE = {
  Sunny:  { background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' },
  Hot:    { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B' },
  Rainy:  { background: '#EFF6FF', border: '1px solid #93C5FD', color: '#1D4ED8' },
  Cloudy: { background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151' },
  Windy:  { background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155' },
  Mild:   { background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534' },
  Cool:   { background: '#EFF6FF', border: '1px solid #BAE6FD', color: '#0369A1' },
}

// ── Post card ─────────────────────────────────────────────────────────────────
// Renders a single daily log entry as a social-style post card.
function PostCard({ item, onViewDay, avatarUrl, initials, author, reactions, onReact }) {
  const w = useW()
  const [animating, setAnimating]     = useState(null)
  const [hoveredReaction, setHovered] = useState(null)

  const handleReactClick = (id) => {
    setAnimating(id)
    setTimeout(() => setAnimating(null), 320)
    onReact?.(id)
  }
  const { dayIndex, resolvedPort, date, highlights, bestMoment, weather,
          breakfast, lunch, dinner, drink, activity, rating, photo } = item

  // For friend posts, author prop overrides the passed-in avatar/initials
  const displayAvatar   = author ? author.avatarUrl  : avatarUrl
  const displayInitials = author ? author.initials   : initials

  const meals = [
    breakfast && { icon: '🍳', text: breakfast },
    lunch     && { icon: '🥗', text: lunch },
    dinner    && { icon: '🍝', text: dinner },
    drink     && { icon: '🍷', text: drink },
  ].filter(Boolean)

  return (
    <div className="feed-card" style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', borderTop: `4px solid ${NAVY}`, position: 'relative' }}>

      {/* ── Friend attribution banner ─────────────────────────────────────── */}
      {author && (
        <div style={{ background: `linear-gradient(135deg, ${NAVY2}08, ${NAVY2}18)`, borderBottom: `1px solid ${BORDER}`, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: NAVY2, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {author.avatarUrl
              ? <img src={author.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: WHITE }}>{author.initials}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: NAVY2 }}>{author.name}</span>
            {author.shipName && <span style={{ fontSize: 12, color: MUTED }}> · {author.shipName}</span>}
          </div>
          <span style={{ fontSize: 11, color: MUTED, background: GOLD + '20', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>Friend</span>
        </div>
      )}

      {/* ── Profile avatar — top-right corner ────────────────────────────── */}
      <div style={{
        position: 'absolute', top: author ? 42 : 12, right: 14,
        width: 36, height: 36, borderRadius: '50%',
        background: NAVY2, border: `2px solid ${WHITE}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        {displayAvatar ? (
          <img src={displayAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif' }}>{displayInitials}</span>
        )}
      </div>

      {/* ── Card header: day badge + port + date ──────────────────────────── */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 62 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Day number badge */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: NAVY,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>Day</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif', lineHeight: 1.1 }}>{dayIndex + 1}</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>
              {resolvedPort || `Day ${dayIndex + 1}`}
            </div>
            {date && (
              <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Star rating pill */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: GOLD + '18', borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
            <span style={{ color: GOLD, fontSize: 13 }}>★</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{rating}.0</span>
          </div>
        )}
      </div>

      {/* ── Hero photo ─────────────────────────────────────────────────────── */}
      {photo && (
        <div style={{ width: '100%', maxHeight: 320, overflow: 'hidden', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <img
            src={photo.dataUrl}
            alt={photo.caption || resolvedPort || `Day ${dayIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: 320 }}
          />
          {photo.caption && (
            <div style={{ padding: '8px 18px', background: '#FAFAF8', borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
              {photo.caption}
            </div>
          )}
        </div>
      )}

      {/* ── Post body ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px' }}>

        {/* Highlights */}
        {highlights && (
          <p style={{ margin: '0 0 14px', fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
            {highlights}
          </p>
        )}

        {/* Best moment — magazine-style pull quote */}
        {bestMoment && (
          <div style={{ borderLeft: `3px solid ${CORAL}`, marginBottom: 14, background: 'rgba(249,115,22,0.06)', borderRadius: '0 10px 10px 0', padding: '10px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CORAL, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: FONT_BODY }}>Best Moment</div>
            <div style={{ fontSize: 16, color: '#92400E', fontStyle: 'italic', lineHeight: 1.6, fontFamily: FONT_DISPLAY, fontWeight: 400 }}>{bestMoment}</div>
          </div>
        )}

        {/* Shore activity */}
        {activity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>🚤</span>
            <span style={{ fontSize: 13, color: TEXT }}><strong>Excursion:</strong> {activity}</span>
          </div>
        )}

        {/* Weather chips — each condition gets its own tinted colour */}
        {(weather || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {weather.map(wx => (
              <span key={wx} style={{ fontSize: 12, borderRadius: 20, padding: '3px 10px', ...(WX_STYLE[wx] || { background: '#F0F7FF', border: '1px solid #C7DCF5', color: '#2563EB' }) }}>
                {WX_EMOJI[wx] || '🌈'} {wx}
              </span>
            ))}
          </div>
        )}

        {/* Meals row */}
        {meals.length > 0 && (
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              What I ate
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {meals.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.4 }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Reactions bar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 4 }}>
        {REACTIONS.map(r => {
          const rd         = reactions?.[r.id] || { count: 0, mine: false }
          const isAnimating = animating === r.id
          const isHovered   = hoveredReaction === r.id
          return (
            <div key={r.id} style={{ position: 'relative', flexShrink: 0 }}>
              {/* Tooltip — appears above on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1C2B3A', color: WHITE,
                  borderRadius: 7, padding: '5px 10px',
                  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  pointerEvents: 'none', zIndex: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {r.label}
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #1C2B3A',
                  }} />
                </div>
              )}

              <button
                onClick={() => handleReactClick(r.id)}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: rd.mine ? 'var(--t-bg)' : 'transparent',
                  border: `1.5px solid ${rd.mine ? 'var(--t-primary)' : BORDER}`,
                  borderRadius: 14, padding: '8px 10px',
                  cursor: 'pointer', minWidth: 52,
                  transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                  transition: isAnimating
                    ? 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)'
                    : 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                  boxShadow: rd.mine ? '0 2px 10px var(--t-btn-shadow)' : isHovered ? '0 3px 10px rgba(0,0,0,0.1)' : 'none',
                  outline: 'none',
                }}
              >
                <span
                  className={isHovered ? 'reaction-emoji-hover' : ''}
                  style={{ fontSize: 26, lineHeight: 1, display: 'block' }}
                >{r.emoji}</span>
                {rd.count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, lineHeight: 1,
                    color: rd.mine ? 'var(--t-primary)' : MUTED,
                    transition: 'color 0.15s',
                  }}>{rd.count}</span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Card footer: view full day link (own posts only) ────────────────── */}
      {onViewDay && (
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${BORDER}`, background: '#F0F9FF', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onViewDay(dayIndex)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: NAVY2, fontFamily: FONT_BODY, fontWeight: 700, padding: 0 }}>
            View full day →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export default function Feed({ voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog, sectionStatus, onChange, onNav, showToast, onViewDay }) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()

  // Own profile — avatar and initials for post card attribution
  const [avatarUrl, setAvatarUrl]       = useState('')
  const [userInitials, setUserInitials] = useState('?')

  // Friend posts — daily log entries from accepted friends, merged into the feed
  const [friendPosts, setFriendPosts] = useState([])

  // Helper: derive initials from a profile row
  const toInitials = (data) => {
    const name = data?.display_name || `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || '?'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return (words[0] || '?').slice(0, 2).toUpperCase()
  }

  // Load own profile
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
      })
  }, [userId])

  // Load friends' posts
  useEffect(() => {
    if (!userId) return

    async function loadFriendFeeds() {
      // 1. Get accepted friend connections
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (!requests?.length) return

      const friendIds = requests.map(r =>
        r.from_user_id === userId ? r.to_user_id : r.from_user_id
      )

      // 2a. Fetch profiles and voyages first
      const [{ data: profiles }, { data: voyages }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, first_name, last_name, avatar_url').in('user_id', friendIds),
        supabase.from('voyages').select('id, user_id, ship_name').in('user_id', friendIds),
      ])

      const voyageIds = (voyages || []).map(v => v.id)
      if (!voyageIds.length) return

      // 2b. Now fetch logs, itinerary and photos using the resolved voyage IDs
      const [{ data: logs }, { data: itineraryRows }, { data: photoRows }] = await Promise.all([
        supabase.from('daily_logs').select('voyage_id, day_number, date, port, highlights, best_moment, weather, breakfast, lunch, dinner, drink, activity, rating').in('voyage_id', voyageIds),
        supabase.from('itinerary').select('voyage_id, day_number, port').in('voyage_id', voyageIds),
        supabase.from('photos').select('voyage_id, day_number, storage_path, caption').in('voyage_id', voyageIds),
      ])

      // Build lookup maps
      const profileMap   = Object.fromEntries((profiles   || []).map(p => [p.user_id,   p]))
      const voyageMap    = Object.fromEntries((voyages    || []).map(v => [v.id,         v]))
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

      // 3. Map each log into a feed item with author attribution
      const posts = (logs || [])
        .filter(log => log.highlights || log.best_moment || log.activity)
        .map(log => {
          const voyage  = voyageMap[log.voyage_id] || {}
          const profile = profileMap[voyage.user_id] || {}
          const port    = log.port || itineraryMap[log.voyage_id]?.[log.day_number] || ''
          const photo   = photoMap[`${log.voyage_id}-${log.day_number}`] || null
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
            photo,
            author: {
              name:      profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cruiser',
              avatarUrl: profile.avatar_url || '',
              initials:  toInitials(profile),
              shipName:  voyage.ship_name || '',
            },
          }
        })

      setFriendPosts(posts)
    }

    loadFriendFeeds()
  }, [userId])

  // ── Atmosphere ─────────────────────────────────────────────────────────────
  const [timeOfDay, setTimeOfDay]     = useState(getTimeOfDay)
  const [showConfetti, setShowConfetti] = useState(false)
  const hornPlayedRef                 = useRef(false)

  // Re-check time of day every minute so long sessions stay accurate
  useEffect(() => {
    const t = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Stars — generated once, stable across renders
  const stars = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id:          i,
      x:           Math.random() * 100,
      y:           Math.random() * 85,    // keep out of wave zone
      size:        Math.random() * 2.5 + 0.8,
      delay:       Math.random() * 4,
      duration:    Math.random() * 2.5 + 1.8,
      baseOpacity: Math.random() * 0.5 + 0.3,
    })), []
  )

  // Reactions — keyed by `${voyageId}-${dayNumber}`, value is { [reactionId]: { count, mine } }
  const [reactionsMap, setReactionsMap] = useState({})

  // Photos keyed by day index — loads the first photo for each day in the
  // background after the feed renders, then triggers a re-render to show them.
  const [photosByDay, setPhotosByDay] = useState({})

  // Animated progress bar — starts at 0 and transitions to actual % on mount
  const [barPct, setBarPct] = useState(0)

  // Tracks scroll position for the collapsing hero (0 = top, 1 = fully condensed)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  // Find the closest scrollable ancestor and track scroll position.
  // Hero condenses over the first 150px of scroll.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    let parent = hero.parentElement
    while (parent) {
      const { overflowY } = getComputedStyle(parent)
      if (overflowY === 'auto' || overflowY === 'scroll') break
      parent = parent.parentElement
    }
    if (!parent) return
    const handler = () => setScrollY(Math.min(parent.scrollTop, 200))
    parent.addEventListener('scroll', handler, { passive: true })
    return () => parent.removeEventListener('scroll', handler)
  }, [])

  // Linear interpolation helper — drives all hero size/opacity transitions
  const lerp = (a, b, t) => a + (b - a) * t
  const p = scrollY / 200  // 0 = full size, 1 = fully condensed

  // Composer state
  const [composing, setComposing]         = useState(false)
  const [composeDay, setComposeDay]       = useState('')
  const [composeText, setComposeText]     = useState('')
  const [composeRating, setComposeRating] = useState(0)
  const textRef = useRef(null)

  // Load the first photo for every day that has a daily log entry.
  useEffect(() => {
    if (!dailyLogs.length || !voyageId) return
    Promise.all(
      dailyLogs.map((_, i) =>
        getPhotos(i, { voyageId })
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
  const spent     = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt = parseFloat(budget.budget) || 0
  const budgetOver = budgetAmt > 0 && spent > budgetAmt
  const nights    = parseInt(voyage.totalNights) || itinerary.length || 0
  const ports     = itinerary.filter(d => d.port && d.port.trim() && d.port.toLowerCase() !== 'at sea').length
  const logged    = dailyLogs.filter(d => d.highlights || d.bestMoment).length

  // ── Voyage progress ───────────────────────────────────────────────────────
  // Only show progress when the user has explicitly set BOTH a departure date
  // and total nights in Voyage Details. Falling back to itinerary.length would
  // show misleading progress numbers when the voyage isn't properly set up.
  const voyageNights = parseInt(voyage.totalNights) || 0
  const today        = new Date()
  const depDate      = voyage.departureDate ? new Date(voyage.departureDate) : null
  // rawDay is the unclamped day number — can be negative (before departure) or
  // greater than voyageNights (after the cruise ended).
  const rawDay       = (depDate && voyageNights > 0) ? Math.floor((today - depDate) / 86400000) + 1 : null
  const voyageOver   = rawDay !== null && rawDay > voyageNights
  const currentDay   = rawDay !== null ? Math.max(1, Math.min(voyageNights, rawDay)) : null
  // If the voyage has ended, lock the bar at 100% and show "Voyage Complete".
  const voyagePct    = rawDay !== null ? (voyageOver ? 100 : Math.round((currentDay / voyageNights) * 100)) : null
  const daysLeft     = voyageOver ? 0 : (currentDay ? Math.max(0, voyageNights - currentDay) : null)

  // Animate the progress bar from 0 → actual % on mount / when voyagePct changes
  useEffect(() => {
    const t = setTimeout(() => setBarPct(voyagePct || 0), 120)
    return () => clearTimeout(t)
  }, [voyagePct])

  // Fire confetti + horn once per session when voyage is complete
  useEffect(() => {
    if (voyageOver && !hornPlayedRef.current) {
      hornPlayedRef.current = true
      setTimeout(() => {
        playShipHorn()
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4500)
      }, 800)
    }
  }, [voyageOver])

  // ── Feed items ────────────────────────────────────────────────────────────
  // Own posts merged with friend posts, sorted newest first.
  const ownItems = dailyLogs
    .map((log, i) => ({
      ...log,
      dayIndex:     i,
      dayNumber:    i + 1,
      voyageId:     voyageId,
      resolvedPort: log.port || itinerary[i]?.port || '',
      photo:        photosByDay[i] || null,
      author:       null,   // null = own post
    }))
    .filter(log => log.highlights || log.bestMoment || log.activity || log.photo)

  const feedItems = [...ownItems, ...friendPosts]
    .sort((a, b) => {
      // Sort by date descending; fall back to dayIndex if no date
      const da = a.date ? new Date(a.date) : null
      const db = b.date ? new Date(b.date) : null
      if (da && db) return db - da
      if (da) return -1
      if (db) return 1
      return b.dayIndex - a.dayIndex
    })

  // ── Load reactions for all visible posts ─────────────────────────────
  useEffect(() => {
    if (!feedItems.length || !userId) return
    const voyageIds = [...new Set(feedItems.map(i => i.voyageId).filter(Boolean))]
    if (!voyageIds.length) return

    supabase
      .from('reactions')
      .select('voyage_id, day_number, reaction, user_id')
      .in('voyage_id', voyageIds)
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

  // ── Toggle a reaction — radio behaviour (one per post) ───────────────
  // Selecting a new reaction first removes any existing one from this user.
  // Tapping the active reaction again deselects it.
  const handleReact = async (postVoyageId, dayNumber, reactionId) => {
    if (!userId || !postVoyageId) return
    const key = `${postVoyageId}-${dayNumber}`
    const postReactions    = reactionsMap[key] || {}
    const prevReactionId   = Object.entries(postReactions).find(([, v]) => v.mine)?.[0]
    const isSame           = prevReactionId === reactionId
    const adding           = !isSame  // adding=false means user tapped their active reaction

    // Optimistic update — remove old, add new (unless deselecting)
    setReactionsMap(prev => {
      const current = { ...(prev[key] || {}) }
      if (prevReactionId && current[prevReactionId]) {
        current[prevReactionId] = {
          count: Math.max(0, current[prevReactionId].count - 1),
          mine: false,
        }
      }
      if (adding) {
        current[reactionId] = {
          count: (current[reactionId]?.count || 0) + 1,
          mine: true,
        }
      }
      return { ...prev, [key]: current }
    })

    // DB sync — delete previous, insert new
    if (prevReactionId) {
      await supabase.from('reactions').delete()
        .eq('voyage_id',  postVoyageId)
        .eq('day_number', dayNumber)
        .eq('user_id',    userId)
        .eq('reaction',   prevReactionId)
    }
    if (adding) {
      await supabase.from('reactions').insert({
        voyage_id:  postVoyageId,
        day_number: dayNumber,
        user_id:    userId,
        reaction:   reactionId,
      })
    }
  }

  // ── Composer submit ───────────────────────────────────────────────────────
  const handlePost = () => {
    const idx = parseInt(composeDay, 10)
    if (!composeText.trim() || isNaN(idx) || idx < 0 || idx >= dailyLogs.length) return
    const updated = [...dailyLogs]
    const wasFirst = !dailyLogs.some(d => d.highlights || d.bestMoment)
    updated[idx] = {
      ...updated[idx],
      highlights: composeText.trim(),
      ...(composeRating > 0 ? { rating: composeRating } : {}),
    }
    onChange(updated)
    if (wasFirst && showToast) showToast(`Day ${idx + 1} logged! ⚓`)
    setComposing(false)
    setComposeText('')
    setComposeRating(0)
    setComposeDay('')
  }

  const handleComposeOpen = () => {
    setComposing(true)
    // Pre-select today's day if it can be inferred
    if (currentDay) {
      const todayIdx = currentDay - 1
      if (todayIdx >= 0 && todayIdx < dailyLogs.length) setComposeDay(String(todayIdx))
    }
    setTimeout(() => textRef.current?.focus(), 60)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Confetti active={showConfetti} />

      {/* ── Voyage hero — full-bleed banner that morphs to a compact bar ─── */}
      {(() => {
        const HERO_H_FULL = w < BP.mobile ? 210 : 250
        const HERO_H_MIN  = 62
        const heroH = lerp(HERO_H_FULL, HERO_H_MIN, p)
        // Expanded layer fades out in first half of scroll; condensed fades in second half
        const expandedOpacity  = Math.max(0, 1 - p * 2.2)
        const condensedOpacity = Math.max(0, (p - 0.45) * 2.2)

        return (
          <div ref={heroRef} style={{
            position: 'sticky', top: 0, zIndex: 50,
            height: heroH,
            borderRadius: lerp(20, 14, p),
            marginBottom: 16, overflow: 'hidden',
            boxShadow: `0 ${lerp(10, 2, p)}px ${lerp(40, 10, p)}px rgba(3,105,161,${lerp(0.3, 0.12, p)})`,
          }}>

            {/* ── Background: time-of-day gradient (falls back to theme) ─────── */}
            {(() => {
              const tg = getTimeGradient(timeOfDay)
              const [vr, vg, vb] = getVignetteRGB(timeOfDay)
              return (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: tg || 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 50%, var(--t-primary) 100%)',
                    transition: 'background 3s ease',
                  }} />

                  {/* Night sky — twinkling stars + moon */}
                  {timeOfDay === 'night' && (
                    <>
                      {stars.map(s => (
                        <div
                          key={s.id}
                          className="night-star"
                          style={{
                            position: 'absolute',
                            left: `${s.x}%`, top: `${s.y}%`,
                            width: s.size, height: s.size,
                            borderRadius: '50%',
                            background: 'white',
                            animationDelay:    `${s.delay}s`,
                            animationDuration: `${s.duration}s`,
                          }}
                        />
                      ))}
                      <div
                        className="moon-icon"
                        style={{
                          position: 'absolute', top: 14, right: 58,
                          fontSize: 28, opacity: expandedOpacity,
                          pointerEvents: 'none',
                        }}
                      >🌙</div>
                    </>
                  )}

                  {/* Cover photo over background — fades out as banner collapses */}
                  {voyage.coverPhotoUrl && (
                    <img src={voyage.coverPhotoUrl} alt="Voyage cover" style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      opacity: Math.max(0, 1 - p * 1.8),
                    }} />
                  )}

                  {/* Vignette — colour-tinted to match the time of day */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `linear-gradient(to bottom, rgba(${vr},${vg},${vb},0.0) 0%, rgba(${vr},${vg},${vb},${lerp(0.55, 0.78, p)}) 100%)`,
                  }} />
                </>
              )
            })()}


            {/* Decorative rings — gradient-only, fade quickly on scroll */}
            {!voyage.coverPhotoUrl && (
              <>
                <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.13)', pointerEvents: 'none', opacity: expandedOpacity }} />
                <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.08)', pointerEvents: 'none', opacity: expandedOpacity }} />
              </>
            )}

            {/* Animated wave — fades out as banner collapses */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', lineHeight: 0, pointerEvents: 'none', opacity: expandedOpacity }}>
              <svg className="hero-wave-1" viewBox="0 0 1440 60" preserveAspectRatio="none"
                style={{ width: '150%', height: 38, display: 'block', marginLeft: '-10%' }}>
                <path d="M0,40 C240,0 480,60 720,30 C960,0 1200,50 1440,20 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.07)" />
              </svg>
              <svg className="hero-wave-2" viewBox="0 0 1440 40" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, width: '150%', height: 24, display: 'block', marginLeft: '-10%' }}>
                <path d="M0,20 C300,40 600,0 900,20 C1100,35 1280,10 1440,20 L1440,40 L0,40 Z" fill="rgba(255,255,255,0.05)" />
              </svg>
              <svg className="hero-wave-3" viewBox="0 0 1440 30" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, width: '160%', height: 16, display: 'block', marginLeft: '-5%' }}>
                <path d="M0,15 C200,30 500,0 800,15 C1050,28 1300,5 1440,15 L1440,30 L0,30 Z" fill="rgba(255,255,255,0.03)" />
              </svg>
            </div>

            {/* ── Expanded content — pinned to bottom of banner ─────────────── */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: `0 ${w < BP.mobile ? 18 : 28}px 20px`,
              opacity: expandedOpacity,
              transform: `translateY(${lerp(0, 8, p)}px)`,
              pointerEvents: p > 0.35 ? 'none' : 'auto',
            }}>
              {/* Cruise line badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>⚓</div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 700, fontFamily: FONT_BODY }}>
                  {voyage.cruiseLine || 'Cruise Ship Log'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Ship name */}
                  <h1 style={{ margin: '0 0 8px', fontSize: w < BP.mobile ? 30 : 38, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1.05 }}>
                    {voyage.shipName || 'Your Voyage Awaits'}
                  </h1>

                  {/* Dates + port */}
                  {(voyage.departurePort || voyage.departureDate) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', marginBottom: voyagePct !== null ? 12 : 0 }}>
                      {voyage.departurePort && <span style={{ fontSize: 12, color: GOLD }}>📍 {voyage.departurePort}</span>}
                      {voyage.departureDate && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                          📅 {voyage.departureDate}{voyage.returnDate ? ` → ${voyage.returnDate}` : ''}
                        </span>
                      )}
                      {voyage.cabin && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>🚪 Cabin {voyage.cabin}</span>}
                    </div>
                  )}

                  {/* Set up CTA */}
                  {!voyage.shipName && (
                    <button onClick={() => onNav('voyage')} style={{ background: GOLD, color: '#1C2B3A', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY, marginBottom: 10 }}>
                      Set Up Your Voyage →
                    </button>
                  )}

                  {/* Progress bar */}
                  {voyagePct !== null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: FONT_BODY }}>Voyage Progress</span>
                        <span style={{ fontSize: 10, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY }}>
                          {daysLeft === 0 ? 'Voyage Complete ✓' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barPct}%`, background: GOLD, borderRadius: 2, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </div>
                    </div>
                  )}

                  {/* Companions */}
                  {(voyage.companion1 || voyage.companion2) && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>With:</span>
                      {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{c}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day counter ring — desktop */}
                {w >= BP.mobile && voyageNights > 0 && (
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 80, height: 80 }}>
                      <Donut pct={voyagePct || 0} size={80} color={GOLD} bg="rgba(255,255,255,0.1)" thick={6} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: currentDay ? 24 : 18, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                          {currentDay || voyageNights}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                          {currentDay ? `of ${voyageNights}` : 'nights'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                      {currentDay ? 'Current Day' : 'Duration'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Condensed bar — fades in as banner collapses ──────────────── */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              padding: `0 ${w < BP.mobile ? 16 : 24}px`,
              opacity: condensedOpacity,
              pointerEvents: p < 0.55 ? 'none' : 'auto',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, marginRight: 12 }}>⚓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: w < BP.mobile ? 15 : 18, color: WHITE, fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                  {voyage.shipName || 'Your Voyage'}
                </div>
                {voyage.cruiseLine && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: FONT_BODY }}>{voyage.cruiseLine}</div>
                )}
              </div>
              {voyagePct !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, fontFamily: FONT_BODY }}>
                    {daysLeft === 0 ? '✓ Complete' : `Day ${currentDay}`}
                  </span>
                  <div style={{ width: 52, height: 3, background: 'rgba(255,255,255,0.14)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: GOLD, borderRadius: 2 }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Compact metrics strip ─────────────────────────────────────────── */}
      {(() => {
        const completedCount = sectionStatus?.size || 0
        const totalSections  = 12 // all sections except dashboard
        const metrics = [
          { icon: '📖', value: nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—', label: 'Days Logged',      color: NAVY2,                                          nav: 'daily' },
          { icon: '📍', value: ports > 0 ? String(ports) : '—',                                          label: 'Ports',             color: TEAL,                                           nav: 'itinerary' },
          { icon: '💳', value: spent > 0 ? `£${spent.toFixed(0)}` : '£—',                               label: budgetOver ? 'Over Budget!' : 'Spent', color: budgetOver ? '#DC2626' : TEAL, nav: 'budget' },
          { icon: '🏆', value: `${completedCount} / ${totalSections}`,                                   label: 'Journal Complete',  color: completedCount === totalSections ? '#22C55E' : NAVY2, nav: 'highlights' },
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
        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, marginBottom: 16, overflow: 'hidden' }}>
          {!composing ? (
            /* Collapsed state — blue-tinted pill */
            <div
              onClick={handleComposeOpen}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'text', background: 'linear-gradient(135deg, var(--t-bg), var(--t-bg))' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                ⚓
              </div>
              <div style={{ flex: 1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 18px', fontSize: 14, color: MUTED, cursor: 'text', userSelect: 'none', fontFamily: FONT_BODY }}>
                What happened today?
              </div>
            </div>
          ) : (
            /* Expanded composer */
            <div style={{ padding: 16, boxShadow: '0 4px 20px var(--t-btn-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--t-primary), var(--t-primary-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, marginTop: 2 }}>
                  ⚓
                </div>
                <textarea
                  ref={textRef}
                  value={composeText}
                  onChange={e => setComposeText(e.target.value)}
                  placeholder="Share what happened today — highlights, discoveries, experiences..."
                  rows={4}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 15, fontFamily: 'inherit',
                    resize: 'none', lineHeight: 1.7,
                    color: TEXT, background: 'transparent',
                    boxSizing: 'border-box', width: '100%',
                  }}
                />
              </div>

              {/* Composer toolbar */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Day picker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day</span>
                    <select
                      value={composeDay}
                      onChange={e => setComposeDay(e.target.value)}
                      style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', fontSize: 13, fontFamily: 'inherit', color: TEXT, background: WHITE, outline: 'none' }}
                    >
                      <option value="">Select…</option>
                      {dailyLogs.map((log, i) => {
                        const port = log.port || itinerary[i]?.port || ''
                        return (
                          <option key={i} value={i}>
                            Day {i + 1}{port ? ` · ${port.split(',')[0]}` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  {/* Star rating */}
                  <Stars value={composeRating} onChange={setComposeRating} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setComposing(false); setComposeText(''); setComposeRating(0); setComposeDay('') }}
                    style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={!composeText.trim() || composeDay === ''}
                    className="btn-primary"
                    style={{
                      ...sty.btn,
                      padding: '7px 22px', fontSize: 13,
                      cursor: composeText.trim() && composeDay !== '' ? 'pointer' : 'not-allowed',
                      opacity: composeText.trim() && composeDay !== '' ? 1 : 0.45,
                      transition: 'opacity 0.15s, filter 0.15s, transform 0.15s',
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      {feedItems.length === 0 ? (
        /* Empty state */
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
        /* Post cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {feedItems.map((item, i) => (
            <PostCard
              key={i}
              item={item}
              onViewDay={item.author ? null : onViewDay}
              avatarUrl={avatarUrl}
              initials={userInitials}
              author={item.author}
              reactions={reactionsMap[`${item.voyageId}-${item.dayNumber}`] || {}}
              onReact={(rid) => handleReact(item.voyageId, item.dayNumber, rid)}
            />
          ))}

          {/* Bottom CTA — go to full Daily Log */}
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
