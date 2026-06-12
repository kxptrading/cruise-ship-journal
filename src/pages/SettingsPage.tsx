// ─────────────────────────────────────────────────────────────────────────────
// pages/SettingsPage.tsx — Settings page root (/settings)
//
// Split out of ProfilePage: the profile page keeps identity content (hero,
// passport map, personality, badges, companions, voyages strip) while this
// page owns configuration — Appearance, Preferences, and Settings & Export.
// Reached via the TopNav profile dropdown.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGsapStagger } from '../hooks/useGsapReveal'
import { useUserId, useW } from '../context'
import { BP, FONT_BODY, FONT_DISPLAY, NAVY2, MUTED } from '../constants'
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

  // Staggered entrance: heading → appearance/preferences row → settings card
  const pageRef = useGsapStagger<HTMLDivElement>([])

  return (
    <div ref={pageRef} style={{ fontFamily: FONT_BODY }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? 24 : 28, fontWeight: 400, color: NAVY2, fontFamily: FONT_DISPLAY, lineHeight: 1.15 }}>
          Settings
        </h1>
        <div style={{ fontSize: 13, color: MUTED, fontFamily: FONT_BODY }}>
          Appearance, preferences, and account options
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 18, marginBottom: 20 }}>
        <AppearanceBlock
          theme={theme}
          onThemeChange={onThemeChange}
          iconPack={iconPack}
          onIconPackChange={onIconPackChange}
        />
        <Preferences onSave={saveProfileField} />
      </div>

      <SettingsBlock
        onSignOut={() => supabase.auth.signOut()}
        displayName={displayName || session?.user?.email?.split('@')[0] || 'My'}
      />
    </div>
  )
}
