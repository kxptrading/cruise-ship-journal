// ─────────────────────────────────────────────────────────────────────────────
// components/BottomNav.tsx — Fixed bottom tab bar (mobile only)
// ─────────────────────────────────────────────────────────────────────────────

import { Ship, CalendarDays, Users, MessageCircle, Rss } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GOLD, FONT_BODY } from '../constants'
import { useLocation } from 'react-router-dom'

interface TabItem { id: string; label: string; Icon: LucideIcon }

const TABS: TabItem[] = [
  { id: 'voyages',  label: 'Voyages', Icon: Ship          },
  { id: 'daily',    label: 'Daily',   Icon: CalendarDays  },
  { id: 'feed',     label: 'Feed',    Icon: Rss           },
  { id: 'friends',  label: 'Friends', Icon: Users         },
  { id: 'chat',     label: 'Chat',    Icon: MessageCircle },
]

interface Props {
  section:    string
  onNav:      (id: string) => void
  onMenuOpen: () => void
}

export default function BottomNav({ section, onNav }: Props) {
  const { pathname } = useLocation()
  const activeTab = pathname.startsWith('/voyages') ? 'voyages' : (pathname.slice(1) || section)

  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position:      'fixed',
        bottom:        0,
        left:          0,
        right:         0,
        zIndex:        500,
        background:    'var(--t-primary-dk)',
        borderTop:     '1px solid rgba(255,255,255,0.08)',
        display:       'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id

        return (
          <button
            key={id}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNav(id)}
            style={{
              flex:           1,
              minHeight:      54,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            4,
              background:     'transparent',
              border:         'none',
              borderTop:      `2px solid ${active ? GOLD : 'transparent'}`,
              cursor:         'pointer',
              padding:        '10px 4px 8px',
              fontFamily:     FONT_BODY,
              transition:     'border-color 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
              color: active ? GOLD : 'rgba(255,255,255,0.45)',
            }}
          >
            <Icon size={21} strokeWidth={active ? 2.5 : 1.75} />
            <span style={{
              fontSize:    10,
              fontWeight:  active ? 700 : 400,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
