// ─────────────────────────────────────────────────────────────────────────────
// pages/ResetPasswordPage.tsx — Password reset request (/reset)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { WHITE, MUTED, FONT_BODY, FONT_LOGO, sty } from '@/constants'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 400, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-primary-dk)', fontFamily: FONT_LOGO, marginBottom: 8 }}>Email sent</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, fontFamily: FONT_BODY, marginBottom: 20 }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </div>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--t-primary)', fontWeight: 700, fontFamily: FONT_BODY }}>Back to sign in</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: FONT_LOGO, letterSpacing: '-0.02em', color: 'var(--t-primary-dk)' }}>Deck Days</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, fontFamily: FONT_BODY }}>Reset your password</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: FONT_BODY }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
              placeholder="you@example.com" autoComplete="email" style={{ ...sty.inp, fontSize: 15 }} />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}>{error}</div>
          )}

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ ...sty.btn, fontSize: 15, padding: '12px', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Sending…' : 'Send reset link'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/login" style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY, textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
