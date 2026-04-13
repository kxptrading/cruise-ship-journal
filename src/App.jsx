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

const INIT = {
  voyage:    {},
  itinerary: Array.from({ length: 14 }, () => ({})),
  dailyLogs: Array.from({ length: 14 }, () => ({})),
  foodLogs:  [],
  diningLog: [],
  entertainmentLog: [],
  foodFav:   {},
  budget:    { budget: '', items: [] },
  shopping:  { items: [] },
  highlights: {},
  packing:   {},
  notes:     [],
}

export default function App() {
  const winW      = useWindowSize()
  const isOverlay = winW <= BP.tablet
  const isMobile  = winW < BP.mobile

  const [section, setSection]         = useState('dashboard')
  const [data, setData]               = useState(INIT)
  const [loaded, setLoaded]           = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  useEffect(() => {
    if (!isOverlay) setSidebarOpen(false)
  }, [isOverlay])

  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)
  }, [])

  const navClick = (id) => {
    setSection(id)
    if (isOverlay) setSidebarOpen(false)
  }

  const baseFontSize  = isMobile ? 15 : winW < BP.tablet ? 15.5 : 16
  const mainPad       = isMobile ? '20px 16px' : winW < BP.tablet ? '28px 24px' : '36px 44px'
  const topbarHeight  = 52
  const currentLabel  = NAV.find(n => n.id === section)?.label ?? ''

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

        <Sidebar
          section={section}
          onNav={navClick}
          isOverlay={isOverlay}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Sticky topbar — mobile & tablet only */}
          {isOverlay && (
            <div style={{
              position: 'sticky', top: 0, zIndex: 100,
              height: topbarHeight, flexShrink: 0,
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
          )}

          <div style={{ padding: mainPad, flex: 1 }}>
          <div style={{ maxWidth: 840 }}>
            {section === 'dashboard'  && <Dashboard voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs} budget={data.budget} packing={data.packing} foodLogs={data.foodLogs} diningLog={data.diningLog} onNav={navClick} />}
            {section === 'voyage'     && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
            {section === 'itinerary'  && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
            {section === 'daily'      && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} />}
            {section === 'food'       && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
            {section === 'dining'     && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
            {section === 'entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
            {section === 'foodfav'    && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
            {section === 'budget'     && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
            {section === 'shopping'   && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
            {section === 'highlights' && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
            {section === 'packing'    && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
            {section === 'notes'      && <Notes data={data.notes} onChange={v => update('notes', v)} />}
          </div>
          </div>
        </main>

      </div>
    </WCtx.Provider>
  )
}
