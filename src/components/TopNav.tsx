// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Full-width top navigation banner (frosted glass)
// ─────────────────────────────────────────────────────────────────────────────

import { WHITE, FONT_BODY } from '../constants'

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
  isOverlay:   boolean
  isMobile:    boolean
  onMenuOpen:  () => void
}

export default function TopNav({ section, onNav, isOverlay, onMenuOpen, isMobile }: Props) {
  const logoH  = isMobile ? 38 : 48
  const barH   = isMobile ? 48 : 58
  const btnPad = isMobile ? '5px 10px' : '7px 18px'
  const navGap = isMobile ? 2 : 6

  return (
    <div style={{
      flexShrink: 0,
      height: barH,
      background: 'var(--t-primary-dk)',
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '0 10px' : '0 22px',
      gap: isMobile ? 4 : 8,
      borderBottom: 'none',
      boxShadow: 'none',
      zIndex: 200,
      position: 'sticky',
      top: 0,
    }}>

      {/* ── Left: hamburger (mobile) + logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
        {isOverlay && (
          <button
            onClick={onMenuOpen}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
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
          style={{ height: logoH, width: 'auto', cursor: 'pointer', opacity: 0.95 }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Right: social nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: navGap }}>
        {TOP_NAV_ITEMS.map(({ id, label, icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: isMobile ? 0 : 6,
                background: active ? 'rgba(201,162,39,0.16)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,162,39,0.45)' : 'transparent'}`,
                borderRadius: 20,
                padding: btnPad,
                cursor: 'pointer',
                color: WHITE,
                fontFamily: FONT_BODY,
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: isMobile ? 18 : 16, lineHeight: 1 }}>{icon}</span>
              {!isMobile && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
