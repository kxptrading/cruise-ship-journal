// ─────────────────────────────────────────────────────────────────────────────
// sections/FriendProfile.tsx — Read-only profile view for a friend
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { NAVY, NAVY2, GOLD, CREAM, WHITE, BORDER, TEXT, MUTED, FONT_DISPLAY, FONT_BODY } from '../constants'
import FE from '../components/FE'

interface BadgeDef {
  key:   string
  emoji: string
  name:  string
  color: string
  howTo: string
}

interface Badge extends BadgeDef {
  earned: boolean
}

interface VoyageRow {
  id:              string
  ship_name:       string | null
  cruise_line:     string | null
  departure_date:  string | null
  return_date:     string | null
  total_nights:    number | string | null
  cover_photo_url: string | null
}

interface ProfileData {
  display_name?:         string | null
  bio?:                  string | null
  home_port?:            string | null
  favourite_cruise_line?: string | null
  avatar_url?:           string | null
  banner_url?:           string | null
  created_at?:           string | null
}

interface FriendProp {
  userId:       string
  displayName?: string | null
  avatarUrl?:   string | null
}

const BADGE_DEFS: BadgeDef[] = [
  { key: 'firstLog',     emoji: '📖', name: 'First Log',     color: '#0EA5E9', howTo: 'Write your first journal entry in the Daily Log.' },
  { key: 'portExplorer', emoji: '📍', name: 'Port Explorer', color: '#0D9488', howTo: 'Add 3 or more port stops (not "At Sea") in the Itinerary.' },
  { key: 'foodie',       emoji: '🍽️', name: 'Foodie',        color: '#F43F5E', howTo: 'Log 5 or more entries in the Food Log.' },
  { key: 'topRated',     emoji: '⭐', name: 'Top Rated',     color: '#F59E0B', howTo: 'Achieve an average day rating of 4 ★ or higher.' },
  { key: 'entertained',  emoji: '🎭', name: 'Entertained',   color: '#7C3AED', howTo: 'Add at least 3 entries in the Entertainment Log.' },
  { key: 'onBudget',     emoji: '💰', name: 'On Budget',     color: '#14293F', howTo: 'Keep total spend at or below the set budget.' },
  { key: 'photographer', emoji: '📸', name: 'Photographer',  color: '#0D9488', howTo: 'Upload at least one photo.' },
  { key: 'fullHouse',    emoji: '🏆', name: 'Full House',    color: '#F59E0B', howTo: 'Log every single night of the voyage.' },
]

function computeBadges(
  dailyData:       { rating?: number | null }[] | null,
  itinData:        { port?: string | null }[] | null,
  foodCount:       number | null,
  entertainCount:  number | null,
  budgetRow:       { total_budget?: string | number | null } | null,
  budgetItemsData: { amount?: string | number | null }[] | null,
  photoCount:      number | null,
  totalNights:     number,
): Badge[] {
  const earned: Record<string, boolean> = {}
  earned.firstLog     = (dailyData?.length ?? 0) >= 1
  const realPorts     = (itinData ?? []).filter(r => r.port && !/^at sea$/i.test(r.port.trim()))
  earned.portExplorer = realPorts.length >= 3
  earned.foodie       = (foodCount ?? 0) >= 5
  const ratings       = (dailyData ?? []).map(r => r.rating).filter((v): v is number => typeof v === 'number' && v > 0)
  const avg           = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
  earned.topRated     = avg >= 4
  earned.entertained  = (entertainCount ?? 0) >= 3
  if (budgetRow?.total_budget && (budgetItemsData?.length ?? 0) > 0) {
    const spent = (budgetItemsData ?? []).reduce((s, i) => s + (parseFloat(String(i.amount)) || 0), 0)
    earned.onBudget = spent <= parseFloat(String(budgetRow.total_budget))
  } else {
    earned.onBudget = false
  }
  earned.photographer = (photoCount ?? 0) >= 1
  earned.fullHouse    = totalNights > 0 && (dailyData?.length ?? 0) >= totalNights
  return BADGE_DEFS.map(def => ({ ...def, earned: earned[def.key] ?? false }))
}

const BANNER_H    = 220
const AVATAR_SIZE = 84
const AVATAR_BORDER = 4

function Wave() {
  return (
    <svg viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 48, display: 'block', pointerEvents: 'none' }}>
      <path d="M0,24 C240,48 480,8 720,28 C960,48 1200,12 1440,24 L1440,48 L0,48 Z" fill="white" opacity="0.13" />
      <path d="M0,36 C360,16 720,44 1080,30 C1260,24 1350,38 1440,36 L1440,48 L0,48 Z" fill="white" opacity="0.07" />
    </svg>
  )
}

interface StatCellProps { emoji: string; value: string | number; label: string; border: boolean }
function StatCell({ emoji, value, label, border }: StatCellProps) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 8px', borderLeft: border ? '1px solid rgba(255,255,255,0.18)' : 'none' }}>
      <div style={{ marginBottom: 3 }}><FE emoji={emoji} size={18} /></div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: GOLD, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, textAlign: 'center' }}>{label}</div>
    </div>
  )
}

function VoyageCard({ voyage }: { voyage: VoyageRow }) {
  const dep = voyage.departure_date
    ? new Date(voyage.departure_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  return (
    <div style={{ background: voyage.cover_photo_url ? 'transparent' : `${NAVY}08`, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', minWidth: 160, flexShrink: 0, position: 'relative' }}>
      {voyage.cover_photo_url ? (
        <div style={{ height: 90, overflow: 'hidden', position: 'relative' }}>
          <img src={voyage.cover_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45))' }} />
        </div>
      ) : (
        <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FE emoji="🚢" size={28} /></div>
      )}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: NAVY2, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{voyage.ship_name || 'Unnamed Voyage'}</div>
        {dep && <div style={{ fontSize: 11, color: MUTED }}>{dep}</div>}
        {voyage.total_nights && <div style={{ fontSize: 11, color: MUTED }}>{voyage.total_nights} nights</div>}
      </div>
    </div>
  )
}

interface Props {
  friend: FriendProp
  onBack: () => void
}

export default function FriendProfile({ friend, onBack }: Props) {
  const [profile,    setProfile]    = useState<ProfileData | null>(null)
  const [voyages,    setVoyages]    = useState<VoyageRow[]>([])
  const [stats,      setStats]      = useState<{ portCount: number | null; daysLogged: number | null }>({ portCount: null, daysLogged: null })
  const [badges,     setBadges]     = useState<Badge[]>(BADGE_DEFS.map(d => ({ ...d, earned: false })))
  const [allPorts,   setAllPorts]   = useState<string[]>([])
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [loading,    setLoading]    = useState<boolean>(true)

  useEffect(() => {
    if (!friend?.userId) return

    async function load() {
      setLoading(true)

      const [{ data: profileData }, { data: voyageRows }] = await Promise.all([
        supabase.from('profiles').select('display_name, bio, home_port, favourite_cruise_line, avatar_url, banner_url, created_at').eq('user_id', friend.userId).maybeSingle(),
        supabase.from('voyages').select('id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url').eq('user_id', friend.userId).order('departure_date', { ascending: false }),
      ])

      setProfile(profileData || {})
      const rows: VoyageRow[] = voyageRows || []
      setVoyages(rows)

      const recentVoyage = rows[0]
      if (recentVoyage?.id) {
        const voyageId = recentVoyage.id
        const [itinRes, logsRes, foodRes, entertainRes, budgetRes, photoRes] = await Promise.all([
          supabase.from('itinerary').select('port').eq('voyage_id', voyageId),
          supabase.from('daily_logs').select('id, rating', { count: 'exact' }).eq('voyage_id', voyageId),
          supabase.from('food_logs').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('entertainment_log').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('budget').select('id, total_budget').eq('voyage_id', voyageId).maybeSingle(),
          supabase.from('photos').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
        ])

        let budgetItemsData: { amount?: string | null }[] = []
        if (budgetRes.data?.id) {
          const { data } = await supabase.from('budget_items').select('amount').eq('budget_id', budgetRes.data.id)
          budgetItemsData = data ?? []
        }

        const ports = (itinRes.data ?? []).filter((r: { port?: string | null }) => r.port && !/^at sea$/i.test(r.port.trim()))
        setStats({ portCount: ports.length, daysLogged: logsRes.count ?? 0 })
        setBadges(computeBadges(
          logsRes.data ?? [], itinRes.data ?? [],
          foodRes.count ?? 0, entertainRes.count ?? 0,
          budgetRes.data, budgetItemsData,
          photoRes.count ?? 0, parseInt(String(recentVoyage.total_nights)) || 0,
        ))
      }

      if (rows.length > 0) {
        const voyageIds = rows.map(v => v.id)
        const { data: allItinRows } = await supabase.from('itinerary').select('port, voyage_id').in('voyage_id', voyageIds)
        const seen = new Set<string>()
        const unique: string[] = []
        ;(allItinRows ?? []).forEach((r: { port?: string | null }) => {
          const p = r.port?.trim()
          if (p && !/^at sea$/i.test(p) && !seen.has(p.toLowerCase())) {
            seen.add(p.toLowerCase())
            unique.push(p)
          }
        })
        setAllPorts(unique.sort())
      }

      setLoading(false)
    }

    load()
  }, [friend?.userId])

  const displayName = profile?.display_name || friend?.displayName || 'Cruiser'
  const initials = (() => {
    const words = displayName.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    return words[0].slice(0, 2).toUpperCase()
  })()

  const avatarUrl   = profile?.avatar_url || friend?.avatarUrl || ''
  const bannerUrl   = profile?.banner_url || ''
  const totalNights = voyages.reduce((sum, v) => sum + (parseInt(String(v.total_nights)) || 0), 0)

  const today = new Date()
  const currentVoyage = voyages.find(v => {
    const dep = v.departure_date ? new Date(v.departure_date + 'T00:00:00') : null
    const ret = v.return_date    ? new Date(v.return_date    + 'T00:00:00') : null
    return dep && ret && today >= dep && today <= ret
  }) || voyages[0] || null

  const isActivelySailing = currentVoyage && (() => {
    const dep = currentVoyage.departure_date ? new Date(currentVoyage.departure_date + 'T00:00:00').getTime() : null
    const ret = currentVoyage.return_date    ? new Date(currentVoyage.return_date    + 'T00:00:00').getTime() : null
    return dep && ret && Date.now() >= dep && Date.now() <= ret
  })()

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: MUTED, fontFamily: FONT_BODY, marginBottom: 20 }}>
        ← Back to Friends
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: MUTED, fontSize: 14 }}>Loading profile…</div>
      ) : (
        <>
          <div style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: BANNER_H, background: 'linear-gradient(135deg, var(--t-primary-dk) 0%, var(--t-primary) 55%, var(--t-primary-lt) 100%)', position: 'relative', overflow: 'hidden' }}>
              {bannerUrl && <img src={bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${GOLD}22`, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 20, right: 60, width: 100, height: 100, borderRadius: '50%', background: `${GOLD}14`, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(3,105,161,0.55) 100%)', pointerEvents: 'none' }} />
              <Wave />
            </div>

            <div style={{ background: WHITE, padding: '0 28px 24px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ marginTop: -(AVATAR_SIZE / 2 + AVATAR_BORDER), flexShrink: 0 }}>
                  <div style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', border: `${AVATAR_BORDER}px solid ${WHITE}`, boxShadow: '0 4px 20px rgba(0,0,0,0.22)', overflow: 'hidden', background: 'linear-gradient(135deg, #F59E0B, #F97316)', flexShrink: 0 }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_DISPLAY, fontSize: 32, color: WHITE }}>{initials}</div>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(3,105,161,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>CAPTAIN'S LOG</div>
                  <h1 style={{ margin: '0 0 8px', fontFamily: FONT_DISPLAY, fontSize: 30, color: NAVY2, lineHeight: 1.05 }}>{displayName}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {currentVoyage?.ship_name && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: isActivelySailing ? '#15803D' : MUTED, background: isActivelySailing ? '#DCFCE7' : '#F3F4F6', border: `1px solid ${isActivelySailing ? '#86EFAC' : BORDER}`, borderRadius: 20, padding: '4px 12px' }}>
                        {isActivelySailing && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 2px #86EFAC' }} />}
                        <FE emoji="🚢" size={14} /> {currentVoyage.ship_name}
                        {!isActivelySailing && currentVoyage.departure_date && (
                          <span style={{ fontWeight: 400, opacity: 0.75 }}>· {new Date(currentVoyage.departure_date + 'T00:00:00').getFullYear()}</span>
                        )}
                      </span>
                    )}
                    {profile?.home_port && <span style={{ fontSize: 12, color: MUTED }}><FE emoji="📍" size={12} /> {profile.home_port}</span>}
                    {profile?.favourite_cruise_line && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 20, padding: '2px 9px' }}><FE emoji="✨" size={11} /> {profile.favourite_cruise_line}</span>
                    )}
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <p style={{ margin: '0 0 18px', fontSize: 14, color: TEXT, lineHeight: 1.7, fontStyle: 'italic', borderLeft: `3px solid ${GOLD}`, paddingLeft: 14 }}>"{profile.bio}"</p>
              )}

              <div style={{ display: 'flex', background: 'rgba(3,105,161,0.72)', backdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                <StatCell emoji="🚢" value={voyages.length}          label="Voyages"      border={false} />
                <StatCell emoji="🌙" value={totalNights || '—'}       label="Total Nights" border={true} />
                <StatCell emoji="📍" value={stats.portCount ?? '—'}   label="Ports"        border={true} />
                <StatCell emoji="📖" value={stats.daysLogged ?? '—'}  label="Days Logged"  border={true} />
              </div>
            </div>
          </div>

          {voyages.length > 0 && (
            <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Voyages · {voyages.length}</div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                {voyages.map(v => <VoyageCard key={v.id} voyage={v} />)}
              </div>
            </div>
          )}

          {voyages.length > 0 && (
            <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>VOYAGE ACHIEVEMENTS</div>
                  <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20, color: NAVY2, lineHeight: 1 }}>Badges</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: GOLD }}>{badges.filter(b => b.earned).length}</span>
                  <span style={{ fontSize: 12, color: MUTED }}>of {badges.length} earned</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}><FE emoji="🚢" size={11} /> {voyages[0]?.ship_name || 'Most recent voyage'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {badges.map(badge => (
                  <div key={badge.key}
                    style={{ borderRadius: 12, border: badge.earned ? `1px solid ${badge.color}44` : `1px solid ${BORDER}`, background: badge.earned ? `linear-gradient(135deg, ${badge.color}0F, ${badge.color}22)` : CREAM, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', overflow: 'visible' }}
                    onMouseEnter={() => setHoveredKey(badge.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    {hoveredKey === badge.key && (
                      <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: 170, background: NAVY2, borderRadius: 10, padding: '10px 12px', pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.28)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: WHITE, marginBottom: 4 }}><FE emoji={badge.emoji} size={11} /> {badge.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{badge.howTo}</div>
                        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: badge.earned ? '#34D399' : 'rgba(255,255,255,0.5)' }}>{badge.earned ? '✓ Earned' : <><FE emoji="🔒" size={10} /> Not yet earned</>}</div>
                        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${NAVY2}` }} />
                      </div>
                    )}
                    {badge.earned && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 13, height: 13, borderRadius: '50%', background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: WHITE, fontWeight: 700 }}>✓</div>
                    )}
                    <span style={{ filter: badge.earned ? 'none' : 'grayscale(1)' }}><FE emoji={badge.emoji} size={26} /></span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: badge.earned ? NAVY2 : MUTED, textAlign: 'center', lineHeight: 1.3 }}>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allPorts.length > 0 && (
            <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>DESTINATIONS</div>
                <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 20, color: NAVY2, lineHeight: 1 }}>Ports Visited · <span style={{ color: GOLD }}>{allPorts.length}</span></h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allPorts.map(port => (
                  <span key={port} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${NAVY}08`, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: NAVY2 }}>
                    <FE emoji="📍" size={12} /> {port}
                  </span>
                ))}
              </div>
            </div>
          )}

          {voyages.length === 0 && !profile?.bio && (
            <div style={{ background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}><FE emoji="⚓" size={36} /></div>
              <div style={{ fontWeight: 600, color: TEXT, marginBottom: 6 }}>{displayName} hasn't logged any voyages yet</div>
              <div style={{ fontSize: 13, color: MUTED }}>Check back once they've set sail.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
