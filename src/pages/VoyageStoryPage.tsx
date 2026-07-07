// ─────────────────────────────────────────────────────────────────────────────
// pages/VoyageStoryPage.tsx — Scroll-driven "storybook" home page
//
// Replaces the dashboard at "/". The current voyage unfolds as a sequence of
// full-bleed chapters whose layers drift at different speeds as you scroll
// (parallax), in the editorial spirit of wearecollins.com but rendered in the
// Deck Days palette (Georgia display serif, cream / navy / gold).
//
// Animation engine: GSAP ScrollTrigger with `scrub` (scroll position drives the
// timeline) against the app's <main> scroller — see lib/gsap.ts. Two opt-in
// hooks via data-attributes:
//   data-parallax="<n>"  layer drifts ±n% across the scene, scrubbed to scroll
//   data-reveal          container whose children fade-up once on enter
// Both no-op under prefers-reduced-motion (content stays fully visible).
// ─────────────────────────────────────────────────────────────────────────────

import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger, SCROLLER, prefersReducedMotion } from '../lib/gsap'
import {
  NAVY2, GOLD, CREAM, WHITE, MUTED, TEXT, TEAL, FONT_DISPLAY, FONT_BODY, FONT_ACCENT, BP,
} from '../constants'
import { ChevronDown, MapPin, Anchor, Star, UtensilsCrossed, Wallet } from 'lucide-react'
import { useW, useVoyageId } from '../context'
import { usePostsByVoyage } from '@/features/posts/hooks'
import { publicUrl } from '@/features/posts/mediaStorage'
import BudgetBreakdown from '@/features/voyages/dashboard/BudgetBreakdown'
import Badges from '../sections/profile/Badges'
import type { Voyage, ItineraryDay, DailyLog, Budget, FoodLog, DiningEntry } from '../types'

interface Props {
  voyage:     Voyage
  itinerary:  ItineraryDay[]
  dailyLogs:  DailyLog[]
  budget:     Budget
  foodLogs:   FoodLog[]
  diningLog:  DiningEntry[]
  onNav:      (section: string) => void
  onViewDay?: (dayIndex: number) => void
  heroActions?: ReactNode   // rendered on the cover (e.g. Open Journal / Open Feed)
  heroOverride?: string     // exact hero photo to use (e.g. handed from the book-open transition)
}

// Full-bleed helper: escape the centered 900px column + page padding in App.tsx.
// Safe because <main> sets overflow-x: hidden.
const fullBleed: CSSProperties = {
  position: 'relative', width: '100vw', left: '50%', right: '50%',
  marginLeft: '-50vw', marginRight: '-50vw',
}

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return iso }
}

// Diary-style date: "Thursday 3 July" (handles both YYYY-MM-DD and ISO timestamps).
function formatDiaryDate(iso: string): string {
  if (!iso) return ''
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function VoyageStoryPage({ voyage, itinerary, dailyLogs, budget, foodLogs, diningLog, onNav, onViewDay, heroActions, heroOverride }: Props) {
  const w        = useW()
  const voyageId = useVoyageId()
  const mobile   = w < BP.mobile
  const rootRef  = useRef<HTMLDivElement>(null)

  const { data: voyagePosts = [] } = usePostsByVoyage(voyageId)

  // ── Photos for the memory collage ─────────────────────────────────────────
  const photoUrls = useMemo<string[]>(() => {
    const seen = new Set<string>()
    const urls: string[] = []
    for (const p of voyagePosts) {
      for (const path of p.media_paths ?? []) {
        if (path && !seen.has(path)) { seen.add(path); urls.push(publicUrl(path)) }
      }
    }
    return urls
  }, [voyagePosts])

  // ── Cover background photo ─────────────────────────────────────────────────
  // Prefer an explicit override (the exact photo the book-open transition showed,
  // passed via router state) so the hero matches it; otherwise pick one at random.
  const heroPickedRef = useRef(false)
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string | undefined>()
  useEffect(() => {
    if (heroOverride || heroPickedRef.current || photoUrls.length === 0) return
    heroPickedRef.current = true
    setHeroPhotoUrl(photoUrls[Math.floor(Math.random() * photoUrls.length)])
  }, [photoUrls, heroOverride])
  const heroUrl = heroOverride || heroPhotoUrl

  // ── Derived voyage facts ──────────────────────────────────────────────────
  const nights      = parseInt(voyage.totalNights) || itinerary.length || 0
  const depDate     = voyage.departureDate ? new Date(voyage.departureDate) : null
  const rawDay      = (depDate && nights > 0) ? Math.floor((Date.now() - depDate.getTime()) / 86400000) + 1 : null
  const currentDay  = rawDay !== null ? Math.max(1, Math.min(nights, rawDay)) : null
  const voyagePct   = rawDay !== null ? Math.min(100, Math.round((currentDay! / nights) * 100)) : null

  const ports = useMemo(
    () => itinerary.filter(d => d.port && d.port.trim() && !d.port.toLowerCase().includes('sea')),
    [itinerary],
  )
  const ratingsArr = dailyLogs.filter(d => d.rating > 0).map(d => d.rating)
  const avgRating  = ratingsArr.length ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length : 0

  const spent = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  // Pulled quotes — best moments / highlights from logged days
  const quotes = useMemo(() => {
    const out: { text: string; dayIndex: number; place: string }[] = []
    dailyLogs.forEach((d, i) => {
      const text = (d.bestMoment || d.highlights || '').trim()
      if (text) out.push({ text, dayIndex: i, place: d.port || itinerary[i]?.port || '' })
    })
    return out.slice(0, 3)
  }, [dailyLogs, itinerary])

  // Dining highlights — top-rated venues across both logs
  const dining = useMemo(() => {
    const rows = [
      ...foodLogs.map(f => ({ venue: f.venue, detail: f.what || f.standout, rating: f.rating })),
      ...diningLog.map(d => ({ venue: d.venue, detail: d.ordered, rating: d.rating })),
    ].filter(r => r.venue && r.venue.trim())
    const seen = new Set<string>()
    return rows
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .filter(r => { const k = r.venue.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
      .slice(0, 4)
  }, [foodLogs, diningLog])

  // Food photos across the food log — the centrepiece of "The Table" chapter.
  const foodPhotos = useMemo(() => {
    const out: { url: string; venue: string; what: string; rating: number }[] = []
    for (const f of foodLogs) {
      for (const path of f.photos ?? []) {
        if (path) out.push({ url: publicUrl(path), venue: f.venue || '', what: f.what || f.standout || '', rating: f.rating || 0 })
      }
    }
    return out
  }, [foodLogs])

  // ── Diary entries: the actual posts, each with its OWN photos ──────────────
  // The heart of the "authentic diary" look — text and its pictures together,
  // in chronological order.
  const diaryEntries = useMemo(() => {
    return [...voyagePosts]
      .filter(p => (p.body && p.body.trim()) || (p.media_paths && p.media_paths.length))
      .sort((a, b) => (a.post_date || a.created_at || '').localeCompare(b.post_date || b.created_at || ''))
      .map(p => ({
        id:       p.id,
        date:     p.post_date || p.created_at || '',
        title:    (p.title || '').trim(),
        body:     (p.body || '').trim(),
        location: (p.location || '').trim(),
        photos:   (p.media_paths ?? []).map(publicUrl),
      }))
  }, [voyagePosts])

  const hasVoyage = !!(voyage.shipName || voyage.departureDate)
  // Theme gradient — follows the selected theme via the --t-* CSS vars. Used for
  // the hero tint (under the photo) and section backgrounds, so the page stays on
  // palette rather than shifting with time-of-day.
  const themeGrad = 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)'

  // ── GSAP scroll choreography ──────────────────────────────────────────────
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return
    const scroller = document.querySelector(SCROLLER)
    if (!scroller) return

    const ctx = gsap.context(() => {
      // Parallax: each layer drifts across its scene, scrubbed to scroll. A
      // slightly higher scrub value lerps the motion so it tracks the scroller
      // smoothly instead of snapping frame-to-frame.
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(el => {
        const depth = parseFloat(el.dataset.parallax || '0')
        const scene = (el.closest('[data-scene]') as HTMLElement) || el
        gsap.fromTo(el,
          { yPercent: depth },
          {
            yPercent: -depth, ease: 'none', force3D: true,
            scrollTrigger: { trigger: scene, scroller, start: 'top bottom', end: 'bottom top', scrub: 1 },
          },
        )
      })

      // Reveal: fade-up a container's children once as it enters.
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(group => {
        const kids = Array.from(group.children).filter(c => getComputedStyle(c).display !== 'none')
        gsap.from(kids, {
          autoAlpha: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.1,
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: group, scroller, start: 'top 82%', once: true },
        })
      })

      // Recompute once content (and lazy images) settle.
      requestAnimationFrame(() => ScrollTrigger.refresh())
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 600)
      return () => window.clearTimeout(t)
    }, root)

    return () => ctx.revert()
  }, [photoUrls.length, ports.length, quotes.length, dining.length, hasVoyage])

  // ── Memories gallery: native horizontal scroll ──────────────────────────────
  // Native scrolling runs on the compositor thread, so it stays smooth where the
  // previous GSAP pin+scrub (transform-pinned inside a custom scroller) was not.
  // A wheel handler maps vertical wheel → horizontal pan while the strip still
  // has room; at either end the wheel passes through so the page keeps scrolling.
  const galleryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = galleryRef.current
    if (!el || prefersReducedMotion()) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      const next = el.scrollLeft + e.deltaY
      if ((e.deltaY > 0 && el.scrollLeft < max - 1) || (e.deltaY < 0 && el.scrollLeft > 1)) {
        el.scrollLeft = Math.max(0, Math.min(max, next))
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [photoUrls.length])

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!hasVoyage) {
    return (
      <div style={{ ...fullBleed, minHeight: '80vh', background: themeGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div style={{ maxWidth: 460 }}>
          <Anchor size={40} strokeWidth={1.4} color={WHITE} style={{ opacity: 0.9, marginBottom: 20 }} />
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: WHITE, fontSize: mobile ? 34 : 52, lineHeight: 1.1 }}>
            Your voyage awaits.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontFamily: FONT_BODY, fontSize: mobile ? 15 : 17, lineHeight: 1.7, margin: '16px 0 28px' }}>
            Set up your voyage to begin the story — your ship, your ports, your memories, gathered into one scrolling journal.
          </p>
          <button onClick={() => onNav('voyage')} style={{ background: WHITE, color: NAVY2, border: 'none', borderRadius: 980, padding: '13px 32px', fontSize: 15, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}>
            Set Up Voyage →
          </button>
        </div>
      </div>
    )
  }

  // Shared inner column for readable text within full-bleed scenes
  const col: CSSProperties = { maxWidth: 1280, margin: '0 auto', padding: mobile ? '0 22px' : '0 48px', width: '100%' }

  // ── Magazine type scale ────────────────────────────────────────────────────
  // A clear hierarchy rather than stacked headlines: kicker → headline →
  // italic standfirst → body copy → caption.
  const kicker:    CSSProperties = { fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }
  const eyebrow = kicker // alias kept for cover/closing usage
  const headline:  CSSProperties = { margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 26 : 'clamp(28px, 3.2vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.01em' }
  const standfirst: CSSProperties = { margin: '14px 0 0', fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontWeight: 400, color: NAVY2, fontSize: mobile ? 19 : 'clamp(19px, 1.7vw, 23px)', lineHeight: 1.5, maxWidth: 660 }
  const body:      CSSProperties = { margin: '18px 0 0', fontFamily: FONT_BODY, color: TEXT, fontSize: 16, lineHeight: 1.75, maxWidth: 600 }
  const caption:   CSSProperties = { fontFamily: FONT_BODY, fontStyle: 'italic', color: MUTED, fontSize: 12.5, letterSpacing: '0.01em' }

  return (
    <div ref={rootRef} style={{ marginTop: mobile ? -20 : w < BP.tablet ? -32 : -44 }}>

      {/* ─────────────── COVER — the ship ─────────────── */}
      <section data-scene style={{ ...fullBleed, minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', background: themeGrad }}>
        {/* Background photo layer (slow drift) */}
        {heroUrl && (
          <div data-parallax="14" style={{
            position: 'absolute', inset: '-22% 0', backgroundImage: `url(${heroUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.5,
          }} />
        )}
        {/* Darkening veil for legibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,20,35,0.35) 0%, rgba(10,20,35,0.15) 40%, rgba(10,20,35,0.55) 100%)' }} />

        {/* Foreground title (fast drift) */}
        <div data-parallax="-22" style={{ ...col, position: 'relative', textAlign: 'center', color: WHITE }}>
          <div style={{ ...eyebrow, color: GOLD, marginBottom: 18 }}>
            {voyage.cruiseLine || 'A Deck Days Voyage'}
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 'clamp(40px, 13vw, 56px)' : 'clamp(56px, 7.5vw, 104px)', lineHeight: 1.04, letterSpacing: '-0.01em' }}>
            {voyage.destination || voyage.shipName || 'The Voyage'}
          </h1>
          {(voyage.departureDate || voyage.returnDate) && (
            <div style={{ marginTop: 22, fontFamily: FONT_BODY, fontSize: mobile ? 14 : 17, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
              {formatDate(voyage.departureDate)}{voyage.returnDate ? `  —  ${formatDate(voyage.returnDate)}` : ''}
            </div>
          )}
          {voyagePct !== null && (
            <div style={{ marginTop: 30, maxWidth: 320, marginInline: 'auto' }}>
              <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${voyagePct}%`, background: GOLD }} />
              </div>
              <div style={{ marginTop: 10, ...eyebrow, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                {voyagePct >= 100 ? 'Voyage complete' : currentDay ? `Day ${currentDay} of ${nights}` : `${nights} nights at sea`}
              </div>
            </div>
          )}
          {heroActions && (
            <div style={{ marginTop: mobile ? 30 : 38, maxWidth: 520, marginInline: 'auto' }}>
              {heroActions}
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
          <ChevronDown size={26} strokeWidth={1.6} className="story-bounce" />
        </div>
      </section>

      {/* ─────────────── CHAPTER 01 — the ship & voyage ─────────────── */}
      <section data-scene style={{ ...fullBleed, background: CREAM, padding: mobile ? '90px 0' : '160px 0', overflow: 'hidden' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 01 — The Ship</div>
          <h2 style={headline}>Aboard the {voyage.shipName || 'ship'}</h2>
          <p style={standfirst}>
            {nights} nights at sea{voyage.cruiseLine ? ` with ${voyage.cruiseLine}` : ''}{voyage.departurePort ? `, sailing from ${voyage.departurePort}` : ''}.
          </p>
          {voyage.cruiseDescription?.trim() && <DropCap text={voyage.cruiseDescription.trim()} style={body} />}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: mobile ? '28px 20px' : 40, marginTop: mobile ? 44 : 64 }}>
            <Fact label="Nights at sea" value={nights ? String(nights) : '—'} />
            <Fact label="Ports of call" value={ports.length ? String(ports.length) : '—'} />
            <Fact label="From" value={voyage.departurePort || '—'} />
            <Fact label="Cabin" value={voyage.cabin ? `${voyage.cabin}${voyage.deck ? ` · Deck ${voyage.deck}` : ''}` : '—'} />
          </div>
        </div>
      </section>

      {/* ─────────────── CHAPTER 02 — the route ─────────────── */}
      {ports.length > 0 && (
        <section data-scene style={{ ...fullBleed, background: NAVY2, color: WHITE, padding: mobile ? '90px 0' : '160px 0', overflow: 'hidden' }}>
          {/* drifting watermark */}
          <div data-parallax="20" aria-hidden style={{ position: 'absolute', top: '-6%', right: mobile ? -40 : 20, fontFamily: FONT_DISPLAY, fontSize: mobile ? 200 : 360, color: 'rgba(255,255,255,0.04)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
            {ports.length}
          </div>
          <div style={{ ...col, position: 'relative' }}>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 02 — The Route</div>
            <h2 style={{ ...headline, color: WHITE }}>
              {ports.length} {ports.length === 1 ? 'port' : 'ports'} of call
            </h2>
            <p style={{ ...standfirst, color: 'rgba(255,255,255,0.85)' }}>
              {ports.length > 1
                ? `From ${ports[0].port} to ${ports[ports.length - 1].port}, every landfall in order.`
                : 'One day ashore on this voyage.'}
            </p>
            <div data-reveal style={{ marginTop: mobile ? 36 : 56, display: 'flex', flexDirection: 'column' }}>
              {ports.map((d, i) => {
                const dayIndex = itinerary.indexOf(d)
                const times = [d.arrive && `Arrive ${d.arrive}`, d.depart && `Depart ${d.depart}`].filter(Boolean).join(' · ')
                return (
                  <button
                    key={`${d.port}-${i}`}
                    onClick={() => onViewDay?.(dayIndex)}
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: mobile ? 14 : 24, padding: mobile ? '16px 0' : '18px 0',
                      background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.14)',
                      cursor: 'pointer', textAlign: 'left', color: WHITE, width: '100%',
                    }}
                  >
                    <span style={{ ...kicker, fontSize: 12, color: GOLD, minWidth: 34 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: FONT_DISPLAY, fontSize: mobile ? 21 : 26, fontWeight: 400, lineHeight: 1.2 }}>
                        {d.port}
                      </span>
                      {times && <span style={{ ...caption, color: 'rgba(255,255,255,0.55)' }}>{times}</span>}
                    </span>
                    {d.date && <span style={{ fontFamily: FONT_BODY, fontSize: mobile ? 12 : 13.5, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>{formatDate(d.date)}</span>}
                    <MapPin size={mobile ? 15 : 18} strokeWidth={1.6} color="rgba(255,255,255,0.5)" />
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────── CHAPTER 03 — the memories (intro) ─────────────── */}
      {(diaryEntries.length > 0 || photoUrls.length > 0 || quotes.length > 0) && (
        <section data-scene style={{ ...fullBleed, background: CREAM, padding: mobile ? '90px 0' : '140px 0', overflow: 'hidden' }}>
          <div style={col}>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 03 — The Diary</div>
            <h2 style={headline}>Pages from the voyage</h2>
            <p style={standfirst}>The days that earned a place in the journal — and the photographs that go with them.</p>
            {avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={16} fill={n <= Math.round(avgRating) ? GOLD : 'none'} color={GOLD} strokeWidth={1.5} />
                  ))}
                </span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED }}>
                  {avgRating.toFixed(1)} average across {ratingsArr.length} {ratingsArr.length === 1 ? 'day' : 'days'} logged
                </span>
              </div>
            )}
          </div>

          {/* Diary entries — each post with its OWN photos, in date order. Falls
              back to pulled quotes (from the daily log) when there are no posts. */}
          {diaryEntries.length > 0 ? (
            <div style={{ ...col, marginTop: mobile ? 44 : 68 }} data-reveal>
              {diaryEntries.map((e, i) => (
                <article key={e.id} style={{ padding: mobile ? '26px 0' : '40px 0', borderTop: i === 0 ? 'none' : '1px solid #E0DBD0' }}>
                  {/* Handwritten-style date */}
                  <div style={{ fontFamily: FONT_ACCENT, fontWeight: 700, fontSize: mobile ? 27 : 34, color: GOLD, lineHeight: 1 }}>
                    {formatDiaryDate(e.date)}
                  </div>
                  {e.location && (
                    <div style={{ ...kicker, fontSize: 11, color: MUTED, marginTop: 8 }}>{e.location}</div>
                  )}
                  {e.title && (
                    <h3 style={{ margin: '12px 0 0', fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 22 : 27, lineHeight: 1.2 }}>{e.title}</h3>
                  )}
                  {e.body && (
                    <p style={{ margin: '12px 0 0', fontFamily: FONT_DISPLAY, color: TEXT, fontSize: mobile ? 16 : 18, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{e.body}</p>
                  )}
                  {e.photos.length > 0 && (
                    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: e.photos.length === 1 ? '1fr' : mobile ? '1fr 1fr' : `repeat(${Math.min(e.photos.length, 3)}, 1fr)`, gap: 12 }}>
                      {e.photos.slice(0, 6).map((url, pi) => (
                        <div key={pi} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${WHITE}`, background: WHITE, aspectRatio: e.photos.length === 1 ? '16 / 9' : '4 / 3', boxShadow: '0 8px 22px rgba(20,41,63,0.10)' }}>
                          <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : quotes.length > 0 ? (
            <div style={{ ...col, marginTop: mobile ? 48 : 76 }} data-reveal>
              {quotes.map((q, i) => (
                <blockquote
                  key={i}
                  onClick={() => onViewDay?.(q.dayIndex)}
                  style={{
                    margin: 0, padding: mobile ? '24px 0' : '32px 0', cursor: 'pointer',
                    borderTop: i === 0 ? 'none' : '1px solid #E0DBD0',
                  }}
                >
                  <span style={{
                    fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontWeight: 400, color: NAVY2,
                    fontSize: mobile ? 21 : 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.4,
                  }}>
                    <span style={{ color: GOLD, fontStyle: 'normal' }}>“</span>{q.text}<span style={{ color: GOLD, fontStyle: 'normal' }}>”</span>
                  </span>
                  <cite style={{ ...kicker, display: 'block', marginTop: 12, color: MUTED, fontStyle: 'normal' }}>
                    Day {q.dayIndex + 1}{q.place ? ` — ${q.place}` : ''}
                  </cite>
                </blockquote>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* ─────────────── CHAPTER 03 — horizontal gallery ─────────────── */}
      {photoUrls.length > 0 && (
        <section style={{ ...fullBleed, background: NAVY2, padding: mobile ? '70px 0' : '110px 0', overflow: 'hidden' }}>
          <div style={{ ...col, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: mobile ? 24 : 34 }}>
            <span style={{ ...kicker, color: GOLD }}>
              The Gallery · {Math.min(photoUrls.length, 8)} {Math.min(photoUrls.length, 8) === 1 ? 'photo' : 'photos'}
            </span>
            <span style={{ ...caption, color: 'rgba(255,255,255,0.55)', fontStyle: 'normal', whiteSpace: 'nowrap' }}>
              Scroll or swipe to explore →
            </span>
          </div>

          {/* Native horizontal scroll — smooth on the compositor; wheel is mapped
              to horizontal pan by the effect above. */}
          <div
            ref={galleryRef}
            className="story-gallery"
            style={{
              display: 'flex', gap: mobile ? 16 : 28, padding: mobile ? '0 22px' : '0 6vw',
              overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none',
            }}
          >
            {photoUrls.slice(0, 8).map((url, i) => (
              <figure
                key={url}
                style={{
                  position: 'relative', flexShrink: 0, margin: 0, scrollSnapAlign: 'center',
                  width: mobile ? '80vw' : 'clamp(300px, 34vw, 460px)',
                  height: mobile ? '56vh' : '68vh',
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                  backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              >
                <figcaption style={{ position: 'absolute', left: 16, bottom: 14, display: 'flex', gap: 8, alignItems: 'baseline', ...caption, fontStyle: 'normal', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>/ {String(Math.min(photoUrls.length, 8)).padStart(2, '0')}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────── CHAPTER — the table (food photos) ─────────────── */}
      {foodPhotos.length > 0 && (
        <section data-scene style={{ ...fullBleed, background: '#1A1410', color: WHITE, padding: mobile ? '80px 0' : '140px 0', overflow: 'hidden' }}>
          <div data-parallax="16" aria-hidden style={{ position: 'absolute', top: '-4%', left: mobile ? -30 : 24, fontFamily: FONT_DISPLAY, fontSize: mobile ? 180 : 320, color: 'rgba(255,255,255,0.035)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
            {foodPhotos.length}
          </div>
          <div style={{ ...col, position: 'relative' }}>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter — The Table</div>
            <h2 style={{ ...headline, color: WHITE }}>Every dish worth remembering</h2>
            <p style={{ ...standfirst, color: 'rgba(255,255,255,0.85)' }}>
              The flavours of the voyage — from the buffet at dawn to the late, candlelit plates.
            </p>
          </div>
          <div
            data-reveal
            style={{
              marginTop: mobile ? 36 : 56, display: 'grid', gap: mobile ? 12 : 16,
              gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              padding: mobile ? '0 22px' : '0 6vw',
            }}
          >
            {foodPhotos.slice(0, 9).map((p, i) => (
              <figure
                key={p.url + i}
                style={{
                  position: 'relative', margin: 0, borderRadius: 14, overflow: 'hidden',
                  aspectRatio: '1 / 1', boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                  backgroundImage: `url(${p.url})`, backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              >
                {/* gradient + caption */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.72) 100%)' }} />
                <figcaption style={{ position: 'absolute', left: 12, right: 12, bottom: 11 }}>
                  {p.venue && <div style={{ fontFamily: FONT_DISPLAY, fontSize: mobile ? 15 : 18, color: WHITE, lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{p.venue}</div>}
                  {p.what && <div style={{ ...caption, fontStyle: 'normal', color: 'rgba(255,255,255,0.8)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.what}</div>}
                  {p.rating > 0 && (
                    <div style={{ display: 'inline-flex', gap: 2, marginTop: 5 }}>
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={11} fill={n <= p.rating ? GOLD : 'none'} color={GOLD} strokeWidth={1.5} />)}
                    </div>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────── CHAPTER 04 — the ledger ─────────────── */}
      {(spent > 0 || dining.length > 0) && (
        <section data-scene style={{ ...fullBleed, background: WHITE, padding: mobile ? '90px 0' : '150px 0', overflow: 'hidden' }}>
          <div style={col} data-reveal>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 04 — The Ledger</div>
            <h2 style={headline}>
              {spent > 0 ? <>£{spent.toLocaleString('en-GB', { maximumFractionDigits: 0 })} <span style={{ color: MUTED, fontStyle: 'italic' }}>well spent</span></> : 'Tastes of the voyage'}
            </h2>
            <p style={standfirst}>
              {spent > 0
                ? 'Every excursion, drink and souvenir of the trip, totted up.'
                : 'The tables and dishes worth remembering.'}
            </p>

            {spent > 0 && (
              <div style={{ marginTop: mobile ? 36 : 56, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wallet size={18} strokeWidth={1.7} color={TEAL} />
                <span style={{ ...eyebrow, fontSize: 12, color: MUTED }}>Where it went</span>
              </div>
            )}
            {spent > 0 && <div style={{ marginTop: 16 }}><BudgetBreakdown budget={budget} /></div>}

            {dining.length > 0 && (
              <>
                <div style={{ marginTop: mobile ? 44 : 64, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <UtensilsCrossed size={18} strokeWidth={1.7} color="#F97316" />
                  <span style={{ ...eyebrow, fontSize: 12, color: MUTED }}>Tables to remember</span>
                </div>
                <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 14 : 22 }}>
                  {dining.map((d, i) => (
                    <div key={i} style={{ borderTop: '2px solid #1B3A5C', paddingTop: 14 }}>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: mobile ? 20 : 24, color: NAVY2 }}>{d.venue}</div>
                      {d.detail && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{d.detail}</div>}
                      {d.rating > 0 && (
                        <div style={{ display: 'inline-flex', gap: 2, marginTop: 8 }}>
                          {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} fill={n <= d.rating ? GOLD : 'none'} color={GOLD} strokeWidth={1.5} />)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ─────────────── ACHIEVEMENTS — voyage-specific badges ─────────────── */}
      {voyageId && (
        <section data-scene style={{ ...fullBleed, background: CREAM, padding: mobile ? '60px 0' : '110px 0', overflow: 'hidden' }}>
          <div style={col} data-reveal>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 05 — Achievements</div>
            <h2 style={{ ...headline, marginBottom: 24 }}>What this voyage earned</h2>
            <Badges currentVoyage={{ id: voyageId, ship_name: voyage.shipName, total_nights: voyage.totalNights }} />
          </div>
        </section>
      )}

      {/* ─────────────── CLOSING ─────────────── */}
      {/* Theme gradient (not the time-of-day atmosphere) so it matches the palette. */}
      <section data-scene style={{ ...fullBleed, minHeight: '70vh', background: themeGrad, color: WHITE, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div data-parallax="-12" style={{ ...col, textAlign: 'center' }}>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Fin</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 32 : 'clamp(38px, 5vw, 60px)', lineHeight: 1.1 }}>
            {voyagePct !== null && voyagePct >= 100 ? 'Until the next horizon.' : 'The voyage continues.'}
          </h2>
          <p style={{ margin: '14px auto 0', maxWidth: 460, fontFamily: FONT_BODY, fontSize: mobile ? 14 : 15.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
            Keep writing the story — every day at sea, beautifully remembered.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            <button onClick={() => onNav('daily')} style={{ background: WHITE, color: NAVY2, border: 'none', borderRadius: 980, padding: '13px 30px', fontSize: 15, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}>
              Open the journal →
            </button>
            <Link to="/gallery" style={{ background: 'transparent', color: WHITE, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 980, padding: '13px 30px', fontSize: 15, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
              View gallery
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Editorial stat ──────────────────────────────────────────────────────────
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: '1px solid #E0DBD0', paddingTop: 14 }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 'clamp(22px, 2.4vw, 30px)', lineHeight: 1.05 }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, marginTop: 8 }}>
        {label}
      </div>
    </div>
  )
}

// ── Drop-cap body paragraph ───────────────────────────────────────────────────
function DropCap({ text, style }: { text: string; style: CSSProperties }) {
  const first = text.charAt(0)
  const rest  = text.slice(1)
  return (
    <p style={style}>
      <span style={{ float: 'left', fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: '3.1em', lineHeight: 0.78, paddingRight: 10, marginTop: 4 }}>
        {first}
      </span>
      {rest}
    </p>
  )
}
