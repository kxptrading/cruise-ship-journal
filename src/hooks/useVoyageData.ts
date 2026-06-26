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
// LOCAL STORAGE DUAL-WRITE (PER VOYAGE):
//   Every update() persists to localStorage under a voyage-namespaced key
//   (vkey: `csj-v-<voyageId>-<section>`), so each voyage keeps its own journal and
//   nothing bleeds across voyages — including offline, where switching voyages
//   rehydrates from that voyage's own keys. IndexedDB (localDb.entries, keyed
//   entityType::cruiseId) is the durable per-voyage store + sync-queue source.
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
import { localDb } from '../db/localDb'
import { enqueue } from '../db/syncQueue'
import { removedRowIds } from '../db/rowDiff'
import { fetchSharedVoyageIds } from '../features/voyages/coauthors'
import type { EntityType } from '../db/localDb'
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

// Local fast-cache key, namespaced per voyage so each voyage keeps its own journal
// (no cross-voyage bleed offline). The durable per-voyage store is IndexedDB
// (localDb.entries, keyed entityType::cruiseId); this is just the synchronous paint cache.
const vkey = (voyageId: string, section: string) => `csj-v-${voyageId}-${section}`

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

  // Latest data, mirrored into a ref so update() can diff the previous rows of a
  // section against the new value without making update() depend on `data`.
  const dataRef = useRef<VoyageData>(data)
  useEffect(() => { dataRef.current = data }, [data])

  // Row ids the user has removed from each section since the last flush. We delete
  // exactly these (never "everything not in my snapshot"), so a co-author's rows
  // are never wiped. Accumulated across debounced edits; drained when the section's
  // write fires. Keyed by section; packing uses `category item` composite keys.
  const pendingDeletes = useRef<Record<string, Set<string>>>({})
  const accumulateDeletes = (key: string, removed: string[], surviving: string[]) => {
    const set = (pendingDeletes.current[key] ??= new Set())
    removed.forEach(id => set.add(id))
    surviving.forEach(id => set.delete(id)) // a re-added row cancels its pending delete
  }
  const drainDeletes = (key: string): string[] => {
    const set = pendingDeletes.current[key]
    if (!set || set.size === 0) return []
    pendingDeletes.current[key] = new Set()
    return [...set]
  }

  // ── Mark loaded on mount ────────────────────────────────────────────────────
  // Section data is seeded PER VOYAGE once voyageId is known (effect below), not
  // from global keys — so one voyage's cache never paints into another.
  useEffect(() => { setLoaded(true) }, [])

  // ── Per-voyage local seed ────────────────────────────────────────────────────
  // Synchronous instant paint from this voyage's own cached keys; the Supabase
  // load effects overwrite when online. Offline, each voyage shows its own data.
  useEffect(() => {
    if (!voyageId) return
    const seeded: Record<string, unknown> = {}
    for (const [k, fb] of Object.entries(INIT)) seeded[k] = db.get(vkey(voyageId, k), fb)
    setData(seeded as unknown as VoyageData)
  }, [voyageId])

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
      // Owned voyages + voyages shared with me as an accepted co-author, so the
      // voyage switcher can open a shared voyage. Reads are open at the RLS layer.
      const sharedIds = await fetchSharedVoyageIds(activeSession.user.id)
      const [ownedRes, sharedRes] = await Promise.all([
        supabase.from('voyages').select(VOYAGE_SELECT).eq('user_id', activeSession.user.id),
        sharedIds.length
          ? supabase.from('voyages').select(VOYAGE_SELECT).in('id', sharedIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (cancelled) return

      const rows = [...(ownedRes.data ?? []), ...(sharedRes.data ?? [])]

      if (rows.length > 0) {
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
      .select('ship_name, cruise_line, cabin, deck, departure_date, return_date, departure_port, total_nights, companion_1, companion_2, companion_3, companion_4, emergency_contact, phone, guest_services, muster_station, dining_time, cover_photo_url, destination, cruise_description')
      .eq('id', voyageId)
      .single()
      .then(({ data: row }) => {
        if (!row) return
        const voyage = fromDbVoyage(row)
        setData(prev => ({ ...prev, voyage }))
        db.set(vkey(voyageId, 'voyage'), voyage)
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
        db.set(vkey(voyageId, 'itinerary'), itinerary)
      })
  }, [voyageId])

  // ── Load daily logs ──────────────────────────────────────────────────────────
  // is_public is included here for future per-day share toggle — it is stored in
  // the DB but not yet exposed in the UI.
  useEffect(() => {
    if (!voyageId) return
    supabase
      .from('daily_logs')
      .select('day_number, date, port, weather, highlights, breakfast, lunch, dinner, drink, activity, duration, exc_cost, exc_notes, entertainment, best_moment, rating, is_public, canvas')
      .eq('voyage_id', voyageId)
      .then(({ data: rows }) => {
        if (!rows) return
        const dailyLogs = fromDbDailyLogs(rows)
        setData(prev => ({ ...prev, dailyLogs }))
        db.set(vkey(voyageId, 'dailyLogs'), dailyLogs)
      })
  }, [voyageId])

  // ── Load remaining sections (parallel) ──────────────────────────────────────
  // All secondary sections are fetched in one Promise.all to minimise round-trips.
  // Budget is special: it has a parent row (budget) plus child rows (budget_items),
  // so it needs two sequential queries. The budget row is created if it doesn't exist
  // so that subsequent update() calls always have a valid budget_id to write to.
  useEffect(() => {
    if (!voyageId) return
    const vid = voyageId  // non-null capture for the async closure below

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
        supabase.from('notes').select('id,title,content,x_pct,y,color,photo_path').eq('voyage_id', voyageId).order('id'),
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
      Object.entries(updates).forEach(([k, v]) => db.set(vkey(vid, k), v))
    }

    loadRemaining()
  }, [voyageId])

  // ── IndexedDB persistence helper ─────────────────────────────────────────────
  // Fire-and-forget write to IndexedDB after every update(). Errors are ignored
  // because localStorage already holds the data — IndexedDB is additive.
  const persistLocal = useCallback((key: string, cId: string, data: unknown) => {
    const entityType = key as EntityType
    const id = `${entityType}::${cId}`
    const now = new Date().toISOString()
    localDb.entries.put({
      id,
      entityType,
      cruiseId:   cId,
      data,
      syncStatus: 'pending',
      createdAt:  now,
      updatedAt:  now,
      deleted:    false,
    }).catch(() => { /* non-critical */ })
  }, [])

  // ── Sync error helper ────────────────────────────────────────────────────────
  // Shows a toast and enqueues the section for background retry.
  // The data is already safe in localStorage + IndexedDB so the user can keep
  // writing regardless of network state.
  const syncCheck = useCallback((
    { error }: { error: unknown },
    key?: string,
    val?: unknown,
    opts?: { budgetId?: string; deletedIds?: string[] },
  ) => {
    if (!error) return
    showToast('Saved to device — will sync when you reconnect.')
    if (key && voyageId) {
      enqueue(key as EntityType, 'UPDATE', voyageId, val, opts).catch(() => {})
    }
  }, [showToast, voyageId])

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
    // Per-voyage caches only — guard against a null voyageId.
    if (voyageId) {
      db.set(vkey(voyageId, key), val)
      // Write to IndexedDB so data survives when Supabase is unreachable.
      persistLocal(key, voyageId, val)
    }

    // Singleton rows — immediate write (no debounce needed; single-column update)
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val as VoyageData['voyage'])).eq('id', voyageId)
        .then(r => syncCheck(r, 'voyage', val))
    }
    if (key === 'foodFav' && voyageId) {
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val as VoyageData['foodFav']), { onConflict: 'voyage_id' })
        .then(r => syncCheck(r, 'foodFav', val))
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val as VoyageData['highlights']), { onConflict: 'voyage_id' })
        .then(r => syncCheck(r, 'highlights', val))
    }
    // Array rows with composite key — debounced UPSERT
    if (key === 'itinerary' && voyageId) {
      clearTimeout(itineraryTimer.current ?? undefined)
      itineraryTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['itinerary']
        if (rows.length > 0) syncCheck(await supabase.from('itinerary').upsert(toDbItinerary(voyageId, rows), { onConflict: 'voyage_id,day_number' }), 'itinerary', val)
      }, 800)
    }
    if (key === 'dailyLogs' && voyageId) {
      clearTimeout(dailyLogsTimer.current ?? undefined)
      dailyLogsTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['dailyLogs']
        if (rows.length > 0) syncCheck(await supabase.from('daily_logs').upsert(toDbDailyLogs(voyageId, rows), { onConflict: 'voyage_id,day_number' }), 'dailyLogs', val)
      }, 800)
    }
    // Array rows without a natural key — debounced UPSERT + delete-orphan.
    if (key === 'foodLogs' && voyageId) {
      const rows = val as VoyageData['foodLogs']
      accumulateDeletes('foodLogs', removedRowIds(dataRef.current.foodLogs, rows), rows.map(r => r.id))
      clearTimeout(foodLogsTimer.current ?? undefined)
      foodLogsTimer.current = window.setTimeout(async () => {
        const del = drainDeletes('foodLogs')
        if (rows.length > 0) syncCheck(await supabase.from('food_logs').upsert(toDbFoodLogs(voyageId, rows), { onConflict: 'id' }), 'foodLogs', val, { deletedIds: del })
        if (del.length > 0)  syncCheck(await supabase.from('food_logs').delete().eq('voyage_id', voyageId).in('id', del), 'foodLogs', val, { deletedIds: del })
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      const rows = val as VoyageData['diningLog']
      accumulateDeletes('diningLog', removedRowIds(dataRef.current.diningLog, rows), rows.map(r => r.id))
      clearTimeout(diningLogTimer.current ?? undefined)
      diningLogTimer.current = window.setTimeout(async () => {
        const del = drainDeletes('diningLog')
        if (rows.length > 0) syncCheck(await supabase.from('dining_log').upsert(toDbDiningLog(voyageId, rows), { onConflict: 'id' }), 'diningLog', val, { deletedIds: del })
        if (del.length > 0)  syncCheck(await supabase.from('dining_log').delete().eq('voyage_id', voyageId).in('id', del), 'diningLog', val, { deletedIds: del })
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      const rows = val as VoyageData['entertainmentLog']
      accumulateDeletes('entertainmentLog', removedRowIds(dataRef.current.entertainmentLog, rows), rows.map(r => r.id))
      clearTimeout(entertainmentTimer.current ?? undefined)
      entertainmentTimer.current = window.setTimeout(async () => {
        const del = drainDeletes('entertainmentLog')
        if (rows.length > 0) syncCheck(await supabase.from('entertainment_log').upsert(toDbEntertainmentLog(voyageId, rows), { onConflict: 'id' }), 'entertainmentLog', val, { deletedIds: del })
        if (del.length > 0)  syncCheck(await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId).in('id', del), 'entertainmentLog', val, { deletedIds: del })
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      const s = val as VoyageData['shopping']
      accumulateDeletes('shopping', removedRowIds(dataRef.current.shopping.items, s.items ?? []), (s.items ?? []).map(i => i.id))
      clearTimeout(shoppingTimer.current ?? undefined)
      shoppingTimer.current = window.setTimeout(async () => {
        const del = drainDeletes('shopping')
        if (s.items?.length > 0) syncCheck(await supabase.from('shopping_items').upsert(toDbShoppingItems(voyageId, s.items), { onConflict: 'id' }), 'shopping', val, { deletedIds: del })
        if (del.length > 0)      syncCheck(await supabase.from('shopping_items').delete().eq('voyage_id', voyageId).in('id', del), 'shopping', val, { deletedIds: del })
      }, 800)
    }
    if (key === 'packing' && voyageId) {
      // packing has no row ids — its "rows" are (category,item) pairs. Diff the
      // previous vs new checked set to find un-checked pairs and delete exactly
      // those; never wipe the whole section (a co-author's checks would be lost).
      const p    = val as VoyageData['packing']
      const prev = dataRef.current.packing
      const pairKeys = (obj: VoyageData['packing']) => Object.entries(obj).flatMap(([c, items]) => items.map(i => `${c} ${i}`))
      const unchecked = pairKeys(prev).filter(k => !new Set(pairKeys(p)).has(k))
      clearTimeout(packingTimer.current ?? undefined)
      packingTimer.current = window.setTimeout(async () => {
        const rows = toDbPackingItems(voyageId, p)
        if (rows.length > 0) syncCheck(await supabase.from('packing_items').upsert(rows, { onConflict: 'voyage_id,category,item' }), 'packing', val)
        for (const k of unchecked) {
          const [cat, item] = k.split(' ')
          await supabase.from('packing_items').delete().eq('voyage_id', voyageId).eq('category', cat).eq('item', item)
        }
      }, 800)
    }
    if (key === 'notes' && voyageId) {
      const n = val as VoyageData['notes']
      accumulateDeletes('notes', removedRowIds(dataRef.current.notes, n), n.map(note => note.id))
      clearTimeout(notesTimer.current ?? undefined)
      notesTimer.current = window.setTimeout(async () => {
        const del = drainDeletes('notes')
        if (n.length > 0) syncCheck(await supabase.from('notes').upsert(toDbNotes(voyageId, n), { onConflict: 'id' }), 'notes', val, { deletedIds: del })
        if (del.length > 0) syncCheck(await supabase.from('notes').delete().eq('voyage_id', voyageId).in('id', del), 'notes', val, { deletedIds: del })
      }, 800)
    }
    if (key === 'budget' && voyageId && budgetIdRef.current) {
      const b = val as VoyageData['budget']
      accumulateDeletes('budget', removedRowIds(dataRef.current.budget.items, b.items ?? []), (b.items ?? []).map(i => i.id))
      clearTimeout(budgetTimer.current ?? undefined)
      budgetTimer.current = window.setTimeout(async () => {
        const bid = budgetIdRef.current
        const del = drainDeletes('budget')
        const opts = { budgetId: bid ?? undefined, deletedIds: del }
        syncCheck(await supabase.from('budget').update({ total_budget: b.budget || null }).eq('id', bid), 'budget', val, opts)
        if (b.items?.length > 0) {
          syncCheck(await supabase.from('budget_items').upsert(b.items.map(item => ({
            id:        item.id,
            budget_id: bid,
            date:      item.date     || null,
            item:      item.item     || null,
            category:  item.category || null,
            amount:    item.amount   ? parseFloat(item.amount) : null,
          })), { onConflict: 'id' }), 'budget', val, opts)
        }
        if (del.length > 0) syncCheck(await supabase.from('budget_items').delete().eq('budget_id', bid).in('id', del), 'budget', val, opts)
      }, 800)
    }
  }, [voyageId, syncCheck, persistLocal])

  // ── switchVoyage ─────────────────────────────────────────────────────────────
  // Resets all local state to INIT before setting the new voyageId. This ensures
  // the previous voyage's data is never briefly visible for the new one.
  // The Supabase load effects (above) re-trigger because voyageId changes.
  const switchVoyage = useCallback((newId: string) => {
    if (newId === voyageId) return
    localStorage.setItem('csj-activeVoyageId', newId)
    setData(INIT)        // clear; the per-voyage seed effect repopulates from newId's cache
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
