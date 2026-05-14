// ─────────────────────────────────────────────────────────────────────────────
// components/BottomNav.tsx — Fixed bottom tab bar (mobile only)
// ─────────────────────────────────────────────────────────────────────────────

import { Home, CalendarDays, BookOpen, Users, MessageCircle, Rss } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GOLD, FONT_BODY } from '../constants'

interface TabItem {
  id:       string
  label:    string
  Icon:     LucideIcon
  action?:  'menu'
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Home',    Icon: Home },
  { id: 'feed',      label: 'Feed',    Icon: Rss },
  { id: 'daily',     label: 'Daily',   Icon: CalendarDays },
  { id: 'friends',   label: 'Friends', Icon: Users },
  { id: 'chat',      label: 'Chat',    Icon: MessageCircle },
]

interface Props {
  section:     string
  onNav:       (id: string) => void
  onMenuOpen:  () => void
}

export default function BottomNav({ section, onNav, onMenuOpen }: Props) {
  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position:    'fixed',
        bottom:      0,
        left:        0,
        right:       0,
        zIndex:      500,
        background:  'var(--t-primary-dk)',
        borderTop:   '1px solid rgba(255,255,255,0.1)',
        display:     'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ id, label, Icon, action }) => {
        const isMenu  = action === 'menu'
        const active  = !isMenu && section === id
        const color   = active ? GOLD : 'rgba(255,255,255,0.55)'

        return (
          <button
            key={id}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => isMenu ? onMenuOpen() : onNav(id)}
            style={{
              flex:           1,
              minHeight:      44,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            3,
              background:     'transparent',
              border:         'none',
              cursor:         'pointer',
              color,
              padding:        '8px 4px',
              fontFamily:     FONT_BODY,
              transition:     'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: '0.02em' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
