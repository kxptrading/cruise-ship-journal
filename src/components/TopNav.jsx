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
  return (
    <div style={{
      flexShrink: 0,
      height: 160,
      background: 'var(--t-primary)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      gap: 8,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      zIndex: 100,
      position: 'relative',
    }}>

      {/* ── Left: hamburger (mobile) + brand ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {isOverlay && (
          <button
            onClick={onMenuOpen}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: WHITE, fontSize: 16,
            }}
          >☰</button>
        )}
        <div
          onClick={() => onNav('dashboard')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <img src="/logo.svg" alt="Cruise Log" style={{ height: 150, width: 'auto' }} />
          {!isMobile && (
            <span style={{
              fontSize: 20, fontWeight: 400, color: WHITE,
              fontFamily: FONT_DISPLAY, letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}>
              Cruise Log
            </span>
          )}
        </div>
      </div>

      {/* ── Spacer ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Right: social nav links ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
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
                padding: isMobile ? '7px 12px' : '8px 18px',
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
              <span style={{ fontSize: isMobile ? 22 : 20, lineHeight: 1 }}>{icon}</span>
              {!isMobile && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
