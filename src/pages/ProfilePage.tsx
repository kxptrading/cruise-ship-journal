// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.tsx — Profile page root
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { BP, FONT_BODY } from '../constants'
import ImageCropper from '../components/ImageCropper'
import type { Session } from '@supabase/supabase-js'
import type { VoyageListRow, Voyage } from '../types'

import Hero         from '@/sections/profile/Hero'
import PassportMap  from '@/sections/profile/PassportMap'
import Personality  from '@/sections/profile/Personality'
import Badges       from '@/sections/profile/Badges'
import Companions   from '@/sections/profile/Companions'
import VoyagesStrip from '@/sections/profile/VoyagesStrip'
import Preferences      from '@/sections/profile/Preferences'
import SettingsBlock    from '@/sections/profile/SettingsBlock'
import AppearanceBlock  from '@/sections/profile/AppearanceBlock'

const BANNER_ASPECT = 840 / 220

interface UserProfileState {
  displayName:          string
  bio:                  string
  homePort:             string
  favouriteCruiseLine:  string
  favouriteDestination: string
  avatarUrl:            string
  bannerUrl:            string
}

interface CropState {
  file: File
  type: 'avatar' | 'banner'
}

interface Props {
  session:           Session | null
  allVoyages:        VoyageListRow[]
  voyage:            Voyage
  onNav:             (section: string) => void
  theme:             string
  onThemeChange:     (id: string) => void
  iconPack?:         'fluent' | 'native' | 'lucide'
  onIconPackChange?: (pack: 'fluent' | 'native' | 'lucide') => void
}

export default function UserProfile({ session, allVoyages, voyage: _voyage, onNav, theme, onThemeChange, iconPack, onIconPackChange }: Props) {
  const userId   = useUserId()
  const w        = useW()
  const isMobile = w < BP.mobile

  const [profile, setProfile] = useState<UserProfileState>({
    displayName: '', bio: '', homePort: '', favouriteCruiseLine: '',
    favouriteDestination: '', avatarUrl: '', bannerUrl: '',
  })
  const [loading,         setLoading]         = useState<boolean>(true)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false)
  const [uploadError,     setUploadError]     = useState<string>('')
  const [cropState,       setCropState]       = useState<CropState | null>(null)

  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select([
        'display_name', 'bio', 'home_port', 'favourite_cruise_line',
        'favourite_destination', 'avatar_url', 'banner_url',
        'cabin_preference', 'dining_time', 'dietary', 'currency',
        'home_airport', 'units', 'trait_1', 'trait_2', 'trait_3', 'trait_4',
      ].join(', '))
      .eq('user_id', userId)
      .maybeSingle()
      .then((res) => {
        const { error } = res
        const data = res.data as Record<string, unknown> | null
        if (error) console.error('Profile load error:', error)
        if (data) {
          setProfile({
            displayName:          (data.display_name          as string)  ?? '',
            bio:                  (data.bio                   as string)  ?? '',
            homePort:             (data.home_port             as string)  ?? '',
            favouriteCruiseLine:  (data.favourite_cruise_line as string)  ?? '',
            favouriteDestination: (data.favourite_destination as string)  ?? '',
            avatarUrl:            (data.avatar_url            as string)  ?? '',
            bannerUrl:            (data.banner_url            as string)  ?? '',
          })
        }
        setLoading(false)
      })
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfileField = useCallback(async (dbUpdates: Record<string, unknown>): Promise<void> => {
    if (!userId) return
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' })
    if (error) console.error('Profile save error:', error)
  }, [userId])

  const today = new Date()
  const currentVoyage = (() => {
    const active = allVoyages.find(v => {
      const dep = v.departure_date ? new Date(v.departure_date + 'T00:00:00') : null
      const ret = v.return_date    ? new Date(v.return_date    + 'T00:00:00') : null
      return dep && ret && today >= dep && today <= ret
    })
    if (active) return active
    return [...allVoyages]
      .filter(v => v.departure_date)
      .sort((a, b) => new Date(b.departure_date!).getTime() - new Date(a.departure_date!).getTime())[0] || null
  })()

  const uploadPhotoBlob = async (blob: Blob, type: 'avatar' | 'banner'): Promise<string | null> => {
    if (!blob || !userId) return null
    setUploadError('')
    if (blob.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10 MB.'); return null }
    const path = `${userId}/user-profiles/${type}.jpg`
    const { error } = await supabase.storage.from('voyage-covers').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { setUploadError('Upload failed — please try again.'); return null }
    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    return `${publicUrl}?t=${Date.now()}`
  }

  const handleNameChange = (newName: string) => {
    setProfile(p => ({ ...p, displayName: newName }))
  }

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (f) setCropState({ file: f, type: 'avatar' })
  }
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (f) setCropState({ file: f, type: 'banner' })
  }

  const handleCropConfirm = async (blob: Blob | null) => {
    if (!blob || !cropState) return
    const { type } = cropState
    setCropState(null)
    if (type === 'avatar') setUploadingAvatar(true)
    else                   setUploadingBanner(true)
    const url = await uploadPhotoBlob(blob, type)
    if (url) {
      const dbField    = type === 'avatar' ? 'avatar_url' : 'banner_url'
      const stateField = type === 'avatar' ? 'avatarUrl'  : 'bannerUrl'
      await saveProfileField({ [dbField]: url })
      setProfile(p => ({ ...p, [stateField]: url }))
    }
    if (type === 'avatar') setUploadingAvatar(false)
    else                   setUploadingBanner(false)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280', fontSize: 14, fontFamily: FONT_BODY }}>
      Loading profile…
    </div>
  )

  return (
    <div style={{ fontFamily: FONT_BODY }}>

      {cropState && (
        <ImageCropper
          file={cropState.file}
          aspect={cropState.type === 'banner' ? BANNER_ASPECT : 1}
          label={cropState.type === 'banner' ? 'banner photo' : 'profile photo'}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropState(null)}
        />
      )}

      {uploadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          {uploadError}
        </div>
      )}

      <Hero
        profile={profile}
        session={session}
        allVoyages={allVoyages}
        currentVoyage={currentVoyage}
        onUploadAvatar={() => avatarRef.current?.click()}
        onUploadBanner={() => bannerRef.current?.click()}
        uploadingAvatar={uploadingAvatar}
        uploadingBanner={uploadingBanner}
        onNameChange={handleNameChange}
      />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 18, marginBottom: 20 }}>
        <PassportMap allVoyages={allVoyages} />
        <Personality onSave={saveProfileField} />
      </div>

      <Badges currentVoyage={currentVoyage} />

      <Companions onNav={onNav} />

      <VoyagesStrip allVoyages={allVoyages} onViewAll={() => onNav?.('voyage')} />

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
        displayName={profile.displayName || session?.user?.email?.split('@')[0] || 'My'}
      />

      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileSelect} />
    </div>
  )
}
