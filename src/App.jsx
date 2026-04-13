import { useState, useEffect, useCallback, createContext, useContext } from "react"

const NAVY   = '#1B3A5C'
const NAVY2  = '#14293F'
const GOLD   = '#C9A227'
const CREAM  = '#F4F1EB'
const WHITE  = '#FFFFFF'
const BORDER = '#E0DBD0'
const TEXT   = '#1C2B3A'
const MUTED  = '#7A8594'
const LIGHT  = '#F9F7F3'
const TEAL   = '#0D6B55'
const ROSE   = '#B03060'
const PLUM   = '#4A3B8C'

const BP = { mobile: 640, tablet: 1024 }

const WCtx = createContext(1200)
const useW = () => useContext(WCtx)

function useWindowSize() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

const db = {
  get: async (k, fb) => { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : fb } catch { return fb } },
  set: async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)) } catch {} }
}

const sty = {
  card: { background: WHITE, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '22px 24px', marginBottom: 18 },
  inp:  { width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: WHITE, color: TEXT },
  btn:  { background: NAVY, color: WHITE, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 },
  lbl:  { display: 'block', fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
}

const Lbl  = ({ c }) => <label style={sty.lbl}>{c}</label>
const Inp  = ({ value, onChange, placeholder, type = 'text', style = {} }) =>
  <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...sty.inp, ...style }} />
const TA   = ({ value, onChange, placeholder, rows = 4 }) =>
  <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...sty.inp, resize: 'vertical', lineHeight: 1.7 }} />
const Fld  = ({ label, children, half }) =>
  <div style={{ marginBottom: 16, flex: half ? '1' : undefined }}><Lbl c={label} />{children}</div>
const Row2 = ({ children }) => <div style={{ display: 'flex', gap: 16 }}>{children}</div>
const Box  = ({ title, children }) => (
  <div style={{ borderRadius: 8, marginBottom: 20, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
    <div style={{ background: NAVY, color: WHITE, padding: '8px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>{title}</div>
    <div style={{ padding: 16, background: LIGHT }}>{children}</div>
  </div>
)
const Stars = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} onClick={() => onChange(n)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: n <= value ? GOLD : BORDER, padding: 0, lineHeight: 1 }}>★</button>
    ))}
  </div>
)
const PgHdr = ({ title, sub }) => {
  const w = useW()
  const h1Size = w < BP.mobile ? 24 : w < BP.tablet ? 27 : 30
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ margin: 0, fontSize: h1Size, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,"Times New Roman",serif' }}>{title}</h1>
      {sub && <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 14 }}>{sub}</p>}
      <div style={{ height: 3, background: GOLD, width: 56, marginTop: 12, borderRadius: 2 }} />
    </div>
  )
}

const IC = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  mapPin:   'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  fork:     'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2l-3 4.5L15 2v13a2 2 0 002 2h2a2 2 0 002-2z',
  wallet:   'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5H5a2 2 0 01-2-2V5zM18 12h.01',
  check:    'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  anchor:   'M12 2a3 3 0 100 6 3 3 0 000-6zM12 8v13M5 15h14M4 19c0 1.1 3.58 2 8 2s8-.9 8-2',
  compass:  'M12 22a10 10 0 100-20 10 10 0 000 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  food:     'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3',
  ship:     'M2 21h20M4 21V10l8-7 8 7v11M9 21V13h6v8',
  menu:     'M3 12h18M3 6h18M3 18h18',
}

const SvgIcon = ({ d, size = 18, color = 'currentColor', weight = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const Donut = ({ pct = 0, size = 64, color = GOLD, bg = '#E8E4DB', thick = 6 }) => {
  const r = (size / 2) - thick
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(100, pct) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={thick} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  )
}

const MetricCard = ({ icon, value, label, sub, color, pct, ring, alert }) => {
  const w = useW()
  const valSize = w < BP.tablet ? 22 : 24
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  return (
  <div style={{ ...cs, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 148 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <SvgIcon d={icon} size={18} color={color} />
      </div>
      {ring !== undefined && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Donut pct={ring} size={52} color={alert ? '#DC2626' : color} thick={5} bg={BORDER} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: alert ? '#DC2626' : color }}>{ring}%</div>
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: valSize, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{sub}</div>}
      {pct !== undefined && (
        <div style={{ marginTop: 10, height: 3, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
        </div>
      )}
    </div>
  </div>
  )
}

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',       icon: IC.compass },
  { id: 'voyage',     label: 'Voyage Details',   icon: IC.ship },
  { id: 'itinerary',  label: 'Itinerary',        icon: IC.mapPin },
  { id: 'daily',      label: 'Daily Log',        icon: IC.calendar },
  { id: 'food',       label: 'Food Log',         icon: IC.fork },
  { id: 'dining',     label: 'Restaurant Log',   icon: IC.food },
  { id: 'foodfav',    label: 'Food Favourites',  icon: IC.star },
  { id: 'budget',     label: 'Budget Tracker',   icon: IC.wallet },
  { id: 'shopping',   label: 'Shopping Log',     icon: IC.trending },
  { id: 'highlights', label: 'Highlights',       icon: IC.star },
  { id: 'packing',    label: 'Packing List',     icon: IC.check },
  { id: 'notes',      label: 'Notes',            icon: IC.calendar },
]

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({ voyage, itinerary, dailyLogs, budget, packing, foodLogs, diningLog, onNav }) {
  const w          = useW()
  const cs         = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const spent      = (budget.items || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budgetAmt  = parseFloat(budget.budget) || 0
  const budgetPct  = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0
  const budgetOver = budgetPct > 100

  const nights     = parseInt(voyage.totalNights) || 14
  const ports      = itinerary.filter(d => d.port && d.port.trim() && d.port.toLowerCase() !== 'at sea').length
  const seaDays    = itinerary.filter(d => d.port?.toLowerCase() === 'at sea').length
  const logged     = dailyLogs.filter(d => d.highlights || d.bestMoment).length
  const loggedPct  = Math.round((logged / nights) * 100)
  const meals      = foodLogs.length + diningLog.length
  const venues     = [...new Set([...foodLogs.map(m => m.venue), ...diningLog.map(r => r.venue)].filter(Boolean))].length

  const packingChecked = Object.values(packing || {}).flat().length
  const packingTotal   = 24
  const packingPct     = Math.round((packingChecked / packingTotal) * 100)

  const ratedDays  = dailyLogs.filter(d => d.rating > 0)
  const avgRating  = ratedDays.length > 0
    ? (ratedDays.reduce((s, d) => s + d.rating, 0) / ratedDays.length).toFixed(1)
    : null

  const today      = new Date()
  const depDate    = voyage.departureDate ? new Date(voyage.departureDate) : null
  const currentDay = depDate ? Math.max(1, Math.min(nights, Math.floor((today - depDate) / 86400000) + 1)) : null
  const voyagePct  = currentDay ? Math.round((currentDay / nights) * 100) : null
  const daysLeft   = currentDay ? Math.max(0, nights - currentDay + 1) : null

  const portList   = itinerary.map((d, i) => ({ ...d, n: i + 1 })).filter(d => d.port?.trim())

  const catSpend   = {}
  ;(budget.items || []).forEach(i => {
    const c = i.category || 'Other'
    catSpend[c] = (catSpend[c] || 0) + (parseFloat(i.amount) || 0)
  })
  const topCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const hasVoyage = !!voyage.shipName

  return (
    <div>

      {/* ── HERO ── */}
      <div style={{ background: NAVY2, borderRadius: 18, padding: '32px 36px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: -25, top: -25, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 30, top: 30, width: 100, height: 100, borderRadius: '50%', border: '1px dashed rgba(201,162,39,0.08)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,162,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SvgIcon d={IC.anchor} size={13} color={GOLD} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                {voyage.cruiseLine || 'Cruise Ship Log'}
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: w < BP.mobile ? (hasVoyage ? 26 : 22) : w < BP.tablet ? (hasVoyage ? 30 : 26) : (hasVoyage ? 34 : 28), fontWeight: 700, color: WHITE, fontFamily: 'Georgia,serif', lineHeight: 1.1, marginBottom: 10 }}>
              {voyage.shipName || 'Your Voyage Awaits'}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', marginBottom: 16 }}>
              {voyage.departurePort && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SvgIcon d={IC.mapPin} size={12} color={GOLD} />
                  <span style={{ fontSize: 13, color: GOLD }}>{voyage.departurePort}</span>
                </div>
              )}
              {voyage.departureDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SvgIcon d={IC.calendar} size={12} color='rgba(255,255,255,0.35)' />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {voyage.departureDate}{voyage.returnDate ? ` → ${voyage.returnDate}` : ''}
                  </span>
                </div>
              )}
              {voyage.cabin && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Cabin {voyage.cabin}</span>}
            </div>

            {!hasVoyage && (
              <button onClick={() => onNav('voyage')}
                style={{ background: GOLD, color: NAVY2, border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Set Up Your Voyage →
              </button>
            )}

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

          {/* Day counter ring */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
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
          </div>
        </div>

        {/* Companions */}
        {(voyage.companion1 || voyage.companion2) && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>With:</span>
            {[voyage.companion1, voyage.companion2, voyage.companion3, voyage.companion4].filter(Boolean).map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '3px 12px', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{c}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── METRICS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : w < BP.tablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <MetricCard
          icon={IC.calendar} color={NAVY}
          value={`${logged} / ${nights}`} label="Days Logged"
          sub={logged === 0 ? 'Open Daily Log to start' : `${nights - logged} day${nights - logged !== 1 ? 's' : ''} to journal`}
          pct={loggedPct}
        />
        <MetricCard
          icon={IC.mapPin} color={TEAL}
          value={ports || '—'} label="Ports Planned"
          sub={ports === 0 ? 'Fill in your Itinerary' : `plus ${seaDays} sea day${seaDays !== 1 ? 's' : ''}`}
        />
        <MetricCard
          icon={IC.fork} color={GOLD}
          value={meals || '—'} label="Dining Entries"
          sub={venues > 0 ? `Across ${venues} venue${venues !== 1 ? 's' : ''}` : 'Start logging meals'}
        />
        <MetricCard
          icon={IC.wallet}
          color={budgetOver ? '#DC2626' : budgetPct > 80 ? '#D97706' : TEAL}
          alert={budgetOver}
          value={spent > 0 ? `£${spent.toFixed(0)}` : '£—'}
          label="Total Spent"
          sub={budgetAmt > 0
            ? `£${Math.abs(budgetAmt - spent).toFixed(0)} ${budgetOver ? 'over budget!' : 'remaining'}`
            : 'Set a budget to track'}
          ring={budgetAmt > 0 ? Math.min(100, budgetPct) : undefined}
        />
        <MetricCard
          icon={IC.check} color={PLUM}
          value={`${packingChecked} / ${packingTotal}`} label="Items Packed"
          sub={packingPct === 100 ? 'All packed — ready to sail!' : `${packingTotal - packingChecked} items to pack`}
          pct={packingPct}
        />
        <MetricCard
          icon={IC.star} color={ROSE}
          value={avgRating ? `${avgRating} ★` : '—'} label="Avg Day Rating"
          sub={ratedDays.length > 0
            ? `From ${ratedDays.length} rated day${ratedDays.length !== 1 ? 's' : ''}`
            : 'Rate days in Daily Log'}
        />
      </div>

      {/* ── ITINERARY TIMELINE ── */}
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
                    {i < portList.length - 1 && (
                      <div style={{ position: 'absolute', top: 15, left: '50%', width: '100%', height: 2, background: isPast ? NAVY : BORDER, zIndex: 0 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: isCurr ? GOLD : isPast ? NAVY : atSea ? LIGHT : WHITE,
                        border: `2.5px solid ${isCurr ? GOLD : isPast ? NAVY : BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCurr ? `0 0 0 5px ${GOLD}28` : 'none'
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

      {/* ── BUDGET + QUICK ACCESS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : topCats.length > 0 ? '1fr 1fr' : '1fr', gap: 14 }}>

        {topCats.length > 0 && (
          <div style={cs}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spend by Category</h2>
              <button onClick={() => onNav('budget')} style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: MUTED, fontFamily: 'inherit' }}>View →</button>
            </div>
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

        <div style={cs}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {NAV.filter(n => n.id !== 'dashboard').map(({ id, label, icon }) => (
              <button key={id} onClick={() => onNav(id)}
                style={{ background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: NAVY + '0E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SvgIcon d={icon} size={13} color={NAVY} />
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

// ── VOYAGE DETAILS ────────────────────────────────────────────
function VoyageDetails({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const set = (f, v) => onChange({ ...data, [f]: v })
  return (
    <div>
      <PgHdr title="Voyage Details" sub="All the essentials for your journey at sea" />
      <div style={cs}>
        <Box title="SHIP INFORMATION">
          <Fld label="Cruise Line"><Inp value={data.cruiseLine} onChange={v => set('cruiseLine', v)} placeholder="e.g. Royal Caribbean" /></Fld>
          <Fld label="Ship Name"><Inp value={data.shipName} onChange={v => set('shipName', v)} placeholder="e.g. Wonder of the Seas" /></Fld>
          <Row2>
            <Fld label="Cabin Number & Type" half><Inp value={data.cabin} onChange={v => set('cabin', v)} placeholder="e.g. 8234 — Balcony" /></Fld>
            <Fld label="Deck" half><Inp value={data.deck} onChange={v => set('deck', v)} placeholder="e.g. Deck 8" /></Fld>
          </Row2>
        </Box>
        <Box title="DATES & DEPARTURE">
          <Row2>
            <Fld label="Departure Date" half><Inp type="date" value={data.departureDate} onChange={v => set('departureDate', v)} /></Fld>
            <Fld label="Return Date" half><Inp type="date" value={data.returnDate} onChange={v => set('returnDate', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Departure Port" half><Inp value={data.departurePort} onChange={v => set('departurePort', v)} placeholder="e.g. Southampton" /></Fld>
            <Fld label="Total Nights" half><Inp type="number" value={data.totalNights} onChange={v => set('totalNights', v)} placeholder="e.g. 14" /></Fld>
          </Row2>
        </Box>
        <Box title="TRAVEL COMPANIONS">
          {[1,2,3,4].map(n => (
            <Fld key={n} label={`Companion ${n}`}><Inp value={data[`companion${n}`]} onChange={v => set(`companion${n}`, v)} placeholder="Full name" /></Fld>
          ))}
        </Box>
        <Box title="IMPORTANT NUMBERS">
          <Row2>
            <Fld label="Emergency Contact" half><Inp value={data.emergencyContact} onChange={v => set('emergencyContact', v)} /></Fld>
            <Fld label="Phone" half><Inp value={data.phone} onChange={v => set('phone', v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Guest Services" half><Inp value={data.guestServices} onChange={v => set('guestServices', v)} /></Fld>
            <Fld label="Muster Station" half><Inp value={data.musterStation} onChange={v => set('musterStation', v)} /></Fld>
          </Row2>
          <Fld label="Dining Time"><Inp value={data.diningTime} onChange={v => set('diningTime', v)} placeholder="e.g. 18:30 — Main Dining Room" /></Fld>
        </Box>
      </div>
    </div>
  )
}

// ── ITINERARY ─────────────────────────────────────────────────
function Itinerary({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const setDay = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  return (
    <div>
      <PgHdr title="Itinerary Overview" sub="Your 14-day voyage at a glance" />
      <div style={cs}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Day','Date','Port / At Sea','Arrive','Depart'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((day, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 14px', fontWeight: 700, color: GOLD, fontSize: 16, textAlign: 'center', fontFamily: 'Georgia,serif' }}>{i + 1}</td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="date" value={day.date || ''} onChange={e => setDay(i,'date',e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer', width: 130 }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input value={day.port || ''} onChange={e => setDay(i,'port',e.target.value)} placeholder="Port or At Sea"
                      style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%' }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="time" value={day.arrive || ''} onChange={e => setDay(i,'arrive',e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="time" value={day.depart || ''} onChange={e => setDay(i,'depart',e.target.value)}
                      style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── DAILY LOG ─────────────────────────────────────────────────
function DailyLog({ data, onChange, itinerary }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const [day, setDay] = useState(0)
  const log = data[day] || {}
  const set = (f, v) => { const u = [...data]; u[day] = { ...log, [f]: v }; onChange(u) }
  const WX = ['Sunny','Cloudy','Rainy','Windy','Hot','Mild','Cool']
  return (
    <div>
      <PgHdr title="Daily Log" sub="Record every moment of your voyage day by day" />
      <div style={{ display: 'flex', flexWrap: w < BP.mobile ? 'nowrap' : 'wrap', gap: 8, marginBottom: 24, overflowX: w < BP.mobile ? 'auto' : 'visible', paddingBottom: w < BP.mobile ? 8 : 0 }}>
        {data.map((_, i) => (
          <button key={i} onClick={() => setDay(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${day === i ? NAVY : BORDER}`, background: day === i ? NAVY : WHITE, color: day === i ? WHITE : TEXT, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: day === i ? 700 : 400 }}>
            Day {i + 1}{itinerary[i]?.port ? ` · ${itinerary[i].port.split(',')[0]}` : ''}
          </button>
        ))}
      </div>
      <div style={cs}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 22 }}>
            Day {day + 1}{itinerary[day]?.port ? ` — ${itinerary[day].port}` : ''}
          </h2>
          <Stars value={log.rating || 0} onChange={v => set('rating', v)} />
        </div>
        <Row2>
          <Fld label="Date" half><Inp type="date" value={log.date} onChange={v => set('date', v)} /></Fld>
          <Fld label="Port / At Sea" half><Inp value={log.port} onChange={v => set('port', v)} placeholder="Port name or At Sea" /></Fld>
        </Row2>
        <Box title="WEATHER">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {WX.map(w => (
              <label key={w} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: TEXT }}>
                <input type="checkbox" checked={(log.weather || []).includes(w)} onChange={e => set('weather', e.target.checked ? [...(log.weather||[]),w] : (log.weather||[]).filter(x=>x!==w))}
                  style={{ accentColor: NAVY, width: 15, height: 15 }} />
                {w}
              </label>
            ))}
          </div>
        </Box>
        <Box title="TODAY'S HIGHLIGHTS">
          <TA value={log.highlights} onChange={v => set('highlights', v)} placeholder="What happened today? Best moments, discoveries, experiences..." rows={5} />
        </Box>
        <Box title="MEALS & DRINKS">
          {[['Breakfast','breakfast'],['Lunch','lunch'],['Dinner','dinner'],['Best Drink','drink']].map(([lbl, key]) => (
            <Fld key={key} label={lbl}><Inp value={log[key]} onChange={v => set(key, v)} placeholder="What did you have?" /></Fld>
          ))}
        </Box>
        <Box title="EXCURSION / SHORE ACTIVITY">
          <Fld label="Activity"><Inp value={log.activity} onChange={v => set('activity', v)} /></Fld>
          <Row2>
            <Fld label="Duration" half><Inp value={log.duration} onChange={v => set('duration', v)} placeholder="e.g. 3 hours" /></Fld>
            <Fld label="Cost" half><Inp value={log.excCost} onChange={v => set('excCost', v)} placeholder="£0.00" /></Fld>
          </Row2>
          <Fld label="Notes"><TA value={log.excNotes} onChange={v => set('excNotes', v)} rows={3} /></Fld>
        </Box>
        <Box title="ONBOARD ENTERTAINMENT">
          <TA value={log.entertainment} onChange={v => set('entertainment', v)} placeholder="Shows, activities, events, games..." rows={3} />
        </Box>
        <Box title="BEST MOMENT OF THE DAY">
          <TA value={log.bestMoment} onChange={v => set('bestMoment', v)} rows={3} />
        </Box>
      </div>
    </div>
  )
}

// ── FOOD LOG ──────────────────────────────────────────────────
function FoodLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const add = () => onChange([...data, {}])
  const set = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(data.filter((_,idx) => idx !== i))
  return (
    <div>
      <PgHdr title="Food Log" sub="Track every delicious bite — from buffet discoveries to specialty dining gems" />
      {data.map((meal, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>Meal {i + 1}</h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>
          <Row2>
            <Fld label="Day" half><Inp value={meal.day} onChange={v => set(i,'day',v)} placeholder="Day #" /></Fld>
            <Fld label="Date" half><Inp type="date" value={meal.date} onChange={v => set(i,'date',v)} /></Fld>
          </Row2>
          <Row2>
            <Fld label="Meal Type" half>
              <select value={meal.meal||''} onChange={e => set(i,'meal',e.target.value)} style={{ ...sty.inp }}>
                <option value="">Select...</option>
                {['Breakfast','Lunch','Dinner','Snack'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Fld>
            <Fld label="Ship / Port" half><Inp value={meal.port} onChange={v => set(i,'port',v)} /></Fld>
          </Row2>
          <Fld label="Venue"><Inp value={meal.venue} onChange={v => set(i,'venue',v)} placeholder="Restaurant or location name" /></Fld>
          <Fld label="What I Had"><Inp value={meal.what} onChange={v => set(i,'what',v)} /></Fld>
          <Fld label="Standout Dish"><Inp value={meal.standout} onChange={v => set(i,'standout',v)} /></Fld>
          <Fld label="Drinks"><Inp value={meal.drinks} onChange={v => set(i,'drinks',v)} /></Fld>
          <Fld label="Tasting Notes"><TA value={meal.notes} onChange={v => set(i,'notes',v)} rows={3} /></Fld>
          <Row2>
            <div style={{ flex: 1 }}><Lbl c="Rating" /><Stars value={meal.rating||0} onChange={v => set(i,'rating',v)} /></div>
            <Fld label="Cost" half><Inp value={meal.cost} onChange={v => set(i,'cost',v)} placeholder="£0.00" /></Fld>
            <div>
              <Lbl c="Order Again?" />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {['Yes','No'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: TEXT }}>
                    <input type="radio" checked={meal.orderAgain===opt} onChange={() => set(i,'orderAgain',opt)} style={{ accentColor: NAVY }} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </Row2>
        </div>
      ))}
      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Meal Entry</button>
    </div>
  )
}

// ── RESTAURANT LOG ────────────────────────────────────────────
function DiningLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const add = () => onChange([...data, {}])
  const set = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del = (i) => onChange(data.filter((_,idx) => idx !== i))
  return (
    <div>
      <PgHdr title="Restaurant & Dining Log" sub="Rate every dining experience across the ship and in port" />
      {data.map((r, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>Restaurant {i + 1}</h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>
          <Fld label="Venue Name"><Inp value={r.venue} onChange={v => set(i,'venue',v)} placeholder="Restaurant name" /></Fld>
          <Row2>
            <Fld label="Date" half><Inp type="date" value={r.date} onChange={v => set(i,'date',v)} /></Fld>
            <Fld label="Meal" half><Inp value={r.meal} onChange={v => set(i,'meal',v)} placeholder="Breakfast / Lunch / Dinner" /></Fld>
          </Row2>
          <Fld label="What I Ordered"><Inp value={r.ordered} onChange={v => set(i,'ordered',v)} /></Fld>
          <div style={{ marginBottom: 16 }}><Lbl c="Rating" /><Stars value={r.rating||0} onChange={v => set(i,'rating',v)} /></div>
          <Fld label="Notes"><TA value={r.notes} onChange={v => set(i,'notes',v)} rows={3} /></Fld>
        </div>
      ))}
      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: 4 }}>+ Add Restaurant</button>
    </div>
  )
}

// ── FOOD FAVOURITES ───────────────────────────────────────────
function FoodFavourites({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const set = (f, v) => onChange({ ...data, [f]: v })
  const FIELDS = [['best','BEST DISH OF THE ENTIRE CRUISE'],['buffet','BEST BUFFET FIND'],['specialty','BEST SPECIALITY RESTAURANT'],['surprising','MOST SURPRISING FLAVOUR'],['recreate',"DISH I'D RECREATE AT HOME"],['regret','BIGGEST FOOD REGRET']]
  return (
    <div>
      <PgHdr title="Food Favourites" sub="Reflecting on the very best bites of the entire voyage" />
      <div style={cs}>
        {FIELDS.map(([k, lbl]) => (
          <Box key={k} title={lbl}><TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Your thoughts..." /></Box>
        ))}
      </div>
    </div>
  )
}

// ── BUDGET TRACKER ────────────────────────────────────────────
function BudgetTracker({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const items  = data.items || []
  const add    = () => onChange({ ...data, items: [...items, {}] })
  const set    = (i, f, v) => { const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u }) }
  const del    = (i) => onChange({ ...data, items: items.filter((_,idx) => idx !== i) })
  const spent  = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const budget = parseFloat(data.budget) || 0
  const pct    = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const CATS   = ['Food & Drink','Shopping','Excursions','Entertainment','Spa','Tips','Transport','Other']
  return (
    <div>
      <PgHdr title="Budget Tracker" sub="Every penny of your voyage, accounted for" />
      <div style={{ display: 'grid', gridTemplateColumns: w < BP.mobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={cs}><Lbl c="Total Budget (£)" /><Inp type="number" value={data.budget} onChange={v => onChange({ ...data, budget: v })} placeholder="0.00" /></div>
        <div style={{ ...cs, background: NAVY2, border: 'none', marginBottom: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Spent</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif' }}>£{spent.toFixed(2)}</div>
          {budget > 0 && (<>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 100 ? '#EF4444' : GOLD, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{pct.toFixed(0)}% used · £{(budget - spent).toFixed(2)} remaining</div>
          </>)}
        </div>
      </div>
      <div style={cs}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Date','Item / Description','Category','Amount (£)',''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '6px 10px' }}><input type="date" value={item.date||''} onChange={e => set(i,'date',e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer' }} /></td>
                  <td style={{ padding: '6px 10px' }}><input value={item.item||''} onChange={e => set(i,'item',e.target.value)} placeholder="Description" style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: 160 }} /></td>
                  <td style={{ padding: '6px 10px' }}><select value={item.category||''} onChange={e => set(i,'category',e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12, color: TEXT, cursor: 'pointer' }}><option value="">Select</option>{CATS.map(c => <option key={c}>{c}</option>)}</select></td>
                  <td style={{ padding: '6px 10px' }}><input type="number" value={item.amount||''} onChange={e => set(i,'amount',e.target.value)} placeholder="0.00" style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: 80 }} /></td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}><button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={add} style={sty.btn}>+ Add Expense</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>TOTAL: £{spent.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

// ── SHOPPING LOG ──────────────────────────────────────────────
function ShoppingLog({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const items = data.items || []
  const add   = () => onChange({ ...data, items: [...items, {}] })
  const set   = (i, f, v) => { const u = [...items]; u[i] = { ...u[i], [f]: v }; onChange({ ...data, items: u }) }
  const del   = (i) => onChange({ ...data, items: items.filter((_,idx) => idx !== i) })
  const total = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)
  return (
    <div>
      <PgHdr title="Souvenirs & Shopping Log" sub="Every purchase, port by port" />
      <div style={cs}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Item','Port / Location','Cost (£)',''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LIGHT, borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '6px 10px' }}><input value={item.item||''} onChange={e => set(i,'item',e.target.value)} placeholder="Item name" style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: 180 }} /></td>
                  <td style={{ padding: '6px 10px' }}><input value={item.port||''} onChange={e => set(i,'port',e.target.value)} placeholder="Port or ship" style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: '100%', minWidth: 140 }} /></td>
                  <td style={{ padding: '6px 10px' }}><input type="number" value={item.cost||''} onChange={e => set(i,'cost',e.target.value)} placeholder="0.00" style={{ border: 'none', background: 'transparent', fontSize: 13, color: TEXT, width: 90 }} /></td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}><button onClick={() => del(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 18, lineHeight: 1 }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
          <button onClick={add} style={sty.btn}>+ Add Item</button>
          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif' }}>TOTAL: £{total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

// ── HIGHLIGHTS ────────────────────────────────────────────────
function Highlights({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const set = (f, v) => onChange({ ...data, [f]: v })
  const FIELDS = [['port','Favourite port of call and why'],['meal','Best meal on the ship'],['funny','Funniest moment'],['view','Most beautiful view'],['friends','New friends I met'],['firstTime','Something I tried for the first time'],['moment','A moment I never want to forget']]
  return (
    <div>
      <PgHdr title="Cruise Highlights & Memories" sub="The moments that defined this voyage" />
      <div style={cs}>
        {FIELDS.map(([k, lbl]) => (
          <Fld key={k} label={lbl}><TA value={data[k]} onChange={v => set(k, v)} rows={3} placeholder="Write your memory here..." /></Fld>
        ))}
      </div>
    </div>
  )
}

// ── PACKING LIST ──────────────────────────────────────────────
function PackingList({ data, onChange }) {
  const w  = useW()
  const cs = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const toggle = (cat, item) => {
    const checked = data[cat] || []
    onChange({ ...data, [cat]: checked.includes(item) ? checked.filter(x => x !== item) : [...checked, item] })
  }
  const CATS = {
    'DOCUMENTS & ESSENTIALS': ['Passport / ID','Boarding pass','Travel insurance','Credit cards / cash','Phone & charger','Medication'],
    'CLOTHING': ['Swimsuits','Casual daywear','Formal night outfit','Light jacket','Walking shoes','Flip flops'],
    'TOILETRIES & HEALTH': ['Sunscreen SPF 50+','After-sun lotion','Seasickness remedy','Hand sanitiser','Insect repellent','First aid basics'],
    'ENTERTAINMENT & EXTRAS': ['Book / e-reader','Journal & pen','Camera','Binoculars','Water bottle','Lanyard for card'],
  }
  const allItems     = Object.values(CATS).flat()
  const checkedItems = Object.values(data || {}).flat()
  const pct          = allItems.length > 0 ? Math.round((checkedItems.length / allItems.length) * 100) : 0
  return (
    <div>
      <PgHdr title="Packing Checklist" sub={`${checkedItems.length} of ${allItems.length} items packed`} />
      <div style={{ ...cs, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: MUTED }}>Packing progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? '#22C55E' : NAVY }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: BORDER, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22C55E' : GOLD, borderRadius: 5 }} />
        </div>
      </div>
      {Object.entries(CATS).map(([cat, items]) => (
        <div key={cat} style={cs}>
          <h3 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: NAVY, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cat}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
            {items.map(item => {
              const done = (data[cat] || []).includes(item)
              return (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={done} onChange={() => toggle(cat, item)} style={{ accentColor: NAVY, width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: done ? MUTED : TEXT, textDecoration: done ? 'line-through' : 'none' }}>{item}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── NOTES ─────────────────────────────────────────────────────
function Notes({ data, onChange }) {
  const w     = useW()
  const cs    = { ...sty.card, padding: w < BP.mobile ? 16 : '22px 24px' }
  const notes = Array.isArray(data) ? data : []
  const add   = () => onChange([...notes, { title: '', content: '' }])
  const set   = (i, f, v) => { const u = [...notes]; u[i] = { ...u[i], [f]: v }; onChange(u) }
  const del   = (i) => onChange(notes.filter((_, idx) => idx !== i))
  return (
    <div>
      <PgHdr title="Notes" sub="Your personal notepad — tips, thoughts, anything you want to remember" />
      {notes.length === 0 && (
        <div style={{ ...cs, textAlign: 'center', color: MUTED, padding: '48px 24px', marginBottom: 18 }}>
          <SvgIcon d={IC.calendar} size={32} color={BORDER} />
          <div style={{ marginTop: 12, fontSize: 14 }}>No notes yet — add your first one below.</div>
        </div>
      )}
      {notes.map((note, i) => (
        <div key={i} style={cs}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: NAVY, fontFamily: 'Georgia,serif', fontSize: 18 }}>
              {note.title?.trim() || `Note ${i + 1}`}
            </h3>
            <button onClick={() => del(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', color: '#DC2626', fontSize: 12, fontFamily: 'inherit' }}>Remove</button>
          </div>
          <Fld label="Title">
            <Inp value={note.title} onChange={v => set(i, 'title', v)} placeholder="e.g. Tips for next cruise, Port research..." />
          </Fld>
          <TA value={note.content} onChange={v => set(i, 'content', v)} placeholder="Write anything here — tips for next time, things to look up, conversations to remember, ideas, places to revisit..." rows={8} />
        </div>
      ))}
      <button onClick={add} style={{ ...sty.btn, width: '100%', marginTop: notes.length > 0 ? 4 : 0 }}>+ Add Note</button>
    </div>
  )
}

// ── INITIAL STATE ─────────────────────────────────────────────
const INIT = {
  voyage:    {},
  itinerary: Array.from({ length: 14 }, () => ({})),
  dailyLogs: Array.from({ length: 14 }, () => ({})),
  foodLogs:  [],
  diningLog: [],
  foodFav:   {},
  budget:    { budget: '', items: [] },
  shopping:  { items: [] },
  highlights:{},
  packing:   {},
  notes:     [],
}

// ── ROOT APP ──────────────────────────────────────────────────
export default function App() {
  const winW          = useWindowSize()
  const isOverlay     = winW <= BP.tablet
  const isMobile      = winW < BP.mobile
  const [section, setSection]       = useState('dashboard')
  const [data, setData]             = useState(INIT)
  const [loaded, setLoaded]         = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      const result = {}
      for (const [k, fb] of Object.entries(INIT)) result[k] = await db.get(`csj-${k}`, fb)
      // Migrate old notes string → array
      if (typeof result.notes === 'string') {
        result.notes = result.notes.trim() ? [{ title: '', content: result.notes }] : []
      }
      setData(result)
      setLoaded(true)
    })()
  }, [])

  // Close sidebar when resizing to desktop
  useEffect(() => {
    if (!isOverlay) setSidebarOpen(false)
  }, [isOverlay])

  const update = useCallback(async (key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    await db.set(`csj-${key}`, val)
  }, [])

  const navClick = (id) => {
    setSection(id)
    if (isOverlay) setSidebarOpen(false)
  }

  const baseFontSize = isMobile ? 15 : winW < BP.tablet ? 15.5 : 16
  const mainPad      = isMobile ? '20px 16px' : winW < BP.tablet ? '28px 24px' : '36px 44px'

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading your voyage journal...</div>
      </div>
    </div>
  )

  return (
    <WCtx.Provider value={winW}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

        {/* Overlay backdrop */}
        {isOverlay && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 220, background: NAVY2, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto',
          ...(isOverlay ? {
            position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-220px)',
            transition: 'transform 0.25s ease',
          } : {})
        }}>
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, fontFamily: 'Georgia,serif', letterSpacing: '0.03em' }}>⚓ CRUISE LOG</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.09em', textTransform: 'uppercase' }}>A Journal for Every Voyage</div>
          </div>
          <nav style={{ flex: 1, paddingTop: 10, paddingBottom: 10 }}>
            {NAV.map(({ id, label, icon }) => {
              const active = section === id
              return (
                <button key={id} onClick={() => navClick(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 18px', background: active ? 'rgba(201,162,39,0.1)' : 'transparent', color: active ? GOLD : 'rgba(255,255,255,0.62)', border: 'none', borderLeft: `3px solid ${active ? GOLD : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 600 : 400 }}>
                  <SvgIcon d={icon} size={14} color={active ? GOLD : 'rgba(255,255,255,0.35)'} />
                  {label}
                </button>
              )
            })}
          </nav>
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', letterSpacing: '0.05em' }}>
            DATA SAVED LOCALLY
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: mainPad }}>
          {isOverlay && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', marginBottom: 16, flexShrink: 0 }}
            >
              <SvgIcon d={IC.menu} size={18} color={NAVY} />
            </button>
          )}
          <div style={{ maxWidth: 840 }}>
            {section === 'dashboard'  && <Dashboard voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs} budget={data.budget} packing={data.packing} foodLogs={data.foodLogs} diningLog={data.diningLog} onNav={navClick} />}
            {section === 'voyage'     && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
            {section === 'itinerary'  && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
            {section === 'daily'      && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} />}
            {section === 'food'       && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
            {section === 'dining'     && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
            {section === 'foodfav'    && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
            {section === 'budget'     && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
            {section === 'shopping'   && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
            {section === 'highlights' && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
            {section === 'packing'    && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
            {section === 'notes'      && <Notes data={data.notes} onChange={v => update('notes', v)} />}
          </div>
        </main>
      </div>
    </WCtx.Provider>
  )
}
