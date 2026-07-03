// ─────────────────────────────────────────────────────────────────────────────
// components/BottomNav.tsx — Fixed bottom tab bar (mobile only)
// ─────────────────────────────────────────────────────────────────────────────

import { Ship, CalendarDays, Users, MessageCircle, Rss } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GOLD, FONT_LABEL } from '../constants'
import { useLocation } from 'react-router-dom'
import { useIconPack } from '../context'
import FE from './FE'

interface TabItem { id: string; label: string; Icon: LucideIcon; emoji: string }

const TABS: TabItem[] = [
  { id: 'voyages',  label: 'Voyages', Icon: Ship,          emoji: '🚢' },
  { id: 'daily',    label: 'Daily',   Icon: CalendarDays,  emoji: '📅' },
  { id: 'feed',     label: 'Feed',    Icon: Rss,           emoji: '🧭' },
  { id: 'friends',  label: 'Buddies', Icon: Users,         emoji: '👥' },
  { id: 'chat',     label: 'Chat',    Icon: MessageCircle, emoji: '💬' },
]

interface Props {
  section: string
  onNav:   (id: string) => void
  badges?: Record<string, number>
}

export default function BottomNav({ section, onNav, badges = {} }: Props) {
  const { pathname } = useLocation()
  const iconPack = useIconPack()
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
      {TABS.map(({ id, label, Icon, emoji }) => {
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
              position:       'relative',
              background:     'transparent',
              border:         'none',
              cursor:         'pointer',
              padding:        '12px 4px 8px',
              fontFamily:     FONT_LABEL,
              transition:     'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
              color: active ? GOLD : 'rgba(255,255,255,0.45)',
            }}
          >
            {/* Active indicator — a discrete element (not a border-color transition,
                which iOS Safari can fail to repaint) so it shows for every tab. */}
            {active && (
              <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: GOLD, borderRadius: '0 0 3px 3px' }} />
            )}
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              {iconPack !== 'lucide'
                ? <FE emoji={emoji} size={21} />
                : <Icon size={21} strokeWidth={active ? 2.5 : 1.75} />
              }
              {(badges[id] ?? 0) > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid var(--t-primary-dk)' }} />
              )}
            </span>
            <span style={{
              fontSize:    10,
              fontWeight:  active ? 700 : 600,
              letterSpacing: '0.08em',
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
