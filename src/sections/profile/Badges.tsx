// ─────────────────────────────────────────────────────────────────────────────
// profile/Badges.tsx — Per-voyage achievement badge grid
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { WHITE, BORDER, NAVY2, GOLD, MUTED, CREAM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { useW } from '../../context'
import FE from '../../components/FE'

interface BadgeDef {
  key:   string
  level: number   // 1–4; badges are grouped into levels of increasing difficulty
  emoji: string
  name:  string
  color: string
  desc:  string
  howTo: string
}

interface Badge extends BadgeDef {
  earned: boolean
}

interface CurrentVoyage {
  id:           string
  ship_name?:   string | null
  total_nights?: number | string | null
}

interface Props {
  currentVoyage: CurrentVoyage | null | undefined
}

interface TooltipProps {
  badge: Badge
}

const WHITE_STR = '#FFFFFF'

function BadgeTooltip({ badge }: TooltipProps) {
  const TEAL_EARN = '#34D399'

  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 188,
        background: NAVY2,
        borderRadius: 12,
        padding: '12px 14px',
        pointerEvents: 'none',
        boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: WHITE_STR, fontFamily: FONT_BODY, marginBottom: 5, lineHeight: 1.3 }}>
        <FE emoji={badge.emoji} size={12} /> {badge.name}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontFamily: FONT_BODY }}>
        How to earn
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, fontFamily: FONT_BODY, marginBottom: 10 }}>
        {badge.howTo}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 700,
        color: badge.earned ? TEAL_EARN : 'rgba(255,255,255,0.75)',
        background: badge.earned ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${badge.earned ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: 20, padding: '3px 9px',
        fontFamily: FONT_BODY,
      }}>
        {badge.earned ? '✓ Earned' : <><FE emoji="🔒" size={10} /> Not yet earned</>}
      </div>
      <div style={{
        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
        borderTop: `7px solid ${NAVY2}`,
      }} />
    </div>
  )
}

const BADGE_DEFS: BadgeDef[] = [
  // ── Level 1 — first steps ──────────────────────────────────────────────────
  { key: 'firstLog',      level: 1, emoji: '📖', name: 'First Log',      color: '#0EA5E9', desc: 'Logged your first day',        howTo: 'Write your first journal entry in the Daily Log — even a single word in Highlights counts.' },
  { key: 'firstSnap',     level: 1, emoji: '📸', name: 'First Snap',     color: '#0D9488', desc: 'Added your first photo',       howTo: 'Upload at least one photo in the Daily Log or via the Feed composer.' },
  { key: 'setSail',       level: 1, emoji: '⚓', name: 'Set Sail',       color: '#0284C7', desc: 'Added your first port',        howTo: 'Add at least one port stop (not "At Sea") in your Itinerary.' },
  { key: 'firstBite',     level: 1, emoji: '🍴', name: 'First Bite',     color: '#F43F5E', desc: 'Logged your first meal',       howTo: 'Log your first entry in the Food Log — any meal, snack or drink counts.' },
  // ── Level 2 — getting into it ──────────────────────────────────────────────
  { key: 'portExplorer',  level: 2, emoji: '📍', name: 'Port Explorer',  color: '#0D9488', desc: 'Visited 3+ ports',            howTo: 'Add 3 or more port stops (not "At Sea") in your Itinerary.' },
  { key: 'foodie',        level: 2, emoji: '🍽️', name: 'Foodie',        color: '#F43F5E', desc: 'Logged 5+ meals',             howTo: 'Log 5 or more entries in the Food Log.' },
  { key: 'entertained',   level: 2, emoji: '🎭', name: 'Entertained',    color: '#7C3AED', desc: 'Logged 3+ shows',             howTo: 'Add at least 3 shows, events or activities in the Entertainment Log.' },
  { key: 'shopaholic',    level: 2, emoji: '🛍️', name: 'Shopaholic',     color: '#DB2777', desc: 'Logged 3+ souvenirs',         howTo: 'Add 3 or more items in the Shopping Log.' },
  // ── Level 3 — dedicated ────────────────────────────────────────────────────
  { key: 'storyteller',   level: 3, emoji: '✍️', name: 'Storyteller',    color: '#2563EB', desc: 'Logged 5+ days',              howTo: 'Write journal entries for 5 or more days of your voyage.' },
  { key: 'gourmet',       level: 3, emoji: '🍷', name: 'Gourmet',        color: '#E11D48', desc: 'Logged 10+ meals',            howTo: 'Log 10 or more entries in the Food Log.' },
  { key: 'topRated',      level: 3, emoji: '⭐', name: 'Top Rated',      color: '#F59E0B', desc: 'Average day rating 4★+',      howTo: 'Rate your days in the Daily Log. An average of 4★ or higher across all rated days earns this.' },
  { key: 'onBudget',      level: 3, emoji: '💰', name: 'On Budget',      color: NAVY2,     desc: 'Stayed within budget',        howTo: 'Set a budget in the Budget Tracker and keep total expenses at or below it.' },
  // ── Level 4 — completionist ────────────────────────────────────────────────
  { key: 'globetrotter',  level: 4, emoji: '🧭', name: 'Globetrotter',   color: '#0891B2', desc: 'Visited 6+ ports',            howTo: 'Add 6 or more port stops (not "At Sea") in your Itinerary.' },
  { key: 'shutterbug',    level: 4, emoji: '📷', name: 'Shutterbug',     color: '#059669', desc: 'Added 10+ photos',            howTo: 'Upload 10 or more photos across your Daily Logs and posts.' },
  { key: 'souvenirHunter',level: 4, emoji: '🎁', name: 'Souvenir Hunter',color: '#C026D3', desc: 'Logged 8+ souvenirs',         howTo: 'Add 8 or more items in the Shopping Log.' },
  { key: 'fullHouse',     level: 4, emoji: '🏆', name: 'Full House',     color: '#F59E0B', desc: 'Logged every day',            howTo: 'Write a journal entry for every night of your voyage. Set the total nights in Voyage Details first.' },
]

interface DailyRow    { rating: number }
interface ItinRow     { port: string }
interface BudgetRow   { id: string; total_budget: string | number }
interface BudgetItem  { amount: string | number }

function computeBadges(
  _voyageId: string,
  dailyData: DailyRow[],
  itinData: ItinRow[],
  foodCount: number,
  entertainCount: number,
  budgetRow: BudgetRow | null,
  budgetItemsData: BudgetItem[],
  photoCount: number,
  shoppingCount: number,
  totalNights: number,
): Badge[] {
  const earned: Record<string, boolean> = {}

  const days      = dailyData?.length ?? 0
  const realPorts = (itinData ?? []).filter(r => r.port && !/^at sea$/i.test(r.port.trim())).length
  const meals     = foodCount ?? 0
  const photos    = photoCount ?? 0
  const shopping  = shoppingCount ?? 0
  const ratings   = (dailyData ?? []).map(r => r.rating).filter(v => v > 0)
  const avg       = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
  let withinBudget = false
  if (budgetRow?.total_budget && (budgetItemsData?.length ?? 0) > 0) {
    const spent = (budgetItemsData ?? []).reduce((s, i) => s + (parseFloat(String(i.amount)) || 0), 0)
    withinBudget = spent <= parseFloat(String(budgetRow.total_budget))
  }

  // Level 1
  earned.firstLog      = days >= 1
  earned.firstSnap     = photos >= 1
  earned.setSail       = realPorts >= 1
  earned.firstBite     = meals >= 1
  // Level 2
  earned.portExplorer  = realPorts >= 3
  earned.foodie        = meals >= 5
  earned.entertained   = (entertainCount ?? 0) >= 3
  earned.shopaholic    = shopping >= 3
  // Level 3
  earned.storyteller   = days >= 5
  earned.gourmet       = meals >= 10
  earned.topRated      = avg >= 4
  earned.onBudget      = withinBudget
  // Level 4
  earned.globetrotter  = realPorts >= 6
  earned.shutterbug    = photos >= 10
  earned.souvenirHunter = shopping >= 8
  earned.fullHouse     = totalNights > 0 && days >= totalNights

  return BADGE_DEFS.map(def => ({ ...def, earned: earned[def.key] ?? false }))
}

export default function Badges({ currentVoyage }: Props) {
  const w    = useW()
  const cols = w < 480 ? 2 : w < 700 ? 3 : 4

  const [badges,     setBadges]     = useState<Badge[]>(BADGE_DEFS.map(d => ({ ...d, earned: false })))
  const [loading,    setLoading]    = useState<boolean>(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  useEffect(() => {
    if (!currentVoyage?.id) {
      setBadges(BADGE_DEFS.map(d => ({ ...d, earned: false })))
      return
    }

    const voyageId = currentVoyage.id

    const run = async () => {
      setLoading(true)
      try {
        const [dailyRes, itinRes, foodRes, entertainRes, budgetRes, photoRes, shopRes] = await Promise.all([
          supabase.from('daily_logs').select('rating').eq('voyage_id', voyageId),
          supabase.from('itinerary').select('port').eq('voyage_id', voyageId),
          supabase.from('food_logs').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('entertainment_log').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('budget').select('id, total_budget').eq('voyage_id', voyageId).maybeSingle(),
          supabase.from('photos').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('shopping_items').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
        ])

        let budgetItemsData: BudgetItem[] = []
        if (budgetRes.data?.id) {
          const { data } = await supabase.from('budget_items').select('amount').eq('budget_id', budgetRes.data.id)
          budgetItemsData = (data ?? []) as BudgetItem[]
        }

        const totalNights = parseInt(String(currentVoyage.total_nights)) || 0

        setBadges(computeBadges(
          voyageId,
          (dailyRes.data ?? []) as DailyRow[],
          (itinRes.data  ?? []) as ItinRow[],
          foodRes.count       ?? 0,
          entertainRes.count  ?? 0,
          budgetRes.data as BudgetRow | null,
          budgetItemsData,
          photoRes.count      ?? 0,
          shopRes.count       ?? 0,
          totalNights,
        ))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [currentVoyage?.id])

  const earned   = badges.filter(b => b.earned).length
  const shipName = currentVoyage?.ship_name || null

  return (
    <div style={{ background: WHITE, borderRadius: 20, border: `1px solid ${BORDER}`, padding: '18px 20px', marginBottom: 20 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>VOYAGE ACHIEVEMENTS</div>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 22, color: NAVY2, lineHeight: 1 }}>Badges</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {loading ? (
            <span style={{ fontSize: 12, color: MUTED }}>Loading…</span>
          ) : (
            <>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: GOLD }}>{earned}</span>
              <span style={{ fontSize: 12, color: MUTED }}>of {badges.length} earned</span>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        {shipName ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: MUTED }}>
            <FE emoji="🚢" size={14} />
            <span>{shipName} · badges earned this voyage</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: MUTED }}>No active voyage — add one in Voyage Details.</div>
        )}
      </div>

      {/* Badges grouped into levels of increasing difficulty. */}
      {[1, 2, 3, 4].map(lvl => {
        const lvlBadges = badges.filter(b => b.level === lvl)
        if (lvlBadges.length === 0) return null
        const lvlEarned = lvlBadges.filter(b => b.earned).length
        const complete  = lvlEarned === lvlBadges.length
        return (
          <div key={lvl} style={{ marginTop: lvl > 1 ? 22 : 0 }}>
            {/* Level header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: complete ? GOLD : NAVY2 }}>
                Level {lvl}
              </span>
              <span style={{ fontSize: 11, color: complete ? GOLD : MUTED, fontWeight: complete ? 700 : 400 }}>
                {lvlEarned}/{lvlBadges.length}{complete ? ' ✓' : ''}
              </span>
              <div style={{ flex: 1, height: 1, background: BORDER }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 13 }}>
              {lvlBadges.map(badge => (
                <div
                  key={badge.key}
                  tabIndex={0}
                  style={{
                    borderRadius: 14,
                    border: badge.earned ? `1px solid ${badge.color}44` : `1px solid ${BORDER}`,
                    background: badge.earned ? `linear-gradient(135deg, ${badge.color}0F, ${badge.color}22)` : CREAM,
                    padding: '14px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    opacity: 1,
                    position: 'relative',
                    cursor: 'default',
                    outline: 'none',
                    transition: 'box-shadow 0.15s',
                    overflow: 'visible',
                  }}
                  onMouseEnter={() => setHoveredKey(badge.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onFocus={() => setHoveredKey(badge.key)}
                  onBlur={() => setHoveredKey(null)}
                  aria-label={`${badge.name}${badge.earned ? ' — earned' : ' — locked'}`}
                >
                  {hoveredKey === badge.key && <BadgeTooltip badge={badge} />}
                  {badge.earned && (
                    <div style={{
                      position: 'absolute', top: 7, right: 7,
                      width: 14, height: 14, borderRadius: '50%',
                      background: badge.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: WHITE_STR, fontWeight: 700,
                    }}>✓</div>
                  )}
                  <span style={{ filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                    <FE emoji={badge.emoji} size={28} />
                  </span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: badge.earned ? NAVY2 : MUTED, textAlign: 'center', lineHeight: 1.3 }}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
