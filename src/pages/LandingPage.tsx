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

import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useWindowSize } from '../context'
import {
  NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, TEAL, ROSE, PLUM, FONT_DISPLAY, FONT_BODY, FONT_LOGO, BP,
} from '../constants'
import { BookOpen, MapPin, Image as ImageIcon, Users, Wallet, Compass, Star, UtensilsCrossed, Luggage } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Footer from '../components/Footer'
import { MetricCard } from '../components/ui/metric-card'
import BudgetBreakdown from '../features/voyages/dashboard/BudgetBreakdown'
import ItineraryTimeline from '../features/voyages/dashboard/ItineraryTimeline'
import type { ItineraryDay, DailyLog, Budget } from '../types'

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
// Rendered from the REAL app components (MetricCard, BudgetBreakdown,
// ItineraryTimeline) seeded with fictional sample data — the genuine developed
// look and feel, with no real or privately-owned user content.
const PREVIEW_ITINERARY: ItineraryDay[] = [
  { date: '2026-05-04', port: 'Barcelona', arrive: '',      depart: '18:00' },
  { date: '2026-05-05', port: 'At sea',    arrive: '',      depart: ''      },
  { date: '2026-05-06', port: 'Naples',    arrive: '08:00', depart: '19:00' },
  { date: '2026-05-07', port: 'Santorini', arrive: '07:00', depart: '21:00' },
  { date: '2026-05-08', port: 'Mykonos',   arrive: '09:00', depart: '18:00' },
  { date: '2026-05-09', port: 'At sea',    arrive: '',      depart: ''      },
  { date: '2026-05-10', port: 'Rome',      arrive: '06:00', depart: ''      },
]

const PREVIEW_LOGS = [
  { weather: ['Sunny'],  rating: 5, highlights: 'Sagrada Família at golden hour' },
  { weather: ['Mild'],   rating: 4, highlights: 'Sea day — spa and sun deck' },
  { weather: ['Hot'],    rating: 5, highlights: 'Pizza in the old town' },
  { weather: ['Sunny'],  rating: 5, highlights: 'Caldera sunset' },
  { weather: ['Sunny'],  rating: 4, highlights: 'Windmills and blue bays' },
  { weather: ['Cloudy'], rating: 4, highlights: '' },
  { weather: ['Mild'],   rating: 0, highlights: '' },
] as unknown as DailyLog[]

const PREVIEW_BUDGET = {
  budget: '1000',
  items: [
    { date: '2026-05-06', item: 'Pompeii tour',      category: 'Excursions', amount: '180' },
    { date: '2026-05-07', item: 'Catamaran cruise',  category: 'Excursions', amount: '150' },
    { date: '2026-05-04', item: 'Cava & tapas',      category: 'Drinks',     amount: '90'  },
    { date: '2026-05-08', item: 'Ceramics',          category: 'Shopping',   amount: '120' },
    { date: '2026-05-06', item: 'Speciality dinner', category: 'Dining',     amount: '110' },
    { date: '2026-05-05', item: 'Spa day',           category: 'Other',      amount: '95'  },
  ],
} as Budget

function BrowserFrame({ title, children }: { title: string; children: ReactNode }) {
  const dot = (c: string): CSSProperties => ({ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' })
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E0DBD0', background: WHITE, boxShadow: '0 24px 64px rgba(20,41,63,0.20)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F1EEE7', borderBottom: '1px solid #E0DBD0' }}>
        <span style={dot('#E0655B')} /><span style={dot('#E6B23E')} /><span style={dot('#5BB463')} />
        <div style={{ flex: 1, textAlign: 'center', fontFamily: FONT_BODY, fontSize: 11, color: MUTED }}>{title}</div>
      </div>
      <div style={{ background: CREAM, padding: 18 }}>{children}</div>
    </div>
  )
}

function LivePreview({ mobile }: { mobile: boolean }) {
  const noop = () => {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 22 : 32 }}>

      {/* Dashboard — real MetricCards */}
      <BrowserFrame title="deck-days.com — Dashboard">
        <div style={{ borderRadius: 12, padding: mobile ? '16px 18px' : '18px 22px', background: SEA, color: WHITE, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD }}>Sample voyage</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: mobile ? 22 : 28, fontWeight: 400, marginTop: 4 }}>Mediterranean Odyssey</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>7 nights · Barcelona → Rome</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 12 }}>
          <MetricCard icon={<BookOpen size={20} strokeWidth={1.8} />}        value="5 / 7"  label="Days Logged" color={NAVY2} sparkline={[1, 1, 1, 1, 1, 1, 0]} />
          <MetricCard icon={<MapPin size={20} strokeWidth={1.8} />}          value={5}      label="Ports"       color={TEAL} />
          <MetricCard icon={<Wallet size={20} strokeWidth={1.8} />}          value="£745"   label="Spent" sub="of £1,000" color={TEAL} pct={75} />
          <MetricCard icon={<Star size={20} strokeWidth={1.8} />}            value="4.6"    label="Avg Rating"  color={GOLD} sparkline={[5, 4, 5, 5, 4, 4, 0]} />
          <MetricCard icon={<UtensilsCrossed size={20} strokeWidth={1.8} />} value={12}     label="Dining"      color={ROSE} />
          <MetricCard icon={<Luggage size={20} strokeWidth={1.8} />}         value="22 / 24" label="Packed"     color={PLUM} pct={92} />
        </div>
      </BrowserFrame>

      {/* Budget — real BudgetBreakdown */}
      <BrowserFrame title="deck-days.com — Budget">
        <BudgetBreakdown budget={PREVIEW_BUDGET} />
      </BrowserFrame>

      {/* Itinerary — real ItineraryTimeline */}
      <BrowserFrame title="deck-days.com — Itinerary">
        <ItineraryTimeline itinerary={PREVIEW_ITINERARY} dailyLogs={PREVIEW_LOGS} currentDay={4} onViewDay={noop} />
      </BrowserFrame>
    </div>
  )
}

export default function LandingPage() {
  const w = useWindowSize()
  const mobile = w < BP.mobile

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

  return (
    // The global CSS locks html/body/#root to the viewport with overflow:hidden
    // (the authed app scrolls inside <main>), so this page is a flex column that
    // fills the viewport: the content scrolls in its own area while the footer
    // stays locked to the bottom — same pattern as the app shell.
    <div style={{ background: CREAM, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Scrolling content area. position:relative anchors the absolute header so
          it scrolls with the content. */}
      <div style={{ position: 'relative', flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

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
        <div style={{ ...col, position: 'relative', zIndex: 2 }}>
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
        <div style={col}>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>What is Deck Days</div>
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 22 : 'clamp(24px, 3.4vw, 36px)', lineHeight: 1.3, maxWidth: 820 }}>
            A cruise is hundreds of small moments — a port at dawn, a dish you'd order again,
            a night you don't want to forget. Deck Days keeps them all in one place,
            so the voyage stays vivid long after you've stepped ashore.
          </p>
        </div>
      </section>

      {/* ── In-app preview — real components, sample data ──────── */}
      <section style={{ background: CREAM, padding: mobile ? '36px 0 16px' : '56px 0 28px' }}>
        <div style={col}>
          <div style={{ ...kicker, color: GOLD, marginBottom: 8, textAlign: mobile ? 'left' : 'center' }}>A look inside</div>
          <h2 style={{ margin: '0 0 26px', fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 24 : 'clamp(26px, 3.2vw, 38px)', lineHeight: 1.2, textAlign: mobile ? 'left' : 'center' }}>
            The actual app, with everything in its place.
          </h2>
          <LivePreview mobile={mobile} />
          <p style={{ textAlign: 'center', margin: '16px 0 0', fontFamily: FONT_BODY, fontSize: 12, color: MUTED }}>
            Real app screens, shown with sample data — no private content.
          </p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: mobile ? '32px 0 64px' : '56px 0 110px' }}>
        <div style={{ ...col, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: mobile ? 16 : 24 }}>
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

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: SEA, color: WHITE, overflow: 'hidden', padding: mobile ? '80px 0 200px' : '120px 0 220px' }}>
        <div style={{ ...col, position: 'relative', zIndex: 2, textAlign: 'center' }}>
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
