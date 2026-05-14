// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Full-width top navigation banner
//
// Mobile  → hamburger (44×44) + logo + profile icon only (social nav is on
//           BottomNav to avoid duplication)
// Tablet+ → full social nav with icons + labels
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, FONT_BODY } from '../constants'
import FE from './FE'

interface NavItem {
  id:    string
  label: string
  icon:  string
}

const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Feed',     icon: '🧭' },
  { id: 'friends',     label: 'Friends',  icon: '👥' },
  { id: 'chat',        label: 'Messages', icon: '💬' },
  { id: 'userprofile', label: 'Profile',  icon: '👤' },
]

interface Props {
  section:     string
  onNav:       (id: string) => void
  isOverlay:   boolean   // true = mobile, shows hamburger
  isMobile:    boolean
  onMenuOpen:  () => void
}

export default function TopNav({ section, onNav, isOverlay, onMenuOpen, isMobile }: Props) {
  const barH = isMobile ? 48 : 58

  // On mobile the social links move to BottomNav — only Profile stays in the top bar.
  const visibleItems = isMobile
    ? TOP_NAV_ITEMS.filter(item => item.id === 'userprofile')
    : TOP_NAV_ITEMS

  return (
    <div style={{
      flexShrink: 0,
      height: barH,
      background: 'var(--t-primary-dk)',
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 10px' : '0 22px',
      gap: isMobile ? 4 : 8,
      zIndex: 200,
      position: 'sticky',
      top: 0,
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
              width: 44, height: 44,      // ≥ 44×44 tap target
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: WHITE, fontSize: 18,
              WebkitTapHighlightColor: 'transparent',
            }}
          >☰</button>
        )}
        <img
          src="/logo.svg"
          alt="Cruise Log"
          onClick={() => onNav('dashboard')}
          style={{ height: isMobile ? 32 : 44, width: 'auto', cursor: 'pointer', opacity: 0.95 }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Right: social nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 6 }}>
        {visibleItems.map(({ id, label, icon }) => {
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
              <FE emoji={icon} size={isMobile ? 24 : 22} />
              {!isMobile && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
