// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Full-width top navigation banner
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

export default function TopNav({ section, onNav, onMenuOpen, isMobile, voyageLabel }: Props) {
  const barH = isMobile ? 56 : 64

  return (
    <div style={{ zIndex: 200, flexShrink: 0 }}>

      {/* ── Main bar ── */}
      <div style={{
        height:     barH,
        background: 'var(--t-primary-dk)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position:   'relative',
      }}>

        {/* ── Hamburger — pinned to the absolute left edge ── */}
        <button
          aria-label="Open menu"
          onClick={onMenuOpen}
          style={{
            position: 'absolute',
            left:     isMobile ? 12 : 16,
            top:      '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.08)',
            border:     '1px solid rgba(255,255,255,0.14)',
            borderRadius: 8,
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: WHITE,
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s',
            zIndex: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        {/* ── Centre-padded inner container: logo + nav links ── */}
        <div style={{
          maxWidth:   NAV_MAX_WIDTH,
          margin:     '0 auto',
          height:     '100%',
          display:    'flex',
          alignItems: 'center',
          padding:    isMobile ? '0 16px' : '0 32px',
          gap:        12,
        }}>

          {/* Logo */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <img
              src="/logo.svg"
              alt="Deck Days"
              style={{ height: isMobile ? 34 : 42, width: 'auto', display: 'block' }}
            />
            <span style={{
              fontSize:      isMobile ? 18 : 22,
              fontWeight:    700,
              color:         WHITE,
              fontFamily:    FONT_BODY,
              letterSpacing: '-0.01em',
              whiteSpace:    'nowrap',
              opacity:       0.95,
            }}>
              Deck Days
            </span>
          </button>

          <div style={{ flex: 1 }} />

          {/* ── Nav links with icons (desktop only — mobile uses BottomNav) ── */}
          {!isMobile && (
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
          )}
        </div>
      </div>

      {/* ── Ticker sub-bar ── */}
      <div style={{
        height:     34,
        background: 'var(--t-primary-dk)',
        borderTop:  '1px solid rgba(255,255,255,0.06)',
        overflow:   'hidden',
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
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Welcome to Deck Days — your personal cruise voyage journal'}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚓</span>
        </div>
      </div>

    </div>
  )
}
