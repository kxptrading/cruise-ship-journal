// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.jsx — Navigation sidebar
//
// On desktop (isOverlay = false) the sidebar sits permanently to the left of
// the main content. On tablet and mobile it becomes a drawer that slides in
// from the left over a darkened backdrop, controlled by isOpen / onClose.
// ─────────────────────────────────────────────────────────────────────────────

import { GOLD, WHITE, FONT_DISPLAY, FONT_BODY } from '../constants'
import { NAV } from '../constants'

const SIDEBAR_BG = '#0F172A'

export default function Sidebar({ section, onNav, isOverlay, isOpen, onClose, user, onSignOut, voyageName, voyageCount, sectionStatus }) {
  return (
    <>
      {isOverlay && isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(4px)' }}
        />
      )}

      <aside style={{
        width: 240,
        background: SIDEBAR_BG,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        ...(isOverlay ? {
          position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '8px 0 40px rgba(0,0,0,0.5)' : 'none',
        } : {}),
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, letterSpacing: '0.01em', lineHeight: 1.2 }}>
              Cruise Log
            </div>
            <div style={{ fontSize: 9, color: GOLD, marginTop: 5, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, opacity: 0.8 }}>
              A Journal for Every Voyage
            </div>
          </div>
          {isOverlay && (
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 8, marginTop: 2, fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>
              ×
            </button>
          )}
        </div>

        {/* ── Voyage pill ── */}
        <div style={{ padding: '14px 12px 4px' }}>
          <button
            onClick={() => onNav('profile')}
            style={{
              width: '100%',
              background: section === 'profile' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${section === 'profile' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '9px 13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: FONT_BODY, transition: 'background 0.18s, border-color 0.18s',
            }}
            onMouseEnter={e => { if (section !== 'profile') e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
            onMouseLeave={e => { if (section !== 'profile') e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>🚢</span>
              <span style={{ fontSize: 12, color: WHITE, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>
                {voyageName || 'My Voyages'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              {voyageCount > 1 && (
                <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '1px 7px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                  {voyageCount}
                </span>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>›</span>
            </div>
          </button>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: '16px 0 8px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, padding: '0 20px 10px' }}>
            Your Journal
          </div>
          {NAV.map(({ id, label, icon }) => {
            const active = section === id
            return (
              <button key={id} onClick={() => onNav(id)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                  padding: '10px 18px 10px 14px',
                  background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
                  color: active ? GOLD : 'rgba(255,255,255,0.72)',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                  cursor: 'pointer', fontSize: 14, fontFamily: FONT_BODY, fontWeight: active ? 700 : 400,
                  transition: 'background 0.15s, color 0.15s',
                  letterSpacing: '0.01em',
                }}>
                <span style={{ fontSize: 18, lineHeight: 1, opacity: active ? 1 : 0.65 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {sectionStatus?.has(id) && !active && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.55, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 16px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {user && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 2, letterSpacing: '0.01em' }}>
              {user.email}
            </div>
          )}
          <button onClick={onSignOut}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)' }}
            style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.38)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s, color 0.15s', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.01em' }}>
            <span style={{ fontSize: 13, opacity: 0.7 }}>↪</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
