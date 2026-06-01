// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.tsx — Navigation sidebar
//
// THREE DISPLAY MODES (driven by the `bp` prop):
//   mobile  → hidden by default; slides in as a Framer Motion spring drawer
//             overlaying the content (zIndex 1000) with a blurred backdrop.
//   tablet  → always-visible, 64 px wide (W_ICON), icons only with floating
//             hover tooltips rendered outside the aside to escape overflow clipping.
//   desktop → always-visible, 240 px wide (W_FULL), full icon + label layout.
//
// VOYAGE CONTEXT AWARENESS:
//   When the URL matches /voyages/:id (and isn't /voyages/new), the Sidebar
//   shows a secondary "Your Journal" section with per-voyage section links.
//   These links navigate to /voyages/:id?tab=<sectionId> rather than to top-level
//   routes. This keeps the user on the VoyageDetailPage while switching tabs.
//   When not on a voyage page, journal nav items are hidden to avoid confusion.
//
// ACTIVE STATE DETECTION:
//   activeId is derived from the URL in this order of precedence:
//     1. ?tab= param  — journal section is active inside a voyage page.
//     2. /voyages/*   — any voyage page sets 'voyages' as active.
//     3. path slice   — fallback to the first path segment (e.g. 'feed', 'friends').
//
// SECTION STATUS DOTS:
//   A small gold dot appears next to section labels when sectionStatus.has(id)
//   is true. sectionStatus is computed in App.tsx from the voyage data and
//   indicates which sections have meaningful content. The dot is hidden when
//   the section is already active (gold border already signals selection).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion }  from 'framer-motion'
import { GOLD, WHITE, FONT_DISPLAY, FONT_BODY, FONT_LOGO } from '../constants'
import { NAV, PRIMARY_NAV } from '../constants'
import FE     from './FE'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Breakpoint } from '../hooks/useBreakpoint'

// ── Constants ─────────────────────────────────────────────────────────────────
const SIDEBAR_BG = 'linear-gradient(180deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 60%, var(--t-primary) 100%)'
const W_FULL = 210   // desktop sidebar width (px)
const W_ICON = 64    // tablet icon-only sidebar width (px)

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
  const isMobile   = bp === 'mobile'
  const isTablet   = bp === 'tablet'
  const location   = useLocation()
  const navigate   = useNavigate()

  // ── Voyage context detection ────────────────────────────────────────────────
  // Determines whether we're on a specific voyage detail page so the journal
  // nav section can be shown. We exclude 'new' to avoid showing journal links
  // on the "Create Voyage" form.
  const voyageIdMatch    = location.pathname.match(/^\/voyages\/([^/]+?)(?:\/|$)/)
  const currentVoyageId  = voyageIdMatch?.[1]
  const isOnVoyage       = !!currentVoyageId && currentVoyageId !== 'new'

  // Active journal tab from ?tab= search param (set by journal nav links)
  const activeTabParam = new URLSearchParams(location.search).get('tab')

  // Navigate journal section links to the current voyage's tab.
  // If not on a voyage page, fall back to the legacy top-level section route
  // (this path is rare; most navigation now goes through VoyageDetailPage).
  const navToJournalTab = (tabId: string) => {
    if (isOnVoyage) {
      navigate(`/voyages/${currentVoyageId}?tab=${tabId}`)
    } else {
      onNav(tabId)
    }
    if (isMobile) onClose()
  }

  // Auto-hide state for desktop/tablet — sidebar slides in when mouse nears left edge.
  const [isAutoOpen, setIsAutoOpen] = useState(false)

  // Tooltip state — kept for potential future use but no longer used with auto-hide sidebar.
  const [tooltip, setTooltip] = useState<{ id: string; y: number } | null>(null)

  // Focus trap — active when mobile drawer is open for accessibility.
  // Traps keyboard focus inside the drawer so Tab doesn't reach background content.
  const drawerRef = useFocusTrap<HTMLElement>(isMobile && isOpen)

  // Close drawer on Escape (mobile) — matches the expected modal keyboard behaviour.
  useEffect(() => {
    if (!isMobile || !isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isMobile, isOpen, onClose])

  // Clear tooltip when switching breakpoints to avoid a stuck tooltip when
  // the sidebar transitions from tablet (hover tooltips) to desktop (labels).
  useEffect(() => { setTooltip(null) }, [bp])

  // Budget nav item is filtered for underage users (same gate as the tab in VoyageDetailPage).
  const navItems = NAV.filter(({ id }) => id !== 'budget' || isAdult)

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{
      height: 58, minHeight: 58,
      padding: '0 14px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      background: 'var(--t-primary-dk)',
    }}>
      <img src="/logo.svg" alt="Deck Days" style={{ height: 44, width: 'auto', opacity: 0.9 }} />
      {isMobile && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'rgba(255,255,255,0.5)', fontSize: 18 }}
        >×</button>
      )}
    </div>
  )

  // ── Active ID resolution ────────────────────────────────────────────────────
  // Derive the active nav item from URL state with explicit precedence:
  //   1. ?tab= param active → journal section is selected inside a voyage page.
  //   2. Path starts with /voyages → 'voyages' top-level item is selected.
  //   3. Path slice → legacy top-level route (e.g. /feed → 'feed').
  const activeId = activeTabParam
    ? activeTabParam                                          // journal tab active
    : location.pathname.startsWith('/voyages') ? 'voyages'   // voyage pages
    : location.pathname.slice(1) || 'dashboard'              // legacy sections

  // ── Nav button renderer ────────────────────────────────────────────────────
  // Renders one nav item in either tablet (icon-only) or desktop (icon+label) mode.
  // customOnClick overrides the default onNav behaviour for journal tab items.
  const renderNavButton = (id: string, label: string, icon: string, customOnClick?: () => void) => {
    const active = activeId === id
    const handleClick = customOnClick ?? (() => { onNav(id); if (isMobile) onClose() })
    return (
      <button
        key={id}
        onClick={handleClick}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 11,
          width: '100%', textAlign: 'left',
          padding: '10px 14px 10px 10px', minHeight: 44,
          background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
          color: WHITE, border: 'none',
          borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
          cursor: 'pointer', fontSize: 14, fontFamily: FONT_BODY,
          fontWeight: active ? 700 : 400,
          transition: 'background 0.15s', letterSpacing: '0.01em',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <FE emoji={icon} size={18} />
        <span style={{ flex: 1 }}>{label}</span>
        {/* Gold dot — indicates this section has content. Hidden when active to
            avoid competing with the gold left-border active indicator. */}
        {sectionStatus?.has(id) && !active && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.55, flexShrink: 0 }} />
        )}
      </button>
    )
  }

  // ── Nav section ────────────────────────────────────────────────────────────
  const Nav = () => (
    <nav style={{ flex: 1, padding: '16px 0 8px', overflowY: 'auto' }}>
      {/* Primary nav — always visible: Dashboard, Feed, Voyages, Friends, Chat, Profile */}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: FONT_LOGO, fontWeight: 700, letterSpacing: '-0.02em', padding: '0 14px 8px' }}>
        Deck Days
      </div>
      {PRIMARY_NAV.filter(({ id }) => id !== 'budget' || isAdult).map(({ id, label, icon }) =>
        renderNavButton(id, label, icon)
      )}

      {/* Journal sections — only shown when on a specific voyage detail page. */}
      {isOnVoyage && (
        <>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, padding: '14px 14px 8px', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            Your Journal
          </div>
          {navItems.map(({ id, label, icon }) =>
            renderNavButton(id, label, icon, () => navToJournalTab(id))
          )}
        </>
      )}
    </nav>
  )

  // ── Footer ─────────────────────────────────────────────────────────────────
  const Footer = () => (
    <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
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
  // The drawer slides in from x=-240 (off the left edge) to x=0.
  // The backdrop fades in behind it and closes the drawer on click.
  // Both are wrapped in AnimatePresence so they animate out when isOpen becomes false.
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
              // role="dialog" + aria-modal tells screen readers this is a modal overlay.
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -W_FULL }}
              animate={{ x: 0 }}
              exit={{ x: -W_FULL }}
              // Spring animation for snappy feel; damping/stiffness tuned to feel
              // native on both fast and slow devices.
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

              <Nav />
              <Footer />
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    )
  }

  // ── Desktop + Tablet: auto-hide sidebar ───────────────────────────────────
  // Hidden off-screen by default. A thin trigger strip at the left edge detects
  // mouse proximity and slides the sidebar in with a spring animation.
  return (
    <>
      {/* Invisible trigger strip — catches the mouse at the left edge */}
      {!isAutoOpen && (
        <div
          onMouseEnter={() => setIsAutoOpen(true)}
          style={{ position: 'fixed', left: 0, top: 0, width: 12, height: '100vh', zIndex: 499 }}
        />
      )}

      {/* Backdrop — dims content while sidebar is open */}
      <AnimatePresence>
        {isAutoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsAutoOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 498, backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={{ x: -W_FULL }}
        animate={{ x: isAutoOpen ? 0 : -W_FULL }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onMouseLeave={() => setIsAutoOpen(false)}
        style={{
          position: 'fixed', left: 0, top: 0,
          width: W_FULL, height: '100vh',
          background: SIDEBAR_BG,
          zIndex: 500,
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '8px 0 40px rgba(0,0,0,0.4)',
        }}
      >
        <Header />
        <Nav />
        <Footer />
      </motion.aside>
    </>
  )
}
