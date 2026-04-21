// ─────────────────────────────────────────────────────────────────────────────
// sections/UserProfile.jsx — Personal cruiser profile
//
// Facebook-style layout:
//   • Full-width banner photo (clickable to upload)
//   • Circular avatar overlapping the bottom of the banner
//   • Display name, bio, and personal details (editable in-place)
//   • Fun at-a-glance cruise stats derived from all voyages
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUserId } from '../context'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, TEXT, MUTED, LIGHT, TEAL } from '../constants'
import { sty } from '../constants'

// ── Colours ───────────────────────────────────────────────────────────────────
const BANNER_H        = 220
const AVATAR_SIZE     = 96
const AVATAR_BORDER   = 4
const AVATAR_OVERLAP  = AVATAR_SIZE / 2 + AVATAR_BORDER

// ── Micro-label ───────────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
    {children}
  </div>
)

// ── Stat bubble ───────────────────────────────────────────────────────────────
function Stat({ emoji, value, label }) {
  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 140px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: NAVY + '10', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Photo upload button (overlaid on images) ──────────────────────────────────
function UploadBtn({ onClick, uploading, label }) {
  return (
    <button
      onClick={onClick}
      disabled={uploading}
      style={{
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        color: WHITE, border: 'none', borderRadius: 8,
        padding: '6px 12px', fontSize: 12, fontWeight: 600,
        cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'background 0.15s',
      }}
    >
      <span>📷</span> {uploading ? 'Uploading…' : label}
    </button>
  )
}

// ── Editable text field ───────────────────────────────────────────────────────
function EditFld({ label, value, onChange, placeholder, multiline }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{label}</Lbl>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.6 }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={sty.inp}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UserProfile({ session, allVoyages, voyage }) {
  const userId = useUserId()

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    displayName:        '',
    bio:                '',
    homePort:           '',
    favouriteCruiseLine:'',
    favouriteDestination:'',
    avatarUrl:          '',
    bannerUrl:          '',
  })
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState(profile)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  // Photo upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadError,     setUploadError]     = useState('')

  const avatarRef = useRef(null)
  const bannerRef = useRef(null)

  // ── Load profile from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('display_name, bio, home_port, favourite_cruise_line, favourite_destination, avatar_url, banner_url')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const loaded = {
          displayName:         data?.display_name          ?? '',
          bio:                 data?.bio                   ?? '',
          homePort:            data?.home_port             ?? '',
          favouriteCruiseLine: data?.favourite_cruise_line ?? '',
          favouriteDestination:data?.favourite_destination ?? '',
          avatarUrl:           data?.avatar_url            ?? '',
          bannerUrl:           data?.banner_url            ?? '',
        }
        setProfile(loaded)
        setDraft(loaded)
        setLoading(false)
      })
  }, [userId])

  // ── Save profile edits ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      user_id:              userId,
      email:                session?.user?.email ?? '',
      display_name:         draft.displayName,
      bio:                  draft.bio,
      home_port:            draft.homePort,
      favourite_cruise_line:draft.favouriteCruiseLine,
      favourite_destination:draft.favouriteDestination,
    }, { onConflict: 'user_id' })
    setProfile(draft)
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(profile)
    setEditing(false)
  }

  // ── Photo upload helpers ───────────────────────────────────────────────────
  const uploadPhoto = async (file, type) => {
    if (!file || !userId) return
    setUploadError('')
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB — try compressing it first.')
      return null
    }
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${userId}/user-profiles/${type}.${ext}`

    const { error } = await supabase.storage.from('voyage-covers').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { setUploadError('Upload failed — please try again.'); return null }

    const { data: { publicUrl } } = supabase.storage.from('voyage-covers').getPublicUrl(path)
    return publicUrl
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    const url = await uploadPhoto(file, 'avatar')
    if (url) {
      await supabase.from('profiles').upsert({ user_id: userId, email: session?.user?.email ?? '', avatar_url: url }, { onConflict: 'user_id' })
      setProfile(p => ({ ...p, avatarUrl: url }))
      setDraft(p    => ({ ...p, avatarUrl: url }))
    }
    setUploadingAvatar(false)
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setUploadingBanner(true)
    const url = await uploadPhoto(file, 'banner')
    if (url) {
      await supabase.from('profiles').upsert({ user_id: userId, email: session?.user?.email ?? '', banner_url: url }, { onConflict: 'user_id' })
      setProfile(p => ({ ...p, bannerUrl: url }))
      setDraft(p    => ({ ...p, bannerUrl: url }))
    }
    setUploadingBanner(false)
  }

  // ── Cruise stats from allVoyages + current voyage data ────────────────────
  const totalVoyages = allVoyages.length
  const totalNights  = allVoyages.reduce((s, v) => s + (parseInt(v.total_nights) || 0), 0)
  const [friendCount, setFriendCount] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'accepted')
      .then(({ count }) => setFriendCount(count ?? 0))
  }, [userId])
  const memberSince  = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  // Initials fallback for avatar
  const initials = (() => {
    const name = profile.displayName || session?.user?.email?.split('@')[0] || '?'
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  })()

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED, fontSize: 14 }}>
      Loading profile…
    </div>
  )

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>

      {/* ── Banner + avatar hero ───────────────────────────────────────────── */}
      <div style={{ borderRadius: 20, overflow: 'visible', marginBottom: 0, position: 'relative' }}>

        {/* Banner */}
        <div style={{
          height: BANNER_H, borderRadius: '20px 20px 0 0', overflow: 'hidden',
          position: 'relative', background: `linear-gradient(135deg, ${NAVY2} 0%, #0EA5E9 60%, ${GOLD}80 100%)`,
          cursor: 'pointer',
        }}
          onClick={() => !uploadingBanner && bannerRef.current?.click()}
        >
          {profile.bannerUrl && (
            <img src={profile.bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          {/* Gradient vignette at bottom so avatar reads over banner */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.35) 100%)' }} />
          {/* Upload button */}
          <div style={{ position: 'absolute', bottom: 12, right: 14 }}>
            <UploadBtn onClick={e => { e.stopPropagation(); bannerRef.current?.click() }} uploading={uploadingBanner} label="Change Banner" />
          </div>
          {!profile.bannerUrl && !uploadingBanner && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}>
              <div style={{ fontSize: 36 }}>🌅</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600 }}>Click to add a banner photo</div>
            </div>
          )}
        </div>

        {/* White card beneath banner */}
        <div style={{
          background: WHITE, border: `1px solid ${BORDER}`,
          borderRadius: '0 0 20px 20px', borderTop: 'none',
          padding: `${AVATAR_OVERLAP + 12}px 24px 24px`,
          position: 'relative',
        }}>

          {/* Avatar — sits half-over the banner, positioned relative to this card */}
          <div style={{
            position: 'absolute', top: -AVATAR_OVERLAP,
            left: 24,
          }}>
            <div style={{
              width: AVATAR_SIZE, height: AVATAR_SIZE,
              borderRadius: '50%', overflow: 'hidden',
              border: `${AVATAR_BORDER}px solid ${WHITE}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              background: NAVY2,
              position: 'relative', cursor: 'pointer',
            }}
              onClick={() => !uploadingAvatar && avatarRef.current?.click()}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif' }}>
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              >
                <span style={{ fontSize: 18, opacity: 0 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >📷</span>
              </div>
              {uploadingAvatar && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 12, color: WHITE, fontWeight: 600 }}>
                  …
                </div>
              )}
            </div>
          </div>

          {/* Name + edit button row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ minWidth: 0, paddingRight: 12 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 400, color: NAVY2, fontFamily: 'Georgia,serif', lineHeight: 1.1 }}>
                {profile.displayName || session?.user?.email?.split('@')[0] || 'Cruiser'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {memberSince && (
                  <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>
                    ⚓ Sailing since {memberSince}
                  </span>
                )}
                {session?.user?.email && (
                  <span style={{ fontSize: 12, color: MUTED }}>· {session.user.email}</span>
                )}
              </div>
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: CREAM, border: `1px solid ${BORDER}`,
                  color: NAVY, borderRadius: 10, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ ...sty.btn, fontSize: 13, padding: '8px 16px', opacity: saving ? 0.6 : 1, cursor: saving ? 'default' : 'pointer' }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          {editing ? (
            <EditFld
              label="Bio"
              value={draft.bio}
              onChange={v => setDraft(p => ({ ...p, bio: v }))}
              placeholder="Tell your fellow cruisers a bit about yourself…"
              multiline
            />
          ) : (
            profile.bio ? (
              <p style={{ margin: '12px 0 0', fontSize: 14, color: TEXT, lineHeight: 1.7, fontStyle: 'italic' }}>
                "{profile.bio}"
              </p>
            ) : !editing && (
              <p style={{ margin: '12px 0 0', fontSize: 13, color: MUTED, fontStyle: 'italic', cursor: 'pointer' }} onClick={() => setEditing(true)}>
                + Add a bio — tell your voyage story…
              </p>
            )
          )}
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {uploadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginTop: 12 }}>
          {uploadError}
        </div>
      )}

      {/* ── Cruise stats ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Your Voyage Stats
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Stat emoji="🚢" value={totalVoyages}          label="Voyages" />
          <Stat emoji="🌙" value={totalNights || '—'}    label="Nights at Sea" />
          <Stat emoji="👥" value={friendCount ?? '—'}    label="Cruise Friends" />
          <Stat emoji="🌍" value="—"                     label="Ports Visited" />
        </div>
      </div>

      {/* ── Personal details ──────────────────────────────────────────────── */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '22px 24px', marginTop: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
          About Me
        </div>

        {editing ? (
          <>
            <EditFld label="Display Name" value={draft.displayName} onChange={v => setDraft(p => ({ ...p, displayName: v }))} placeholder="Your name as cruise friends will see it" />
            <EditFld label="Home Port" value={draft.homePort} onChange={v => setDraft(p => ({ ...p, homePort: v }))} placeholder="e.g. Southampton" />
            <EditFld label="Favourite Cruise Line" value={draft.favouriteCruiseLine} onChange={v => setDraft(p => ({ ...p, favouriteCruiseLine: v }))} placeholder="e.g. P&O Cruises" />
            <EditFld label="Favourite Destination" value={draft.favouriteDestination} onChange={v => setDraft(p => ({ ...p, favouriteDestination: v }))} placeholder="e.g. Norwegian Fjords" />
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { emoji: '🏠', label: 'Home Port',           value: profile.homePort             },
              { emoji: '⚓', label: 'Favourite Line',      value: profile.favouriteCruiseLine  },
              { emoji: '🌴', label: 'Favourite Destination',value: profile.favouriteDestination },
              { emoji: '✉️', label: 'Email',               value: session?.user?.email         },
            ].map(({ emoji, label, value }) => (
              <div key={label}>
                <Lbl>{label}</Lbl>
                <div style={{ fontSize: 14, color: value ? TEXT : MUTED, fontStyle: value ? 'normal' : 'italic', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span>{emoji}</span>
                  <span>{value || 'Not set'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
      <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />

    </div>
  )
}