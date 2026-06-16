// ─────────────────────────────────────────────────────────────────────────────
// pages/LandingPage.tsx — Public marketing page for logged-out visitors
//
// Shown at "/" when there is no session (see the !session branch in App.tsx).
// Explains and advertises Deck Days. Visual language follows the clean, premium,
// imagery-led feel of coralcap.co — large serif headlines, generous whitespace,
// restrained CTAs — rendered in the Deck Days palette. The signature motion is
// an animated ocean: layered SVG wave bands that drift continuously (see the
// .wave-* rules in index.css), symbolising the sea.
// ─────────────────────────────────────────────────────────────────────────────

import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import { useWindowSize, WCtx } from '../context'
import {
  NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, FONT_DISPLAY, FONT_BODY, FONT_LOGO, BP,
} from '../constants'
import { BookOpen, MapPin, Image as ImageIcon, Users, Wallet, Compass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Footer from '../components/Footer'
// Real journal-section components, rendered with sample data as live previews.
import VoyageForm from '../features/voyages/VoyageForm'
import ItineraryEditor from '../features/voyages/ItineraryEditor'
import BudgetTracker from '../sections/BudgetTracker'
import DiningLog from '../sections/DiningLog'
import Notes from '../sections/Notes'
import DailyLogSection from '../sections/DailyLog'
import FeedItem from '../features/feed/FeedItem'
import type { FeedRow } from '../features/feed/hooks'
import type { Voyage, ItineraryDay, Budget, DiningEntry, Note, DailyLog } from '../types'

// Smooth wave that starts and ends at the same height, so two copies tile cleanly.
const WAVE_PATH = 'M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z'

function WaveSvg({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path d={WAVE_PATH} fill={fill} />
    </svg>
  )
}

// A single drifting wave band. `speed` = seconds per loop (lower = faster).
function WaveLayer({ fill, height, speed, opacity = 1, offset = 0 }: {
  fill: string; height: number; speed: number; opacity?: number; offset?: number
}) {
  return (
    <div className="wave-layer" style={{ height, opacity, transform: `translateY(${offset}px)` }}>
      <div className="wave-track" style={{ height: '100%', animationDuration: `${speed}s` }}>
        <WaveSvg fill={fill} />
        <WaveSvg fill={fill} />
      </div>
    </div>
  )
}

// The full ocean: stacked translucent crests over a deep base, with the front
// crest rendered in the next section's colour so the boundary itself ripples.
function Ocean({ frontFill }: { frontFill: string }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, pointerEvents: 'none', overflow: 'hidden' }}>
      <WaveLayer fill="rgba(255,255,255,0.06)" height={130} speed={26} offset={6} />
      <WaveLayer fill="rgba(255,255,255,0.10)" height={104} speed={19} />
      <WaveLayer fill="rgba(255,255,255,0.14)" height={78}  speed={13} />
      <WaveLayer fill={frontFill}              height={54}  speed={9} />
    </div>
  )
}

const SEA = 'linear-gradient(165deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)'

interface Feature { Icon: LucideIcon; title: string; body: string }

const FEATURES: Feature[] = [
  { Icon: BookOpen,  title: 'A journal for every voyage', body: 'Day-by-day entries for each cruise — highlights, meals, weather and the moments worth keeping.' },
  { Icon: MapPin,    title: 'Itinerary & ports',          body: 'Lay out your route, track every port of call and open any day to relive it.' },
  { Icon: ImageIcon, title: 'Photos & memories',          body: 'Gather your photographs into a living gallery, organised by trip and by day.' },
  { Icon: Users,     title: 'A private feed',             body: 'Choose what to share — keep the journal to yourself, or post select moments to family and friends.' },
  { Icon: Wallet,    title: 'Budget tracking',            body: 'Log excursions, drinks and souvenirs, and see exactly where the voyage went.' },
  { Icon: Compass,   title: 'Your whole cruise, gathered', body: 'Dining, entertainment, packing and more — one calm home for the entire voyage.' },
]

// ── In-app preview ───────────────────────────────────────────────────────────
// Each preview renders a REAL journal-section component (VoyageForm,
// ItineraryEditor, DiningLog, BudgetTracker, Notes) seeded with fictional sample
// data — the genuine developed pages, with no real or privately-owned content.
// Wrapped in WCtx so the components see the current width, and made static
// (pointer-events:none, cropped with a fade) so they read as screen grabs.
const PREVIEW_VOYAGE = {
  shipName: 'Azure Horizon', cruiseLine: 'Celestia Cruises', cabin: '10412', deck: '10',
  departureDate: '2026-05-04', returnDate: '2026-05-11', departurePort: 'Barcelona, Spain',
  totalNights: '7', companion1: 'Sam', companion2: 'Priya', companion3: '', companion4: '',
  emergencyContact: 'Jordan Lee', phone: '+44 7700 900123', guestServices: 'Dial 0',
  musterStation: 'B', diningTime: 'Late · 8:30pm', breakfastTime: '7:30am', lunchTime: '12:30pm',
  roomLocation: 'Midship', safeboxPin: '', coverPhotoUrl: '',
  cruiseDescription: 'A week through the western Mediterranean.',
} as unknown as Voyage

const PREVIEW_ITINERARY: ItineraryDay[] = [
  { date: '2026-05-04', port: 'Barcelona', arrive: '',      depart: '18:00' },
  { date: '2026-05-05', port: 'At sea',    arrive: '',      depart: ''      },
  { date: '2026-05-06', port: 'Naples',    arrive: '08:00', depart: '19:00' },
  { date: '2026-05-07', port: 'Santorini', arrive: '07:00', depart: '21:00' },
  { date: '2026-05-08', port: 'Mykonos',   arrive: '09:00', depart: '18:00' },
]

const PREVIEW_DINING = [
  { id: 'd1', venue: 'La Terrazza',  date: '2026-05-06', meal: 'Dinner', ordered: 'Seafood linguine',          rating: 5, notes: 'Best pasta of the trip.' },
  { id: 'd2', venue: 'Aurora Grill', date: '2026-05-07', meal: 'Dinner', ordered: 'Ribeye, peppercorn sauce',  rating: 4, notes: 'Cooked perfectly.' },
  { id: 'd3', venue: 'Sakura',       date: '2026-05-08', meal: 'Lunch',  ordered: 'Omakase set',               rating: 5, notes: 'Worth the cover charge.' },
] as unknown as DiningEntry[]

const PREVIEW_BUDGET = {
  budget: '1000',
  items: [
    { date: '2026-05-06', item: 'Pompeii tour',      category: 'Excursions', amount: '180' },
    { date: '2026-05-07', item: 'Catamaran cruise',  category: 'Excursions', amount: '150' },
    { date: '2026-05-04', item: 'Cava & tapas',      category: 'Drinks',     amount: '90'  },
    { date: '2026-05-08', item: 'Ceramics',          category: 'Shopping',   amount: '120' },
    { date: '2026-05-06', item: 'Speciality dinner', category: 'Dining',     amount: '110' },
  ],
} as Budget

const PREVIEW_NOTES = [
  { id: 'n1', title: 'Packing reminders', content: 'Bring the good camera and a power adapter. Formal night is day 3.' },
  { id: 'n2', title: 'For next time',     content: 'Book Santorini excursions early — the catamaran sold out fast.' },
] as unknown as Note[]

// Sample feed posts (text-only — no media, so nothing to fetch and no private
// content). created_at is relative to now so the timestamps read naturally.
const PREVIEW_FEED = [
  {
    id: 'p1', user_id: 'u1', voyage_id: 'v1',
    author_display_name: 'Priya Sharma', author_avatar_url: null,
    ship_name: 'Azure Horizon', cruise_line: 'Celestia Cruises', audience: 'public',
    title: '', body: 'Sailed past the Santorini caldera at sunset and the whole deck went quiet. Easily the best evening of the trip. 🌅',
    location: 'Santorini, Greece', post_date: '2026-05-07',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), media_paths: [], metadata: {},
  },
  {
    id: 'p2', user_id: 'u2', voyage_id: 'v1',
    author_display_name: 'The Bennetts', author_avatar_url: null,
    ship_name: 'Azure Horizon', cruise_line: 'Celestia Cruises', audience: 'family',
    title: '', body: 'Pompeii today with the kids — they actually loved it. Gelato in Naples afterwards. Shared with family only. 🍦',
    location: 'Naples, Italy', post_date: '2026-05-06',
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(), media_paths: [], metadata: {},
  },
] as unknown as FeedRow[]

const PREVIEW_DAILY = [
  {
    date: '2026-05-04', port: 'Barcelona', weather: ['Sunny'],
    highlights: 'Sagrada Família at golden hour, then tapas through the Gothic Quarter.',
    breakfast: 'Buffet on deck 14', lunch: 'Pan con tomate ashore', dinner: 'Seafood linguine at La Terrazza',
    drink: 'Cava', activity: 'Old town walking tour', duration: '3h', excCost: '0', excNotes: 'Self-guided',
    entertainment: 'Welcome-aboard show', bestMoment: 'Sailing past the harbour at sunset.', rating: 5, isPublic: true,
  },
  { date: '2026-05-05', port: 'At sea',  weather: ['Mild'], highlights: 'Spa morning and a long, slow lunch.', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 4, isPublic: false },
  { date: '2026-05-06', port: 'Naples',  weather: ['Hot'],  highlights: 'Day trip to Pompeii.',               breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 5, isPublic: true },
] as unknown as DailyLog[]

// A real page rendered as a static, cropped "screen grab" — a clean rounded card
// (no browser chrome). `ctxW` is the width the embedded component lays out for
// (fed via WCtx); `mobile` controls the crop.
function PagePreview({ ctxW, mobile, children }: { ctxW: number; mobile: boolean; children: ReactNode }) {
  const crop = mobile ? 360 : 470
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E0DBD0', background: CREAM }}>
      <div style={{ position: 'relative', maxHeight: crop, overflow: 'hidden', padding: 18 }}>
        <div style={{ pointerEvents: 'none' }}>
          <WCtx.Provider value={ctxW}>{children}</WCtx.Provider>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: `linear-gradient(transparent, ${CREAM})` }} />
      </div>
    </div>
  )
}

// Horizontal carousel of real pages. The track is panned by scroll via GSAP
// (see the effect in LandingPage); native overflow-x is the reduced-motion / touch
// fallback. data-carousel / data-carousel-track are the GSAP hooks. Kept to a few
// cards each so the pan stays fluid and every screen is seen before the section
// scrolls past — longer tracks outrun the available scroll.
function LiveCarousel({ mobile, w, items }: { mobile: boolean; w: number; items: { title: string; node: ReactNode }[] }) {
  const cardW: CSSProperties['width'] = mobile ? '86vw' : 560
  const ctxW = mobile ? Math.max(260, Math.round(w * 0.86) - 40) : 520
  return (
    // scroll-snap improves the native swipe on touch (no effect under the desktop
    // GSAP pan, where overflow is clipped and the track is transform-driven).
    <div data-carousel className="story-gallery" style={{ overflowX: 'auto', overflowY: 'hidden', scrollSnapType: mobile ? 'x mandatory' : undefined, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
      <div data-carousel-track style={{ display: 'flex', gap: mobile ? 14 : 28, padding: mobile ? '8px 16px 26px' : '12px 6vw 34px', willChange: 'transform' }}>
        {items.map(it => (
          <div key={it.title} style={{ flexShrink: 0, width: cardW, scrollSnapAlign: mobile ? 'center' : undefined }}>
            <PagePreview ctxW={ctxW} mobile={mobile}>{it.node}</PagePreview>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const w = useWindowSize()
  const mobile = w < BP.mobile
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Scroll choreography ─────────────────────────────────────────────────────
  // This page scrolls inside its own container (scrollRef), not <main>, so every
  // ScrollTrigger is bound to that scroller. Sections fade/slide in as they enter
  // and back out as they leave (scrubbed), and the preview carousel is panned
  // right→left on scroll-down (and back on scroll-up). All no-ops under reduced
  // motion, where the carousel falls back to a native horizontal swipe strip.
  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller || prefersReducedMotion()) return

    // Desktop drives each carousel's pan via scroll; on touch they stay native
    // horizontal swipe strips (scroll-jacking a wide track feels wrong on a phone,
    // where the user is already scrolling vertically).
    const carousels = Array.from(scroller.querySelectorAll<HTMLElement>('[data-carousel]'))
    if (!mobile) carousels.forEach(c => { c.style.overflowX = 'hidden' })

    const ctx = gsap.context(() => {
      // Hero — gentle staggered intro on load.
      gsap.from('[data-hero] > *', { autoAlpha: 0, y: 30, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.05 })

      // Sections — on desktop, fade/slide in from below, hold (most of the range),
      // then gently back out; on mobile, a lighter one-time fade-in (no scrubbed
      // fade-out, which feels fussy on a small screen).
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(el => {
        if (mobile) {
          gsap.fromTo(el, { autoAlpha: 0, y: 26 }, {
            autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
            scrollTrigger: { trigger: el, scroller, start: 'top 88%', toggleActions: 'play none none reverse' },
          })
        } else {
          gsap.timeline({ scrollTrigger: { trigger: el, scroller, start: 'top 90%', end: 'bottom 10%', scrub: 1 } })
            .fromTo(el, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 1 })
            .to(el, { duration: 3 }) // long hold — visible for most of its time on screen
            .to(el, { autoAlpha: 0, y: -28, ease: 'power2.in', duration: 1 })
        }
      })

      // Each preview gallery is pinned to the screen and its track is scrolled
      // sideways through every screen as you scroll vertically, then released
      // (the Better Off "Lookback" pattern). Direction alternates by index: the
      // top gallery moves right→left on scroll-down, the next left→right.
      if (!mobile) {
        carousels.forEach((carousel, i) => {
          const track = carousel.querySelector('[data-carousel-track]') as HTMLElement | null
          if (!track) return
          const distance = () => Math.max(0, track.scrollWidth - carousel.offsetWidth)
          if (distance() <= 0) return
          const reverse = i % 2 === 1
          gsap.fromTo(track,
            { x: () => (reverse ? -distance() : 0) },
            {
              x: () => (reverse ? 0 : -distance()), ease: 'none',
              scrollTrigger: {
                trigger: carousel, scroller,
                start: 'center center', end: () => '+=' + distance(),
                pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
              },
            },
          )
        })
      }

      requestAnimationFrame(() => ScrollTrigger.refresh())
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 600)
      return () => window.clearTimeout(t)
    }, scroller)

    return () => { carousels.forEach(c => { c.style.overflowX = '' }); ctx.revert() }
  }, [mobile])

  const col: CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: mobile ? '0 22px' : '0 40px', width: '100%' }
  const kicker: CSSProperties = { fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }

  const primaryBtn: CSSProperties = {
    background: GOLD, color: NAVY2, border: 'none', borderRadius: 980,
    padding: mobile ? '12px 24px' : '14px 30px', fontSize: 15, fontWeight: 700,
    fontFamily: FONT_BODY, cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  }
  const ghostBtnLight: CSSProperties = {
    background: 'transparent', color: WHITE, border: '1px solid rgba(255,255,255,0.5)', borderRadius: 980,
    padding: mobile ? '12px 24px' : '14px 30px', fontSize: 15, fontWeight: 600,
    fontFamily: FONT_BODY, cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  }

  // Preview cards split into two shorter carousels for fluid scroll panning.
  const noop = () => {}
  const cardsA = [
    { title: 'deck-days.com — Voyage Details', node: <VoyageForm     data={PREVIEW_VOYAGE}    onChange={noop} /> },
    { title: 'deck-days.com — Itinerary',      node: <ItineraryEditor data={PREVIEW_ITINERARY} onChange={noop} /> },
    { title: 'deck-days.com — Restaurant Log', node: <DiningLog       data={PREVIEW_DINING}    onChange={noop} /> },
  ]
  const cardsB = [
    { title: 'deck-days.com — Daily Log', node: <DailyLogSection data={PREVIEW_DAILY} onChange={noop} itinerary={PREVIEW_ITINERARY} voyage={PREVIEW_VOYAGE} initialDay={0} /> },
    { title: 'deck-days.com — Budget',    node: <BudgetTracker   data={PREVIEW_BUDGET} onChange={noop} /> },
    { title: 'deck-days.com — Notes',     node: <Notes           data={PREVIEW_NOTES}  onChange={noop} /> },
  ]

  return (
    // The global CSS locks html/body/#root to the viewport with overflow:hidden
    // (the authed app scrolls inside <main>), so this page is a flex column that
    // fills the viewport: the content scrolls in its own area while the footer
    // stays locked to the bottom — same pattern as the app shell.
    <div style={{ background: CREAM, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Scrolling content area. position:relative anchors the absolute header so
          it scrolls with the content; ref feeds the GSAP ScrollTriggers. */}
      <div ref={scrollRef} style={{ position: 'relative', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ ...col, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: mobile ? 64 : 80 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 10 }}>
            <img src="/logo.svg" alt="" style={{ height: mobile ? 28 : 34, width: 'auto', display: 'block', flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_LOGO, fontWeight: 700, fontSize: mobile ? 22 : 26, color: WHITE, letterSpacing: '-0.02em' }}>
              Deck Days
            </span>
          </span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: mobile ? 10 : 18 }}>
            <Link to="/login" style={{ color: WHITE, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, textDecoration: 'none', opacity: 0.92 }}>
              Log in
            </Link>
            <Link to="/signup" style={primaryBtn}>Get started</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: SEA, color: WHITE, overflow: 'hidden', minHeight: mobile ? 600 : 700, display: 'flex', alignItems: 'center', paddingTop: mobile ? 92 : 110, paddingBottom: 200 }}>
        <div data-hero style={{ ...col, position: 'relative', zIndex: 2 }}>
          <div style={{ ...kicker, color: GOLD, marginBottom: 18 }}>The voyage journal</div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 'clamp(34px, 10vw, 44px)' : 'clamp(46px, 6vw, 76px)', lineHeight: 1.06, letterSpacing: '-0.01em', maxWidth: 780 }}>
            Every day at sea, beautifully remembered.
          </h1>
          <p style={{ margin: mobile ? '18px 0 0' : '22px 0 0', maxWidth: 540, fontFamily: FONT_BODY, fontSize: mobile ? 15 : 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.86)' }}>
            Deck Days is a private, journal-first home for your cruises — ports, photos, meals,
            budgets and memories, gathered into one living record of the voyage. Share only what you choose.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: mobile ? 28 : 36 }}>
            <Link to="/signup" style={primaryBtn}>Start your journal →</Link>
            <Link to="/login" style={ghostBtnLight}>Log in</Link>
          </div>
        </div>

        <Ocean frontFill={CREAM} />
      </section>

      {/* ── Statement ──────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: mobile ? '64px 0 8px' : '110px 0 24px' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>What is Deck Days</div>
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 22 : 'clamp(24px, 3.4vw, 36px)', lineHeight: 1.3, maxWidth: 820 }}>
            A cruise is hundreds of small moments — a port at dawn, a dish you'd order again,
            a night you don't want to forget. Deck Days keeps them all in one place,
            so the voyage stays vivid long after you've stepped ashore.
          </p>
        </div>
      </section>

      {/* ── In-app preview, part 1 — plan the voyage ───────────── */}
      <section style={{ background: CREAM, padding: mobile ? '36px 0 48px' : '56px 0 72px', overflow: 'hidden' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 8, textAlign: mobile ? 'left' : 'center' }}>A look inside</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 24 : 'clamp(26px, 3.2vw, 38px)', lineHeight: 1.2, textAlign: mobile ? 'left' : 'center' }}>
            The actual app, with everything in its place.
          </h2>
        </div>
        <div style={{ marginTop: mobile ? 26 : 38 }}>
          <LiveCarousel mobile={mobile} w={w} items={cardsA} />
        </div>
      </section>

      {/* ── Social Feed — the standout feature ─────────────────── */}
      <section style={{ background: SEA, color: WHITE, padding: mobile ? '64px 0' : '110px 0', overflow: 'hidden' }}>
        <div data-reveal style={{ ...col, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 32 : 56, alignItems: 'center' }}>
          {/* Copy */}
          <div>
            <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>What sets it apart</div>
            <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 26 : 'clamp(30px, 3.6vw, 46px)', lineHeight: 1.15 }}>
              Private by default. Social only when you choose.
            </h2>
            <p style={{ margin: '18px 0 0', maxWidth: 460, fontFamily: FONT_BODY, fontSize: mobile ? 15 : 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.86)' }}>
              Your journal is yours alone — until you decide to share. Post a single moment to family,
              or to all your contacts, and they can react and comment. Most cruise apps stop at planning;
              Deck Days turns the voyage into something you share, on your terms.
            </p>
            <ul style={{ margin: '22px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Per-post audience: private, family or public', 'Reactions and comments from your contacts', 'Nothing is shared unless you opt in'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY, fontSize: mobile ? 14 : 15, color: 'rgba(255,255,255,0.92)' }}>
                  <Users size={16} strokeWidth={1.8} color={GOLD} style={{ flexShrink: 0 }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Feed preview — real FeedItem cards, sample posts, static */}
          <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, width: '100%', marginInline: mobile ? 'auto' : 0 }}>
            {PREVIEW_FEED.map(item => <FeedItem key={item.id} item={item} />)}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: mobile ? '32px 0 64px' : '56px 0 110px' }}>
        <div data-reveal style={{ ...col, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: mobile ? 16 : 24 }}>
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} style={{ background: WHITE, border: '1px solid #E0DBD0', borderRadius: 16, padding: mobile ? '24px 22px' : '30px 28px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(201,162,39,0.12)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 19, lineHeight: 1.2 }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontFamily: FONT_BODY, color: TEXT, fontSize: 14.5, lineHeight: 1.6 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── In-app preview, part 2 — write & remember ──────────── */}
      <section style={{ background: CREAM, padding: mobile ? '8px 0 64px' : '16px 0 100px', overflow: 'hidden' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 8, textAlign: mobile ? 'left' : 'center' }}>Write & remember</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 24 : 'clamp(26px, 3.2vw, 38px)', lineHeight: 1.2, textAlign: mobile ? 'left' : 'center' }}>
            Log each day, track the budget, keep your notes.
          </h2>
        </div>
        <div style={{ marginTop: mobile ? 26 : 38 }}>
          <LiveCarousel mobile={mobile} w={w} items={cardsB} />
        </div>
        <p style={{ ...col, textAlign: 'center', margin: '18px auto 0', fontFamily: FONT_BODY, fontSize: 12, color: MUTED }}>
          Real app screens, shown with sample data — no private content.
        </p>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: SEA, color: WHITE, overflow: 'hidden', padding: mobile ? '80px 0 200px' : '120px 0 220px' }}>
        <div data-reveal style={{ ...col, position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h2 style={{ margin: '0 auto', maxWidth: 680, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 'clamp(28px, 8vw, 36px)' : 'clamp(34px, 4.6vw, 52px)', lineHeight: 1.12 }}>
            Your next voyage deserves to be remembered.
          </h2>
          <p style={{ margin: '14px auto 0', maxWidth: 460, fontFamily: FONT_BODY, fontSize: mobile ? 14 : 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
            Create a free account and start your first journal in minutes.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <Link to="/signup" style={primaryBtn}>Get started →</Link>
            <Link to="/login" style={ghostBtnLight}>Log in</Link>
          </div>
        </div>

        <Ocean frontFill={CREAM} />
      </section>

      </div>{/* end scrolling content area */}

      {/* ── Footer — locked to the bottom of the viewport ──────────── */}
      <Footer />
    </div>
  )
}
