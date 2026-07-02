// ─────────────────────────────────────────────────────────────────────────────
// pages/WelcomePage.tsx — first-run onboarding (shown right after a member's
// account is created via the Founder's Offer redeem flow).
//
// Full-screen standalone (rendered outside the app shell). Explains how to use
// Deck Days, marks profiles.onboarded = true, then sends the member into the app
// — either to create their first voyage or to their voyages hub.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ship, BookOpen, Share2, WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, TEXT, MUTED, BORDER, FONT_DISPLAY, FONT_BODY } from '@/constants'

const STEPS = [
  { icon: Ship,     title: 'Start with a voyage', body: 'Every journal begins with a cruise — ship, dates and destination. Each voyage becomes its own book on your shelf.' },
  { icon: BookOpen, title: 'Keep your journal',   body: 'Write your daily log, food, ports and photos. Move between sections with the dock, and swipe to turn the page like a real book.' },
  { icon: Share2,   title: 'Share what you choose', body: 'Post the highlights you want to your feed for friends and family. Everything else stays private to you.' },
  { icon: WifiOff,  title: 'Works at sea',        body: 'No cruise Wi-Fi? No problem. Deck Days works fully offline and syncs automatically when you’re back on land.' },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const first = (data.user?.user_metadata as { first_name?: string } | undefined)?.first_name
      if (first) setName(first)
    })
  }, [])

  const finish = async (to: string) => {
    if (busy) return
    setBusy(true)
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('profiles').update({ onboarded: true }).eq('user_id', data.user.id)
    }
    navigate(to, { replace: true })
  }

  return (
    <div style={{ minHeight: '100dvh', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 640, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '40px 36px', boxShadow: '0 24px 70px rgba(20,41,63,0.10)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
            You're a founding member
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: 34, lineHeight: 1.12 }}>
            Welcome aboard{name ? `, ${name}` : ''}.
          </h1>
          <p style={{ margin: '14px auto 0', maxWidth: 460, fontFamily: FONT_BODY, fontSize: 15.5, lineHeight: 1.6, color: TEXT }}>
            Here's how Deck Days works — then let's start your first journal.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14, marginBottom: 32 }}>
          {STEPS.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={2} color={NAVY} />
              </div>
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: NAVY2 }}>{title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.55, color: MUTED, marginTop: 2 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={() => finish('/voyages/new')} disabled={busy}
            style={{ width: '100%', maxWidth: 340, borderRadius: 980, padding: '13px 24px', fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, border: 'none', background: GOLD, color: NAVY2, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            Create your first voyage
          </button>
          <button type="button" onClick={() => finish('/voyages')} disabled={busy}
            style={{ background: 'none', border: 'none', fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: NAVY, cursor: busy ? 'default' : 'pointer' }}>
            Skip — take me to my voyages
          </button>
        </div>
      </motion.div>
    </div>
  )
}
