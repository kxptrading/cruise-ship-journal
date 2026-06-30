// ─────────────────────────────────────────────────────────────────────────────
// pages/FounderResultPage.tsx — Stripe Checkout success / cancelled landing
//
// Where Stripe redirects after a Founder's Offer checkout. Public (anonymous
// checkout — the buyer is usually logged out here). Success thanks them and
// previews account creation (entitlement is a later phase); cancelled offers a
// way back to the offer. Kept deliberately light — no data fetch required.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_BODY } from '@/constants'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        width: '100%', maxWidth: 460, background: WHITE, border: `1px solid ${BORDER}`,
        borderRadius: 18, padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(20,41,63,0.08)',
      }}>
        {children}
      </div>
    </div>
  )
}

const btn = (primary: boolean): React.CSSProperties => ({
  display: 'inline-block', textDecoration: 'none', borderRadius: 980,
  padding: '12px 26px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700,
  background: primary ? GOLD : 'transparent', color: primary ? NAVY2 : NAVY2,
  border: primary ? 'none' : `1px solid ${BORDER}`,
})

export function FounderSuccessPage() {
  return (
    <Shell>
      <CheckCircle2 size={52} strokeWidth={1.6} color={GOLD} style={{ margin: '0 auto 18px' }} />
      <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 30, lineHeight: 1.15 }}>
        Welcome aboard, founder.
      </h1>
      <p style={{ margin: '16px 0 0', fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: TEXT }}>
        Your payment went through — your founder price is locked in for life. A receipt
        is on its way to your email.
      </p>
      <p style={{ margin: '14px 0 28px', fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.6, color: MUTED }}>
        We'll email you the moment accounts open so you can claim your spot and start
        your first voyage journal.
      </p>
      <Link to="/" style={btn(true)}>Back to Deck Days</Link>
    </Shell>
  )
}

export function FounderCancelledPage() {
  return (
    <Shell>
      <XCircle size={52} strokeWidth={1.6} color={MUTED} style={{ margin: '0 auto 18px' }} />
      <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 30, lineHeight: 1.15 }}>
        Checkout cancelled
      </h1>
      <p style={{ margin: '16px 0 28px', fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: TEXT }}>
        No charge was made. The founder spots are still filling up — your price is held
        only while spots remain at this tier.
      </p>
      <Link to="/#pricing" style={btn(true)}>See the Founder's Offer</Link>
    </Shell>
  )
}
