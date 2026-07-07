// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.tsx — Profile page root
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGsapReveal } from '../hooks/useGsapReveal'
import type { CSSProperties } from 'react'
import { useUserId, useW } from '../context'
import { BP, FONT_BODY, FONT_DISPLAY, FONT_LABEL, LABEL_TRACK, GOLD, CREAM, WHITE, NAVY2, TEXT, MUTED } from '../constants'
import ImageCropper from '../components/ImageCropper'
import type { Session } from '@supabase/supabase-js'
import type { VoyageListRow, Voyage } from '../types'

import Personality  from '@/sections/profile/Personality'
import Companions   from '@/sections/profile/Companions'

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
  session:    Session | null
  allVoyages: VoyageListRow[]
  voyage:     Voyage
  onNav:      (section: string) => void
}

export default function UserProfile({ session, allVoyages, voyage: _voyage, onNav }: Props) {
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

  // Scroll-reveal: each top-level section fades up as it enters the viewport.
  // Re-runs once `loading` flips and the real sections mount.
  const revealRef = useGsapReveal<HTMLDivElement>([loading])

  const [editingName, setEditingName] = useState(false)
  const saveName = async () => { setEditingName(false); await saveProfileField({ display_name: profile.displayName.trim() }) }

  // Editorial style helpers — mirror the landing / voyage-story pages.
  const col: CSSProperties = { maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 22px' : '0 48px', width: '100%' }
  const fullBleed: CSSProperties = { position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }
  // Cancel the app's main-content top padding so the hero sits flush under the
  // ticker (matches App.tsx mainPad: <768→20, <1024→32, else 44).
  const heroPullUp = w < 768 ? 20 : w < 1024 ? 32 : 44
  const kicker: CSSProperties = { fontFamily: FONT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: LABEL_TRACK, textTransform: 'uppercase' }
  const headline: CSSProperties = { margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, color: NAVY2, fontSize: isMobile ? 26 : 'clamp(28px, 3.2vw, 38px)', lineHeight: 1.15, letterSpacing: '-0.01em' }
  const standfirst: CSSProperties = { margin: '16px auto 0', fontFamily: FONT_DISPLAY, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? 17 : 20, lineHeight: 1.5, maxWidth: 560 }

  const voyageCount = allVoyages.length
  const nightsAtSea = allVoyages.reduce((s, v) => {
    if (v.departure_date && v.return_date) {
      const d = (new Date(v.return_date + 'T00:00:00').getTime() - new Date(v.departure_date + 'T00:00:00').getTime()) / 86400000
      return s + Math.max(0, Math.round(d))
    }
    return s
  }, 0)
  const initials = (profile.displayName || session?.user?.email || '?').trim().slice(0, 2).toUpperCase()
  const subLine = [profile.homePort && `Home port · ${profile.homePort}`, profile.favouriteCruiseLine].filter(Boolean).join('   ·   ')

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280', fontSize: 14, fontFamily: FONT_BODY }}>
      Loading profile…
    </div>
  )

  return (
    <div ref={revealRef} style={{ fontFamily: FONT_BODY }}>

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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ ...fullBleed, marginTop: -heroPullUp, minHeight: isMobile ? 500 : 620, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: WHITE, textAlign: 'center' }}>
        {/* Banner background (or theme gradient) + theme tint + legibility */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, ...(profile.bannerUrl
          ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: 'linear-gradient(150deg, var(--t-primary-dk) 0%, var(--t-primary-mid) 55%, var(--t-primary) 100%)' }) }} />
        <div style={{ position: 'absolute', inset: 0, background: 'var(--t-primary-dk)', opacity: 0.6, zIndex: 1 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(7,14,24,0.5) 0%, rgba(7,14,24,0.22) 45%, rgba(7,14,24,0.68) 100%)', zIndex: 1 }} />

        <button onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 3, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: WHITE, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, fontFamily: FONT_BODY, cursor: 'pointer' }}>
          {uploadingBanner ? 'Uploading…' : '📷 Change banner'}
        </button>

        <div style={{ ...col, position: 'relative', zIndex: 2 }} data-reveal>
          {/* Avatar */}
          <div style={{ position: 'relative', width: isMobile ? 108 : 130, height: isMobile ? 108 : 130, margin: '0 auto 20px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.92)', background: 'var(--t-primary-dk)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 44px rgba(0,0,0,0.45)' }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: isMobile ? 34 : 40, fontWeight: 700, color: WHITE, fontFamily: FONT_DISPLAY }}>{initials}</span>}
            </div>
            <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar} title="Change photo"
              style={{ position: 'absolute', bottom: 2, right: 2, width: 34, height: 34, borderRadius: '50%', background: GOLD, color: NAVY2, border: '2px solid #fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploadingAvatar ? '…' : '📷'}
            </button>
          </div>

          <div style={{ ...kicker, color: GOLD, marginBottom: 14 }}>A Deck Days traveller</div>

          {/* Name (click to edit) */}
          {editingName ? (
            <input
              autoFocus
              value={profile.displayName}
              onChange={e => handleNameChange(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName() }}
              placeholder="Your name"
              style={{ display: 'block', margin: '0 auto', textAlign: 'center', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12, color: WHITE, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: isMobile ? 'clamp(32px,10vw,44px)' : 'clamp(46px,6vw,72px)', padding: '4px 16px', outline: 'none', maxWidth: '100%' }}
            />
          ) : (
            <h1 onClick={() => setEditingName(true)} title="Edit name"
              style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: isMobile ? 'clamp(32px,10vw,44px)' : 'clamp(46px,6vw,72px)', lineHeight: 1.05, letterSpacing: '-0.01em', cursor: 'pointer', textShadow: '0 2px 14px rgba(0,0,0,0.4)' }}>
              {profile.displayName || 'Your name'} <span style={{ fontSize: '0.35em', opacity: 0.7, fontFamily: FONT_BODY, verticalAlign: 'middle' }}>✎</span>
            </h1>
          )}

          {profile.bio
            ? <p style={standfirst}>{profile.bio}</p>
            : subLine && <p style={{ ...standfirst, fontStyle: 'normal', fontFamily: FONT_BODY, fontSize: isMobile ? 14 : 16 }}>{subLine}</p>}

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 26 : 48, marginTop: isMobile ? 26 : 34 }}>
            {[
              { value: voyageCount, label: voyageCount === 1 ? 'Voyage' : 'Voyages' },
              { value: nightsAtSea, label: 'Nights at sea' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: isMobile ? 32 : 44, lineHeight: 1 }}>{s.value}</div>
                <div style={{ ...kicker, fontSize: 10.5, color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAPTER 01 — Personality ─────────────────────────────── */}
      <section style={{ ...fullBleed, background: CREAM, padding: isMobile ? '64px 0' : '110px 0' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 01 — The traveller</div>
          <h2 style={{ ...headline, marginBottom: 8 }}>What kind of cruiser are you?</h2>
          <p style={{ ...standfirst, color: MUTED, margin: '10px 0 28px' }}>Your travel personality — the little things that make your voyages yours.</p>
          <Personality onSave={saveProfileField} />
        </div>
      </section>

      {/* ── CHAPTER 02 — Companions ──────────────────────────────── */}
      <section style={{ ...fullBleed, background: CREAM, padding: isMobile ? '64px 0' : '110px 0', borderTop: '1px solid #E0DBD0' }}>
        <div style={col} data-reveal>
          <div style={{ ...kicker, color: GOLD, marginBottom: 16 }}>Chapter 02 — Fellow travellers</div>
          <h2 style={{ ...headline, marginBottom: 8, color: NAVY2 }}>The people you sail with</h2>
          <p style={{ ...standfirst, color: MUTED, margin: '10px 0 28px' }}>Your connections on Deck Days.</p>
          <div style={{ color: TEXT }}>
            <Companions onNav={onNav} />
          </div>
        </div>
      </section>

      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileSelect} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFileSelect} />
    </div>
  )
}
