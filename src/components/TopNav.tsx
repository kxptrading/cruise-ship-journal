// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Full-width top navigation banner
//
// Mobile  → inline hamburger + logo only (no wordmark, no links, no ticker)
//           BottomNav handles all navigation on mobile.
// Desktop → hamburger pinned to left edge, max-width container with logo +
//           "Deck Days" wordmark + nav links with icons. Ticker sub-bar below.
// ─────────────────────────────────────────────────────────────────────────────

import { Menu, Compass, Ship, Users, MessageCircle, CircleUser } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { WHITE, GOLD, FONT_BODY } from '../constants'
import TickerText from '../ui/TickerText'

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

  // ── Mobile layout ────────────────────────────────────────────────────────────
  // Simple, clean bar: hamburger left + logo. No wordmark, no links, no ticker.
  // BottomNav owns all navigation on mobile.
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
      }}>
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            background: 'transparent',
            border:     'none',
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: WHITE, flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Menu size={24} strokeWidth={1.75} />
        </button>

        <button
          onClick={() => onNav('dashboard')}
          aria-label="Deck Days — home"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <img src="/logo.svg" alt="Deck Days" style={{ height: 32, width: 'auto', display: 'block' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY, letterSpacing: '-0.01em', opacity: 0.95 }}>
            Deck Days
          </span>
        </button>
      </div>
    )
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ zIndex: 200, flexShrink: 0 }}>

      {/* Main bar */}
      <div style={{
        height:       64,
        background:   'var(--t-primary-dk)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position:     'relative',
      }}>

        {/* Hamburger — pinned to absolute left edge of the full-width bar */}
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            position:  'absolute',
            left:      16,
            top:       '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border:     'none',
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
            WebkitTapHighlightColor: 'transparent',
            transition: 'color 0.15s',
            zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = WHITE }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        {/* Centre-padded inner container: logo + wordmark + nav links */}
        <div style={{
          maxWidth:   NAV_MAX_WIDTH,
          margin:     '0 auto',
          height:     '100%',
          display:    'flex',
          alignItems: 'center',
          padding:    '0 32px',
          gap:        12,
        }}>

          {/* Logo + wordmark */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <img src="/logo.svg" alt="Deck Days" style={{ height: 42, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: FONT_BODY, letterSpacing: '-0.01em', whiteSpace: 'nowrap', opacity: 0.95 }}>
              Deck Days
            </span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Nav links with icons */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {TOP_NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = section === id
              return (
                <button
                  key={id}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNav(id)}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         6,
                    background:  active ? 'rgba(201,162,39,0.14)' : 'transparent',
                    border:      `1px solid ${active ? 'rgba(201,162,39,0.4)' : 'transparent'}`,
                    borderRadius: 8,
                    padding:     '7px 14px',
                    cursor:      'pointer',
                    color:       active ? GOLD : 'rgba(255,255,255,0.82)',
                    fontFamily:  FONT_BODY,
                    fontSize:    13,
                    fontWeight:  active ? 700 : 500,
                    letterSpacing: '0.01em',
                    whiteSpace:  'nowrap',
                    transition:  'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = WHITE } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)' } }}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Ticker sub-bar */}
      <div style={{
        height:   30,
        background: 'var(--t-primary-dk)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth:   NAV_MAX_WIDTH,
          margin:     '0 auto',
          height:     '100%',
          display:    'flex',
          alignItems: 'center',
          padding:    '0 32px',
          gap:        8,
          overflow:   'hidden',
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Welcome to Deck Days — your personal cruise voyage journal'}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚓</span>
        </div>
      </div>

    </div>
  )
}
