// ─────────────────────────────────────────────────────────────────────────────
// pages/FounderResultPage.tsx — Stripe Checkout success / cancelled landing
//
// SUCCESS is the second half of the purchase flow: it turns the paid checkout into
// an account. It reads the Stripe session_id from the URL, collects a name + age +
// password, and calls redeemPurchase() — which verifies the session server-side,
// creates the (paying) account, links the purchase, and signs the new member in.
// On success we send them to /welcome (first-run onboarding).
//
// Public route (anonymous checkout — the buyer is logged out here).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_BODY, sty } from '@/constants'
import { redeemPurchase } from '@/features/founder/checkout'

function Shell({ children }: { children: ReactNode }) {
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
  background: primary ? GOLD : 'transparent', color: NAVY2,
  border: primary ? 'none' : `1px solid ${BORDER}`,
})

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase',
  letterSpacing: '0.07em', marginBottom: 5, fontFamily: FONT_BODY, textAlign: 'left',
}

export function FounderSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = params.get('session_id') ?? ''

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [age,       setAge]       = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  // No session_id (e.g. someone opened the URL directly) — thank them generically.
  if (!sessionId) {
    return (
      <Shell>
        <CheckCircle2 size={52} strokeWidth={1.6} color={GOLD} style={{ margin: '0 auto 18px' }} />
        <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 30, lineHeight: 1.15 }}>
          Welcome aboard, founder.
        </h1>
        <p style={{ margin: '16px 0 28px', fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.65, color: TEXT }}>
          Your founder price is locked in. If you've already created your account, sign in to start your journal.
        </p>
        <Link to="/login" style={btn(true)}>Sign in</Link>
      </Shell>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await redeemPurchase({ sessionId, password, firstName, lastName, age })
      navigate('/welcome', { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  const showSignIn = /sign in/i.test(error)

  return (
    <Shell>
      <CheckCircle2 size={48} strokeWidth={1.6} color={GOLD} style={{ margin: '0 auto 14px' }} />
      <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 28, lineHeight: 1.15 }}>
        Welcome aboard, founder.
      </h1>
      <p style={{ margin: '12px 0 22px', fontFamily: FONT_BODY, fontSize: 14.5, lineHeight: 1.6, color: TEXT }}>
        Payment received — your founder price is locked in for life. Create your account to start
        your journal. We'll use the email from your purchase.
      </p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={fieldLabel}>First name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
          <div>
            <label style={fieldLabel}>Last name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
        </div>
        <div>
          <label style={fieldLabel}>Age</label>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="120" placeholder="e.g. 34" style={{ ...sty.inp, fontSize: 14 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={fieldLabel}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
          <div>
            <label style={fieldLabel}>Confirm</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" placeholder="••••••••" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY, textAlign: 'left' }}>
            {error}
            {showSignIn && <> <Link to="/login" style={{ color: '#DC2626', fontWeight: 700 }}>Sign in →</Link></>}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary"
          style={{ ...sty.btn, fontSize: 15, padding: '12px', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
          {loading ? 'Creating your account…' : 'Create account & start'}
        </button>
      </form>
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
