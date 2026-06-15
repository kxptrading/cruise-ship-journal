// ─────────────────────────────────────────────────────────────────────────────
// pages/ComingSoonPage.tsx — Placeholder shown at /signup before launch
//
// Sign-ups are intentionally disabled until we go live. This dummy page replaces
// the real SignupPage at the /signup route (see App.tsx). To re-enable sign-ups,
// point /signup back at <SignupPage /> — the form component is left untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WHITE, GOLD, MUTED, NAVY2, FONT_BODY, FONT_LOGO } from '@/constants'
import { Anchor } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div style={{ minHeight: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)', padding: '24px 16px', overflowY: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 420, background: WHITE, borderRadius: 24, padding: '40px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', textAlign: 'center' }}
      >
        {/* Wordmark */}
        <div style={{ fontSize: 30, fontWeight: 700, fontFamily: FONT_LOGO, letterSpacing: '-0.02em', color: NAVY2, marginBottom: 26 }}>
          Deck Days
        </div>

        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,162,39,0.12)', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Anchor size={26} strokeWidth={1.8} />
        </div>

        <h1 style={{ margin: '0 0 10px', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, color: NAVY2, fontSize: 26, lineHeight: 1.2 }}>
          Sign-ups open soon
        </h1>
        <p style={{ margin: '0 0 26px', fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, color: MUTED }}>
          Deck Days isn't quite ready for new crew yet — we're putting the finishing touches on
          the voyage journal. Check back soon to start documenting your cruises.
        </p>

        <Link
          to="/"
          style={{ display: 'inline-block', background: NAVY2, color: WHITE, borderRadius: 980, padding: '13px 30px', fontSize: 15, fontWeight: 600, fontFamily: FONT_BODY, textDecoration: 'none' }}
        >
          ← Back to home
        </Link>

        <div style={{ marginTop: 18, fontSize: 13, fontFamily: FONT_BODY, color: MUTED }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </div>
      </motion.div>
    </div>
  )
}
