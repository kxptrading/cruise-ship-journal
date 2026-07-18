// ─────────────────────────────────────────────────────────────────────────────
// pages/PassSuccessPage.tsx — post-checkout landing (/passes/success)
//
// Stripe redirects here with ?session_id=…. Fulfilment happens asynchronously via
// the webhook, so we poll the user's passes until the pass(es) for this session
// appear, then prompt them to start their voyage journal. Falls back gracefully
// if fulfilment is slow (offers My Passes / retry).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Check, Loader2, Ship } from 'lucide-react'
import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, CREAM, FONT_DISPLAY, FONT_BODY } from '@/constants'
import { useMyPasses } from '@/features/passes/hooks'

const SLOW_AFTER_MS = 20_000

export default function PassSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  const { data: passes } = useMyPasses({ poll: true })
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(t)
  }, [])

  // Passes granted by this checkout session (precise match). If we somehow have no
  // session id, treat any available pass as success.
  const granted = useMemo(() => {
    if (!passes) return []
    if (!sessionId) return passes.filter(p => p.status === 'available')
    return passes.filter(p => p.stripe_checkout_session_id === sessionId)
  }, [passes, sessionId])

  const ready = granted.length > 0
  const availableCount = granted.filter(p => p.status === 'available').length

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '36px 30px' }}>
        {ready ? (
          <>
            <Badge tone="ok"><Check size={26} color={WHITE} strokeWidth={3} /></Badge>
            <h1 style={{ margin: '20px 0 0', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 26, color: NAVY2 }}>
              You're all set!
            </h1>
            <p style={{ margin: '12px 0 0', fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: TEXT }}>
              {availableCount > 1
                ? `${availableCount} Voyage Passes are ready to use.`
                : 'Your Voyage Pass is ready to use.'} Start your cruise journal whenever you like — it's yours to keep.
            </p>
            <button
              onClick={() => navigate('/voyages/new')}
              style={{ marginTop: 24, width: '100%', background: NAVY, color: WHITE, border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 700, fontFamily: FONT_BODY, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Ship size={17} /> Start your voyage journal
            </button>
            <Link to="/passes" style={{ display: 'inline-block', marginTop: 14, fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textDecoration: 'none' }}>
              View my passes
            </Link>
          </>
        ) : (
          <>
            <Badge tone="wait"><Loader2 size={24} color={NAVY2} className="animate-spin" /></Badge>
            <h1 style={{ margin: '20px 0 0', fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 24, color: NAVY2 }}>
              Finalising your purchase…
            </h1>
            <p style={{ margin: '12px 0 0', fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.6, color: TEXT }}>
              Payment received — we're activating your pass. This usually takes a few seconds.
            </p>
            {slow && (
              <p style={{ margin: '18px 0 0', fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: MUTED }}>
                Taking longer than expected. Your payment is safe — check{' '}
                <Link to="/passes" style={{ color: NAVY, fontWeight: 600 }}>My Passes</Link>{' '}
                in a moment, or refresh this page.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'ok' | 'wait'; children: React.ReactNode }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%', margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tone === 'ok' ? GOLD : CREAM,
      border: tone === 'ok' ? 'none' : `1px solid ${BORDER}`,
    }}>
      {children}
    </div>
  )
}
