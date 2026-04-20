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

import { useState, useEffect, useRef } from 'react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, TEAL, ROSE, CORAL, BP, sty, FONT_DISPLAY, FONT_BODY, SECTION_COLORS } from '../constants'
import { useW, useVoyageId, useUserId } from '../context'
import { Donut, Stars } from '../components/ui'
import { getPhotos } from '../lib/photoStorage'
import { supabase } from '../lib/supabase'

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
function PostCard({ item, onViewDay, avatarUrl, initials }) {
  const w = useW()
  const { dayIndex, resolvedPort, date, highlights, bestMoment, weather,
          breakfast, lunch, dinner, drink, activity, rating, photo } = item

  const meals = [
    breakfast && { icon: '🍳', text: breakfast },
    lunch     && { icon: '🥗', text: lunch },
    dinner    && { icon: '🍝', text: dinner },
    drink     && { icon: '🍷', text: drink },
  ].filter(Boolean)

  return (
    <div className="feed-card" style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden', borderTop: `4px solid ${NAVY}`, position: 'relative' }}>

      {/* ── Profile avatar — top-right corner ────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 12, right: 14,
        width: 36, height: 36, borderRadius: '50%',
        background: NAVY2, border: `2px solid ${WHITE}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif' }}>{initials}</span>
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

      {/* ── Card footer: view full day link ────────────────────────────────── */}
      <div style={{ padding: '10px 18px', borderTop: `1px solid ${BORDER}`, background: '#F0F9FF', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onViewDay(dayIndex)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: NAVY2, fontFamily: FONT_BODY, fontWeight: 700, padding: 0 }}>
          View full day →
        </button>
      </div>
    </div>
  )
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export default function Feed({ voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog, sectionStatus, onChange, onNav, showToast, onViewDay }) {
  const w        = useW()
  const voyageId = useVoyageId()
  const userId   = useUserId()

  // User profile — avatar and initials for the post card attribution bubble
  const [avatarUrl, setAvatarUrl]     = useState('')
  const [userInitials, setUserInitials] = useState('?')

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
        const name = data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim()
        const words = name.trim().split(/\s+/).filter(Boolean)
        if (words.length >= 2) setUserInitials((words[0][0] + words[words.length - 1][0]).toUpperCase())
        else if (words[0]) setUserInitials(words[0].slice(0, 2).toUpperCase())
      })
  }, [userId])

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
    const handler = () => setScrollY(Math.min(parent.scrollTop, 150))
    parent.addEventListener('scroll', handler, { passive: true })
    return () => parent.removeEventListener('scroll', handler)
  }, [])

  // Linear interpolation helper — drives all hero size/opacity transitions
  const lerp = (a, b, t) => a + (b - a) * t
  const p = scrollY / 150  // 0 = full size, 1 = fully condensed

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

  // ── Feed items ────────────────────────────────────────────────────────────
  // Only show days that have some content — empty days stay out of the feed.
  // Reversed so the most recent entry appears at the top, like a social feed.
  const feedItems = dailyLogs
    .map((log, i) => ({
      ...log,
      dayIndex:     i,
      resolvedPort: log.port || itinerary[i]?.port || '',
      photo:        photosByDay[i] || null,
    }))
    .filter(log => log.highlights || log.bestMoment || log.activity || log.photo)
    .reverse()

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

      {/* ── Voyage hero — sticky + collapses as user scrolls ─────────────── */}
      <div ref={heroRef} style={{
        background: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
        borderRadius: lerp(20, 14, p),
        marginBottom: 16, position: 'sticky', top: 0, zIndex: 50, overflow: 'hidden',
        boxShadow: `0 ${lerp(6, 3, p)}px ${lerp(24, 12, p)}px rgba(3,105,161,0.25)`,
      }}>
        {/* Cover photo — full-width banner at top of hero when set */}
        {voyage.coverPhotoUrl && (
          <div style={{ width: '100%', height: w < BP.mobile ? 160 : 220, overflow: 'hidden' }}>
            <img
              src={voyage.coverPhotoUrl}
              alt="Voyage cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Content area — padding shrinks as hero condenses */}
        <div style={{ padding: `${lerp(w < BP.mobile ? 20 : 28, 10, p)}px ${w < BP.mobile ? 18 : 32}px`, position: 'relative' }}>

        {/* Decorative rings — only shown when no cover photo */}
        {!voyage.coverPhotoUrl && <>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.15)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.1)', pointerEvents: 'none' }} />
        </>}

        {/* Animated wave — sits at the bottom of the hero */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', lineHeight: 0, pointerEvents: 'none' }}>
          <svg className="hero-wave-1" viewBox="0 0 1440 60" preserveAspectRatio="none"
            style={{ width: '150%', height: 40, display: 'block', marginLeft: '-10%' }}>
            <path d="M0,40 C240,0 480,60 720,30 C960,0 1200,50 1440,20 L1440,60 L0,60 Z" fill="rgba(255,255,255,0.07)" />
          </svg>
          <svg className="hero-wave-2" viewBox="0 0 1440 40" preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: 0, width: '150%', height: 26, display: 'block', marginLeft: '-10%' }}>
            <path d="M0,20 C300,40 600,0 900,20 C1100,35 1280,10 1440,20 L1440,40 L0,40 Z" fill="rgba(255,255,255,0.05)" />
          </svg>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Cruise line badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>⚓</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                {voyage.cruiseLine || 'Cruise Ship Log'}
              </span>
            </div>

            {/* Ship name — shrinks from display to compact as hero condenses */}
            <h1 style={{
              margin: 0,
              fontSize: lerp(w < BP.mobile ? 32 : 40, w < BP.mobile ? 18 : 22, p),
              fontWeight: 400, color: WHITE,
              fontFamily: FONT_DISPLAY, lineHeight: 1.1,
              marginBottom: lerp(10, 4, p),
            }}>
              {voyage.shipName || 'Your Voyage Awaits'}
            </h1>

            {/* Location + dates row — fades out as hero condenses */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginBottom: voyagePct !== null ? lerp(16, 0, p) : 0, opacity: lerp(1, 0, Math.min(1, p * 2)), overflow: 'hidden', maxHeight: lerp(60, 0, p) }}>
              {voyage.departurePort && (
                <span style={{ fontSize: 13, color: GOLD }}>📍 {voyage.departurePort}</span>
              )}
              {voyage.departureDate && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  📅 {voyage.departureDate}{voyage.returnDate ? ` → ${voyage.returnDate}` : ''}
                </span>
              )}
              {voyage.cabin && (
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>🚪 Cabin {voyage.cabin}</span>
              )}
            </div>

            {/* Set up CTA */}
            {!voyage.shipName && (
              <button
                onClick={() => onNav('voyage')}
                style={{ background: GOLD, color: '#1C2B3A', border: 'none', borderRadius: 12, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY }}>
                Set Up Your Voyage →
              </button>
            )}

            {/* Progress bar */}
            {voyagePct !== null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Voyage Progress</span>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>
                    {daysLeft === 0 ? 'Voyage Complete ✓' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barPct}%`, background: GOLD, borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            )}
          </div>

          {/* Day counter ring — desktop only, fades as hero condenses */}
          {w >= BP.mobile && voyageNights > 0 && (
            <div style={{ flexShrink: 0, textAlign: 'center', opacity: lerp(1, 0, Math.min(1, p * 1.5)), overflow: 'hidden', maxWidth: lerp(90, 0, p) }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <Donut pct={voyagePct || 0} size={90} color={GOLD} bg="rgba(255,255,255,0.07)" thick={7} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: currentDay ? 26 : 20, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>
                    {currentDay || voyageNights}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.05em', marginTop: 2 }}>
                    {currentDay ? `of ${voyageNights}` : 'nights'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 5 }}>
                {currentDay ? 'Current Day' : 'Duration'}
              </div>
            </div>
          )}
        </div>

        {/* Companions strip — collapses as hero condenses */}
        {(voyage.companion1 || voyage.companion2) && (
          <div style={{ marginTop: lerp(14, 0, p), paddingTop: lerp(12, 0, p), borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', opacity: lerp(1, 0, Math.min(1, p * 2)), overflow: 'hidden', maxHeight: lerp(60, 0, p) }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>With:</span>
            {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{c}</div>
            ))}
          </div>
        )}
        </div> {/* end content padding div */}

        {/* Fade overlay — deepens gradually as hero condenses */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
          background: 'linear-gradient(to bottom, transparent, rgba(3,105,161,0.85))',
          pointerEvents: 'none',
          opacity: p,
          zIndex: 2,
        }} />
      </div>

      {/* ── Compact metrics strip ─────────────────────────────────────────── */}
      {(() => {
        const completedCount = sectionStatus?.size || 0
        const totalSections  = 12 // all sections except dashboard
        const metrics = [
          { icon: '📖', value: nights > 0 ? `${logged} / ${nights}` : logged > 0 ? String(logged) : '—', label: 'Days Logged', color: NAVY2 },
          { icon: '📍', value: ports > 0 ? String(ports) : '—', label: 'Ports', color: TEAL },
          { icon: '💳', value: spent > 0 ? `£${spent.toFixed(0)}` : '£—', label: budgetOver ? 'Over Budget!' : 'Spent', color: budgetOver ? '#DC2626' : TEAL },
          { icon: '🏆', value: `${completedCount} / ${totalSections}`, label: 'Journal Complete', color: completedCount === totalSections ? '#22C55E' : NAVY2 },
        ]
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${w < BP.mobile ? 2 : 4}, 1fr)`, gap: 10, marginBottom: 16 }}>
            {metrics.map(m => (
              <div key={m.label} style={{ background: `linear-gradient(135deg, ${WHITE} 60%, ${m.color}18 100%)`, border: `1px solid ${BORDER}`, borderRadius: 16, padding: w < BP.mobile ? '10px 8px' : '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>{m.icon}</div>
                <div style={{ fontSize: w < BP.mobile ? 16 : 22, fontWeight: 400, color: m.color, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3, fontFamily: FONT_BODY }}>{m.label}</div>
              </div>
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
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'text', background: 'linear-gradient(135deg, #F0F9FF, #EFF9FF)' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                ⚓
              </div>
              <div style={{ flex: 1, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '10px 18px', fontSize: 14, color: MUTED, cursor: 'text', userSelect: 'none', fontFamily: FONT_BODY }}>
                What happened today?
              </div>
            </div>
          ) : (
            /* Expanded composer */
            <div style={{ padding: 16, boxShadow: '0 4px 20px rgba(14,165,233,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #0369A1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, marginTop: 2 }}>
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
          {feedItems.map(item => (
            <PostCard key={item.dayIndex} item={item} onViewDay={onViewDay} avatarUrl={avatarUrl} initials={userInitials} />
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
