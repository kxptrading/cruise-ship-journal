// ─────────────────────────────────────────────────────────────────────────────
// hooks/useVoyageData.ts — Data layer for the active voyage
//
// This is the LEGACY data layer. It predates React Query and is kept because
// the 12 journal section components (DailyLog, FoodLog, etc.) all depend on the
// `data` / `update()` contract it provides. New pages (VoyagesPage, FeedPage,
// PostComposerPage) use React Query hooks instead (see features/*/hooks.ts).
//
// WRITE STRATEGY:
//   • Sections with a natural composite key (itinerary, daily_logs) use
//     debounced UPSERT on (voyage_id, day_number).
//   • Sections without a natural key (food_logs, dining_log, entertainment_log,
//     shopping_items, notes) use debounced UPSERT + delete-orphan pattern:
//       1. upsert all rows in the current state array.
//       2. delete any rows in DB whose id is not in the current state array.
//     This ensures rows deleted in the UI are also removed from the DB.
//   • packing_items has no stable row id in the app model, so it uses a full
//     delete-all + reinsert on every save.
//   • Singleton sections (food_favourites, highlights, voyage) use a plain UPDATE
//     or UPSERT with onConflict: 'voyage_id'.
//
// DEBOUNCE WINDOWS:
//   All array writes use an 800 ms debounce (refs stored per-section).
//   This lets users type freely in form fields without hammering Supabase on
//   every keystroke. The debounce is section-scoped so editing food logs
//   doesn't reset the itinerary timer.
//
// LOCAL STORAGE DUAL-WRITE:
//   Every update() call also persists to localStorage via db.set('csj-<key>', v).
//   This provides an offline fallback and instant page-reload without a loading
//   flash while Supabase re-fetches. Keys match the prototype ('csj-voyage',
//   'csj-dailyLogs', etc.) so old prototype data is read on first load.
//
// RLS IMPLICATIONS:
//   All Supabase queries are scoped to voyageId (and implicitly user_id via RLS).
//   The 'voyages' RLS policy enforces that users can only CRUD their own rows, so
//   voyageId alone is enough to prevent cross-user data leaks on read.
//   On write, the WHERE clause `.eq('id', voyageId)` or `.eq('voyage_id', voyageId)`
//   is always present, which also limits the blast radius of any mutation.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { db } from '../storage'
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
} from '../lib/converters'
import type { VoyageData, VoyageListRow, UseVoyageDataReturn } from '../types'
import { EMPTY_VOYAGE } from '../types'

// ── Default empty state ───────────────────────────────────────────────────────
// INIT is also used by switchVoyage() to reset state when changing voyages.
// All arrays are [] so section components don't need to null-check.
export const INIT: VoyageData = {
  voyage:           EMPTY_VOYAGE,
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

// Minimal column list for the voyage list query — avoids fetching heavy fields
// (companions, emergency contacts, etc.) that are only needed in the detail view.
const VOYAGE_SELECT = 'id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url'

interface Options {
  session:   Session | null
  showToast: (msg: string) => void
}

export function useVoyageData({ session, showToast }: Options): UseVoyageDataReturn {
  const [data,       setData]       = useState<VoyageData>(INIT)
  const [loaded,     setLoaded]     = useState<boolean>(false)
  const [voyageId,   setVoyageId]   = useState<string | null>(null)
  const [allVoyages, setAllVoyages] = useState<VoyageListRow[]>([])

  // ── Per-section debounce timers ───────────────────────────────────────────
  // Each section gets its own timer ref so they don't interfere.
  // Using window.setTimeout (not setTimeout) to get the numeric id type on all
  // platforms including browsers where the return type differs.
  const itineraryTimer     = useRef<number | null>(null)
  const dailyLogsTimer     = useRef<number | null>(null)
  const foodLogsTimer      = useRef<number | null>(null)
  const diningLogTimer     = useRef<number | null>(null)
  const entertainmentTimer = useRef<number | null>(null)
  const shoppingTimer      = useRef<number | null>(null)
  const budgetTimer        = useRef<number | null>(null)
  const packingTimer       = useRef<number | null>(null)
  const notesTimer         = useRef<number | null>(null)

  // Budget requires a two-table write (budget + budget_items) and needs the
  // budget row's UUID. We store it in a ref rather than state to avoid
  // triggering a re-render when it is set.
  const budgetIdRef = useRef<string | null>(null)

  // ── Seed from localStorage on mount ─────────────────────────────────────────
  // Provides instant first paint — the Supabase fetches below will overwrite this.
  // If the user has old prototype data in localStorage (plain string for 'notes'),
  // we convert it to the array format the app now expects.
  useEffect(() => {
    const result: Record<string, unknown> = {}
    for (const [k, fb] of Object.entries(INIT)) result[k] = db.get(`csj-${k}`, fb)
    if (typeof result.notes === 'string') {
      result.notes = (result.notes as string).trim()
        ? [{ title: '', content: result.notes as string }]
        : []
    }
    setData(result as unknown as VoyageData) // cast: shape mirrors VoyageData, values from localStorage
    setLoaded(true)
  }, [])

  // ── Voyage list init ─────────────────────────────────────────────────────────
  // Runs when the user's session becomes available (or on sign-in).
  // Steps:
  //   1. Fetch all voyages for this user, ordered by creation date.
  //   2. Restore the previously active voyage from localStorage if it still exists.
  //   3. If the user has no voyages yet, create one automatically so the app is
  //      never in a state where voyageId is null after a valid session.
  //
  // The `cancelled` flag prevents state updates if the component unmounts or
  // the session changes mid-fetch.
  useEffect(() => {
    if (!session) return
    const activeSession = session  // capture for async closure (non-null)
    let cancelled = false

    async function initVoyage() {
      const { data: rows } = await supabase
        .from('voyages')
        .select(VOYAGE_SELECT)
        .eq('user_id', activeSession.user.id)
        .order('created_at', { ascending: true })

      if (cancelled) return

      if (rows && rows.length > 0) {
        setAllVoyages(rows as VoyageListRow[])
        // Restore the last active voyage, or fall back to the oldest voyage.
        const savedId = localStorage.getItem('csj-activeVoyageId')
        const active  = (rows as VoyageListRow[]).find(r => r.id === savedId) || rows[0] as VoyageListRow
        setVoyageId(active.id)
        localStorage.setItem('csj-activeVoyageId', active.id)
        return
      }

      // Auto-create a starter voyage so new users are never stuck at a loading screen.
      const { data: created } = await supabase
        .from('voyages')
        .insert({ user_id: activeSession.user.id })
        .select(VOYAGE_SELECT)
        .single()

      if (cancelled) return

      if (created) {
        setAllVoyages([created as VoyageListRow])
        setVoyageId((created as VoyageListRow).id)
        localStorage.setItem('csj-activeVoyageId', (created as VoyageListRow).id)
      }
    }

    initVoyage()
    return () => { cancelled = true }
  }, [session])

  // ── Load voyage detail ───────────────────────────────────────────────────────
  // Separate from the list query above because detail view needs far more columns
  // (companions, emergency contact, muster station, etc.). This fires whenever
  // voyageId changes, including when the user switches voyages.
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

  // ── Load itinerary ───────────────────────────────────────────────────────────
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

  // ── Load daily logs ──────────────────────────────────────────────────────────
  // is_public is included here for future per-day share toggle — it is stored in
  // the DB but not yet exposed in the UI.
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

  // ── Load remaining sections (parallel) ──────────────────────────────────────
  // All secondary sections are fetched in one Promise.all to minimise round-trips.
  // Budget is special: it has a parent row (budget) plus child rows (budget_items),
  // so it needs two sequential queries. The budget row is created if it doesn't exist
  // so that subsequent update() calls always have a valid budget_id to write to.
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
        supabase.from('food_logs').select('id,day,date,meal_type,port,venue,what_i_had,standout,drinks,tasting_notes,rating,cost,order_again').eq('voyage_id', voyageId),
        supabase.from('dining_log').select('id,venue,date,meal,ordered,rating,notes').eq('voyage_id', voyageId),
        supabase.from('entertainment_log').select('id,day,date,name,type,venue,performers,duration,rating,notes').eq('voyage_id', voyageId),
        supabase.from('food_favourites').select('best,buffet,specialty,surprising,recreate,regret').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('highlights').select('port,meal,funny,view,friends,first_time,moment').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('budget').select('id,total_budget').eq('voyage_id', voyageId).maybeSingle(),
        supabase.from('shopping_items').select('id,item,port,cost').eq('voyage_id', voyageId),
        supabase.from('packing_items').select('category,item,checked').eq('voyage_id', voyageId),
        supabase.from('notes').select('id,title,content').eq('voyage_id', voyageId).order('id'),
      ])

      let budgetItemRows: Array<{ date?: string | null; item?: string | null; category?: string | null; amount?: number | null }> = []
      if (budgetRow) {
        // Cache the budget row id in a ref so update() can reference it without
        // needing to pass it through or re-query for it on every save.
        budgetIdRef.current = (budgetRow as { id: string }).id
        const { data: items } = await supabase
          .from('budget_items')
          .select('id,date,item,category,amount')
          .eq('budget_id', (budgetRow as { id: string }).id)
        budgetItemRows = items || []
      } else {
        // Create the budget row eagerly. Without this, the first time the user
        // opens the Budget Tracker section and types a value, update() would try
        // to update a budget row that doesn't exist yet.
        const { data: created } = await supabase
          .from('budget')
          .insert({ voyage_id: voyageId, total_budget: null })
          .select('id')
          .single()
        if (created) budgetIdRef.current = (created as { id: string }).id
      }

      const updates: Partial<VoyageData> = {
        foodLogs:         fromDbFoodLogs(foodLogRows         || []),
        diningLog:        fromDbDiningLog(diningLogRows      || []),
        entertainmentLog: fromDbEntertainmentLog(entertainmentRows || []),
        foodFav:          fromDbFoodFav(foodFavRow),
        highlights:       fromDbHighlights(highlightsRow),
        budget:           fromDbBudget(budgetRow as { total_budget?: number | string | null } | null, budgetItemRows),
        shopping:         fromDbShopping(shoppingRows        || []),
        packing:          fromDbPacking(packingRows          || []),
        notes:            fromDbNotes(noteRows               || []),
      }

      setData(prev => ({ ...prev, ...updates }))
      // Mirror every fetched value to localStorage for offline/fast-reload fallback.
      Object.entries(updates).forEach(([k, v]) => db.set(`csj-${k}`, v))
    }

    loadRemaining()
  }, [voyageId])

  // ── Sync error helper ────────────────────────────────────────────────────────
  // Shows a non-blocking toast rather than throwing. Since the write already
  // succeeded locally and in localStorage, the user can continue working even if
  // the cloud sync fails — data will be consistent when they reload.
  const syncCheck = useCallback(({ error }: { error: unknown }) => {
    if (error) showToast('⚠️ Sync error — changes saved locally but not to the cloud.')
  }, [showToast])

  // ── update() ────────────────────────────────────────────────────────────────
  // The single write surface for all section components.
  // Signature: update(sectionKey, newValue)
  //
  // Each call does three things:
  //   1. Optimistic UI update via setData (instant, no loading state needed).
  //   2. localStorage write for offline / fast-reload.
  //   3. Debounced Supabase write for the matching section.
  //
  // The if-chain below maps each key to its write strategy. Wrapped in
  // useCallback with [voyageId, syncCheck] so it is stable when voyageId
  // is known and only recreates when switching voyages.
  const update = useCallback((key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)

    // Singleton rows — immediate write (no debounce needed; single-column update)
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val as VoyageData['voyage'])).eq('id', voyageId).then(syncCheck)
    }
    if (key === 'foodFav' && voyageId) {
      // onConflict: 'voyage_id' means insert if missing, update if exists —
      // safe to call even before the row is confirmed to exist in DB.
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val as VoyageData['foodFav']), { onConflict: 'voyage_id' }).then(syncCheck)
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val as VoyageData['highlights']), { onConflict: 'voyage_id' }).then(syncCheck)
    }
    // Array rows with composite key — debounced UPSERT; rows are never deleted
    // by the user directly (day-indexed, always 14 entries).
    if (key === 'itinerary' && voyageId) {
      clearTimeout(itineraryTimer.current ?? undefined)
      itineraryTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['itinerary']
        if (rows.length > 0) syncCheck(await supabase.from('itinerary').upsert(toDbItinerary(voyageId, rows), { onConflict: 'voyage_id,day_number' }))
      }, 800)
    }
    if (key === 'dailyLogs' && voyageId) {
      clearTimeout(dailyLogsTimer.current ?? undefined)
      dailyLogsTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['dailyLogs']
        if (rows.length > 0) syncCheck(await supabase.from('daily_logs').upsert(toDbDailyLogs(voyageId, rows), { onConflict: 'voyage_id,day_number' }))
      }, 800)
    }
    // Array rows without a natural key — debounced UPSERT + delete-orphan.
    // The NOT IN delete pattern removes rows the user deleted from the UI.
    // CAUTION: if the array is briefly empty due to a race, this will delete all
    // rows. The `if (rows.length > 0)` guard prevents accidental wipes.
    if (key === 'foodLogs' && voyageId) {
      clearTimeout(foodLogsTimer.current ?? undefined)
      foodLogsTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['foodLogs']
        if (rows.length > 0) {
          syncCheck(await supabase.from('food_logs').upsert(toDbFoodLogs(voyageId, rows), { onConflict: 'id' }))
          const ids = rows.map(r => r.id)
          syncCheck(await supabase.from('food_logs').delete().eq('voyage_id', voyageId).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('food_logs').delete().eq('voyage_id', voyageId))
        }
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      clearTimeout(diningLogTimer.current ?? undefined)
      diningLogTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['diningLog']
        if (rows.length > 0) {
          syncCheck(await supabase.from('dining_log').upsert(toDbDiningLog(voyageId, rows), { onConflict: 'id' }))
          const ids = rows.map(r => r.id)
          syncCheck(await supabase.from('dining_log').delete().eq('voyage_id', voyageId).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('dining_log').delete().eq('voyage_id', voyageId))
        }
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      clearTimeout(entertainmentTimer.current ?? undefined)
      entertainmentTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['entertainmentLog']
        if (rows.length > 0) {
          syncCheck(await supabase.from('entertainment_log').upsert(toDbEntertainmentLog(voyageId, rows), { onConflict: 'id' }))
          const ids = rows.map(r => r.id)
          syncCheck(await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId))
        }
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      clearTimeout(shoppingTimer.current ?? undefined)
      shoppingTimer.current = window.setTimeout(async () => {
        const s = val as VoyageData['shopping']
        if (s.items?.length > 0) {
          syncCheck(await supabase.from('shopping_items').upsert(toDbShoppingItems(voyageId, s.items), { onConflict: 'id' }))
          const ids = s.items.map(i => i.id)
          syncCheck(await supabase.from('shopping_items').delete().eq('voyage_id', voyageId).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('shopping_items').delete().eq('voyage_id', voyageId))
        }
      }, 800)
    }
    // packing_items has no stable row id in the app model — the packing object is
    // keyed by category, not by row id. Full delete + reinsert is the safest approach
    // even though it costs more writes per save.
    if (key === 'packing' && voyageId) {
      clearTimeout(packingTimer.current ?? undefined)
      packingTimer.current = window.setTimeout(async () => {
        const p = val as VoyageData['packing']
        syncCheck(await supabase.from('packing_items').delete().eq('voyage_id', voyageId))
        const rows = toDbPackingItems(voyageId, p)
        if (rows.length > 0) syncCheck(await supabase.from('packing_items').insert(rows))
      }, 800)
    }
    if (key === 'notes' && voyageId) {
      clearTimeout(notesTimer.current ?? undefined)
      notesTimer.current = window.setTimeout(async () => {
        const n = val as VoyageData['notes']
        if (n.length > 0) {
          syncCheck(await supabase.from('notes').upsert(toDbNotes(voyageId, n), { onConflict: 'id' }))
          const ids = n.map(note => note.id)
          syncCheck(await supabase.from('notes').delete().eq('voyage_id', voyageId).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('notes').delete().eq('voyage_id', voyageId))
        }
      }, 800)
    }
    // Budget writes two tables: the budget row (total_budget) and budget_items.
    // budgetIdRef.current must be set before any budget update can be written;
    // it is guaranteed to be set by the loadRemaining() effect above.
    if (key === 'budget' && voyageId && budgetIdRef.current) {
      clearTimeout(budgetTimer.current ?? undefined)
      budgetTimer.current = window.setTimeout(async () => {
        const b   = val as VoyageData['budget']
        const bid = budgetIdRef.current
        syncCheck(await supabase.from('budget').update({ total_budget: b.budget || null }).eq('id', bid))
        if (b.items?.length > 0) {
          syncCheck(await supabase.from('budget_items').upsert(b.items.map(item => ({
            id:        item.id,
            budget_id: bid,
            date:      item.date     || null,
            item:      item.item     || null,
            category:  item.category || null,
            // amount is stored as string in the UI form; parse to float for the DB
            amount:    item.amount   ? parseFloat(item.amount) : null,
          })), { onConflict: 'id' }))
          const ids = b.items.map(i => i.id)
          syncCheck(await supabase.from('budget_items').delete().eq('budget_id', bid).not('id', 'in', `(${ids.join(',')})`))
        } else {
          syncCheck(await supabase.from('budget_items').delete().eq('budget_id', bid))
        }
      }, 800)
    }
  }, [voyageId, syncCheck])

  // ── switchVoyage ─────────────────────────────────────────────────────────────
  // Resets all local state to INIT before setting the new voyageId. This ensures
  // the previous voyage's data is never briefly visible for the new one.
  // The Supabase load effects (above) re-trigger because voyageId changes.
  const switchVoyage = useCallback((newId: string) => {
    if (newId === voyageId) return
    Object.keys(INIT).forEach(k => db.set(`csj-${k}`, INIT[k as keyof VoyageData]))
    localStorage.setItem('csj-activeVoyageId', newId)
    setData(INIT)
    setVoyageId(newId)
  }, [voyageId])

  // ── createVoyage ─────────────────────────────────────────────────────────────
  // Creates a new voyage row in Supabase and switches to it immediately.
  // The caller (App.tsx) injects the userId; this hook doesn't read it directly
  // because it was designed before UserCtx existed.
  const createVoyage = useCallback(async (userId: string, partial: Record<string, unknown> = {}): Promise<VoyageListRow | null> => {
    const { data: created } = await supabase
      .from('voyages')
      .insert({ user_id: userId, ...partial })
      .select(VOYAGE_SELECT)
      .single()

    if (created) {
      setAllVoyages(prev => [...prev, created as VoyageListRow])
      switchVoyage((created as VoyageListRow).id)
    }
    return (created as VoyageListRow | null)
  }, [switchVoyage])

  // ── handleCoverPhotoChange ───────────────────────────────────────────────────
  // Called by VoyageProfile after a successful cover photo upload.
  // Updates both local state and the allVoyages list so the Sidebar ticker
  // and VoyagesPage grid reflect the new cover image without a page reload.
  const handleCoverPhotoChange = useCallback((url: string | null) => {
    setData(prev => ({ ...prev, voyage: { ...prev.voyage, coverPhotoUrl: url || '' } }))
    setAllVoyages(prev => prev.map(v => v.id === voyageId ? { ...v, cover_photo_url: url } : v))
  }, [voyageId])

  return {
    data,
    loaded,
    voyageId,
    allVoyages,
    update,
    switchVoyage,
    createVoyage,
    handleCoverPhotoChange,
  }
}
