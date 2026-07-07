// ─────────────────────────────────────────────────────────────────────────────
// pages/SettingsPage.tsx — Settings page root (/settings)
//
// Split out of ProfilePage: the profile page keeps identity content (hero,
// passport map, personality, badges, companions, voyages strip) while this
// page owns configuration — Appearance, Preferences, and Settings & Export.
// Reached via the TopNav profile dropdown.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { useUserId, useW } from '../context'
import { BP, FONT_BODY, FONT_DISPLAY, FONT_LABEL, LABEL_TRACK, NAVY2, MUTED, GOLD, CREAM, WHITE } from '../constants'
import type { Session } from '@supabase/supabase-js'

import AppearanceBlock from '@/sections/profile/AppearanceBlock'
import Preferences     from '@/sections/profile/Preferences'
import SettingsBlock   from '@/sections/profile/SettingsBlock'

interface Props {
  session:           Session | null
  theme:             string
  onThemeChange:     (id: string) => void
  iconPack?:         'fluent' | 'native' | 'lucide'
  onIconPackChange?: (pack: 'fluent' | 'native' | 'lucide') => void
}

export default function SettingsPage({ session, theme, onThemeChange, iconPack, onIconPackChange }: Props) {
  const userId   = useUserId()
  const w        = useW()
  const isMobile = w < BP.mobile

  // Display name feeds the export filename/title in SettingsBlock.
  const [displayName, setDisplayName] = useState<string>('')
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Settings profile load error:', error)
        if (data?.display_name) setDisplayName(data.display_name)
      })
  }, [userId])

  const saveProfileField = useCallback(async (dbUpdates: Record<string, string | null>): Promise<void> => {
    if (!userId) return
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' })
    if (error) console.error('Settings save error:', error)
  }, [userId])

  // Each [data-reveal] section fades up as it enters the viewport.
  const pageRef = useGsapReveal<HTMLDivElement>([])

  // Editorial style helpers — mirror the landing / voyage / profile pages.
  const col: CSSProperties = { maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 22px' : '0 48px', width: '100%' }
  const fullBleed: CSSProperties = { position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }
  const kicker: CSSProperties = { fontFamily: FONT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase' }
  const headline: CSSProperties = { margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: isMobile ? 26 : 'clamp(28px, 3.2vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.01em' }
  const standfirst: CSSProperties = { margin: '10px 0 28px', fontFamily: FONT_DISPLAY, fontStyle: 'italic', color: MUTED, fontSize: isMobile ? 18 : 21, lineHeight: 1.5, maxWidth: 620 }

  return (
    <div ref={pageRef} style={{ fontFamily: FONT_BODY }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ ...fullBleed, minHeight: isMobile ? 300 : 380, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: WHITE, textAlign: 'center', background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,14,24,0.22) 0%, rgba(7,14,24,0.12) 45%, rgba(7,14,24,0.42) 100%)', zIndex: 1 }} />
        <div style={{ ...col, position: 'relative', zIndex: 2 }} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 14 }}>Deck Days</div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: isMobile ? 'clamp(34px,11vw,48px)' : 'clamp(48px,6vw,74px)', lineHeight: 1.05, letterSpacing: '-0.01em', textShadow: '0 2px 14px rgba(0,0,0,0.32)' }}>
            Settings
          </h1>
          <p style={{ margin: '16px auto 0', fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 17, color: 'rgba(255,255,255,0.85)', maxWidth: 520, lineHeight: 1.6 }}>
            Appearance, preferences, and account options — tune Deck Days to feel like yours.
          </p>
        </div>
      </section>

      {/* ── CHAPTER 01 — Appearance & Preferences ────────────────── */}
      <section style={{ ...fullBleed, background: CREAM, padding: isMobile ? '64px 0' : '104px 0' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 01 — Make it yours</div>
          <h2 style={{ ...headline }}>Appearance &amp; preferences</h2>
          <p style={standfirst}>Pick a palette and icon style, and set your travel defaults.</p>
          {/* Stacked vertically — each card full-width, one above the other. */}
          <div style={{ display: 'grid', gap: 18 }}>
            <AppearanceBlock
              theme={theme}
              onThemeChange={onThemeChange}
              iconPack={iconPack}
              onIconPackChange={onIconPackChange}
            />
            <Preferences onSave={saveProfileField} />
          </div>
        </div>
      </section>

      {/* ── CHAPTER 02 — Account & Export ────────────────────────── */}
      <section style={{ ...fullBleed, background: CREAM, padding: isMobile ? '64px 0' : '104px 0', borderTop: '1px solid #E0DBD0' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 02 — Your account</div>
          <h2 style={{ ...headline }}>Account &amp; data</h2>
          <p style={standfirst}>Export a keepsake of your voyages, manage your account, or sign out.</p>
          <SettingsBlock
            onSignOut={() => supabase.auth.signOut()}
            displayName={displayName || session?.user?.email?.split('@')[0] || 'My'}
          />
        </div>
      </section>
    </div>
  )
}
