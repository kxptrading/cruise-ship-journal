// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/VoyageInvitesBanner.tsx — Pending co-author invites
//
// Shown at the top of VoyagesPage. Lists voyages someone has invited the current
// user to co-author, with Accept / Decline. Renders nothing when there are none.
// ─────────────────────────────────────────────────────────────────────────────

import { Users } from 'lucide-react'
import { WHITE, BORDER, NAVY2, MUTED, GOLD, TEXT, FONT_BODY } from '@/constants'
import { useMyVoyageInvites, useAcceptVoyageInvite, useDeclineVoyageInvite } from './coauthors'

export default function VoyageInvitesBanner() {
  const { data: invites = [] } = useMyVoyageInvites()
  const accept = useAcceptVoyageInvite()
  const decline = useDeclineVoyageInvite()

  if (invites.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
      {invites.map(inv => (
        <div
          key={inv.id}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: WHITE, border: `1px solid ${GOLD}`, borderRadius: 14, padding: '12px 16px' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'rgba(201,162,39,0.16)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 14, color: TEXT, fontFamily: FONT_BODY }}>
              <strong style={{ color: NAVY2 }}>{inv.ownerName}</strong> invited you to co-author{' '}
              <strong style={{ color: NAVY2 }}>{inv.shipName}</strong>.
            </div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, marginTop: 2 }}>
              You'll be able to add your own photos and posts.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => accept.mutate(inv.id)}
              disabled={accept.isPending}
              style={{ background: NAVY2, color: WHITE, border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY, cursor: 'pointer' }}
            >
              Accept
            </button>
            <button
              onClick={() => decline.mutate(inv.id)}
              disabled={decline.isPending}
              style={{ background: 'none', color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontFamily: FONT_BODY, cursor: 'pointer' }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
