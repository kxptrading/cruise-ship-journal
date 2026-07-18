// ─────────────────────────────────────────────────────────────────────────────
// pages/PricingPage.tsx — the Voyage Pass paywall (/pricing)
//
// Renders the three SKUs live from pricing_plans (no hardcoded amounts). The
// bundle card shows a per-voyage saving computed from live prices. Buying
// requires a signed-in user; logged-out visitors are routed to /signup first.
//
// Query params:
//   ?tier=<sku>       preselects/highlights a tier (set by the gated editor)
//   ?reason=create    shows the "don't forget your journal" upgrade banner
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Check, ArrowLeft, Ship } from 'lucide-react'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, TEXT, MUTED, FONT_DISPLAY, FONT_BODY, FONT_LABEL, LABEL_TRACK } from '@/constants'
import { useUserId } from '@/context'
import { usePricingPlans, startVoyageCheckout, type PricingPlan } from '@/features/passes/hooks'
import { bundleSaving, coversLabel, formatPrice, isBundle, SKU_BUNDLE } from '@/features/passes/pricing'

export default function PricingPage() {
  const navigate = useNavigate()
  const userId   = useUserId()
  const [params] = useSearchParams()
  const preselect = params.get('tier')
  const reason    = params.get('reason')

  const { data: plans, isLoading, error } = usePricingPlans()
  const [busy, setBusy] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string>('')

  const saving = plans ? bundleSaving(plans) : null

  const onBuy = async (sku: string) => {
    setBuyError('')
    if (!userId) {
      // Send them to create an account first, remembering which tier they wanted.
      navigate(`/signup?next=${encodeURIComponent(`/pricing?tier=${sku}`)}`)
      return
    }
    setBusy(sku)
    try {
      await startVoyageCheckout(sku)  // redirects to Stripe on success
    } catch (e) {
      setBuyError((e as Error).message || 'Could not start checkout.')
      setBusy(null)
    }
  }

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '8px 4px 40px' }}>
      {/* Back link — home when logged out, voyages when signed in */}
      <Link
        to={userId ? '/voyages' : '/'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: MUTED, fontFamily: FONT_BODY, textDecoration: 'none', marginBottom: 18 }}
      >
        <ArrowLeft size={15} /> {userId ? 'Back to voyages' : 'Back to home'}
      </Link>

      {reason === 'create' && (
        <div style={{ background: 'rgba(201,162,39,0.12)', border: `1px solid ${GOLD}`, borderRadius: 12, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Ship size={20} color={GOLD} style={{ flexShrink: 0 }} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT, lineHeight: 1.5 }}>
            <strong style={{ color: NAVY2 }}>Going on a cruise? Don't forget your journal.</strong>{' '}
            Pick a Voyage Pass below to start your new cruise journal — you'll come right back to it.
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontFamily: FONT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
          Voyage Passes
        </div>
        <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 'clamp(26px, 3.4vw, 40px)', lineHeight: 1.15 }}>
          One pass per cruise. Yours to keep.
        </h1>
        <p style={{ margin: '14px auto 0', maxWidth: 560, fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.6, color: TEXT }}>
          Buy a pass for each voyage you journal. No subscription — once a journal is
          started it's yours forever. Sailing often? The bundle saves you the most.
        </p>
      </div>

      {isLoading && <p style={{ textAlign: 'center', fontFamily: FONT_BODY, color: MUTED }}>Loading plans…</p>}
      {error && <p style={{ textAlign: 'center', fontFamily: FONT_BODY, color: '#DC2626' }}>Couldn't load pricing. Please refresh.</p>}

      {plans && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, alignItems: 'stretch', marginTop: 8 }}>
          {plans.map(plan => (
            <PlanCard
              key={plan.sku}
              plan={plan}
              highlighted={preselect ? plan.sku === preselect : plan.sku === SKU_BUNDLE}
              savingPct={isBundle(plan) && saving ? saving.savingPct : null}
              perVoyage={isBundle(plan) && saving ? formatPrice(saving.perVoyageCents, plan.currency) : null}
              busy={busy === plan.sku}
              disabled={!!busy}
              onBuy={() => onBuy(plan.sku)}
            />
          ))}
        </div>
      )}

      {buyError && <p style={{ textAlign: 'center', marginTop: 18, fontFamily: FONT_BODY, color: '#DC2626', fontSize: 14 }}>{buyError}</p>}

      <p style={{ textAlign: 'center', marginTop: 28, fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>
        Secure checkout by Stripe · {userId ? <Link to="/passes" style={{ color: NAVY, fontWeight: 600 }}>View my passes</Link> : <>Already a member? <Link to="/login" style={{ color: NAVY, fontWeight: 600 }}>Sign in</Link></>}
      </p>
    </div>
  )
}

interface PlanCardProps {
  plan:        PricingPlan
  highlighted: boolean
  savingPct:   number | null
  perVoyage:   string | null
  busy:        boolean
  disabled:    boolean
  onBuy:       () => void
}

function PlanCard({ plan, highlighted, savingPct, perVoyage, busy, disabled, onBuy }: PlanCardProps) {
  const dark = highlighted
  const bundle = isBundle(plan)
  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      background: dark ? NAVY2 : WHITE, color: dark ? WHITE : NAVY2,
      border: dark ? '1px solid rgba(255,255,255,0.14)' : `1px solid ${BORDER}`,
      borderRadius: 18, padding: '30px 26px',
      boxShadow: dark ? '0 18px 44px rgba(20,41,63,0.28)' : 'none',
    }}>
      {bundle && savingPct != null && savingPct > 0 && (
        <span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: GOLD, color: NAVY2, borderRadius: 980, padding: '4px 14px', fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Best value · save {savingPct}%
        </span>
      )}

      <div style={{ fontFamily: FONT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase', color: GOLD }}>
        {plan.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 12 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 42, lineHeight: 1 }}>{formatPrice(plan.amount_cents, plan.currency)}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: dark ? 'rgba(255,255,255,0.7)' : MUTED }}>
          {bundle ? `for ${plan.voyage_credits} voyages` : 'one voyage'}
        </span>
      </div>

      {bundle && perVoyage && (
        <div style={{ marginTop: 6, fontFamily: FONT_BODY, fontSize: 13, color: dark ? 'rgba(255,255,255,0.72)' : MUTED }}>
          Just {perVoyage} per voyage
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <span style={{
          display: 'inline-block', fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: dark ? GOLD : NAVY2,
          background: dark ? 'rgba(201,162,39,0.16)' : CREAM,
          border: `1px solid ${dark ? 'rgba(201,162,39,0.4)' : BORDER}`,
          borderRadius: 980, padding: '4px 11px',
        }}>
          {coversLabel(plan)}
        </span>
      </div>

      {plan.description && (
        <p style={{ margin: '14px 0 0', fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.55, color: dark ? 'rgba(255,255,255,0.82)' : TEXT }}>
          {plan.description}
        </p>
      )}

      <ul style={{ margin: '18px 0 24px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {[
          bundle ? `${plan.voyage_credits} cruise journals` : '1 full cruise journal',
          coversLabel(plan),
          'Yours to keep forever',
          'Photos, daily log, dining, budget & more',
        ].map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.4, color: dark ? 'rgba(255,255,255,0.92)' : TEXT }}>
            <Check size={16} strokeWidth={2.4} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onBuy}
        disabled={disabled}
        style={{
          textAlign: 'center', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 700,
          fontFamily: FONT_BODY, border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled && !busy ? 0.6 : 1,
          background: dark ? GOLD : NAVY,
          color: dark ? NAVY2 : WHITE,
        }}
      >
        {busy ? 'Starting checkout…' : bundle ? 'Get the bundle' : 'Get this pass'}
      </button>
    </div>
  )
}
