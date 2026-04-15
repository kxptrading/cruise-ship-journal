// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root application component
//
// Owns all journal data in a single state object and persists every change to
// localStorage via the db helper. Also controls which section is visible and
// manages the sidebar open/close state for mobile and tablet viewports.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { CREAM, NAVY, NAVY2, GOLD, WHITE, BORDER, BP } from './constants'
import { IC, NAV } from './constants'
import { WCtx, VoyageCtx, useWindowSize } from './context'
import { db } from './storage'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import AuthScreen from './components/AuthScreen'
import { SvgIcon } from './components/ui'
import Dashboard      from './sections/Dashboard'
import VoyageDetails  from './sections/VoyageDetails'
import Itinerary      from './sections/Itinerary'
import DailyLog       from './sections/DailyLog'
import FoodLog        from './sections/FoodLog'
import DiningLog      from './sections/DiningLog'
import EntertainmentLog from './sections/EntertainmentLog'
import FoodFavourites from './sections/FoodFavourites'
import BudgetTracker  from './sections/BudgetTracker'
import ShoppingLog    from './sections/ShoppingLog'
import Highlights     from './sections/Highlights'
import PackingList    from './sections/PackingList'
import Notes          from './sections/Notes'

// ── DB ↔ app shape converters for the voyage section ─────────────────────────
// The voyages table uses snake_case column names; the app uses camelCase field
// names. These two pure functions translate between the two shapes so nothing
// else in the codebase ever needs to know about DB column names.

function fromDbVoyage(row) {
  return {
    shipName:         row.ship_name         ?? '',
    cruiseLine:       row.cruise_line       ?? '',
    cabin:            row.cabin             ?? '',
    deck:             row.deck              ?? '',
    departureDate:    row.departure_date    ?? '',
    returnDate:       row.return_date       ?? '',
    departurePort:    row.departure_port    ?? '',
    totalNights:      row.total_nights != null ? String(row.total_nights) : '',
    companion1:       row.companion_1       ?? '',
    companion2:       row.companion_2       ?? '',
    companion3:       row.companion_3       ?? '',
    companion4:       row.companion_4       ?? '',
    emergencyContact: row.emergency_contact ?? '',
    phone:            row.phone             ?? '',
    guestServices:    row.guest_services    ?? '',
    musterStation:    row.muster_station    ?? '',
    diningTime:       row.dining_time       ?? '',
  }
}

function toDbVoyage(v) {
  return {
    ship_name:         v.shipName         || null,
    cruise_line:       v.cruiseLine       || null,
    cabin:             v.cabin            || null,
    deck:              v.deck             || null,
    departure_date:    v.departureDate    || null,
    return_date:       v.returnDate       || null,
    departure_port:    v.departurePort    || null,
    total_nights:      v.totalNights ? parseInt(v.totalNights, 10) : null,
    companion_1:       v.companion1       || null,
    companion_2:       v.companion2       || null,
    companion_3:       v.companion3       || null,
    companion_4:       v.companion4       || null,
    emergency_contact: v.emergencyContact || null,
    phone:             v.phone            || null,
    guest_services:    v.guestServices    || null,
    muster_station:    v.musterStation    || null,
    dining_time:       v.diningTime       || null,
  }
}

// ── Initial data shape ────────────────────────────────────────────────────────
// Defines the default empty state for every section. Used as the fallback when
// no saved data exists in localStorage. The keys here must match the "csj-"
// prefixed storage keys and the props passed to each section component.
const INIT = {
  voyage:           {},
  itinerary:        Array.from({ length: 14 }, () => ({})),
  dailyLogs:        Array.from({ length: 14 }, () => ({})),
  foodLogs:         [],
  diningLog:        [],
  entertainmentLog: [],
  foodFav:          {},
  budget:           { budget: '', items: [] },
  shopping:         { items: [] },
  highlights:       {},
  packing:          {},
  notes:            [],
}

export default function App() {
  // ── Responsive layout flags ─────────────────────────────────────────────────
  // isOverlay: sidebar slides over content rather than sitting beside it
  // isMobile:  tightest layout — single column, smallest text and padding
  const winW      = useWindowSize()
  const isOverlay = winW <= BP.tablet
  const isMobile  = winW < BP.mobile

  const [session, setSession]         = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [section, setSection]         = useState('dashboard')
  const [data, setData]               = useState(INIT)
  const [loaded, setLoaded]           = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [voyageId, setVoyageId]       = useState(null)

  // ── Auth session ────────────────────────────────────────────────────────────
  // Check for an existing session on mount, then listen for sign-in/sign-out
  // events so the UI updates automatically without a page reload.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Voyage initialisation ───────────────────────────────────────────────────
  // Runs once after the user is confirmed logged in. Fetches their first voyage
  // row (ordered by created_at so the same voyage is always returned), or
  // inserts a blank one for new users. Sets voyageId so every section knows
  // which voyage to read/write. RLS ensures the query only sees their own rows.
  useEffect(() => {
    if (!session) return

    async function initVoyage() {
      const { data } = await supabase
        .from('voyages')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (data) {
        setVoyageId(data.id)
        return
      }

      // First login — create a blank voyage row so all child tables have a
      // valid voyage_id to reference.
      const { data: created } = await supabase
        .from('voyages')
        .insert({ user_id: session.user.id })
        .select('id')
        .single()

      if (created) setVoyageId(created.id)
    }

    initVoyage()
  }, [session])

  // ── Load voyage details from Supabase ───────────────────────────────────────
  // Runs once after voyageId is known. Fetches the voyage row's detail columns
  // and merges them into data.voyage, replacing the localStorage fallback with
  // the authoritative Supabase values. Also writes back to localStorage so the
  // data is available as a fast initial render on the next page load.
  useEffect(() => {
    if (!voyageId) return

    supabase
      .from('voyages')
      .select('ship_name, cruise_line, cabin, deck, departure_date, return_date, departure_port, total_nights, companion_1, companion_2, companion_3, companion_4, emergency_contact, phone, guest_services, muster_station, dining_time')
      .eq('id', voyageId)
      .single()
      .then(({ data: row }) => {
        if (!row) return
        const voyage = fromDbVoyage(row)
        setData(prev => ({ ...prev, voyage }))
        db.set('csj-voyage', voyage)
      })
  }, [voyageId])

  // ── Load persisted data on mount ────────────────────────────────────────────
  // Reads every section's data from localStorage. Migrates legacy notes format
  // (plain string) to the current array-of-objects format.
  useEffect(() => {
    const result = {}
    for (const [k, fb] of Object.entries(INIT)) result[k] = db.get(`csj-${k}`, fb)
    // Migrate old notes string → array
    if (typeof result.notes === 'string') {
      result.notes = result.notes.trim() ? [{ title: '', content: result.notes }] : []
    }
    setData(result)
    setLoaded(true)
  }, [])

  // ── Auto-close sidebar when viewport widens past tablet breakpoint ──────────
  // Prevents the sidebar from staying open in overlay mode if the user resizes
  // their browser window to a larger size.
  useEffect(() => {
    if (!isOverlay) setSidebarOpen(false)
  }, [isOverlay])

  // ── Persist a section's data update ─────────────────────────────────────────
  // Called by every section component via its onChange prop. Updates React
  // state and writes through to localStorage in one step. useCallback prevents
  // child components from re-rendering when unrelated state changes.
  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)
    // Write voyage changes to Supabase. Fire-and-forget — localStorage is the
    // fallback if the write fails, so there's no need to block the UI on it.
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val)).eq('id', voyageId)
    }
  }, [voyageId])

  // ── Handle sidebar navigation clicks ────────────────────────────────────────
  // Switches the active section and collapses the sidebar on mobile/tablet
  // after a nav item is tapped.
  const navClick = (id) => {
    setSection(id)
    if (isOverlay) setSidebarOpen(false)
  }

  // ── Layout values derived from viewport width ────────────────────────────────
  const baseFontSize  = isMobile ? 15 : winW < BP.tablet ? 15.5 : 16
  const mainPad       = isMobile ? '20px 16px' : winW < BP.tablet ? '28px 24px' : '36px 44px'
  const topbarHeight  = 52
  const currentLabel  = NAV.find(n => n.id === section)?.label ?? ''

  // ── Auth / data loading screens ─────────────────────────────────────────────
  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading...</div>
      </div>
    </div>
  )

  if (!session) return <AuthScreen />

  if (!loaded || !voyageId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading your voyage journal...</div>
      </div>
    </div>
  )

  return (
    // ── VoyageCtx + WCtx providers ─────────────────────────────────────────────
    // VoyageCtx makes the active voyageId available anywhere via useVoyageId()
    // without prop-drilling. WCtx does the same for viewport width.
    <VoyageCtx.Provider value={voyageId}>
    <WCtx.Provider value={winW}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

        {/* ── Mobile/tablet topbar ────────────────────────────────────────────
            position:fixed anchors the bar to the visual viewport so iOS
            keyboard appearance, address-bar hide/show, and layout reflows
            cannot push it off screen. A matching spacer div preserves the
            52px gap in the document flow so content doesn't slide under it. */}
        {isOverlay && (
          <>
          <div style={{ height: topbarHeight, flexShrink: 0 }} aria-hidden="true" />
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            height: topbarHeight, zIndex: 200,
            background: WHITE, borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          }}>
            <button onClick={() => setSidebarOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}>
              <SvgIcon d={IC.menu} size={18} color={NAVY} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: 'Georgia,serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentLabel}
              </span>
            </div>
          </div>
          </>
        )}

        {/* ── Body row: sidebar + scrollable content ──────────────────────────
            flex: 1 + overflow: hidden ensures this row fills the remaining
            height below the topbar and clips the sidebar/main correctly.   */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar — fixed on desktop, overlay drawer on mobile/tablet */}
          <Sidebar
            section={section}
            onNav={navClick}
            isOverlay={isOverlay}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={session?.user}
            onSignOut={() => supabase.auth.signOut()}
          />

          {/* ── Section content ─────────────────────────────────────────────
              maxWidth 840 keeps long-form content readable on wide screens.
              Each section receives its slice of data and an onChange handler
              that calls update() to persist the change.                     */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: mainPad }}>
            <div style={{ maxWidth: 840 }}>
              {section === 'dashboard'     && <Dashboard voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs} budget={data.budget} packing={data.packing} foodLogs={data.foodLogs} diningLog={data.diningLog} onNav={navClick} />}
              {section === 'voyage'        && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
              {section === 'itinerary'     && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
              {section === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} />}
              {section === 'food'          && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
              {section === 'dining'        && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
              {section === 'entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
              {section === 'foodfav'       && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
              {section === 'budget'        && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
              {section === 'shopping'      && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
              {section === 'highlights'    && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
              {section === 'packing'       && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
              {section === 'notes'         && <Notes data={data.notes} onChange={v => update('notes', v)} />}
            </div>
            </div>
          </main>

        </div>
      </div>
    </WCtx.Provider>
    </VoyageCtx.Provider>
  )
}
