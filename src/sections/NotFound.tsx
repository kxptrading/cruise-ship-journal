// ─────────────────────────────────────────────────────────────────────────────
// sections/NotFound.tsx — 404 / unmatched route
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { NAVY2, MUTED, BORDER, WHITE, FONT_DISPLAY, FONT_BODY, sty } from '../constants'
import FE from '../components/FE'

interface Props {
  onNav: (section: string) => void
}

export default function NotFound({ onNav }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '80px 24px',
        background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`,
        marginTop: 16,
      }}
    >
      <div style={{ marginBottom: 20 }}><FE emoji="🧭" size={64} /></div>

      <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY }}>
        Page not found
      </h1>

      <p style={{ margin: '0 0 28px', fontSize: 15, color: MUTED, lineHeight: 1.6, maxWidth: 340, fontFamily: FONT_BODY }}>
        The section you're looking for doesn't exist. Head back to the dashboard to continue your voyage.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => onNav('dashboard')} className="btn-primary" style={{ ...sty.btn, fontSize: 14, padding: '10px 24px' }}>
          Back to Dashboard
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontFamily: FONT_BODY, color: MUTED }}
        >
          Go back
        </button>
      </div>
    </motion.div>
  )
}
