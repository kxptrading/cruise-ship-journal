// ─────────────────────────────────────────────────────────────────────────────
// pages/UpdatePasswordPage.tsx — Set new password after clicking reset link
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { WHITE, MUTED, FONT_BODY, FONT_LOGO, sty } from '@/constants'

export default function UpdatePasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/'), 2500)
  }

  const bg = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }
  const card = { width: '100%', maxWidth: 400, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }

  if (done) {
    return (
      <div style={bg}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-primary-dk)', fontFamily: FONT_LOGO, marginBottom: 8 }}>Password updated</div>
          <div style={{ fontSize: 14, color: MUTED, fontFamily: FONT_BODY }}>Taking you back to the app…</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={bg}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={card}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 30, fontWeight: 700, fontFamily: FONT_LOGO, letterSpacing: '-0.02em', color: 'var(--t-primary-dk)' }}>Deck Days</div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, fontFamily: FONT_BODY }}>Set a new password</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: FONT_BODY }}>New password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoFocus autoComplete="new-password" minLength={8}
              placeholder="At least 8 characters"
              style={{ ...sty.inp, fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: FONT_BODY }}>Confirm password</label>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={{ ...sty.inp, fontSize: 15 }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}>{error}</div>
          )}

          <motion.button
            type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ ...sty.btn, fontSize: 15, padding: '12px', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Saving…' : 'Set new password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
