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

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useWindowSize } from '../context'
import {
  NAVY2, GOLD, CREAM, WHITE, TEXT, FONT_DISPLAY, FONT_BODY, FONT_LOGO, BP,
} from '../constants'
import { BookOpen, MapPin, Image as ImageIcon, Users, Wallet, Compass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Footer from '../components/Footer'

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
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 'clamp(38px, 11vw, 52px)' : 'clamp(56px, 7vw, 92px)', lineHeight: 1.04, letterSpacing: '-0.01em', maxWidth: 880 }}>
            Every day at sea, beautifully remembered.
          </h1>
          <p style={{ margin: mobile ? '20px 0 0' : '24px 0 0', maxWidth: 560, fontFamily: FONT_BODY, fontSize: mobile ? 16 : 19, lineHeight: 1.65, color: 'rgba(255,255,255,0.86)' }}>
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
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: mobile ? 24 : 'clamp(28px, 4vw, 44px)', lineHeight: 1.25, maxWidth: 860 }}>
            A cruise is hundreds of small moments — a port at dawn, a dish you'd order again,
            a night you don't want to forget. Deck Days keeps them all in one place,
            so the voyage stays vivid long after you've stepped ashore.
          </p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: mobile ? '40px 0 64px' : '64px 0 110px' }}>
        <div style={{ ...col, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: mobile ? 16 : 24 }}>
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} style={{ background: WHITE, border: '1px solid #E0DBD0', borderRadius: 16, padding: mobile ? '24px 22px' : '30px 28px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(201,162,39,0.12)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 21, lineHeight: 1.2 }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontFamily: FONT_BODY, color: TEXT, fontSize: 15, lineHeight: 1.65 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: SEA, color: WHITE, overflow: 'hidden', padding: mobile ? '80px 0 200px' : '120px 0 220px' }}>
        <div style={{ ...col, position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h2 style={{ margin: '0 auto', maxWidth: 720, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: mobile ? 'clamp(30px, 9vw, 40px)' : 'clamp(40px, 5.5vw, 64px)', lineHeight: 1.1 }}>
            Your next voyage deserves to be remembered.
          </h2>
          <p style={{ margin: '16px auto 0', maxWidth: 480, fontFamily: FONT_BODY, fontSize: mobile ? 15 : 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.85)' }}>
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
