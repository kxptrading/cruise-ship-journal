// features/voyages/dashboard/MyVoyagesStrip.tsx — Quick-nav voyage strip on the dashboard

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Plus } from 'lucide-react'
import { NAVY2, MUTED, WHITE, GOLD, BORDER, FONT_DISPLAY, FONT_BODY, TEAL } from '@/constants'
import FE from '@/components/FE'
import { useVoyages } from '@/features/voyages/hooks'
import type { VoyageRow } from '@/features/voyages/hooks'

// ── Status helpers (mirrored from VoyageCard) ─────────────────────────────────

function voyageStatus(start: string | null, end: string | null): 'upcoming' | 'active' | 'completed' {
  if (!start) return 'upcoming'
  const now = new Date()
  const s   = new Date(start + 'T00:00:00')
  const e   = end ? new Date(end + 'T00:00:00') : null
  if (now < s) return 'upcoming'
  if (e && now > e) return 'completed'
  return 'active'
}

const STATUS_LABEL: Record<string, string> = { upcoming: 'Upcoming', active: 'Active', completed: 'Completed' }
const STATUS_COLOR: Record<string, string> = { upcoming: NAVY2, active: GOLD, completed: TEAL }

// ── Mini voyage card ──────────────────────────────────────────────────────────

function MiniCard({ voyage, currentVoyageId, onClick }: {
  voyage:         VoyageRow
  currentVoyageId: string | null
  onClick:        () => void
}) {
  const status    = voyageStatus(voyage.departure_date, voyage.return_date)
  const statusCol = STATUS_COLOR[status]
  const isCurrent = voyage.id === currentVoyageId

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16 }}
      style={{
        flexShrink:    0,
        width:         160,
        background:    WHITE,
        border:        `${isCurrent ? '2px' : '1px'} solid ${isCurrent ? 'var(--t-primary)' : BORDER}`,
        borderRadius:  16,
        overflow:      'hidden',
        textAlign:     'left',
        cursor:        'pointer',
        fontFamily:    FONT_BODY,
        display:       'flex',
        flexDirection: 'column',
        boxShadow:     isCurrent ? '0 0 0 3px var(--t-primary)22' : '0 2px 6px rgba(0,0,0,0.06)',
        transition:    'border-color 0.18s',
      }}
    >
      {/* Cover image */}
      <div style={{ height: 90, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {voyage.cover_photo_url ? (
          <img src={voyage.cover_photo_url} alt={voyage.ship_name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FE emoji="🚢" size={32} />
          </div>
        )}
        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 7, right: 8,
          background: statusCol + 'EE', color: status === 'active' ? '#1C2B3A' : WHITE,
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
          borderRadius: 20, padding: '2px 8px', backdropFilter: 'blur(6px)', fontFamily: FONT_BODY,
        }}>
          {STATUS_LABEL[status]}
        </div>
        {/* Nights badge */}
        {voyage.total_nights && (
          <div style={{
            position: 'absolute', bottom: 7, left: 8,
            background: 'rgba(0,0,0,0.48)', color: WHITE, fontSize: 10, fontWeight: 700,
            borderRadius: 10, padding: '2px 7px', backdropFilter: 'blur(4px)', fontFamily: FONT_BODY,
          }}>
            {voyage.total_nights}n
          </div>
        )}
        {/* "Current" indicator */}
        {isCurrent && (
          <div style={{
            position: 'absolute', bottom: 7, right: 8,
            background: 'var(--t-primary)', color: WHITE, fontSize: 9, fontWeight: 700,
            borderRadius: 10, padding: '2px 7px', fontFamily: FONT_BODY,
          }}>
            Now
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 13, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {voyage.ship_name || 'Unnamed Voyage'}
        </div>
        {voyage.cruise_line && (
          <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {voyage.cruise_line}
          </div>
        )}
        {voyage.departure_date && (
          <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
            {new Date(voyage.departure_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ── MyVoyagesStrip ────────────────────────────────────────────────────────────

interface Props {
  currentVoyageId: string | null
  onSwitch?:       (id: string) => void
}

export default function MyVoyagesStrip({ currentVoyageId, onSwitch }: Props) {
  const navigate = useNavigate()
  const { data: voyages = [], isLoading } = useVoyages()

  // Don't render the strip if no voyages exist yet
  if (!isLoading && voyages.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
          My Voyages
        </h2>
        <button
          onClick={() => navigate('/voyages')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--t-primary)', fontFamily: FONT_BODY, fontWeight: 600, padding: '2px 0' }}
        >
          View all <ChevronRight size={13} />
        </button>
      </div>

      {/* Horizontal scroll strip */}
      <div className="voyage-strip" style={{
        display:        'flex',
        gap:            10,
        overflowX:      'auto',
        paddingBottom:  6,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>

        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="skeleton-shimmer" style={{ flexShrink: 0, width: 160, height: 190, borderRadius: 16 }} />
        ))}

        {!isLoading && voyages.map(v => (
          <div key={v.id} style={{ scrollSnapAlign: 'start' }}>
            <MiniCard
              voyage={v}
              currentVoyageId={currentVoyageId}
              onClick={() => onSwitch ? onSwitch(v.id) : navigate(`/voyages/${v.id}`)}
            />
          </div>
        ))}

        {/* New voyage shortcut */}
        {!isLoading && (
          <div style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
            <motion.button
              onClick={() => navigate('/voyages/new')}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.16 }}
              style={{
                width: 130, height: '100%', minHeight: 120,
                background: 'none',
                border: `1.5px dashed ${BORDER}`,
                borderRadius: 16, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: MUTED, fontFamily: FONT_BODY,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} color={MUTED} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>New voyage</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
