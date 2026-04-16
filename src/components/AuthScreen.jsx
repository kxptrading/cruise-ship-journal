// ─────────────────────────────────────────────────────────────────────────────
// components/AuthScreen.jsx — Login and sign-up screen
//
// Shown instead of the journal when no Supabase session is active. Toggles
// between Sign In and Create Account modes. On success the parent (App.jsx)
// receives the session via onAuthStateChange and unmounts this screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, MUTED, TEXT } from '../constants'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [mode, setMode]       = useState('signin')   // 'signin' | 'signup' | 'reset'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isSignUp = mode === 'signup'
  const isReset  = mode === 'reset'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isSignUp && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    if (isReset) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } else if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      // On success, App.jsx onAuthStateChange fires and unmounts this screen
    }

    setLoading(false)
  }

  const inp = {
    width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: '11px 14px', fontSize: 15, fontFamily: 'inherit',
    boxSizing: 'border-box', outline: 'none', background: WHITE, color: TEXT,
  }

  return (
    <div style={{ minHeight: '100vh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚓</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', letterSpacing: '0.03em' }}>CRUISE LOG</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>A Journal for Every Voyage</div>
        </div>

        {/* Card */}
        <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

          {/* Card header */}
          <div style={{ background: NAVY2, padding: '20px 28px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif' }}>
              {isReset ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {isReset ? 'We\'ll email you a reset link' : isSignUp ? 'Start logging your voyages' : 'Sign in to your voyage journal'}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>

            {success ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 6 }}>Check your email</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                  {isReset
                    ? <>We've sent a password reset link to <strong>{email}</strong>.<br />Follow the link to choose a new password.</>
                    : <>We've sent a confirmation link to <strong>{email}</strong>.<br />Click it to activate your account, then sign in.</>
                  }
                </div>
                <button type="button" onClick={() => { setMode('signin'); setSuccess(false) }}
                  style={{ marginTop: 20, background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoComplete="email" style={inp} />
                </div>

                {!isReset && (
                  <div style={{ marginBottom: isSignUp ? 16 : 8 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required autoComplete={isSignUp ? 'new-password' : 'current-password'} style={inp} />
                  </div>
                )}

                {!isReset && !isSignUp && (
                  <div style={{ textAlign: 'right', marginBottom: 16 }}>
                    <button type="button"
                      onClick={() => { setMode('reset'); setError('') }}
                      style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {isSignUp && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Confirm Password</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" required autoComplete="new-password" style={inp} />
                  </div>
                )}

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: NAVY, color: WHITE, border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginTop: isReset ? 4 : 0 }}>
                  {loading ? '...' : isReset ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: MUTED }}>
                  {isReset ? 'Remembered it?' : isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button"
                    onClick={() => { setMode(isReset || isSignUp ? 'signin' : 'signup'); setError('') }}
                    style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    {isReset || isSignUp ? 'Sign In' : 'Create one'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
