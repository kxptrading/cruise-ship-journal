// ─────────────────────────────────────────────────────────────────────────────
// pages/SignupPage.tsx — Create account (spec §4: /signup)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { WHITE, MUTED, FONT_BODY, FONT_LOGO, sty } from '@/constants'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [age,       setAge]       = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return }
    const parsedAge = parseInt(age, 10)
    if (!age || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) { setError('Please enter a valid age.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), age: parsedAge } },
    })
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

    // Upsert profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id:      data.user.id,
        email:        email.trim(),
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`,
        age:          parsedAge,
      }, { onConflict: 'user_id' })
    }
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 400, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-primary-dk)', fontFamily: FONT_LOGO, marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, fontFamily: FONT_BODY, marginBottom: 20 }}>
            We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.
          </div>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--t-primary)', fontWeight: 700, fontFamily: FONT_BODY }}>
            Back to sign in
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 420, background: WHITE, borderRadius: 24, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/DeckDays2.png" alt="Deck Days" style={{ height: 48, width: 'auto', display: 'block', margin: '0 auto' }} />
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4, fontFamily: FONT_BODY }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['First name', firstName, setFirstName, 'given-name'], ['Last name', lastName, setLastName, 'family-name']].map(([label, val, setter, ac]) => (
              <div key={label as string}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: FONT_BODY }}>{label as string}</label>
                <input value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} autoComplete={ac as string} style={{ ...sty.inp, fontSize: 14 }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: FONT_BODY }}>Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="120" placeholder="e.g. 34" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: FONT_BODY }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" style={{ ...sty.inp, fontSize: 14 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['Password', password, setPassword, 'new-password'], ['Confirm', confirm, setConfirm, 'new-password']].map(([label, val, setter, ac]) => (
              <div key={label as string}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontFamily: FONT_BODY }}>{label as string}</label>
                <input type="password" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} autoComplete={ac as string} placeholder="••••••••" style={{ ...sty.inp, fontSize: 14 }} />
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: FONT_BODY }}>{error}</div>
          )}

          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ ...sty.btn, fontSize: 15, padding: '12px', opacity: loading ? 0.6 : 1, marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--t-primary)', fontWeight: 600, fontFamily: FONT_BODY, textDecoration: 'none' }}>
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
