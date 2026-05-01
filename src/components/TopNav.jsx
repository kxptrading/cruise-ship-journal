// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.jsx — Full-width top navigation banner
//
// Spans the entire width of the app above the sidebar + main content.
// Hosts the four social/account links (Feed, Friends, Messages, Profile)
// that were moved out of the sidebar.
//
// Layout:
//   Left  — hamburger (mobile/tablet only) + ⚓ brand
//   Right — Feed · Friends · Messages · Profile pill buttons
//
// Active link: white semi-opaque pill, white text, bold
// Inactive:    transparent, semi-white text
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, FONT_DISPLAY, FONT_BODY } from '../constants'

const TOP_NAV_ITEMS = [
  { id: 'dashboard',   label: 'Feed',     icon: '🧭' },
  { id: 'friends',     label: 'Friends',  icon: '👥' },
  { id: 'chat',        label: 'Messages', icon: '💬' },
  { id: 'userprofile', label: 'Profile',  icon: '👤' },
]

export default function TopNav({ section, onNav, isOverlay, onMenuOpen, isMobile }) {
  const logoH   = isMobile ? 42 : 70
  const barH    = isMobile ? 58 : 80
  const iconSz  = isMobile ? 18 : 20
  const btnPad  = isMobile ? '5px 9px' : '8px 18px'
  const navGap  = isMobile ? 2 : 8

  return (
    <div style={{
      flexShrink: 0,
      height: barH,
      background: 'var(--t-primary-dk)',
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 8px' : '0 16px',
      gap: isMobile ? 4 : 8,
      borderBottom: 'none',
      boxShadow: 'none',
      zIndex: 100,
      position: 'relative',
    }}>

      {/* ── Left: hamburger (mobile) + logo ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
        {isOverlay && (
          <button
            onClick={onMenuOpen}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: WHITE, fontSize: 14,
            }}
          >☰</button>
        )}
        <img
          src="/logo.svg"
          alt="Cruise Log"
          onClick={() => onNav('dashboard')}
          style={{ height: logoH, width: 'auto', cursor: 'pointer' }}
        />
      </div>

      {/* ── Spacer ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Right: social nav links ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: navGap }}>
        {TOP_NAV_ITEMS.map(({ id, label, icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? 0 : 8,
                background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: `1px solid ${active ? 'rgba(255,255,255,0.35)' : 'transparent'}`,
                borderRadius: 20,
                padding: btnPad,
                cursor: 'pointer',
                color: active ? WHITE : 'rgba(255,255,255,0.65)',
                fontFamily: FONT_BODY,
                fontSize: 15, fontWeight: active ? 700 : 500,
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: iconSz, lineHeight: 1 }}>{icon}</span>
              {!isMobile && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
