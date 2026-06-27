// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/VoyageCard.tsx — Clickable voyage summary card
//
// The entire card is a button that navigates to the voyage. The delete action
// lives in the footer and uses e.stopPropagation() so clicking it doesn't
// also trigger navigation. A two-step confirm prevents accidental deletion.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAVY2, WHITE, GOLD, FONT_DISPLAY, FONT_BODY, TEAL } from '@/constants'
import FE from '@/components/FE'
import { Trash2, AlertTriangle, Users, Pencil } from 'lucide-react'
import { useDeleteVoyage } from './hooks'
import type { VoyageRow } from './hooks'

interface Props {
  voyage:    VoyageRow
  postCount: number
  onClick:   (rect: DOMRect) => void
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
  const now = new Date()
  const s   = new Date(start + 'T00:00:00')
  const e   = end ? new Date(end + 'T00:00:00') : null
  if (now < s) return 'upcoming'
  if (e && now > e) return 'completed'
  return 'active'
}

const STATUS_LABEL: Record<string, string> = { upcoming: 'Upcoming', active: 'Active', completed: 'Completed' }
const STATUS_COLOR: Record<string, string> = { upcoming: NAVY2, active: GOLD, completed: TEAL }

export default function VoyageCard({ voyage, postCount, onClick }: Props) {
  const navigate                = useNavigate()
  const deleteVoyage            = useDeleteVoyage()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Edit the voyage's details (ship, dates, cabin, companions…) post-creation.
  // Owner only; opens the voyage editor without triggering the card's navigation.
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/voyages/${voyage.id}/edit`)
  }

  const status    = voyageStatus(voyage.departure_date, voyage.return_date)
  const statusCol = STATUS_COLOR[status]
  // Book title = the destination (where the ship's going), falling back to the ship.
  const title    = voyage.destination || voyage.ship_name || 'Unnamed Voyage'
  const showShip = !!voyage.destination && !!voyage.ship_name

  const handleDeleteClick = (e: React.MouseEvent) => {
    // Stop the card's onClick (navigation) from firing
    e.stopPropagation()
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteVoyage.mutateAsync(voyage.id)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  const cover    = voyage.cover_photo_url
  const dateLine = [formatDateRange(voyage.departure_date, voyage.return_date), voyage.total_nights ? `${voyage.total_nights} nights` : '']
    .filter(s => s && s !== 'Dates not set').join(' · ') || 'Dates not set'

  const iconBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.14)', border: 'none', cursor: 'pointer', color: WHITE,
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26,
    borderRadius: 7, padding: 0, backdropFilter: 'blur(4px)',
  }

  return (
    <motion.button
      onClick={e => onClick((e.currentTarget as HTMLElement).getBoundingClientRect())}
      whileHover={{ y: -6, rotate: -0.5, boxShadow: '0 20px 40px rgba(0,0,0,0.30), 0 5px 12px rgba(0,0,0,0.18)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{
        position: 'relative', width: '100%', aspectRatio: '2 / 3',
        border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
        fontFamily: FONT_BODY, color: WHITE,
        borderRadius: '3px 11px 11px 3px', overflow: 'hidden',
        boxShadow: '0 10px 26px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)',
        background: cover ? NAVY2 : 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)',
      }}
    >
      {/* Cover artwork */}
      {cover
        ? <img src={cover} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}><FE emoji="🚢" size={56} /></div>}

      {/* Jacket scrim — legibility at top (kicker/status) and bottom (title) */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,16,28,0.55) 0%, rgba(8,16,28,0.06) 28%, rgba(8,16,28,0.14) 52%, rgba(8,16,28,0.84) 100%)' }} />

      {/* Page edges (right) */}
      <div style={{ position: 'absolute', right: 0, top: 5, bottom: 5, width: 5, borderRadius: '0 2px 2px 0',
        background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0.85) 1px, rgba(150,140,120,0.55) 1px, rgba(150,140,120,0.55) 2px)' }} />

      {/* ── Spine / binding (left) ─────────────────────────────────────────── */}
      {/* Curved spine: outer edge in shadow → a lit crown → curving back. */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 17,
        background: 'linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 20%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.04) 55%, rgba(0,0,0,0.18) 78%, rgba(0,0,0,0.46) 100%)' }} />
      {/* Hinge groove where the spine folds into the front cover, with a thin
          highlight on the cover edge — this fold is what reads as a real book. */}
      <div style={{ position: 'absolute', left: 17, top: 0, bottom: 0, width: 7,
        background: 'linear-gradient(to right, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.14) 42%, rgba(0,0,0,0) 70%, rgba(255,255,255,0.12) 100%)' }} />
      {/* Head & tail bands (binding ridges top and bottom of the spine) */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 17, height: 6, background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: 17, height: 6, background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))' }} />
      {/* Soft shadow the spine casts onto the cover */}
      <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 14, background: 'linear-gradient(to right, rgba(0,0,0,0.22), rgba(0,0,0,0))', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, padding: '15px 15px 15px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top group: corner badges, then the centred cruise title */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            {voyage.is_shared ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: WHITE, background: 'rgba(0,0,0,0.42)', borderRadius: 20, padding: '2px 8px' }}>
                <Users size={10} /> Shared
              </span>
            ) : <span />}
            <span style={{ flexShrink: 0, background: statusCol + 'EE', color: status === 'active' ? '#1C2B3A' : WHITE, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 20, padding: '3px 9px', backdropFilter: 'blur(6px)' }}>
              {STATUS_LABEL[status]}
            </span>
          </div>

          {/* Cruise title — top & centred, the book's headline */}
          <div style={{ textAlign: 'center', marginTop: 16, paddingInline: 6 }}>
            {voyage.cruise_line && (
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 4px rgba(0,0,0,0.6)', marginBottom: 8 }}>
                {voyage.cruise_line}
              </div>
            )}
            <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(20px, 2.2vw, 27px)', lineHeight: 1.14, color: WHITE, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {title}
            </h3>
            <div style={{ margin: '10px auto 0', height: 2, width: 36, background: GOLD, borderRadius: 2 }} />
          </div>
        </div>

        {/* Bottom group: ship, dates, actions */}
        <div>
          {showShip && (
            <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {voyage.ship_name}
            </div>
          )}
          <div style={{ marginTop: showShip ? 3 : 0, fontSize: 11.5, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {dateLine}
          </div>

          {/* Action row */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', fontWeight: 600 }}>
              {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : 'No posts yet'}
            </span>

            {voyage.is_shared ? (
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={11} /> Co-authoring
              </span>
            ) : confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: '#FCA5A5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <AlertTriangle size={11} /> Delete?
                </span>
                <button onClick={handleConfirmDelete} disabled={deleteVoyage.isPending}
                  style={{ background: '#DC2626', color: WHITE, border: 'none', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, opacity: deleteVoyage.isPending ? 0.6 : 1 }}>
                  {deleteVoyage.isPending ? '…' : 'Yes'}
                </button>
                <button onClick={handleCancelDelete}
                  style={{ background: 'rgba(255,255,255,0.16)', color: WHITE, border: 'none', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', fontSize: 10.5 }}>
                  No
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEdit} title="Edit voyage details" style={iconBtn}><Pencil size={13} /></button>
                <button onClick={handleDeleteClick} title="Delete voyage" style={iconBtn}><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}
