// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/VoyageCard.tsx — Clickable voyage summary card
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { NAVY2, MUTED, WHITE, GOLD, BORDER, FONT_DISPLAY, FONT_BODY, TEAL } from '@/constants'
import FE from '@/components/FE'
import type { VoyageRow } from './hooks'

interface Props {
  voyage:    VoyageRow
  postCount: number
  onClick:   () => void
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'Dates not set'
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

function voyageStatus(start: string | null, end: string | null): 'upcoming' | 'active' | 'completed' {
  if (!start) return 'upcoming'
  const now   = new Date()
  const s     = new Date(start + 'T00:00:00')
  const e     = end ? new Date(end + 'T00:00:00') : null
  if (now < s) return 'upcoming'
  if (e && now > e) return 'completed'
  return 'active'
}

const STATUS_LABEL: Record<string, string> = { upcoming: 'Upcoming', active: 'Active', completed: 'Completed' }
const STATUS_COLOR: Record<string, string> = { upcoming: NAVY2, active: GOLD, completed: TEAL }

export default function VoyageCard({ voyage, postCount, onClick }: Props) {
  const status     = voyageStatus(voyage.departure_date, voyage.return_date)
  const statusCol  = STATUS_COLOR[status]
  const title      = voyage.ship_name || 'Unnamed Voyage'
  const subtitle   = [voyage.cruise_line, voyage.departure_date?.slice(0, 4)].filter(Boolean).join(' · ')

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
      style={{
        background:    WHITE,
        border:        `1px solid ${BORDER}`,
        borderRadius:  18,
        overflow:      'hidden',
        textAlign:     'left',
        cursor:        'pointer',
        fontFamily:    FONT_BODY,
        display:       'flex',
        flexDirection: 'column',
        boxShadow:     '0 2px 8px rgba(0,0,0,0.05)',
        width:         '100%',
      }}
    >
      {/* Cover image / gradient */}
      <div style={{ height: 130, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {voyage.cover_photo_url ? (
          <img
            src={voyage.cover_photo_url}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FE emoji="🚢" size={48} />
          </div>
        )}
        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: statusCol + 'EE',
          color: status === 'active' ? '#1C2B3A' : WHITE,
          fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          borderRadius: 20, padding: '3px 10px',
          backdropFilter: 'blur(6px)',
          fontFamily: FONT_BODY,
        }}>
          {STATUS_LABEL[status]}
        </div>
        {/* Night count badge */}
        {voyage.total_nights && (
          <div style={{
            position: 'absolute', bottom: 10, left: 12,
            background: 'rgba(0,0,0,0.5)',
            color: WHITE, fontSize: 11, fontWeight: 700,
            borderRadius: 12, padding: '3px 9px',
            backdropFilter: 'blur(4px)',
            fontFamily: FONT_BODY,
          }}>
            {voyage.total_nights} nights
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2 }}>
          {title}
        </h3>
        {subtitle && (
          <div style={{ fontSize: 12, color: MUTED }}>{subtitle}</div>
        )}
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
          {formatDateRange(voyage.departure_date, voyage.return_date)}
        </div>

        {/* Post count footer */}
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FE emoji="📝" size={13} />
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
            {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : 'No posts yet'}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
