// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.jsx — Navigation sidebar
//
// On desktop (isOverlay = false) the sidebar sits permanently to the left of
// the main content. On tablet and mobile it becomes a drawer that slides in
// from the left over a darkened backdrop, controlled by isOpen / onClose.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY2, GOLD, WHITE } from '../constants'
import { NAV } from '../constants'

export default function Sidebar({ section, onNav, isOverlay, isOpen, onClose, user, onSignOut }) {
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
        width: 240, background: NAVY2, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
        ...(isOverlay ? {
          position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
        } : {}),
      }}>

        {/* ── Header ────────────────────────────────────────────────────────
            App brand mark. On mobile/tablet a close button is shown here
            so the user can dismiss the drawer without tapping the backdrop. */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif', letterSpacing: '0.03em' }}>
              ⚓ CRUISE LOG
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
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

        {/* ── Navigation items ──────────────────────────────────────────────
            One button per journal section. The active item is highlighted
            with a gold left border, gold text, and a faint gold background.
            All items are rendered from the NAV array in constants.js.      */}
        <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => onNav(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: '11px 18px',
                  background: active ? 'rgba(201,162,39,0.1)' : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.62)',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                  transition: 'background 0.15s',
                }}>
                <span style={{ fontSize: 15, lineHeight: 1, opacity: active ? 1 : 0.6 }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </nav>

        {/* ── Footer — user account + sign out ─────────────────────────────
            Shows the signed-in email address and a sign out button.       */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {user && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          )}
          <button onClick={onSignOut}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
