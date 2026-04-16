// ─────────────────────────────────────────────────────────────────────────────
// sections/Dashboard.jsx — Home screen with voyage overview and live metrics
//
// Aggregates data from every other section to produce a single at-a-glance
// view. Nothing is stored here — it derives all values from props at render
// time, so metrics always reflect the latest saved data.
// ─────────────────────────────────────────────────────────────────────────────

import { NAVY, NAVY2, GOLD, WHITE, BORDER, TEXT, MUTED, TEAL, ROSE, PLUM, BP } from '../constants'
import { NAV, sty } from '../constants'
import { useW } from '../context'
import { Donut, MetricCard } from '../components/ui'

const QUICK_EMOJI = {
  voyage:        '🚢',
  itinerary:     '🗺️',
  daily:         '📅',
  food:          '🍴',
  dining:        '🍽️',
  entertainment: '🎭',
  foodfav:       '💛',
  budget:        '💳',
  shopping:      '🛍️',
  highlights:    '🌟',
  packing:       '🧳',
  notes:         '📝',
}

export default function Dashboard({ voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog, onNav }) {
  const w          = useW()
  const cs         = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }

  // ── Metric calculations ───────────────────────────────────────────────────
  // Each value is derived live from the section data passed as props.

  // Budget: sum all expense amounts; calculate percentage of total budget used
  const spent      = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt  = parseFloat(budget.budget) || 0
  const budgetPct  = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0
  const budgetOver = budgetPct > 100

  // Itinerary: total nights derived from Voyage Details (or itinerary length as fallback),
  // port count (excluding "at sea"), and sea day count
  const nights     = parseInt(voyage.totalNights) || itinerary.length || 0
  const ports      = itinerary.filter(d => d.port && d.port.trim() && d.port.toLowerCase() !== 'at sea').length
  const seaDays    = itinerary.filter(d => d.port?.toLowerCase() === 'at sea').length

  // Daily log: count days that have any written content
  const logged     = dailyLogs.filter(d => d.highlights || d.bestMoment).length
  const loggedPct  = nights > 0 ? Math.round((logged / nights) * 100) : 0

  // Dining: combined meal count across Food Log and Restaurant Log sections;
  // unique venues for the sub-text
  const meals      = foodLogs.length + diningLog.length
  const venues     = [...new Set([...foodLogs.map(m => m.venue), ...diningLog.map(r => r.venue)].filter(Boolean))].length

  // Packing: checked items vs fixed total of 24 defined in PackingList
  const packingChecked = Object.values(packing || {}).flat().length
  const packingTotal   = 24
  const packingPct     = Math.round((packingChecked / packingTotal) * 100)

  // Ratings: average across all daily log entries that have a rating set
  const ratedDays  = dailyLogs.filter(d => d.rating > 0)
  const avgRating  = ratedDays.length > 0
    ? (ratedDays.reduce((s, d) => s + d.rating, 0) / ratedDays.length).toFixed(1)
    : null

  // ── Voyage progress ───────────────────────────────────────────────────────
  // Calculates which day of the voyage today falls on, based on the stored
  // departure date. Used for the progress bar and day counter ring in the hero.
  const today      = new Date()
  const depDate    = voyage.departureDate ? new Date(voyage.departureDate) : null
  const currentDay = depDate ? Math.max(1, Math.min(nights, Math.floor((today - depDate) / 86400000) + 1)) : null
  const voyagePct  = currentDay ? Math.round((currentDay / nights) * 100) : null
  const daysLeft   = currentDay ? Math.max(0, nights - currentDay + 1) : null

  // ── Supporting data for lower panels ─────────────────────────────────────
  // Port list for the timeline — only days that have a port name filled in
  const portList   = itinerary.map((d, i) => ({ ...d, n: i + 1 })).filter(d => d.port?.trim())

  // Spend by category — top 4 categories for the budget breakdown bar chart
  const catSpend   = {}
  ;(budget.items || []).forEach(i => {
    const c = i.category || 'Other'
    catSpend[c] = (catSpend[c] || 0) + (parseFloat(i.amount) || 0)
  })
  const topCats  = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const hasVoyage = !!voyage.shipName

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────────
          Dark navy panel showing the ship name, key voyage info, and a live
          voyage progress bar. The day counter ring is hidden on mobile to
          prevent it from squishing the text content.                       */}
      <div style={{ background: NAVY2, borderRadius: 18, padding: w < BP.mobile ? '20px 18px' : '32px 36px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background circles — purely visual */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -25, top: -25, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 30, top: 30, width: 100, height: 100, borderRadius: '50%', border: '1px dashed rgba(201,162,39,0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1 }}>
            {/* Cruise line / app name badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,162,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>⚓</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                {voyage.cruiseLine || 'Cruise Ship Log'}
              </span>
            </div>

            {/* Ship name — scales down on mobile */}
            <h1 style={{ margin: 0, fontSize: w < BP.mobile ? (hasVoyage ? 26 : 22) : w < BP.tablet ? (hasVoyage ? 30 : 26) : (hasVoyage ? 34 : 28), fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif', lineHeight: 1.1, marginBottom: 10 }}>
              {voyage.shipName || 'Your Voyage Awaits'}
            </h1>

            {/* Departure port, dates, and cabin number */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 16 }}>
              {voyage.departurePort && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, lineHeight: 1 }}>📍</span>
                  <span style={{ fontSize: 13, color: GOLD }}>{voyage.departurePort}</span>
                </div>
              )}
              {voyage.departureDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, lineHeight: 1 }}>📅</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {voyage.departureDate}{voyage.returnDate ? ` → ${voyage.returnDate}` : ''}
                  </span>
                </div>
              )}
              {voyage.cabin && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Cabin {voyage.cabin}</span>}
            </div>

            {/* CTA shown only when no voyage is set up yet */}
            {!hasVoyage && (
              <button onClick={() => onNav('voyage')}
                style={{ background: GOLD, color: NAVY2, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Set Up Your Voyage →
              </button>
            )}

            {/* Live voyage progress bar — shown only once a departure date is set */}
            {voyagePct !== null && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Voyage Progress</span>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>
                    {daysLeft === 0 ? 'Voyage Complete' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${voyagePct}%`, background: GOLD, borderRadius: 3 }} />
                </div>
              </div>
            )}
          </div>

          {/* Day counter ring — hidden on mobile to save horizontal space */}
          {w >= BP.mobile && <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <Donut pct={voyagePct || 0} size={100} color={GOLD} bg="rgba(255,255,255,0.07)" thick={7} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: currentDay ? 28 : 22, fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif', lineHeight: 1 }}>
                  {currentDay || nights}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.05em', marginTop: 2 }}>
                  {currentDay ? `of ${nights}` : 'nights'}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>
              {currentDay ? 'Current Day' : 'Duration'}
            </div>
          </div>}
        </div>

        {/* Travel companions — shown beneath the hero content when set */}
        {(voyage.companion1 || voyage.companion2) && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>With:</span>
            {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{c}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Metrics grid ──────────────────────────────────────────────────────
          6 metric cards in a responsive grid: 3 columns on desktop, 2 on
          tablet, 1 on mobile. Each MetricCard is self-contained.           */}
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : w < BP.tablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <MetricCard icon="📖" color={NAVY} value={nights > 0 ? `${logged} / ${nights}` : logged > 0 ? `${logged}` : '—'} label="Days Logged"
          sub={nights === 0 ? 'Set Total Nights in Voyage Details' : logged === 0 ? 'Open Daily Log to start' : `${nights - logged} day${nights - logged !== 1 ? 's' : ''} to journal`}
          pct={loggedPct} />
        <MetricCard icon="📍" color={TEAL} value={ports || '—'} label="Ports Planned"
          sub={ports === 0 ? 'Fill in your Itinerary' : `plus ${seaDays} sea day${seaDays !== 1 ? 's' : ''}`} />
        <MetricCard icon="🍴" color={GOLD} value={meals || '—'} label="Dining Entries"
          sub={venues > 0 ? `Across ${venues} venue${venues !== 1 ? 's' : ''}` : 'Start logging meals'} />
        {/* Budget card turns amber at 80% and red above 100% of the budget */}
        <MetricCard icon="💳"
          color={budgetOver ? '#DC2626' : budgetPct > 80 ? '#D97706' : TEAL}
          alert={budgetOver}
          value={spent > 0 ? `£${spent.toFixed(0)}` : '£—'} label="Total Spent"
          sub={budgetAmt > 0 ? `£${Math.abs(budgetAmt - spent).toFixed(0)} ${budgetOver ? 'over budget!' : 'remaining'}` : 'Set a budget to track'}
          ring={budgetAmt > 0 ? Math.min(100, budgetPct) : undefined} />
        <MetricCard icon="🧳" color={PLUM} value={`${packingChecked} / ${packingTotal}`} label="Items Packed"
          sub={packingPct === 100 ? 'All packed — ready to sail!' : `${packingTotal - packingChecked} items to pack`}
          pct={packingPct} />
        <MetricCard icon="⭐" color={ROSE} value={avgRating ? `${avgRating} ★` : '—'} label="Avg Day Rating"
          sub={ratedDays.length > 0 ? `From ${ratedDays.length} rated day${ratedDays.length !== 1 ? 's' : ''}` : 'Rate days in Daily Log'} />
      </div>

      {/* ── Itinerary timeline ────────────────────────────────────────────────
          Horizontal scrollable port timeline. Each stop is shown as a dot on
          a line; past days use navy fill, the current day is highlighted in
          gold, and future days are empty circles.                           */}
      {portList.length > 0 && (
        <div style={{ ...cs, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Itinerary Timeline</h2>
            <button onClick={() => onNav('itinerary')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: MUTED, fontFamily: 'inherit' }}>Edit →</button>
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', minWidth: portList.length * 110 }}>
              {portList.map((p, i) => {
                const atSea  = p.port?.toLowerCase() === 'at sea'
                const isPast = currentDay && p.n < currentDay
                const isCurr = currentDay && p.n === currentDay
                return (
                  <div key={i} style={{ flex: 1, minWidth: 100, textAlign: 'center', position: 'relative' }}>
                    {/* Connector line between stops */}
                    {i < portList.length - 1 && (
                      <div style={{ position: 'absolute', top: 15, left: '50%', width: '100%', height: 2, background: isPast ? NAVY : BORDER, zIndex: 0 }} />
                    )}
                    {/* Stop dot — gold for today, navy for past, outline for future */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: isCurr ? GOLD : isPast ? NAVY : atSea ? '#F9F7F3' : WHITE,
                        border: `2.5px solid ${isCurr ? GOLD : isPast ? NAVY : BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCurr ? `0 0 0 5px ${GOLD}28` : 'none',
                      }}>
                        <div style={{ width: atSea ? 5 : 7, height: atSea ? 5 : 7, borderRadius: '50%', background: isCurr ? WHITE : isPast ? GOLD : atSea ? BORDER : NAVY + '50' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isCurr ? NAVY : isPast ? MUTED : NAVY, lineHeight: 1.3, padding: '0 4px' }}>{p.port}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>Day {p.n}</div>
                    {p.date && <div style={{ fontSize: 10, color: MUTED }}>{p.date}</div>}
                    {isCurr && <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Budget breakdown + Quick Access ───────────────────────────────────
          Two-column grid on tablet and above; single column on mobile.
          Budget breakdown only renders if there are categorised expenses.  */}
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : topCats.length > 0 ? '1fr 1fr' : '1fr', gap: 14 }}>
        {topCats.length > 0 && (
          <div style={cs}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spend by Category</h2>
              <button onClick={() => onNav('budget')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: MUTED, fontFamily: 'inherit' }}>View →</button>
            </div>
            {/* Horizontal bar per category showing its share of total spending */}
            {topCats.map(([cat, amt], i) => {
              const pct    = spent > 0 ? (amt / spent) * 100 : 0
              const colors = [NAVY, TEAL, GOLD, PLUM]
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: TEXT }}>{cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>£{amt.toFixed(0)}</span>
                  </div>
                  <div style={{ height: 5, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{pct.toFixed(0)}% of total spending</div>
                </div>
              )
            })}
            {budgetAmt > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: MUTED }}>Total budget</span>
                <span style={{ color: NAVY, fontWeight: 700, fontFamily: 'Georgia,serif' }}>£{budgetAmt.toFixed(0)}</span>
              </div>
            )}
          </div>
        )}

        {/* Quick access grid — shortcut buttons to every section */}
        <div style={cs}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {NAV.filter(n => n.id !== 'dashboard').map(({ id, label }) => (
              <button key={id} onClick={() => onNav(id)}
                style={{ background: '#F9F7F3', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: NAVY + '0E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, lineHeight: 1 }}>{QUICK_EMOJI[id]}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
