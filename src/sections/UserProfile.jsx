// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.jsx — Profile page root
//
// Fetches real profile data from Supabase, keeps avatar/banner upload with the
// interactive ImageCropper, then delegates rendering to sub-components:
//
//   Hero            — banner, avatar, stat strip
//   PassportMap     — world map with port pins
//   Personality     — cruise DNA trait rows
//   Badges          — achievement badge grid
//   Companions      — scrollable shipmate cards
//   VoyagesStrip    — compact voyage cards
//   Preferences     — auto-fill preference rows
//   SettingsBlock   — export actions + sign-out
//
// Where to plug in live data
// ──────────────────────────
// • Badges: replace BADGES in profileData.js with a Supabase query on a
//   `user_badges` table; same shape { emoji, name, earned, color }.
// • Companions: replace COMPANIONS with a query joining friend_requests +
//   profiles; same shape { initials, name, relation, voyages, color }.
// • Preferences: replace PREFERENCES with user preferences from a DB table.
// • Traits: derive from journal data or store in a `user_traits` table.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId, useW } from '../context'
import { BP } from '../constants'
import { FONT_BODY } from '../constants'
import ImageCropper from '../components/ImageCropper'

import Hero          from './profile/Hero'
import PassportMap   from './profile/PassportMap'
import Personality   from './profile/Personality'
import Badges        from './profile/Badges'
import Companions    from './profile/Companions'
import VoyagesStrip  from './profile/VoyagesStrip'
import Preferences      from './profile/Preferences'
import SettingsBlock    from './profile/SettingsBlock'
import AppearanceBlock  from './profile/AppearanceBlock'

// Cover photo / banner aspect ratio — 840×220px output
const BANNER_ASPECT = 840 / 220

// ── Root component ────────────────────────────────────────────────────────────
export default function UserProfile({ session, allVoyages, voyage, onNav, theme, onThemeChange }) {
  const userId   = useUserId()
  const w        = useW()
  const isMobile = w < BP.mobile

  const [profile, setProfile] = useState({
    displayName: '', bio: '', homePort: '', favouriteCruiseLine: '',
    favouriteDestination: '', avatarUrl: '', bannerUrl: '',
  })
  const [loading,         setLoading]         = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadError,     setUploadError]     = useState('')
  const [cropState,       setCropState]       = useState(null)

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  // ── Load ALL profile fields in one query ──────────────────────────────────────
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
      .then(({ data, error }) => {
        if (error) console.error('Profile load error:', error)
        if (data) setProfile({
          displayName:          data.display_name          ?? '',
          bio:                  data.bio                   ?? '',
          homePort:             data.home_port             ?? '',
          favouriteCruiseLine:  data.favourite_cruise_line ?? '',
          favouriteDestination: data.favourite_destination ?? '',
          avatarUrl:            data.avatar_url            ?? '',
          bannerUrl:            data.banner_url            ?? '',
        })
        setLoading(false)
      })
  }, [userId])

  // ── Single save helper — used by name, avatar, banner, and sub-components ─────
  // Upserts only the supplied fields; never sends email or unrelated columns.
  const saveProfileField = useCallback(async (dbUpdates) => {
    if (!userId) return
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' })
    if (error) console.error('Profile save error:', error)
  }, [userId])

  // ── Current voyage (active today, else most recent past) ──────────────────────
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
      .sort((a, b) => new Date(b.departure_date) - new Date(a.departure_date))[0] || null
  })()

  // ── Upload blob → Supabase Storage ───────────────────────────────────────────
  const uploadPhotoBlob = async (blob, type) => {
    if (!blob || !userId) return null
    setUploadError('')
    if (blob.size > 10 * 1024 * 1024) { setUploadError('Image must be under 10 MB.'); return null }
    const path = `${userId}/user-profiles/${type}.jpg`
    const { error } = await supabase.storage.from('voyage-covers').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) { setUploadError('Upload failed — please try again.'); return null }
    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    return `${publicUrl}?t=${Date.now()}`
  }

  // ── Name change ───────────────────────────────────────────────────────────────
  const handleNameChange = async (newName) => {
    setProfile(p => ({ ...p, displayName: newName }))
    await saveProfileField({ display_name: newName })
  }

  // ── File pickers → open cropper ───────────────────────────────────────────────
  const handleAvatarFileSelect = e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropState({ file: f, type: 'avatar' }) }
  const handleBannerFileSelect = e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropState({ file: f, type: 'banner' }) }

  // ── Cropper confirmed ─────────────────────────────────────────────────────────
  const handleCropConfirm = async (blob) => {
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

      {/* Cropper modal */}
      {cropState && (
        <ImageCropper
          file={cropState.file}
          aspect={cropState.type === 'banner' ? BANNER_ASPECT : 1}
          label={cropState.type === 'banner' ? 'banner photo' : 'profile photo'}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropState(null)}
        />
      )}

      {/* Upload error */}
      {uploadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
          {uploadError}
        </div>
      )}

      {/* 1. Hero */}
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

      {/* 2. Passport map + Personality */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 18, marginBottom: 20 }}>
        <PassportMap />
        <Personality onSave={saveProfileField} />
      </div>

      {/* 3. Badges */}
      <Badges currentVoyage={currentVoyage} />

      {/* 4. Companions */}
      <Companions onNav={onNav} />

      {/* 5. Voyages */}
      <VoyagesStrip allVoyages={allVoyages} onViewAll={() => onNav?.('voyage')} />

      {/* 6. Appearance + Preferences */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 18, marginBottom: 20 }}>
        <AppearanceBlock theme={theme} onThemeChange={onThemeChange} />
        <Preferences onSave={saveProfileField} />
      </div>

      {/* 7. Settings */}
      <SettingsBlock
        onSignOut={() => supabase.auth.signOut()}
        displayName={profile.displayName || session?.user?.email?.split('@')[0] || 'My'}
      />

      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileSelect} />
    </div>
  )
}
