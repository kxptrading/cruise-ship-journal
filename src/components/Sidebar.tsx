// ─────────────────────────────────────────────────────────────────────────────
// components/Sidebar.tsx — Navigation sidebar
//
// Three display modes driven by the `bp` prop:
//   mobile  → hidden by default; slides in as a Framer Motion drawer
//   tablet  → always-visible, 64 px wide, icons only with hover tooltips
//   desktop → always-visible, 240 px wide, full labels
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties }          from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion }  from 'framer-motion'
import { GOLD, WHITE, FONT_DISPLAY, FONT_BODY, FONT_LOGO } from '../constants'
import { NAV, PRIMARY_NAV } from '../constants'
import FE     from './FE'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Breakpoint } from '../hooks/useBreakpoint'

// ── TickerText — single-copy scrolling ticker ─────────────────────────────────
// Measures the actual text width and container width, then animates ONE copy of
// the text from just-off-screen-right to just-off-screen-left. No duplicate
// visible; loops with a brief pause after each pass.

function TickerText({ text, style }: { text: string; style?: CSSProperties }) {
  const outerRef   = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [travel, setTravel] = useState<{ from: number; to: number } | null>(null)

  useEffect(() => {
    const outer   = outerRef.current
    const measure = measureRef.current
    if (!outer || !measure) return
    const cw = outer.clientWidth
    const tw = measure.scrollWidth
    // Only animate when text is wider than its container
    setTravel(tw > cw ? { from: cw + 8, to: -(tw + 8) } : null)
  }, [text])

  const base: CSSProperties = { display: 'inline-block', whiteSpace: 'nowrap', ...style }

  return (
    <div ref={outerRef} style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
      {/* Hidden span used only for measuring text width */}
      <span ref={measureRef} aria-hidden="true"
        style={{ ...base, position: 'absolute', visibility: 'hidden', top: 0, left: 0, pointerEvents: 'none' }}>
        {text}
      </span>
      {travel ? (
        // Animated — one copy scrolls from right edge to left edge, then pauses
        <motion.span
          animate={{ x: [travel.from, travel.to] }}
          transition={{
            duration: Math.max(3, (travel.from - travel.to) / 55),
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 1.2,
          }}
          style={base}
        >
          {text}
        </motion.span>
      ) : (
        // Static — fits without scrolling
        <span style={base}>{text}</span>
      )}
    </div>
  )
}

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
  const isMobile   = bp === 'mobile'
  const isTablet   = bp === 'tablet'
  const location   = useLocation()
  const navigate   = useNavigate()

  // Detect whether we're on a specific voyage detail page
  const voyageIdMatch    = location.pathname.match(/^\/voyages\/([^/]+?)(?:\/|$)/)
  const currentVoyageId  = voyageIdMatch?.[1]
  const isOnVoyage       = !!currentVoyageId && currentVoyageId !== 'new'

  // Active journal tab from ?tab= search param (set by journal nav links)
  const activeTabParam = new URLSearchParams(location.search).get('tab')

  // Navigate journal section links to the current voyage's tab
  const navToJournalTab = (tabId: string) => {
    if (isOnVoyage) {
      navigate(`/voyages/${currentVoyageId}?tab=${tabId}`)
    } else {
      onNav(tabId)
    }
    if (isMobile) onClose()
  }

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
      <img src="/logo.svg" alt="Swell Days" style={{ height: isTablet ? 36 : 44, width: 'auto', opacity: 0.9 }} />
      {isMobile && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'rgba(255,255,255,0.5)', fontSize: 18 }}
        >×</button>
      )}
    </div>
  )

  // ── Voyage label — uses TickerText for long ship names ───────────────────
  const VoyageSwitcher = () => {
    const name = voyageName || 'No voyage selected'
    return (
      <div style={{ padding: '10px 14px 2px' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: FONT_BODY, fontWeight: 700, marginBottom: 5 }}>
          Active Voyage
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '7px 11px', overflow: 'hidden' }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🚢</span>
          <TickerText
            text={name}
            style={{ fontSize: 12, color: WHITE, fontWeight: 600, opacity: 0.9, fontFamily: FONT_BODY }}
          />
          {voyageCount > 1 && (
            <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '1px 6px', fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 700, flexShrink: 0 }}>
              {voyageCount}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Nav items ──────────────────────────────────────────────────────────────
  // Determine the active id — handles /voyages/:id paths and ?tab= journal tabs
  const activeId = activeTabParam
    ? activeTabParam                                          // journal tab active
    : location.pathname.startsWith('/voyages') ? 'voyages'   // voyage pages
    : location.pathname.slice(1) || 'dashboard'              // legacy sections

  const renderNavButton = (id: string, label: string, icon: string, customOnClick?: () => void) => {
    const active = activeId === id
    const handleClick = customOnClick ?? (() => { onNav(id); if (isMobile) onClose() })
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
            onClick={handleClick}
            style={{
              width: W_ICON, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
              cursor: 'pointer', color: WHITE,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <FE emoji={icon} size={20} />
          </button>
        </div>
      )
    }
    return (
      <button
        key={id}
        onClick={handleClick}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 11,
          width: '100%', textAlign: 'left',
          padding: '10px 18px 10px 14px', minHeight: 44,
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
        {sectionStatus?.has(id) && !active && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, opacity: 0.55, flexShrink: 0 }} />
        )}
      </button>
    )
  }

  const Nav = () => (
    <nav style={{ flex: 1, padding: '16px 0 8px', overflowY: isTablet ? 'auto' : undefined }}>
      {/* Primary nav */}
      {!isTablet && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: FONT_LOGO, fontWeight: 700, letterSpacing: '-0.02em', padding: '0 20px 8px' }}>
          SwellDays
        </div>
      )}
      {PRIMARY_NAV.filter(({ id }) => id !== 'budget' || isAdult).map(({ id, label, icon }) =>
        renderNavButton(id, label, icon)
      )}

      {/* Journal sections — only shown when viewing a specific voyage */}
      {isOnVoyage && (
        <>
          {!isTablet && (
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT_BODY, fontWeight: 700, padding: '14px 20px 8px', marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              Your Journal
            </div>
          )}
          {isTablet && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 12px' }} />}
          {navItems.map(({ id, label, icon }) =>
            renderNavButton(id, label, icon, () => navToJournalTab(id))
          )}
        </>
      )}
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
