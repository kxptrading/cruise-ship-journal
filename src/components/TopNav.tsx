// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Fully responsive top navigation banner
//
// Mobile  (<768px) → inline hamburger + logo + wordmark. No ticker, no links.
//                    BottomNav owns all navigation on mobile.
//
// Desktop (≥768px) → hamburger pinned to absolute left edge of the full bar.
//                    Inner max-width container holds logo + wordmark + nav links.
//                    containerPadLeft is always ≥ hamburgerEnd + gap so nothing
//                    ever overlaps regardless of screen width.
//                    Nav labels hide below 1080px (icon-only mode).
//                    Ticker sub-bar below the main bar.
// ─────────────────────────────────────────────────────────────────────────────

import { Menu, Compass, Ship, Users, MessageCircle, CircleUser, UserCircle2, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { WHITE, GOLD, FONT_BODY } from '../constants'
import TickerText from '../ui/TickerText'
import { useW } from '../context'

// Hamburger geometry — used to compute safe inner container left padding
const HBG_LEFT = 16   // px from bar left edge
const HBG_W    = 40   // button width
const HBG_GAP  = 16   // breathing room between button and logo

const NAV_MAX_WIDTH = 1200

interface NavItem { id: string; label: string; Icon: LucideIcon }

const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Feed',     Icon: Compass       },
  { id: 'voyages',     label: 'Voyages',  Icon: Ship          },
  { id: 'friends',     label: 'Friends',  Icon: Users         },
  { id: 'chat',        label: 'Messages', Icon: MessageCircle },
  { id: 'userprofile', label: 'Profile',  Icon: CircleUser    },
]

interface Props {
  section:      string
  onNav:        (id: string) => void
  isOverlay:    boolean
  isMobile:     boolean
  onMenuOpen:   () => void
  voyageLabel?: string
}

export default function TopNav({ section, onNav, isMobile, onMenuOpen, voyageLabel }: Props) {
  const w = useW()

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        height:       52,
        background:   'var(--t-primary-dk)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 14px',
        gap:          12,
        flexShrink:   0,
        zIndex:       200,
        position:     'relative',
      }}>
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            background: 'transparent', border: 'none',
            width: 40, height: 40, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: WHITE,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Menu size={24} strokeWidth={1.75} />
        </button>

        {/* Centre — absolutely positioned so it doesn't shift with the right icons */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}
          >
            <img src="/logo.svg" alt="Deck Days" style={{ height: 32, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY, letterSpacing: '-0.01em', opacity: 0.95, whiteSpace: 'nowrap' }}>
              Deck Days
            </span>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button
          aria-label="Search"
          onClick={() => onNav('search')}
          style={{
            background: section === 'search' ? 'rgba(201,162,39,0.18)' : 'transparent',
            border: 'none',
            width: 40, height: 40, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: section === 'search' ? GOLD : 'rgba(255,255,255,0.85)',
            borderRadius: 8,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Search size={22} strokeWidth={section === 'search' ? 2.5 : 1.75} />
        </button>

        <button
          aria-label="Profile"
          onClick={() => onNav('userprofile')}
          style={{
            background: section === 'userprofile' ? 'rgba(201,162,39,0.18)' : 'transparent',
            border: 'none',
            width: 40, height: 40, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: section === 'userprofile' ? GOLD : 'rgba(255,255,255,0.85)',
            borderRadius: 8,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <UserCircle2 size={24} strokeWidth={section === 'userprofile' ? 2.5 : 1.75} />
        </button>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────

  // Dynamically computed values based on actual window width
  const showLabels    = w >= 1080                          // hide nav labels below 1080px
  const logoH         = w < 900 ? 34 : 42                 // logo shrinks on narrow desktop
  const wordmarkSize  = w < 900 ? 16 : w < 1100 ? 18 : 22
  const navFontSize   = w < 1100 ? 12 : 13
  const navPadding    = showLabels ? '7px 12px' : '7px 10px'
  const navGap        = w < 1000 ? 2 : 4

  // Left padding of the inner container — always clears the hamburger button
  const containerPadLeft  = HBG_LEFT + HBG_W + HBG_GAP   // = 72px
  const containerPadRight = 32

  return (
    <div style={{ zIndex: 200, flexShrink: 0 }}>

      {/* ── Main bar ── */}
      <div style={{
        height:       64,
        background:   'var(--t-primary-dk)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position:     'relative',
      }}>

        {/* Hamburger — absolute left edge, independent of the container */}
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            position:  'absolute',
            left:      HBG_LEFT,
            top:       '50%',
            transform: 'translateY(-50%)',
            width:     HBG_W,
            height:    HBG_W,
            background: 'transparent',
            border:     'none',
            display:    'flex', alignItems: 'center', justifyContent: 'center',
            cursor:     'pointer',
            color:      'rgba(255,255,255,0.8)',
            WebkitTapHighlightColor: 'transparent',
            transition: 'color 0.15s',
            zIndex:     1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = WHITE }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        {/* Inner container — padded to always clear the hamburger on the left */}
        <div style={{
          maxWidth:   NAV_MAX_WIDTH,
          margin:     '0 auto',
          height:     '100%',
          display:    'flex',
          alignItems: 'center',
          paddingLeft:  containerPadLeft,
          paddingRight: containerPadRight,
          gap:          12,
          boxSizing:    'border-box',
        }}>

          {/* Logo + wordmark */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
          >
            <img src="/logo.svg" alt="Deck Days" style={{ height: logoH, width: 'auto', display: 'block', transition: 'height 0.2s' }} />
            <span style={{
              fontSize: wordmarkSize, fontWeight: 700, color: WHITE,
              fontFamily: FONT_BODY, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', opacity: 0.95,
              transition: 'font-size 0.2s',
            }}>
              Deck Days
            </span>
          </button>

          <div style={{ flex: 1, minWidth: 0 }} />

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: navGap, flexShrink: 0 }}>
            {TOP_NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = section === id
              return (
                <button
                  key={id}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNav(id)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          showLabels ? 6 : 0,
                    background:   active ? 'rgba(201,162,39,0.14)' : 'transparent',
                    border:       `1px solid ${active ? 'rgba(201,162,39,0.4)' : 'transparent'}`,
                    borderRadius: 8,
                    padding:      navPadding,
                    cursor:       'pointer',
                    color:        active ? GOLD : 'rgba(255,255,255,0.82)',
                    fontFamily:   FONT_BODY,
                    fontSize:     navFontSize,
                    fontWeight:   active ? 700 : 500,
                    letterSpacing: '0.01em',
                    whiteSpace:   'nowrap',
                    transition:   'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = WHITE } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)' } }}
                  title={!showLabels ? label : undefined}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                  {showLabels && label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Ticker sub-bar ── */}
      <div style={{
        height:     30,
        background: 'var(--t-primary-dk)',
        borderTop:  '1px solid rgba(255,255,255,0.06)',
        overflow:   'hidden',
      }}>
        <div style={{
          maxWidth:    NAV_MAX_WIDTH,
          margin:      '0 auto',
          height:      '100%',
          display:     'flex',
          alignItems:  'center',
          paddingLeft:  containerPadLeft,
          paddingRight: containerPadRight,
          gap:          8,
          overflow:     'hidden',
          boxSizing:    'border-box',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Welcome to Deck Days — your personal cruise voyage journal'}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚓</span>
        </div>
      </div>

    </div>
  )
}
