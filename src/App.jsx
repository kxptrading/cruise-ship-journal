// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root application component
//
// Owns all journal data in a single state object and persists every change to
// localStorage via the db helper. Also controls which section is visible and
// manages the sidebar open/close state for mobile and tablet viewports.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { CREAM, NAVY, NAVY2, GOLD, WHITE, BORDER, BP } from './constants'
import { IC, NAV } from './constants'
import { WCtx, VoyageCtx, UserCtx, useWindowSize } from './context'
import { applyTheme, getSavedTheme, THEMES } from './themes'
import { db } from './storage'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import AuthScreen from './components/AuthScreen'
import { SvgIcon, Toast } from './components/ui'
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
import UserProfile    from './sections/UserProfile'

// ── DB ↔ app shape converters for the voyage section ─────────────────────────
// The voyages table uses snake_case column names; the app uses camelCase field
// names. These two pure functions translate between the two shapes so nothing
// else in the codebase ever needs to know about DB column names.

function fromDbVoyage(row) {
  return {
    shipName:         row.ship_name         ?? '',
    cruiseLine:       row.cruise_line       ?? '',
    cabin:            row.cabin             ?? '',
    deck:             row.deck             ?? '',
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
    coverPhotoUrl:    row.cover_photo_url   ?? '',
  }
}

// ── DB ↔ app shape converters for itinerary ──────────────────────────────────
// Rows are sorted by day_number and returned as a plain dynamic array — no
// fixed length. arrive/depart come back from Postgres as HH:MM:SS so we
// slice to HH:MM to match <input type="time">.

function fromDbItinerary(rows) {
  return [...rows]
    .sort((a, b) => a.day_number - b.day_number)
    .map(row => ({
      date:   row.date                              ?? '',
      port:   row.port                              ?? '',
      arrive: row.arrive ? row.arrive.slice(0, 5) : '',
      depart: row.depart ? row.depart.slice(0, 5) : '',
    }))
}

function toDbItinerary(voyageId, arr) {
  return arr.map((day, i) => ({
    voyage_id:  voyageId,
    day_number: i + 1,
    date:       day.date   || null,
    port:       day.port   || null,
    arrive:     day.arrive || null,
    depart:     day.depart || null,
  }))
}

// ── DB ↔ app shape converters for daily logs ─────────────────────────────────
// Sorted by day_number, returned as a plain dynamic array.
// exc_cost/exc_notes/best_moment are the DB column names;
// excCost/excNotes/bestMoment are the camelCase app names.

function fromDbDailyLogs(rows) {
  return [...rows]
    .sort((a, b) => a.day_number - b.day_number)
    .map(row => ({
      date:          row.date          ?? '',
      port:          row.port          ?? '',
      weather:       row.weather       ?? [],
      highlights:    row.highlights    ?? '',
      breakfast:     row.breakfast     ?? '',
      lunch:         row.lunch         ?? '',
      dinner:        row.dinner        ?? '',
      drink:         row.drink         ?? '',
      activity:      row.activity      ?? '',
      duration:      row.duration      ?? '',
      excCost:       row.exc_cost      ?? '',
      excNotes:      row.exc_notes     ?? '',
      entertainment: row.entertainment ?? '',
      bestMoment:    row.best_moment   ?? '',
      rating:        row.rating        ?? 0,
    }))
}

function toDbDailyLogs(voyageId, arr) {
  return arr.map((day, i) => ({
    voyage_id:     voyageId,
    day_number:    i + 1,
    date:          day.date          || null,
    port:          day.port          || null,
    weather:       day.weather       || [],
    highlights:    day.highlights    || null,
    breakfast:     day.breakfast     || null,
    lunch:         day.lunch         || null,
    dinner:        day.dinner        || null,
    drink:         day.drink         || null,
    activity:      day.activity      || null,
    duration:      day.duration      || null,
    exc_cost:      day.excCost       || null,
    exc_notes:     day.excNotes      || null,
    entertainment: day.entertainment || null,
    best_moment:   day.bestMoment    || null,
    rating:        day.rating        || null,
  }))
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
    cover_photo_url:   v.coverPhotoUrl    || null,
  }
}

// ── DB ↔ app shape converters — remaining sections ───────────────────────────

// Food Log — dynamic array. DB uses meal_type / what_i_had / tasting_notes /
// order_again; app uses meal / what / notes / orderAgain.
function fromDbFoodLogs(rows) {
  return rows.map(r => ({
    day:        r.day             ?? '',
    date:       r.date            ?? '',
    meal:       r.meal_type       ?? '',
    port:       r.port            ?? '',
    venue:      r.venue           ?? '',
    what:       r.what_i_had      ?? '',
    standout:   r.standout        ?? '',
    drinks:     r.drinks          ?? '',
    notes:      r.tasting_notes   ?? '',
    rating:     r.rating          ?? 0,
    cost:       r.cost            ?? '',
    orderAgain: r.order_again     ?? '',
  }))
}
function toDbFoodLogs(voyageId, arr) {
  return arr.map(m => ({
    voyage_id:     voyageId,
    day:           m.day        || null,
    date:          m.date       || null,
    meal_type:     m.meal       || null,
    port:          m.port       || null,
    venue:         m.venue      || null,
    what_i_had:    m.what       || null,
    standout:      m.standout   || null,
    drinks:        m.drinks     || null,
    tasting_notes: m.notes      || null,
    rating:        m.rating     || null,
    cost:          m.cost       || null,
    order_again:   m.orderAgain || null,
  }))
}

// Dining Log — dynamic array. Column names match app field names exactly.
function fromDbDiningLog(rows) {
  return rows.map(r => ({
    venue:   r.venue   ?? '',
    date:    r.date    ?? '',
    meal:    r.meal    ?? '',
    ordered: r.ordered ?? '',
    rating:  r.rating  ?? 0,
    notes:   r.notes   ?? '',
  }))
}
function toDbDiningLog(voyageId, arr) {
  return arr.map(r => ({
    voyage_id: voyageId,
    venue:     r.venue   || null,
    date:      r.date    || null,
    meal:      r.meal    || null,
    ordered:   r.ordered || null,
    rating:    r.rating  || null,
    notes:     r.notes   || null,
  }))
}

// Entertainment Log — dynamic array. day is stored as integer in DB.
function fromDbEntertainmentLog(rows) {
  return rows.map(r => ({
    day:        r.day != null ? String(r.day) : '',
    date:       r.date       ?? '',
    name:       r.name       ?? '',
    type:       r.type       ?? '',
    venue:      r.venue      ?? '',
    performers: r.performers ?? '',
    duration:   r.duration   ?? '',
    rating:     r.rating     ?? 0,
    notes:      r.notes      ?? '',
  }))
}
function toDbEntertainmentLog(voyageId, arr) {
  return arr.map(e => ({
    voyage_id:  voyageId,
    day:        e.day  ? parseInt(e.day, 10) : null,
    date:       e.date       || null,
    name:       e.name       || null,
    type:       e.type       || null,
    venue:      e.venue      || null,
    performers: e.performers || null,
    duration:   e.duration   || null,
    rating:     e.rating     || null,
    notes:      e.notes      || null,
  }))
}

// Food Favourites — single record per voyage. Direct 1-to-1 column mapping.
function fromDbFoodFav(row) {
  if (!row) return {}
  return {
    best:       row.best       ?? '',
    buffet:     row.buffet     ?? '',
    specialty:  row.specialty  ?? '',
    surprising: row.surprising ?? '',
    recreate:   row.recreate   ?? '',
    regret:     row.regret     ?? '',
  }
}
function toDbFoodFav(voyageId, v) {
  return {
    voyage_id:  voyageId,
    best:       v.best       || null,
    buffet:     v.buffet     || null,
    specialty:  v.specialty  || null,
    surprising: v.surprising || null,
    recreate:   v.recreate   || null,
    regret:     v.regret     || null,
  }
}

// Highlights — single record per voyage. firstTime ↔ first_time.
function fromDbHighlights(row) {
  if (!row) return {}
  return {
    port:      row.port       ?? '',
    meal:      row.meal       ?? '',
    funny:     row.funny      ?? '',
    view:      row.view       ?? '',
    friends:   row.friends    ?? '',
    firstTime: row.first_time ?? '',
    moment:    row.moment     ?? '',
  }
}
function toDbHighlights(voyageId, v) {
  return {
    voyage_id:  voyageId,
    port:       v.port      || null,
    meal:       v.meal      || null,
    funny:      v.funny     || null,
    view:       v.view      || null,
    friends:    v.friends   || null,
    first_time: v.firstTime || null,
    moment:     v.moment    || null,
  }
}

// Budget — budget row (total_budget) + budget_items array.
function fromDbBudget(budgetRow, itemRows) {
  return {
    budget: budgetRow?.total_budget ?? '',
    items:  (itemRows || []).map(r => ({
      date:     r.date     ?? '',
      item:     r.item     ?? '',
      category: r.category ?? '',
      amount:   r.amount != null ? String(r.amount) : '',
    })),
  }
}

// Shopping — wrapped { items: [] } shape. cost is numeric in DB.
function fromDbShopping(rows) {
  return {
    items: rows.map(r => ({
      item: r.item ?? '',
      port: r.port ?? '',
      cost: r.cost != null ? String(r.cost) : '',
    })),
  }
}
function toDbShoppingItems(voyageId, arr) {
  return arr.map(i => ({
    voyage_id: voyageId,
    item:      i.item || null,
    port:      i.port || null,
    cost:      i.cost ? parseFloat(i.cost) : null,
  }))
}

// Packing — { [category]: string[] } of checked items. DB stores one row per
// checked item; unchecked items are not stored (they're hardcoded in the UI).
function fromDbPacking(rows) {
  const result = {}
  rows.filter(r => r.checked).forEach(r => {
    if (!result[r.category]) result[r.category] = []
    result[r.category].push(r.item)
  })
  return result
}
function toDbPackingItems(voyageId, obj) {
  return Object.entries(obj).flatMap(([cat, items]) =>
    items.map(item => ({ voyage_id: voyageId, category: cat, item, checked: true }))
  )
}

// Notes — dynamic array of { title, content } objects.
function fromDbNotes(rows) {
  return rows.map(r => ({ title: r.title ?? '', content: r.content ?? '' }))
}
function toDbNotes(voyageId, arr) {
  return arr.map(n => ({
    voyage_id: voyageId,
    title:     n.title   || null,
    content:   n.content || null,
  }))
}

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
    }
  }
  const [section, setSection]         = useState('dashboard')
  const [selectedDay, setSelectedDay] = useState(null)  // day index open in DayDetail
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
  const [toast, setToast]   = useState({ message: '', visible: false })
  const toastTimer          = useRef(null)
  // Refs track whether the first-entry toasts have already been shown this session
  const toastLoggedRef      = useRef(false)
  const toastVoyageRef      = useRef(false)

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
      // Load theme from DB — overrides the localStorage fallback once we know the user
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      .select('day_number, date, port, weather, highlights, breakfast, lunch, dinner, drink, activity, duration, exc_cost, exc_notes, entertainment, best_moment, rating')
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

  // ── Toast triggers ──────────────────────────────────────────────────────────
  // Only fire after data has loaded from Supabase (loaded + voyageId set),
  // and only once per session to avoid repeat toasts on every render.
  useEffect(() => {
    if (!loaded || !voyageId) return
    if (!toastVoyageRef.current && data.voyage.shipName) {
      toastVoyageRef.current = true
      return // suppress on initial load — only fire on actual user input
    }
    if (toastVoyageRef.current && data.voyage.shipName) return
    toastVoyageRef.current = !!data.voyage.shipName
  }, [data.voyage.shipName])

  useEffect(() => {
    if (!loaded || !voyageId) return
    const logged = data.dailyLogs.filter(d => d.highlights || d.bestMoment).length
    if (!toastLoggedRef.current && logged > 0) {
      // Suppress on page load — wait for the count to increase
      toastLoggedRef.current = true
      return
    }
    if (toastLoggedRef.current && logged === 0) toastLoggedRef.current = false
  }, [data.dailyLogs, loaded, voyageId])

  // ── Derived section completion status ──────────────────────────────────────
  // A Set of section IDs that have meaningful data. Used by Sidebar (dots) and
  // Feed (journal completion score). Recomputed only when data changes.
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
  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)

    // Voyage — immediate write, no debounce needed (one row, small payload)
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val)).eq('id', voyageId).then(() => {})
    }

    // Single-record sections — upsert on every keystroke (tiny payload)
    if (key === 'foodFav' && voyageId) {
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val), { onConflict: 'voyage_id' }).then(() => {})
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val), { onConflict: 'voyage_id' }).then(() => {})
    }

    // Dynamic arrays — debounced delete-all + re-insert to avoid write-per-keystroke
    if (key === 'itinerary' && voyageId) {
      clearTimeout(itineraryTimer.current)
      itineraryTimer.current = setTimeout(async () => {
        await supabase.from('itinerary').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('itinerary').insert(toDbItinerary(voyageId, val))
      }, 800)
    }
    if (key === 'dailyLogs' && voyageId) {
      clearTimeout(dailyLogsTimer.current)
      dailyLogsTimer.current = setTimeout(async () => {
        await supabase.from('daily_logs').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('daily_logs').insert(toDbDailyLogs(voyageId, val))
      }, 800)
    }
    if (key === 'foodLogs' && voyageId) {
      clearTimeout(foodLogsTimer.current)
      foodLogsTimer.current = setTimeout(async () => {
        await supabase.from('food_logs').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('food_logs').insert(toDbFoodLogs(voyageId, val))
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      clearTimeout(diningLogTimer.current)
      diningLogTimer.current = setTimeout(async () => {
        await supabase.from('dining_log').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('dining_log').insert(toDbDiningLog(voyageId, val))
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      clearTimeout(entertainmentTimer.current)
      entertainmentTimer.current = setTimeout(async () => {
        await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('entertainment_log').insert(toDbEntertainmentLog(voyageId, val))
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      clearTimeout(shoppingTimer.current)
      shoppingTimer.current = setTimeout(async () => {
        await supabase.from('shopping_items').delete().eq('voyage_id', voyageId)
        if (val.items?.length > 0) await supabase.from('shopping_items').insert(toDbShoppingItems(voyageId, val.items))
      }, 800)
    }
    if (key === 'packing' && voyageId) {
      clearTimeout(packingTimer.current)
      packingTimer.current = setTimeout(async () => {
        await supabase.from('packing_items').delete().eq('voyage_id', voyageId)
        const rows = toDbPackingItems(voyageId, val)
        if (rows.length > 0) await supabase.from('packing_items').insert(rows)
      }, 800)
    }
    if (key === 'notes' && voyageId) {
      clearTimeout(notesTimer.current)
      notesTimer.current = setTimeout(async () => {
        await supabase.from('notes').delete().eq('voyage_id', voyageId)
        if (val.length > 0) await supabase.from('notes').insert(toDbNotes(voyageId, val))
      }, 800)
    }

    // Budget — two-table write: update row first, then replace items
    if (key === 'budget' && voyageId && budgetIdRef.current) {
      clearTimeout(budgetTimer.current)
      budgetTimer.current = setTimeout(async () => {
        const bid = budgetIdRef.current
        await supabase.from('budget').update({ total_budget: val.budget || null }).eq('id', bid)
        await supabase.from('budget_items').delete().eq('budget_id', bid)
        if (val.items?.length > 0) {
          await supabase.from('budget_items').insert(val.items.map(item => ({
            budget_id: bid,
            date:      item.date     || null,
            item:      item.item     || null,
            category:  item.category || null,
            amount:    item.amount   ? parseFloat(item.amount) : null,
          })))
        }
      }, 800)
    }
  }, [voyageId])

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
    <UserCtx.Provider value={session?.user?.id ?? null}>
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
            voyageName={data.voyage.shipName}
            voyageCount={allVoyages.length}
            sectionStatus={sectionStatus}
          />

          {/* ── Section content ─────────────────────────────────────────────
              maxWidth 840 keeps long-form content readable on wide screens.
              Each section receives its slice of data and an onChange handler
              that calls update() to persist the change.                     */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: mainPad }}>
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              {section === 'dashboard' && selectedDay === null && (
                <Feed voyage={data.voyage} itinerary={data.itinerary} dailyLogs={data.dailyLogs} budget={data.budget} packing={data.packing} foodLogs={data.foodLogs} diningLog={data.diningLog} sectionStatus={sectionStatus} onChange={v => update('dailyLogs', v)} onNav={navClick} showToast={showToast} onViewDay={setSelectedDay} />
              )}
              {section === 'dashboard' && selectedDay !== null && (
                <DayDetail dayIndex={selectedDay} log={data.dailyLogs[selectedDay] || {}} itinerary={data.itinerary} onBack={() => setSelectedDay(null)} onEdit={() => { setSelectedDay(null); navClick('daily') }} />
              )}
              {section === 'profile'       && <VoyageProfile voyage={data.voyage} allVoyages={allVoyages} voyageId={voyageId} session={session} onSwitch={switchVoyage} onCreate={createVoyage} onCoverPhotoChange={handleCoverPhotoChange} />}
              {section === 'voyage'        && <VoyageDetails data={data.voyage} onChange={v => update('voyage', v)} />}
              {section === 'itinerary'     && <Itinerary data={data.itinerary} onChange={v => update('itinerary', v)} />}
              {section === 'daily'         && <DailyLog data={data.dailyLogs} onChange={v => update('dailyLogs', v)} itinerary={data.itinerary} voyage={data.voyage} />}
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
              {section === 'userprofile'   && <UserProfile session={session} allVoyages={allVoyages} voyage={data.voyage} onNav={navClick} theme={theme} onThemeChange={switchTheme} />}
            </div>
            </div>
          </main>

        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </WCtx.Provider>
    </UserCtx.Provider>
    </VoyageCtx.Provider>
  )
}
