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
import { useW, useIconPack } from '../context'
import FE from './FE'

// Hamburger geometry — used to compute safe inner container left padding
const HBG_LEFT = 16   // px from bar left edge
const HBG_W    = 40   // button width
const HBG_GAP  = 16   // breathing room between button and logo

const NAV_MAX_WIDTH = 1200

interface NavItem { id: string; label: string; Icon: LucideIcon; emoji: string }

const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'feed',        label: 'Feed',     Icon: Compass,       emoji: '🧭' },
  { id: 'voyages',     label: 'Voyages',  Icon: Ship,          emoji: '🚢' },
  { id: 'friends',     label: 'Friends',  Icon: Users,         emoji: '👥' },
  { id: 'chat',        label: 'Messages', Icon: MessageCircle, emoji: '💬' },
  { id: 'userprofile', label: 'Profile',  Icon: CircleUser,    emoji: '👤' },
]

interface Props {
  section:      string
  onNav:        (id: string) => void
  isOverlay:    boolean
  isMobile:     boolean
  onMenuOpen:   () => void
  voyageLabel?: string
  badges?:      Record<string, number>
}

export default function TopNav({ section, onNav, isMobile, onMenuOpen, voyageLabel, badges = {} }: Props) {
  const w        = useW()
  const iconPack = useIconPack()

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ flexShrink: 0, zIndex: 200, position: 'relative' }}>
        {/* ── Main bar ── */}
        <div style={{
          height:       52,
          background:   'var(--t-primary-dk)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 14px',
          gap:          12,
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

          {/* Centre — text at dead centre, logo to its left.
              Shift right by (logoW + gap) / 2 = (28 + 8) / 2 = 18px so the
              text midpoint lands at 50% rather than the group midpoint. */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(calc(-50% - 18px), -50%)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <img src="/logo.svg" alt="" style={{ height: 28, width: 28, display: 'block', flexShrink: 0, objectFit: 'contain' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY, letterSpacing: '-0.01em', opacity: 0.95, whiteSpace: 'nowrap' }}>
              Deck Days
            </span>
          </button>

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
            {iconPack !== 'lucide'
              ? <FE emoji="🔍" size={22} />
              : <Search size={22} strokeWidth={section === 'search' ? 2.5 : 1.75} />
            }
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
            {iconPack !== 'lucide'
              ? <FE emoji="👤" size={24} />
              : <UserCircle2 size={24} strokeWidth={section === 'userprofile' ? 2.5 : 1.75} />
            }
          </button>
        </div>

        {/* ── Ticker sub-bar ── */}
        <div style={{
          height:     26,
          background: 'var(--t-primary-dk)',
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          padding:    '0 14px',
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Deck Days - Cruise Journal - Capture every day at sea!!!'}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 12, flexShrink: 0 }}>⚓</span>
        </div>
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
    <div style={{ zIndex: 200, flexShrink: 0, position: 'relative' }}>

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
            {TOP_NAV_ITEMS.map(({ id, label, Icon, emoji }) => {
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
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    {iconPack !== 'lucide'
                      ? <FE emoji={emoji} size={15} />
                      : <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                    }
                    {(badges[id] ?? 0) > 0 && (
                      <span style={{ position: 'absolute', top: -3, right: -4, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid var(--t-primary-dk)' }} />
                    )}
                  </span>
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
            text={voyageLabel || 'Deck Days - Cruise Journal - Capture every day at sea!!!'}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚓</span>
        </div>
      </div>

    </div>
  )
}
