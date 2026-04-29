// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root application component
//
// Owns all journal data in a single state object and persists every change to
// localStorage via the db helper. Also controls which section is visible and
// manages the sidebar open/close state for mobile and tablet viewports.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CREAM, NAVY, NAVY2, GOLD, WHITE, BORDER, BP } from './constants'
import { NAV } from './constants'
import { WCtx, VoyageCtx, UserCtx, useWindowSize } from './context'
import { applyTheme, getSavedTheme } from './themes'
import { db } from './storage'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import TopNav  from './components/TopNav'
import AuthScreen from './components/AuthScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { Toast } from './components/ui'
import Feed           from './sections/Feed'
import DayDetail      from './sections/DayDetail'
import VoyageProfile  from './sections/VoyageProfile'
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
import Friends        from './sections/Friends'
import Chat           from './sections/Chat'
import UserProfile    from './sections/UserProfile'
import {
  fromDbVoyage,    toDbVoyage,
  fromDbItinerary, toDbItinerary,
  fromDbDailyLogs, toDbDailyLogs,
  fromDbFoodLogs,  toDbFoodLogs,
  fromDbDiningLog, toDbDiningLog,
  fromDbEntertainmentLog, toDbEntertainmentLog,
  fromDbFoodFav,   toDbFoodFav,
  fromDbHighlights, toDbHighlights,
  fromDbBudget,
  fromDbShopping,  toDbShoppingItems,
  fromDbPacking,   toDbPackingItems,
  fromDbNotes,     toDbNotes,
} from './lib/converters'

// ── Initial data shape ────────────────────────────────────────────────────────
// Defines the default empty state for every section. Used as the fallback when
// no saved data exists in localStorage. The keys here must match the "csj-"
// prefixed storage keys and the props passed to each section component.
const INIT = {
  voyage:           {},
  itinerary:        [],
  dailyLogs:        [],
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

  const [theme, setTheme]             = useState(getSavedTheme)

  // Apply the persisted theme immediately on first render (localStorage fallback)
  useEffect(() => { applyTheme(theme) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchTheme = (id) => {
    applyTheme(id)   // writes CSS vars + localStorage
    setTheme(id)
    // Persist to DB using the session already in state — no extra API call needed
    const uid = session?.user?.id
    if (uid) {
      supabase.from('profiles')
        .update({ theme: id })
        .eq('user_id', uid)
        .then()
    }
  }
  const [section, setSection]         = useState('dashboard')
  const [selectedDay, setSelectedDay] = useState(null)  // day index open in DayDetail
  const [dailyJumpDay, setDailyJumpDay] = useState(null) // day to open when entering Daily Log
  const [data, setData]               = useState(INIT)
  const [loaded, setLoaded]           = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [voyageId, setVoyageId]       = useState(null)
  const [allVoyages, setAllVoyages]   = useState([])  // minimal rows for the voyage switcher

  // Debounce timers for array-section Supabase writes — held in refs so they
  // persist across renders without becoming useCallback dependencies.
  const itineraryTimer       = useRef(null)
  const dailyLogsTimer       = useRef(null)
  const foodLogsTimer        = useRef(null)
  const diningLogTimer       = useRef(null)
  const entertainmentTimer   = useRef(null)
  const shoppingTimer        = useRef(null)
  const budgetTimer          = useRef(null)
  const packingTimer         = useRef(null)
  const notesTimer           = useRef(null)
  // Stores the budget row's DB id after it's created/loaded so the write path
  // can insert budget_items without an extra SELECT round-trip.
  const budgetIdRef          = useRef(null)

  // ── Toast notification state ────────────────────────────────────────────────
  // showToast is passed to Feed so the quick composer can confirm a logged day.
  const [toast, setToast]   = useState({ message: '', visible: false })
  const toastTimer          = useRef(null)

  const showToast = (message) => {
    clearTimeout(toastTimer.current)
    setToast({ message, visible: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  // ── Auth session ────────────────────────────────────────────────────────────
  // Check for an existing session on mount, then listen for sign-in/sign-out
  // events so the UI updates automatically without a page reload.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
      // Load theme from DB — overrides the localStorage fallback once we know the user.
      // applyTheme() also writes to localStorage immediately so subsequent page loads
      // use the correct theme before this async call completes (no flash).
      if (session?.user?.id) {
        supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.theme) { applyTheme(data.theme); setTheme(data.theme) }
          })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear cached voyage ID on sign-in so a different user on the same
      // device never accidentally loads another user's voyage.
      if (event === 'SIGNED_IN') localStorage.removeItem('csj-activeVoyageId')
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Voyage initialisation ───────────────────────────────────────────────────
  // Loads all voyages for this user. Picks the active one from localStorage
  // (so the last-used voyage is restored on reload), or falls back to the
  // oldest voyage. Creates a blank voyage row for brand-new users.
  useEffect(() => {
    if (!session) return
    // Guard against React StrictMode double-invocation — if the effect runs a
    // second time before the first async completes, the cancelled flag stops the
    // second run from creating a duplicate voyage row.
    let cancelled = false

    async function initVoyage() {
      const VOYAGE_SELECT = 'id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url'

      const { data: rows } = await supabase
        .from('voyages')
        .select(VOYAGE_SELECT)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

      if (cancelled) return

      if (rows && rows.length > 0) {
        setAllVoyages(rows)
        const savedId = localStorage.getItem('csj-activeVoyageId')
        const active  = rows.find(r => r.id === savedId) || rows[0]
        setVoyageId(active.id)
        localStorage.setItem('csj-activeVoyageId', active.id)
        return
      }

      // First login — create a blank voyage row so all child tables have a
      // valid voyage_id to reference.
      const { data: created } = await supabase
        .from('voyages')
        .insert({ user_id: session.user.id })
        .select(VOYAGE_SELECT)
        .single()

      if (cancelled) return

      if (created) {
        setAllVoyages([created])
        setVoyageId(created.id)
        localStorage.setItem('csj-activeVoyageId', created.id)
      }
    }

    initVoyage()
    return () => { cancelled = true }
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
      .select('ship_name, cruise_line, cabin, deck, departure_date, return_date, departure_port, total_nights, companion_1, companion_2, companion_3, companion_4, emergency_contact, phone, guest_services, muster_station, dining_time, cover_photo_url')
      .eq('id', voyageId)
      .single()
      .then(({ data: row }) => {
        if (!row) return
        const voyage = fromDbVoyage(row)
        setData(prev => ({ ...prev, voyage }))
        db.set('csj-voyage', voyage)
      })
  }, [voyageId])

  // ── Load itinerary from Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!voyageId) return
    supabase
      .from('itinerary')
      .select('day_number, date, port, arrive, depart')
      .eq('voyage_id', voyageId)
      .then(({ data: rows }) => {
        if (!rows) return
        const itinerary = fromDbItinerary(rows)
        setData(prev => ({ ...prev, itinerary }))
        db.set('csj-itinerary', itinerary)
      })
  }, [voyageId])

  // ── Load daily logs from Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!voyageId) return
    supabase
      .from('daily_logs')
      .select('day_number, date, port, weather, highlights, breakfast, lunch, dinner, drink, activity, duration, exc_cost, exc_notes, entertainment, best_moment, rating, is_public')
      .eq('voyage_id', voyageId)
      .then(({ data: rows }) => {
        if (!rows) return
        const dailyLogs = fromDbDailyLogs(rows)
        setData(prev => ({ ...prev, dailyLogs }))
        db.set('csj-dailyLogs', dailyLogs)
      })
  }, [voyageId])

  // ── Load remaining sections from Supabase ───────────────────────────────────
  // Runs once after voyageId is known. Fetches all remaining sections in a
  // single parallel Promise.all, then handles the two-step budget load
  // (budget row → budget_items). Budget row is created here if it doesn't
  // exist yet so subsequent writes always have a valid budgetIdRef.
  useEffect(() => {
    if (!voyageId) return

    async function loadRemaining() {
      const [
        { data: foodLogRows },
        { data: diningLogRows },
        { data: entertainmentRows },
        { data: foodFavRow },
        { data: highlightsRow },
        { data: budgetRow },
        { data: shoppingRows },
        { data: packingRows },
        { data: noteRows },
      ] = await Promise.all([
        supabase.from('food_logs').select('day,date,meal_type,port,venue,what_i_had,standout,drinks,tasting_notes,rating,cost,order_again').eq('voyage_id', voyageId),
        supabase.from('dining_log').select('venue,date,meal,ordered,rating,notes').eq('voyage_id', voyageId),
        supabase.from('entertainment_log').select('day,date,name,type,venue,performers,duration,rating,notes').eq('voyage_id', voyageId),
        supabase.from('food_favourites').select('best,buffet,specialty,surprising,recreate,regret').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('highlights').select('port,meal,funny,view,friends,first_time,moment').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('budget').select('id,total_budget').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('shopping_items').select('item,port,cost').eq('voyage_id', voyageId),
        supabase.from('packing_items').select('category,item,checked').eq('voyage_id', voyageId),
        supabase.from('notes').select('title,content').eq('voyage_id', voyageId).order('id'),
      ])

      // Budget: fetch items if the row exists, otherwise create the row so the
      // write path always has a valid budgetIdRef.current.
      let budgetItemRows = []
      if (budgetRow) {
        budgetIdRef.current = budgetRow.id
        const { data: items } = await supabase
          .from('budget_items')
          .select('date,item,category,amount')
          .eq('budget_id', budgetRow.id)
        budgetItemRows = items || []
      } else {
        const { data: created } = await supabase
          .from('budget')
          .insert({ voyage_id: voyageId, total_budget: null })
          .select('id')
          .single()
        if (created) budgetIdRef.current = created.id
      }

      const updates = {
        foodLogs:         fromDbFoodLogs(foodLogRows         || []),
        diningLog:        fromDbDiningLog(diningLogRows      || []),
        entertainmentLog: fromDbEntertainmentLog(entertainmentRows || []),
        foodFav:          fromDbFoodFav(foodFavRow),
        highlights:       fromDbHighlights(highlightsRow),
        budget:           fromDbBudget(budgetRow, budgetItemRows),
        shopping:         fromDbShopping(shoppingRows        || []),
        packing:          fromDbPacking(packingRows          || []),
        notes:            fromDbNotes(noteRows               || []),
      }

      setData(prev => ({ ...prev, ...updates }))
      Object.entries(updates).forEach(([k, v]) => db.set(`csj-${k}`, v))
    }

    loadRemaining()
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

  // ── Derived section completion status ──────────────────────────────────────
  // A Set of section IDs that have meaningful data. This is the central
  // cross-section signal consumed by two places:
  //   • Sidebar — green dot on each nav item that has content
  //   • Feed compact metrics strip — "Journal Complete N / 12" tile
  //
  // Rules: the minimum meaningful content that counts as "started":
  //   voyage        → any of ship name, cruise line, or departure date
  //   itinerary     → at least one row exists
  //   daily         → at least one day with highlights, best moment, or activity
  //   food          → at least one food log entry
  //   dining        → at least one restaurant log entry
  //   entertainment → at least one entertainment log entry
  //   foodfav       → any favourites field filled
  //   budget        → budget amount set OR at least one expense item
  //   shopping      → at least one shopping item
  //   highlights    → any highlights field filled
  //   packing       → at least one item checked
  //   notes         → at least one note with title or content
  const sectionStatus = useMemo(() => {
    const has = new Set()
    if (data.voyage.shipName || data.voyage.cruiseLine || data.voyage.departureDate) has.add('voyage')
    if (data.itinerary.length > 0) has.add('itinerary')
    if (data.dailyLogs.some(d => d.highlights || d.bestMoment || d.activity)) has.add('daily')
    if (data.foodLogs.length > 0) has.add('food')
    if (data.diningLog.length > 0) has.add('dining')
    if (data.entertainmentLog.length > 0) has.add('entertainment')
    if (Object.values(data.foodFav).some(v => v)) has.add('foodfav')
    if (data.budget.budget || data.budget.items.length > 0) has.add('budget')
    if (data.shopping.items.length > 0) has.add('shopping')
    if (Object.values(data.highlights).some(v => v)) has.add('highlights')
    if (Object.values(data.packing).flat().length > 0) has.add('packing')
    if (data.notes.some(n => n.content || n.title)) has.add('notes')
    return has
  }, [data])

  // ── Persist a section's data update ─────────────────────────────────────────
  // Called by every section component via its onChange prop. Updates React
  // state and writes through to localStorage in one step. useCallback prevents
  // child components from re-rendering when unrelated state changes.
  // NOTE: Every Supabase call must be awaited or have .then() called.
  // In Supabase JS v2 the query builder is lazy — the HTTP request only fires
  // when the Promise chain is started. Unawaited calls silently do nothing.
  // ── Sync error helper ────────────────────────────────────────────────────────
  // Checks a Supabase result and fires a toast if it errored.
  const syncCheck = useCallback(({ error }) => {
    if (error) showToast('⚠️ Sync error — changes saved locally but not to the cloud.')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)

    // Voyage — immediate write, no debounce needed (one row, small payload)
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val)).eq('id', voyageId).then(syncCheck)
    }

    // Single-record sections — upsert on every keystroke (tiny payload)
    if (key === 'foodFav' && voyageId) {
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val), { onConflict: 'voyage_id' }).then(syncCheck)
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val), { onConflict: 'voyage_id' }).then(syncCheck)
    }

    // Dynamic arrays — debounced delete-all + re-insert to avoid write-per-keystroke
    if (key === 'itinerary' && voyageId) {
      clearTimeout(itineraryTimer.current)
      itineraryTimer.current = setTimeout(async () => {
        const del = await supabase.from('itinerary').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('itinerary').insert(toDbItinerary(voyageId, val)))
      }, 800)
    }
    if (key === 'dailyLogs' && voyageId) {
      clearTimeout(dailyLogsTimer.current)
      dailyLogsTimer.current = setTimeout(async () => {
        const del = await supabase.from('daily_logs').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('daily_logs').insert(toDbDailyLogs(voyageId, val)))
      }, 800)
    }
    if (key === 'foodLogs' && voyageId) {
      clearTimeout(foodLogsTimer.current)
      foodLogsTimer.current = setTimeout(async () => {
        const del = await supabase.from('food_logs').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('food_logs').insert(toDbFoodLogs(voyageId, val)))
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      clearTimeout(diningLogTimer.current)
      diningLogTimer.current = setTimeout(async () => {
        const del = await supabase.from('dining_log').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('dining_log').insert(toDbDiningLog(voyageId, val)))
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      clearTimeout(entertainmentTimer.current)
      entertainmentTimer.current = setTimeout(async () => {
        const del = await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('entertainment_log').insert(toDbEntertainmentLog(voyageId, val)))
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      clearTimeout(shoppingTimer.current)
      shoppingTimer.current = setTimeout(async () => {
        const del = await supabase.from('shopping_items').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.items?.length > 0) syncCheck(await supabase.from('shopping_items').insert(toDbShoppingItems(voyageId, val.items)))
      }, 800)
    }
    if (key === 'packing' && voyageId) {
      clearTimeout(packingTimer.current)
      packingTimer.current = setTimeout(async () => {
        const del = await supabase.from('packing_items').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        const rows = toDbPackingItems(voyageId, val)
        if (rows.length > 0) syncCheck(await supabase.from('packing_items').insert(rows))
      }, 800)
    }
    if (key === 'notes' && voyageId) {
      clearTimeout(notesTimer.current)
      notesTimer.current = setTimeout(async () => {
        const del = await supabase.from('notes').delete().eq('voyage_id', voyageId)
        syncCheck(del)
        if (val.length > 0) syncCheck(await supabase.from('notes').insert(toDbNotes(voyageId, val)))
      }, 800)
    }

    // Budget — two-table write: update row first, then replace items
    if (key === 'budget' && voyageId && budgetIdRef.current) {
      clearTimeout(budgetTimer.current)
      budgetTimer.current = setTimeout(async () => {
        const bid = budgetIdRef.current
        syncCheck(await supabase.from('budget').update({ total_budget: val.budget || null }).eq('id', bid))
        syncCheck(await supabase.from('budget_items').delete().eq('budget_id', bid))
        if (val.items?.length > 0) {
          syncCheck(await supabase.from('budget_items').insert(val.items.map(item => ({
            budget_id: bid,
            date:      item.date     || null,
            item:      item.item     || null,
            category:  item.category || null,
            amount:    item.amount   ? parseFloat(item.amount) : null,
          }))))
        }
      }, 800)
    }
  }, [voyageId, syncCheck])

  // ── Switch active voyage ─────────────────────────────────────────────────────
  // Clears all section data and localStorage cache, then sets the new voyageId
  // which re-triggers every Supabase load effect.
  const switchVoyage = (newId) => {
    if (newId === voyageId) return
    Object.keys(INIT).forEach(k => db.set(`csj-${k}`, INIT[k]))
    localStorage.setItem('csj-activeVoyageId', newId)
    setData(INIT)
    setVoyageId(newId)
    setSection('dashboard')
  }

  // ── Create a new voyage ───────────────────────────────────────────────────────
  // Inserts a row in the voyages table, adds it to allVoyages, and switches to it.
  const createVoyage = async (partial = {}) => {
    const VOYAGE_SELECT = 'id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url'
    const { data: created } = await supabase
      .from('voyages')
      .insert({ user_id: session.user.id, ...partial })
      .select(VOYAGE_SELECT)
      .single()

    if (created) {
      setAllVoyages(prev => [...prev, created])
      switchVoyage(created.id)
    }
    return created
  }

  // ── Cover photo change ────────────────────────────────────────────────────────
  // Called by VoyageProfile after a successful Supabase Storage upload.
  // Updates the in-memory voyage data and the allVoyages summary list.
  const handleCoverPhotoChange = (url) => {
    setData(prev => ({ ...prev, voyage: { ...prev.voyage, coverPhotoUrl: url || '' } }))
    setAllVoyages(prev => prev.map(v => v.id === voyageId ? { ...v, cover_photo_url: url } : v))
  }

  // ── Handle sidebar navigation clicks ────────────────────────────────────────
  // Switches the active section and collapses the sidebar on mobile/tablet
  // after a nav item is tapped.
  const navClick = (id) => {
    setSection(id)
    setSelectedDay(null)   // close any open day detail when navigating
    if (id !== 'daily') setDailyJumpDay(null)  // clear jump target unless going to daily
    if (isOverlay) setSidebarOpen(false)
  }

  // ── Layout values derived from viewport width ────────────────────────────────
  const baseFontSize  = isMobile ? 15 : winW < BP.tablet ? 15.5 : 16
  const mainPad       = isMobile ? '16px 10px' : winW < BP.tablet ? '28px 24px' : '36px 44px'
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
    <UserCtx.Provider value={session?.user?.id ?? null}>
    <WCtx.Provider value={winW}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: CREAM, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: baseFontSize }}>

          {/* Sidebar — full height on desktop so it merges seamlessly with the
              TopNav above the content. On mobile/tablet it becomes a drawer.  */}
          <Sidebar
            section={section}
            onNav={navClick}
            isOverlay={isOverlay}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            user={session?.user}
            onSignOut={() => supabase.auth.signOut()}
            voyageName={data.voyage.shipName}
            voyageCount={allVoyages.length}
            sectionStatus={sectionStatus}
          />

          {/* ── Right column: TopNav + scrollable content ──────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* ── Top navigation banner ──────────────────────────────────────── */}
          <TopNav
            section={section}
            onNav={navClick}
            isOverlay={isOverlay}
            isMobile={isMobile}
            onMenuOpen={() => setSidebarOpen(true)}
          />

          {/* ── Section content ─────────────────────────────────────────────
              maxWidth 840 keeps long-form content readable on wide screens.
              Each section receives its slice of data and an onChange handler
              that calls update() to persist the change.                     */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: mainPad }}>
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <ErrorBoundary>
              {section === 'dashboard' && selectedDay === null && (
                <Feed voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs} budget={data.budget} packing={data.packing} foodLogs={data.foodLogs} diningLog={data.diningLog} sectionStatus={sectionStatus} onChange={v => update('dailyLogs', v)} onNav={navClick} showToast={showToast} onViewDay={setSelectedDay} />
              )}
              {section === 'dashboard' && selectedDay !== null && (
                <DayDetail dayIndex={selectedDay} log={data.dailyLogs[selectedDay] || {}} itinerary={data.itinerary} onBack={() => setSelectedDay(null)} onEdit={() => { setDailyJumpDay(selectedDay); setSelectedDay(null); navClick('daily') }} />
              )}
              {section === 'profile'       && <VoyageProfile voyage={data.voyage} allVoyages={allVoyages} voyageId={voyageId} session={session} onSwitch={switchVoyage} onCreate={createVoyage} onCoverPhotoChange={handleCoverPhotoChange} />}
              {section === 'voyage'        && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
              {section === 'itinerary'     && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
              {section === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} initialDay={dailyJumpDay ?? 0} />}
              {section === 'food'          && <FoodLog data={data.foodLogs} onChange={v => update('foodLogs', v)} />}
              {section === 'dining'        && <DiningLog data={data.diningLog} onChange={v => update('diningLog', v)} />}
              {section === 'entertainment' && <EntertainmentLog data={data.entertainmentLog} onChange={v => update('entertainmentLog', v)} />}
              {section === 'foodfav'       && <FoodFavourites data={data.foodFav} onChange={v => update('foodFav', v)} />}
              {section === 'budget'        && <BudgetTracker data={data.budget} onChange={v => update('budget', v)} />}
              {section === 'shopping'      && <ShoppingLog data={data.shopping} onChange={v => update('shopping', v)} />}
              {section === 'highlights'    && <Highlights data={data.highlights} onChange={v => update('highlights', v)} />}
              {section === 'packing'       && <PackingList data={data.packing} onChange={v => update('packing', v)} />}
              {section === 'notes'         && <Notes data={data.notes} onChange={v => update('notes', v)} />}
              {section === 'friends'       && <Friends />}
              {section === 'chat'          && <Chat />}
              {section === 'userprofile'   && <UserProfile session={session} allVoyages={allVoyages} voyage={data.voyage} onNav={navClick} theme={theme} onThemeChange={switchTheme} />}
            </ErrorBoundary>
            </div>
            </div>
          </main>

          </div>{/* end right column */}
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </WCtx.Provider>
    </UserCtx.Provider>
    </VoyageCtx.Provider>
  )
}
