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
import { WCtx, useWindowSize } from './context'
import { db } from './storage'
import Sidebar from './components/Sidebar'
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

  const [section, setSection]         = useState('dashboard')
  const [data, setData]               = useState(INIT)
  const [loaded, setLoaded]           = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
  }, [])

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

  // ── Loading screen ───────────────────────────────────────────────────────────
  // Shown briefly while data is read from localStorage. Prevents sections from
  // rendering with empty state before the stored data has been applied.
  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM, fontFamily: 'Georgia,serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚓</div>
        <div style={{ color: NAVY, fontSize: 18 }}>Loading your voyage journal...</div>
      </div>
    </div>
  )

  return (
    // ── WCtx provider ──────────────────────────────────────────────────────────
    // Makes the current viewport width available to all child components via
    // useW(), so they can adjust layouts without receiving width as a prop.
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
  )
}
