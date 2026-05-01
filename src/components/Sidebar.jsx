// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.jsx — Navigation sidebar
//
// On desktop (isOverlay = false) the sidebar sits permanently to the left of
// the main content. On tablet and mobile it becomes a drawer that slides in
// from the left over a darkened backdrop, controlled by isOpen / onClose.
// ─────────────────────────────────────────────────────────────────────────────

import { GOLD, WHITE, FONT_DISPLAY, FONT_BODY } from '../constants'
import { NAV } from '../constants'

const GOLD_ACTIVE_BG = 'rgba(201,162,39,0.13)'
const GOLD_ACTIVE_BORDER = GOLD

export default function Sidebar({ section, onNav, isOverlay, isOpen, onClose, user, onSignOut, voyageName, voyageCount, sectionStatus }) {
  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────────
          Semi-transparent overlay rendered behind the drawer on mobile/tablet.
          Tapping it closes the sidebar without navigating anywhere.        */}
      {isOverlay && isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────────────────────
          On desktop: static flex child, always visible.
          On mobile/tablet: fixed, slides in via CSS transform. The transition
          uses a material-motion easing curve for a natural feel.           */}
      <aside style={{
        width: 240, background: 'linear-gradient(180deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 60%, var(--t-primary) 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        ...(isOverlay ? {
          position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '6px 0 32px rgba(0,0,0,0.45)' : 'none',
        } : {}),
      }}>

        {/* ── Header ────────────────────────────────────────────────────────
            App brand mark. On mobile/tablet a close button is shown here
            so the user can dismiss the drawer without tapping the backdrop. */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'rgba(0,0,0,0.12)' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, letterSpacing: '0.02em', lineHeight: 1.2 }}>
              Cruise Log
            </div>
            <div style={{ fontSize: 9, color: GOLD, marginTop: 4, letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, opacity: 0.85 }}>
              A Journal for Every Voyage
            </div>
          </div>
          {isOverlay && (
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 8, marginTop: 2, fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>
              ×
            </button>
          )}
        </div>

        {/* ── Voyage switcher pill ──────────────────────────────────────────
            Shows the active ship name. Clicking navigates to My Voyages.    */}
        <div style={{ padding: '0 12px 12px' }}>
          <button
            onClick={() => onNav('profile')}
            style={{
              width: '100%', background: section === 'profile' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${section === 'profile' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: FONT_BODY, transition: 'background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🚢</span>
              <span style={{ fontSize: 12, color: WHITE, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {voyageName || 'My Voyages'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              {voyageCount > 1 && (
                <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1px 7px', fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                  {voyageCount}
                </span>
              )}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </div>
          </button>
        </div>

        {/* ── Navigation items ──────────────────────────────────────────────
            One button per journal section. The active item is highlighted
            with a gold left border, gold text, and a faint gold background.
            All items are rendered from the NAV array in constants.js.      */}
        <nav style={{ flex: 1, paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, padding: '0 20px 8px' }}>
            Your Journal
          </div>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => onNav(id)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '11px 18px 11px 15px',
                  background: active ? GOLD_ACTIVE_BG : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.8)',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD_ACTIVE_BORDER : 'transparent'}`,
                  cursor: 'pointer', fontSize: 15, fontFamily: FONT_BODY, fontWeight: active ? 700 : 500,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}>
                <span style={{ fontSize: 20, lineHeight: 1, filter: active ? 'none' : 'brightness(0.8)' }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {/* Gold dot when section has data — gives at-a-glance journal completeness */}
                {sectionStatus?.has(id) && !active && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.6, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Footer — user account + sign out ─────────────────────────────
            Shows the signed-in email address and a sign out button.       */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.12)' }}>
          {user && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 2 }}>
              {user.email}
            </div>
          )}
          <button onClick={onSignOut}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s, border-color 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13 }}>↪</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
