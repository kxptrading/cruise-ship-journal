// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Full-width top navigation banner
//
// Mobile  → hamburger (44×44) + logo + profile icon only (social nav is on
//           BottomNav to avoid duplication)
// Tablet+ → full social nav with icons + labels
//
// CENTRE TICKER:
//   The active voyage name + date range scrolls in the centre of the bar.
//   voyageLabel is built in App.tsx from allVoyages (instant, no async wait).
// ─────────────────────────────────────────────────────────────────────────────

import { CircleUser, Menu, Search, Compass, Users, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { WHITE, FONT_BODY, FONT_LOGO } from '../constants'
import TickerText from '../ui/TickerText'
import FE from './FE'

interface NavItem {
  id:      string
  label:   string
  icon:    string
  LIcon?:  LucideIcon   // optional Lucide icon, takes priority over emoji
}

const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Feed',     icon: '🧭', LIcon: Compass       },
  { id: 'friends',     label: 'Friends',  icon: '👥', LIcon: Users         },
  { id: 'chat',        label: 'Messages', icon: '💬', LIcon: MessageCircle },
  { id: 'search',      label: 'Search',   icon: '🔍', LIcon: Search        },
  { id: 'userprofile', label: 'Profile',  icon: '👤', LIcon: CircleUser    },
]

interface Props {
  section:      string
  onNav:        (id: string) => void
  isOverlay:    boolean   // true = mobile, shows hamburger
  isMobile:     boolean
  onMenuOpen:   () => void
  voyageLabel?: string    // active voyage name + dates for centre ticker
}

export default function TopNav({ section, onNav, isOverlay, onMenuOpen, isMobile, voyageLabel }: Props) {
  const barH = isMobile ? 48 : 58

  // On mobile the social links move to BottomNav — only Profile stays in the top bar.
  const visibleItems = isMobile
    ? TOP_NAV_ITEMS.filter(item => item.id === 'search' || item.id === 'userprofile')
    : TOP_NAV_ITEMS

  return (
    // Outer wrapper is sticky and stacks the main bar + optional ticker sub-bar
    <div style={{ position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 }}>

      {/* ── Main bar ── */}
      <div style={{
        height: barH,
        background: 'var(--t-primary-dk)',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 10px' : '0 22px',
        gap: isMobile ? 4 : 8,
        position: 'relative',   // anchors the desktop absolute-centred ticker
      }}>

        {/* ── Left: hamburger + logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          {isOverlay && (
            <button
              aria-label="Open menu"
              onClick={onMenuOpen}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, color: WHITE, fontSize: 18,
                WebkitTapHighlightColor: 'transparent',
              }}
            ><Menu size={22} strokeWidth={1.75} /></button>
          )}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — go to dashboard"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: WHITE, fontFamily: FONT_LOGO, letterSpacing: '-0.02em', lineHeight: 1, opacity: 0.95 }}>Deck Days</span>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* ── Right: social nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 6, flexShrink: 0 }}>
        {visibleItems.map(({ id, label, icon, LIcon }) => {
          const active = section === id
          return (
            <button
              key={id}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNav(id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? 0 : 6,
                background: active ? 'rgba(201,162,39,0.16)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,162,39,0.45)' : 'transparent'}`,
                borderRadius: 20,
                padding: isMobile ? '0' : '7px 18px',
                width:  isMobile ? 44 : 'auto',
                height: isMobile ? 44 : 'auto',
                justifyContent: 'center',
                cursor: 'pointer',
                color: WHITE,
                fontFamily: FONT_BODY,
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {(isMobile && LIcon)
                ? <LIcon size={24} strokeWidth={active ? 2.5 : 1.75} />
                : <FE emoji={icon} size={22} />
              }
              {!isMobile && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>

    {/* Ticker always in sub-bar — voyage name when active, welcome message otherwise */}
    <div style={{
        height: 28,
        background: 'var(--t-primary-dk)',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 6,
        overflow: 'hidden',
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>🚢</span>
        <TickerText
          text={voyageLabel || 'Welcome to Deck Days, the journal app tailored to your every journaling needs!!!'}
          style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontFamily: FONT_BODY }}
        />
        {/* Mirrored ship — scaleX(-1) flips it to face left, creating a bookend effect */}
        <span style={{ fontSize: 14, flexShrink: 0, display: 'inline-block', transform: 'scaleX(-1)' }}>🚢</span>
    </div>
    </div>
  )
}
