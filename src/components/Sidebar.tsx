// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.tsx — Navigation sidebar
//
// Three display modes driven by the `bp` prop:
//   mobile  → hidden by default; slides in as a Framer Motion drawer
//   tablet  → always-visible, 64 px wide, icons only with hover tooltips
//   desktop → always-visible, 240 px wide, full labels
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState }      from 'react'
import { AnimatePresence, motion }  from 'framer-motion'
import { GOLD, WHITE, FONT_DISPLAY, FONT_BODY } from '../constants'
import { NAV } from '../constants'
import FE     from './FE'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Breakpoint } from '../hooks/useBreakpoint'

const SIDEBAR_BG = 'linear-gradient(180deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 60%, var(--t-primary) 100%)'
const W_FULL = 240
const W_ICON = 64

interface Props {
  section:       string
  onNav:         (id: string) => void
  bp:            Breakpoint
  isOpen:        boolean
  onClose:       () => void
  user:          { email?: string } | null
  onSignOut:     () => void
  voyageName:    string | null
  voyageCount:   number
  sectionStatus: Set<string> | null | undefined
  isAdult:       boolean
}

export default function Sidebar({
  section, onNav, bp, isOpen, onClose,
  user, onSignOut, voyageName, voyageCount, sectionStatus, isAdult,
}: Props) {
  const isMobile  = bp === 'mobile'
  const isTablet  = bp === 'tablet'

  // Tooltip tracking for tablet icon-only mode
  const [tooltip, setTooltip] = useState<{ id: string; y: number } | null>(null)

  // Focus trap — active when mobile drawer is open
  const drawerRef = useFocusTrap<HTMLElement>(isMobile && isOpen)

  // Close drawer on Escape (mobile)
  useEffect(() => {
    if (!isMobile || !isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isMobile, isOpen, onClose])

  // Close tooltip on unmount / mode change
  useEffect(() => { setTooltip(null) }, [bp])

  const navItems = NAV.filter(({ id }) => id !== 'budget' || isAdult)

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{
      height: 58, minHeight: 58,
      padding: isTablet ? 0 : '0 20px',
      display: 'flex', alignItems: 'center',
      justifyContent: isTablet ? 'center' : 'space-between',
      flexShrink: 0,
      background: 'var(--t-primary-dk)',
    }}>
      {isTablet
        ? <img src="/logo.svg" alt="Swell Days" style={{ height: 32, width: 'auto', opacity: 0.9 }} />
        : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.svg" alt="Swell Days" style={{ height: 36, width: 'auto', opacity: 0.9, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 19, fontWeight: 400, color: WHITE, fontFamily: FONT_DISPLAY, letterSpacing: '0.01em', lineHeight: 1.2 }}>
                Swell Days
              </div>
              <div style={{ fontSize: 9, color: WHITE, marginTop: 5, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, opacity: 0.6 }}>
                A Journal for Every Voyage
              </div>
            </div>
          </div>
        )
      }
      {isMobile && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'rgba(255,255,255,0.5)', fontSize: 18 }}
        >×</button>
      )}
    </div>
  )

  // ── Voyage switcher (desktop + mobile only) ────────────────────────────────
  const VoyageSwitcher = () => (
    <div style={{ padding: '14px 12px 4px' }}>
      <button
        onClick={() => { onNav('profile'); if (isMobile) onClose() }}
        style={{ width: '100%', background: section === 'profile' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${section === 'profile' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '9px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONT_BODY, transition: 'background 0.18s, border-color 0.18s', minHeight: 44 }}
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
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '1px 7px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{voyageCount}</span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>›</span>
        </div>
      </button>
    </div>
  )

  // ── Nav items ──────────────────────────────────────────────────────────────
  const Nav = () => (
    <nav style={{ flex: 1, padding: '16px 0 8px', overflowY: isTablet ? 'auto' : undefined }}>
      {!isTablet && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, padding: '0 20px 10px' }}>
          Your Journal
        </div>
      )}
      {navItems.map(({ id, label, icon }) => {
        const active = section === id

        if (isTablet) {
          return (
            <div
              key={id}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ id, y: rect.top + rect.height / 2 })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <button
                aria-label={label}
                onClick={() => onNav(id)}
                style={{
                  width: W_ICON, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
                  cursor: 'pointer',
                  color: WHITE,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <FE emoji={icon} size={20} />
              </button>
            </div>
          )
        }

        // Desktop / mobile — full label row
        return (
          <button
            key={id}
            onClick={() => { onNav(id); if (isMobile) onClose() }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', textAlign: 'left',
              padding: '10px 18px 10px 14px', minHeight: 44,
              background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
              color: WHITE,
              border: 'none',
              borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
              cursor: 'pointer',
              fontSize: 14, fontFamily: FONT_BODY, fontWeight: active ? 700 : 400,
              transition: 'background 0.15s',
              letterSpacing: '0.01em',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FE emoji={icon} size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            {sectionStatus?.has(id) && !active && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.55, flexShrink: 0 }} />
            )}
          </button>
        )
      })}
    </nav>
  )

  // ── Footer ─────────────────────────────────────────────────────────────────
  const Footer = () => (
    <div style={{ padding: '14px 16px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      {user && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 2, letterSpacing: '0.01em' }}>
          {user.email}
        </div>
      )}
      <button
        onClick={onSignOut}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = WHITE }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
        style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '8px 12px', minHeight: 44, fontSize: 12, color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s, color 0.15s', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.01em' }}
      >
        <span style={{ fontSize: 13, opacity: 0.7 }}>↪</span>
        Sign out
      </button>
    </div>
  )

  // ── Tablet: compact sign-out icon at the bottom ────────────────────────────
  const TabletFooter = () => (
    <div style={{ padding: '8px 0 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center' }}>
      <button
        aria-label="Sign out"
        onClick={onSignOut}
        style={{ width: W_ICON, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 18 }}
        onMouseEnter={e => { e.currentTarget.style.color = WHITE }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
      >↪</button>
    </div>
  )

  // ── Mobile: Framer Motion drawer + backdrop ────────────────────────────────
  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(4px)' }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              key="drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -W_FULL }}
              animate={{ x: 0 }}
              exit={{ x: -W_FULL }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              style={{
                width: W_FULL, background: SIDEBAR_BG,
                position: 'fixed', left: 0, top: 0, height: '100vh',
                zIndex: 1000,
                display: 'flex', flexDirection: 'column', overflowY: 'auto',
                boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
              }}
            >
              <Header />
              <VoyageSwitcher />
              <Nav />
              <Footer />
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Tablet: 64 px icon-only sidebar ───────────────────────────────────────
  if (isTablet) {
    return (
      <>
        <aside style={{
          width: W_ICON, background: SIDEBAR_BG,
          flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto', overflowX: 'visible',
        }}>
          <Header />
          <Nav />
          <TabletFooter />
        </aside>

        {/* Floating tooltip — rendered outside <aside> to escape overflow */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              key={tooltip.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                left: W_ICON + 10,
                top: tooltip.y,
                transform: 'translateY(-50%)',
                zIndex: 1001,
                background: 'var(--t-primary-dk)',
                color: WHITE,
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                fontFamily: FONT_BODY,
              }}
            >
              {NAV.find(n => n.id === tooltip.id)?.label ?? ''}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Desktop: full 240 px sidebar ───────────────────────────────────────────
  return (
    <aside style={{
      width: W_FULL, background: SIDEBAR_BG,
      flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <Header />
      <VoyageSwitcher />
      <Nav />
      <Footer />
    </aside>
  )
}
