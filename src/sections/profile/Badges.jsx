// ─────────────────────────────────────────────────────────────────────────────
// profile/Badges.jsx — Per-voyage achievement badge grid
//
// Badges are computed live from journal data for the current voyage.
// Each badge has a clear condition tied to a real table:
//
//   First Log     — any daily_logs row for this voyage
//   Port Explorer — 3+ non-sea ports in itinerary
//   Foodie        — 5+ food_logs entries
//   Top Rated     — avg daily_logs.rating >= 4
//   Entertained   — 3+ entertainment_log entries
//   On Budget     — budget_items total <= budget.total_budget
//   Photographer  — any photos row
//   Full House    — daily_logs count >= voyage.total_nights
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { WHITE, BORDER, NAVY2, GOLD, MUTED, CREAM, FONT_DISPLAY, FONT_BODY } from '../../constants'
import { useW } from '../../context'

// ── Badge tooltip ─────────────────────────────────────────────────────────────
// Absolutely-positioned dark card that floats above a badge on hover.
// Shows the badge name, how to earn it, and earned/locked status.
// `position: relative` on the parent badge card keeps it anchored.
function BadgeTooltip({ badge }) {
  const TEAL_EARN = '#34D399'

  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        // Float above the badge card with a small gap
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 188,
        background: NAVY2,
        borderRadius: 12,
        padding: '12px 14px',
        pointerEvents: 'none',   // never block mouse events on underlying cards
        boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
      }}
    >
      {/* Badge name */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: WHITE,
        fontFamily: FONT_BODY, marginBottom: 5, lineHeight: 1.3,
      }}>
        {badge.emoji} {badge.name}
      </div>

      {/* How to earn label */}
      <div style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
        fontFamily: FONT_BODY,
      }}>
        How to earn
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.55, fontFamily: FONT_BODY, marginBottom: 10,
      }}>
        {badge.howTo}
      </div>

      {/* Earned / locked status pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10, fontWeight: 700,
        color: badge.earned ? TEAL_EARN : 'rgba(255,255,255,0.35)',
        background: badge.earned ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${badge.earned ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 20, padding: '3px 9px',
        fontFamily: FONT_BODY,
      }}>
        {badge.earned ? '✓ Earned' : '🔒 Not yet earned'}
      </div>

      {/* Downward-pointing arrow */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: `7px solid ${NAVY2}`,
      }} />
    </div>
  )
}

// Badge definitions — shape only, earned computed at runtime.
// `desc` is the short summary (used in aria-label);
// `howTo` is the full tooltip explanation shown on hover.
const BADGE_DEFS = [
  {
    key: 'firstLog', emoji: '📖', name: 'First Log', color: '#0EA5E9',
    desc: 'Logged at least one day',
    howTo: 'Write your first journal entry in the Daily Log — even a single word in Highlights counts.',
  },
  {
    key: 'portExplorer', emoji: '📍', name: 'Port Explorer', color: '#0D9488',
    desc: 'Visited 3 or more ports',
    howTo: 'Add 3 or more port stops (not "At Sea") in your Itinerary section.',
  },
  {
    key: 'foodie', emoji: '🍽️', name: 'Foodie', color: '#F43F5E',
    desc: 'Logged 5 or more meals',
    howTo: 'Log 5 or more entries in the Food Log section — each meal, snack, or drink counts.',
  },
  {
    key: 'topRated', emoji: '⭐', name: 'Top Rated', color: '#F59E0B',
    desc: 'Average day rating of 4 stars or above',
    howTo: 'Rate your days in the Daily Log. An average of 4 ★ or higher across all rated days earns this badge.',
  },
  {
    key: 'entertained', emoji: '🎭', name: 'Entertained', color: '#7C3AED',
    desc: 'Logged 3 or more entertainment entries',
    howTo: 'Add at least 3 shows, events, or activities in the Entertainment Log.',
  },
  {
    key: 'onBudget', emoji: '💰', name: 'On Budget', color: '#14293F',
    desc: 'Total spend within your budget',
    howTo: 'Set a budget in the Budget Tracker and keep your total expenses at or below it.',
  },
  {
    key: 'photographer', emoji: '📸', name: 'Photographer', color: '#0D9488',
    desc: 'Added at least one photo',
    howTo: 'Upload at least one photo in the Daily Log or via the Feed composer.',
  },
  {
    key: 'fullHouse', emoji: '🏆', name: 'Full House', color: '#F59E0B',
    desc: 'Logged every day of the voyage',
    howTo: 'Write a journal entry for every single night of your voyage. Set the total nights in Voyage Details first.',
  },
]

// Compute which badges are earned from queried data
function computeBadges(voyageId, dailyData, itinData, foodCount, entertainCount, budgetRow, budgetItemsData, photoCount, totalNights) {
  const earned = {}

  // First Log — at least one daily log row
  earned.firstLog = (dailyData?.length ?? 0) >= 1

  // Port Explorer — 3+ ports that are not "at sea"
  const realPorts = (itinData ?? []).filter(r => r.port && !/^at sea$/i.test(r.port.trim()))
  earned.portExplorer = realPorts.length >= 3

  // Foodie — 5+ food log entries
  earned.foodie = (foodCount ?? 0) >= 5

  // Top Rated — average rating of all rated days >= 4
  const ratings = (dailyData ?? []).map(r => r.rating).filter(v => v > 0)
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
  earned.topRated = avg >= 4

  // Entertained — 3+ entertainment log entries
  earned.entertained = (entertainCount ?? 0) >= 3

  // On Budget — total spent <= total_budget
  if (budgetRow?.total_budget && (budgetItemsData?.length ?? 0) > 0) {
    const spent = (budgetItemsData ?? []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
    earned.onBudget = spent <= parseFloat(budgetRow.total_budget)
  } else {
    earned.onBudget = false
  }

  // Photographer — at least one photo
  earned.photographer = (photoCount ?? 0) >= 1

  // Full House — logged every day
  earned.fullHouse = totalNights > 0 && (dailyData?.length ?? 0) >= totalNights

  return BADGE_DEFS.map(def => ({ ...def, earned: earned[def.key] ?? false }))
}

export default function Badges({ currentVoyage }) {
  const w    = useW()
  const cols = w < 480 ? 2 : w < 700 ? 3 : 4

  const [badges,     setBadges]     = useState(BADGE_DEFS.map(d => ({ ...d, earned: false })))
  const [loading,    setLoading]    = useState(false)
  // Track which badge card is hovered so we can show its tooltip
  const [hoveredKey, setHoveredKey] = useState(null)

  useEffect(() => {
    if (!currentVoyage?.id) {
      setBadges(BADGE_DEFS.map(d => ({ ...d, earned: false })))
      return
    }

    const voyageId = currentVoyage.id

    const run = async () => {
      setLoading(true)
      try {
        // Run all independent queries in parallel
        const [
          dailyRes,
          itinRes,
          foodRes,
          entertainRes,
          budgetRes,
          photoRes,
        ] = await Promise.all([
          supabase.from('daily_logs').select('rating').eq('voyage_id', voyageId),
          supabase.from('itinerary').select('port').eq('voyage_id', voyageId),
          supabase.from('food_logs').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('entertainment_log').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
          supabase.from('budget').select('id, total_budget').eq('voyage_id', voyageId).maybeSingle(),
          supabase.from('photos').select('id', { count: 'exact', head: true }).eq('voyage_id', voyageId),
        ])

        // Fetch budget items if we have a budget row
        let budgetItemsData = []
        if (budgetRes.data?.id) {
          const { data } = await supabase
            .from('budget_items')
            .select('amount')
            .eq('budget_id', budgetRes.data.id)
          budgetItemsData = data ?? []
        }

        const totalNights = parseInt(currentVoyage.total_nights) || 0

        setBadges(computeBadges(
          voyageId,
          dailyRes.data ?? [],
          itinRes.data  ?? [],
          foodRes.count       ?? 0,
          entertainRes.count  ?? 0,
          budgetRes.data,
          budgetItemsData,
          photoRes.count      ?? 0,
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

      {/* Header */}
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

      {/* Voyage context label */}
      <div style={{ marginBottom: 16 }}>
        {shipName ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: MUTED }}>
            <span style={{ fontSize: 14 }}>🚢</span>
            <span>{shipName} · badges earned this voyage</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: MUTED }}>No active voyage — add one in Voyage Details.</div>
        )}
      </div>

      {/* Badge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 13 }}>
        {badges.map(badge => (
          <div
            key={badge.key}
            tabIndex={0}
            style={{
              borderRadius: 14,
              border: badge.earned ? `1px solid ${badge.color}44` : `1px solid ${BORDER}`,
              background: badge.earned
                ? `linear-gradient(135deg, ${badge.color}0F, ${badge.color}22)`
                : CREAM,
              padding: '14px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              opacity: badge.earned ? 1 : 0.5,
              position: 'relative',
              cursor: 'default',
              outline: 'none',
              transition: 'box-shadow 0.15s',
              // overflow must stay visible so the tooltip can float above the card
              overflow: 'visible',
            }}
            onMouseEnter={() => setHoveredKey(badge.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onFocus={() => setHoveredKey(badge.key)}
            onBlur={() => setHoveredKey(null)}
            aria-label={`${badge.name}${badge.earned ? ' — earned' : ' — locked'}`}
          >
            {/* Tooltip — rendered inside the card so it stays anchored via position:relative */}
            {hoveredKey === badge.key && <BadgeTooltip badge={badge} />}
            {badge.earned && (
              <div style={{
                position: 'absolute', top: 7, right: 7,
                width: 14, height: 14, borderRadius: '50%',
                background: badge.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: WHITE, fontWeight: 700,
              }}>✓</div>
            )}
            <span style={{ fontSize: 28, filter: badge.earned ? 'none' : 'grayscale(1)' }}>
              {badge.emoji}
            </span>
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
              color: badge.earned ? NAVY2 : MUTED,
              textAlign: 'center', lineHeight: 1.3,
            }}>
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
