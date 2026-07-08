// ─────────────────────────────────────────────────────────────────────────────
// components/TopNav.tsx — Fully responsive top navigation banner
//
// The top banner is the app's single navigation surface on desktop.
//
// Mobile  (<768px) → logo + wordmark centred, search + profile menu on the
//                    right. BottomNav owns primary navigation on mobile.
//
// Desktop (≥768px) → inner max-width container holds logo + wordmark + nav
//                    links + search + profile menu.
//                    Nav labels hide below 1080px (icon-only mode).
//                    Ticker sub-bar below the main bar.
//
// PROFILE MENU:
//   The CircleUser button at the far right opens a dropdown with the signed-in
//   email, Profile link, Admin link (admins only), and Sign out. This replaces
//   the retired sidebar's footer. Closes on outside click and Escape.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Compass, Ship, Users, MessageCircle, CircleUser, Menu, Search, Settings, ShieldCheck, LogOut, Bell } from 'lucide-react'
import { useUnreadNotificationCount } from '@/features/notifications/hooks'
import type { LucideIcon } from 'lucide-react'
import { gsap, prefersReducedMotion } from '../lib/gsap'
import { WHITE, GOLD, BORDER, MUTED, TEXT, FONT_BODY, FONT_DISPLAY, FONT_LABEL } from '../constants'
import TickerText from '../ui/TickerText'
import { useW, useIconPack } from '../context'
import FE from './FE'

const NAV_MAX_WIDTH = 1200

interface NavItem { id: string; label: string; Icon: LucideIcon; emoji: string }

const TOP_NAV_ITEMS: NavItem[] = [
  { id: 'feed',        label: 'Feed',     Icon: Compass,       emoji: '🧭' },
  { id: 'voyages',     label: 'Voyages',  Icon: Ship,          emoji: '🚢' },
  { id: 'friends',     label: 'Friends',  Icon: Users,         emoji: '👥' },
  { id: 'chat',        label: 'Messages', Icon: MessageCircle, emoji: '💬' },
]

interface Props {
  section:      string
  onNav:        (id: string) => void
  isMobile:     boolean
  voyageLabel?: string
  badges?:      Record<string, number>
  userEmail?:   string
  onSignOut:    () => void
  isAdmin?:     boolean
}

// ── Profile dropdown ──────────────────────────────────────────────────────────
// Trigger button + anchored menu. Owns its open state; closes on outside
// click, Escape, or after any menu action.

function ProfileMenu({ section, onNav, userEmail, onSignOut, isAdmin, iconSize, compact = false }: {
  section:    string
  onNav:      (id: string) => void
  userEmail?: string
  onSignOut:  () => void
  isAdmin?:   boolean
  iconSize:   number
  // compact = mobile: search + notifications are folded into this menu, so the
  // trigger also surfaces an unread-notifications dot.
  compact?:   boolean
}) {
  const [open, setOpen] = useState(false)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const menuRef  = useRef<HTMLDivElement>(null)
  const active   = section === 'userprofile'
  const unread   = useUnreadNotificationCount()

  // Dropdown entrance: quick scale + fade from the trigger corner, then the
  // menu items cascade in.
  useLayoutEffect(() => {
    if (!open || !menuRef.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(menuRef.current,
        { autoAlpha: 0, y: -8, scale: 0.96, transformOrigin: 'top right' },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'power3.out' },
      )
      gsap.fromTo(menuRef.current!.children,
        { autoAlpha: 0, y: -6 },
        { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out', stagger: 0.04, delay: 0.05, clearProps: 'opacity,visibility,transform' },
      )
    }, menuRef)
    return () => ctx.revert()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const act = (fn: () => void) => () => { setOpen(false); fn() }

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', textAlign: 'left',
    padding: '10px 14px', minHeight: 40,
    background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, color: TEXT, fontFamily: FONT_LABEL,
    WebkitTapHighlightColor: 'transparent',
  }
  const hover = (e: React.MouseEvent<HTMLButtonElement>, on: boolean) => {
    e.currentTarget.style.background = on ? 'rgba(0,0,0,0.04)' : 'transparent'
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          background: active || open ? 'rgba(201,162,39,0.18)' : 'transparent',
          border: 'none',
          width: 40, height: 40, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: active || open ? GOLD : 'rgba(255,255,255,0.85)',
          borderRadius: 8,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Burger: the menu now holds search + notifications + account. */}
        <Menu size={iconSize} strokeWidth={active || open ? 2.5 : 1.9} />
        {/* Unread-notifications dot — only in compact mode, where the bell is hidden. */}
        {compact && unread > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: '50%',
            background: '#E5484D', boxShadow: '0 0 0 2px var(--t-primary-dk)',
          }} />
        )}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 220, background: WHITE,
            border: `1px solid ${BORDER}`, borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.14)',
            padding: '6px 0', zIndex: 300, overflow: 'hidden',
          }}
        >
          {userEmail && (
            <div style={{ padding: '8px 14px 10px', borderBottom: `1px solid ${BORDER}`, marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_BODY, marginBottom: 3 }}>
                Signed in as
              </div>
              <div style={{ fontSize: 13, color: TEXT, fontFamily: FONT_BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
            </div>
          )}

          {/* Mobile: search + notifications live here instead of on the top bar. */}
          {compact && (
            <>
              <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(() => onNav('search'))}>
                <Search size={16} strokeWidth={1.75} color={MUTED} /> Search
              </button>
              <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(() => onNav('notifications'))}>
                <Bell size={16} strokeWidth={1.75} color={MUTED} /> Notifications
                {unread > 0 && (
                  <span style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                    background: '#E5484D', color: WHITE, fontSize: 11, fontWeight: 800, fontFamily: FONT_BODY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
            </>
          )}

          <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(() => onNav('userprofile'))}>
            <CircleUser size={16} strokeWidth={1.75} color={MUTED} /> Profile
          </button>

          <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(() => onNav('settings'))}>
            <Settings size={16} strokeWidth={1.75} color={MUTED} /> Settings
          </button>

          {isAdmin && (
            <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(() => onNav('admin'))}>
              <ShieldCheck size={16} strokeWidth={1.75} color={MUTED} /> Admin
            </button>
          )}

          <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />

          <button role="menuitem" style={itemStyle} onMouseEnter={e => hover(e, true)} onMouseLeave={e => hover(e, false)} onClick={act(onSignOut)}>
            <LogOut size={16} strokeWidth={1.75} color={MUTED} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopNav({ section, onNav, isMobile, voyageLabel, badges = {}, userEmail, onSignOut, isAdmin = false }: Props) {
  const w        = useW()
  const iconPack = useIconPack()

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ flexShrink: 0, zIndex: 200, position: 'relative' }}>
        {/* ── Main bar ── */}
        <div style={{
          height:       52,
          background:   'var(--t-primary-dk)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex',
          alignItems:   'center',
          padding:      '0 14px',
          gap:          12,
          position:     'relative',
        }}>
          {/* Centre — text at dead centre, logo to its left.
              Shift right by (logoW + gap) / 2 = (28 + 8) / 2 = 18px so the
              text midpoint lands at 50% rather than the group midpoint. */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(calc(-50% - 18px), -50%)',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <img src="/logo.svg" alt="" style={{ height: 28, width: 28, display: 'block', flexShrink: 0, objectFit: 'contain' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: WHITE, fontFamily: FONT_DISPLAY, letterSpacing: '-0.01em', opacity: 0.97, whiteSpace: 'nowrap' }}>
              Deck Days
            </span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Search + notifications are folded into the profile menu on mobile to
              save top-bar space (see compact ProfileMenu). */}
          <ProfileMenu
            section={section}
            onNav={onNav}
            userEmail={userEmail}
            onSignOut={onSignOut}
            isAdmin={isAdmin}
            iconSize={24}
            compact
          />
        </div>

        {/* ── Ticker sub-bar ── */}
        <div style={{
          height:     26,
          background: 'var(--t-primary-dk)',
          borderTop:  '1px solid rgba(255,255,255,0.06)',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          padding:    '0 14px',
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Deck Days - Cruise Journal - Capture every day at sea!!!'}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 12, flexShrink: 0 }}>⚓</span>
        </div>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────

  // Dynamically computed values based on actual window width
  const showLabels    = w >= 1080                          // hide nav labels below 1080px
  const logoH         = w < 900 ? 34 : 42                 // logo shrinks on narrow desktop
  const wordmarkSize  = w < 900 ? 16 : w < 1100 ? 18 : 22
  const navFontSize   = w < 1100 ? 12 : 13
  const navPadding    = showLabels ? '7px 12px' : '7px 10px'
  const navGap        = w < 1000 ? 2 : 4

  const containerPadX = 32

  return (
    <div style={{ zIndex: 200, flexShrink: 0, position: 'relative' }}>

      {/* ── Main bar ── */}
      <div style={{
        height:       64,
        background:   'var(--t-primary-dk)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position:     'relative',
      }}>

        {/* Inner container */}
        <div style={{
          maxWidth:   NAV_MAX_WIDTH,
          margin:     '0 auto',
          height:     '100%',
          display:    'flex',
          alignItems: 'center',
          paddingLeft:  containerPadX,
          paddingRight: containerPadX,
          gap:          12,
          boxSizing:    'border-box',
        }}>

          {/* Logo + wordmark */}
          <button
            onClick={() => onNav('dashboard')}
            aria-label="Deck Days — home"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
          >
            <img src="/logo.svg" alt="Deck Days" style={{ height: logoH, width: 'auto', display: 'block', transition: 'height 0.2s' }} />
            <span style={{
              fontSize: wordmarkSize, fontWeight: 800, color: WHITE,
              fontFamily: FONT_DISPLAY, letterSpacing: '-0.01em',
              whiteSpace: 'nowrap', opacity: 0.97,
              transition: 'font-size 0.2s',
            }}>
              Deck Days
            </span>
          </button>

          <div style={{ flex: 1, minWidth: 0 }} />

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: navGap, flexShrink: 0 }}>
            {TOP_NAV_ITEMS.map(({ id, label, Icon, emoji }) => {
              const active = section === id
              return (
                <button
                  key={id}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNav(id)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          showLabels ? 6 : 0,
                    background:   active ? 'rgba(201,162,39,0.14)' : 'transparent',
                    border:       `1px solid ${active ? 'rgba(201,162,39,0.4)' : 'transparent'}`,
                    borderRadius: 8,
                    padding:      navPadding,
                    cursor:       'pointer',
                    color:        active ? GOLD : 'rgba(255,255,255,0.82)',
                    fontFamily:   FONT_BODY,
                    fontSize:     navFontSize,
                    fontWeight:   active ? 700 : 500,
                    letterSpacing: '0.01em',
                    whiteSpace:   'nowrap',
                    transition:   'all 0.15s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = WHITE } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.82)' } }}
                  title={!showLabels ? label : undefined}
                >
                  <span style={{ position: 'relative', display: 'inline-flex' }}>
                    {iconPack !== 'lucide'
                      ? <FE emoji={emoji} size={15} />
                      : <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                    }
                    {(badges[id] ?? 0) > 0 && (
                      <span style={{ position: 'absolute', top: -3, right: -4, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid var(--t-primary-dk)' }} />
                    )}
                  </span>
                  {showLabels && label}
                </button>
              )
            })}

            {/* Search + notifications are folded into the burger menu (compact). */}
            <ProfileMenu
              section={section}
              onNav={onNav}
              userEmail={userEmail}
              onSignOut={onSignOut}
              isAdmin={isAdmin}
              iconSize={20}
              compact
            />
          </nav>
        </div>
      </div>

      {/* ── Ticker sub-bar ── */}
      <div style={{
        height:     30,
        background: 'var(--t-primary-dk)',
        borderTop:  '1px solid rgba(255,255,255,0.06)',
        overflow:   'hidden',
      }}>
        <div style={{
          maxWidth:    NAV_MAX_WIDTH,
          margin:      '0 auto',
          height:      '100%',
          display:     'flex',
          alignItems:  'center',
          paddingLeft:  containerPadX,
          paddingRight: containerPadX,
          gap:          8,
          overflow:     'hidden',
          boxSizing:    'border-box',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚓</span>
          <TickerText
            text={voyageLabel || 'Deck Days - Cruise Journal - Capture every day at sea!!!'}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400, fontFamily: FONT_BODY, letterSpacing: '0.02em' }}
          />
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚓</span>
        </div>
      </div>

    </div>
  )
}
