// ─────────────────────────────────────────────────────────────────────────────
// pages/MyPassesPage.tsx — the user's Voyage Passes (/passes)
//
// Shows available credits (what each covers), a link to buy more, and the full
// purchase/redemption history. Read-only: passes are granted server-side.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate, Link } from 'react-router-dom'
import { Ship, Plus } from 'lucide-react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, CREAM, LIGHT, FONT_DISPLAY, FONT_BODY, FONT_LABEL, LABEL_TRACK } from '@/constants'
import { useMyPasses, type VoyagePass } from '@/features/passes/hooks'

const coversText = (maxNights: number | null) => (maxNights == null ? 'Any voyage length' : `Up to ${maxNights} nights`)

const STATUS_STYLE: Record<VoyagePass['status'], { label: string; bg: string; fg: string; bd: string }> = {
  available: { label: 'Available', bg: 'rgba(16,185,129,0.12)', fg: '#0F7A5A', bd: 'rgba(16,185,129,0.4)' },
  redeemed:  { label: 'Redeemed',  bg: CREAM,                    fg: MUTED,    bd: BORDER },
  refunded:  { label: 'Refunded',  bg: '#FEF2F2',                fg: '#DC2626', bd: '#FECACA' },
}

const SOURCE_LABEL: Record<VoyagePass['source'], string> = {
  purchase: 'Purchase', bundle: 'Bundle credit', founder: "Founder's Offer", promo: 'Promo',
}

export default function MyPassesPage() {
  const navigate = useNavigate()
  const { data: passes, isLoading } = useMyPasses()

  const available = (passes ?? []).filter(p => p.status === 'available')

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 4px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: FONT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
            My Voyage Passes
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 28, color: NAVY2 }}>
            {available.length} pass{available.length === 1 ? '' : 'es'} ready to use
          </h1>
        </div>
        <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: NAVY, color: WHITE, borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, textDecoration: 'none' }}>
          <Plus size={15} /> Buy passes
        </Link>
      </div>

      {isLoading && <p style={{ fontFamily: FONT_BODY, color: MUTED }}>Loading…</p>}

      {/* Available credits */}
      {!isLoading && available.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 30 }}>
          {available.map(p => (
            <div key={p.id} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,162,39,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ship size={19} color={GOLD} />
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: NAVY2 }}>{coversText(p.max_nights)}</div>
              </div>
              <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED }}>
                {SOURCE_LABEL[p.source]} · {new Date(p.purchased_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => navigate('/voyages/new')}
                style={{ marginTop: 14, width: '100%', background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, color: NAVY, cursor: 'pointer' }}
              >
                Use for a new voyage
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && available.length === 0 && (
        <div style={{ background: WHITE, border: `1px dashed ${BORDER}`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 30 }}>
          <Ship size={30} color={MUTED} style={{ opacity: 0.6 }} />
          <p style={{ margin: '12px 0 18px', fontFamily: FONT_BODY, fontSize: 15, color: TEXT }}>
            You don't have any passes yet. Grab one to start your next cruise journal.
          </p>
          <Link to="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: NAVY, color: WHITE, borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, textDecoration: 'none' }}>
            View Voyage Passes
          </Link>
        </div>
      )}

      {/* History */}
      {!isLoading && passes && passes.length > 0 && (
        <div>
          <div style={{ fontFamily: FONT_LABEL, fontSize: 11, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase', color: MUTED, marginBottom: 12 }}>
            History
          </div>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            {passes.map((p, i) => {
              const s = STATUS_STYLE[p.status]
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', background: i % 2 ? LIGHT : WHITE, borderTop: i ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY2 }}>{coversText(p.max_nights)}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {SOURCE_LABEL[p.source]} · {new Date(p.purchased_at).toLocaleDateString()}
                      {p.redeemed_at ? ` · redeemed ${new Date(p.redeemed_at).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: s.fg, background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 980, padding: '4px 11px' }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
