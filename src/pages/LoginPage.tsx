// ─────────────────────────────────────────────────────────────────────────────
// pages/LoginPage.tsx — Sign in (spec §4: /login)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { GOLD, WHITE, BORDER, MUTED, FONT_BODY, FONT_LOGO, sty } from '@/constants'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) setError(err.message)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
      >
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/DeckDays2.png" alt="Deck Days" style={{ height: 48, width: 'auto', display: 'block', margin: '0 auto' }} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, fontFamily: FONT_BODY }}>Your voyage journal</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: FONT_BODY }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoFocus autoComplete="email"
              style={{ ...sty.inp, fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: FONT_BODY }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              style={{ ...sty.inp, fontSize: 15 }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}>
              {error}
            </div>
          )}

          <motion.button
            type="submit" disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ ...sty.btn, fontSize: 15, padding: '12px', opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/signup" style={{ fontSize: 13, color: 'var(--t-primary)', fontWeight: 600, fontFamily: FONT_BODY, textDecoration: 'none' }}>
            New to Deck Days? Create an account →
          </Link>
          <Link to="/reset" style={{ fontSize: 12, color: MUTED, fontFamily: FONT_BODY, textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
