// ─────────────────────────────────────────────────────────────────────────────
// hooks/useVoyageData.js — Data layer for the active voyage
//
// Owns everything that touches Supabase data:
//   • localStorage seed on mount
//   • voyage list init (or first-time creation)
//   • per-section load effects
//   • debounced write-through update()
//   • voyage switching + creation
//   • cover photo URL sync
//
// App.jsx is left as a pure layout/routing shell — it never touches Supabase
// or localStorage directly for journal data.
//
// API
// ───
//   const {
//     data, loaded, voyageId, allVoyages,
//     update, switchVoyage, createVoyage, handleCoverPhotoChange,
//   } = useVoyageData({ session, showToast })
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
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

// ── Default empty state ───────────────────────────────────────────────────────
// Exported so App.jsx can reference it for the loading guard without
// duplicating the shape definition.
export const INIT = {
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

const VOYAGE_SELECT = 'id, ship_name, cruise_line, departure_date, return_date, total_nights, cover_photo_url'

export function useVoyageData({ session, showToast }) {
  const [data,       setData]       = useState(INIT)
  const [loaded,     setLoaded]     = useState(false)
  const [voyageId,   setVoyageId]   = useState(null)
  const [allVoyages, setAllVoyages] = useState([])

  // Debounce timers — refs so they persist across renders without becoming
  // useCallback dependencies.
  const itineraryTimer     = useRef(null)
  const dailyLogsTimer     = useRef(null)
  const foodLogsTimer      = useRef(null)
  const diningLogTimer     = useRef(null)
  const entertainmentTimer = useRef(null)
  const shoppingTimer      = useRef(null)
  const budgetTimer        = useRef(null)
  const packingTimer       = useRef(null)
  const notesTimer         = useRef(null)

  // Holds the budget row's DB id so the write path never needs an extra SELECT.
  const budgetIdRef = useRef(null)

  // ── Seed from localStorage on mount ─────────────────────────────────────────
  // Gives instant first paint before Supabase responds. Migrates legacy notes
  // format (plain string → array of objects).
  useEffect(() => {
    const result = {}
    for (const [k, fb] of Object.entries(INIT)) result[k] = db.get(`csj-${k}`, fb)
    if (typeof result.notes === 'string') {
      result.notes = result.notes.trim() ? [{ title: '', content: result.notes }] : []
    }
    setData(result)
    setLoaded(true)
  }, [])

  // ── Voyage list init ─────────────────────────────────────────────────────────
  // Loads all voyages for this user. Restores the last-used voyage from
  // localStorage, or falls back to the oldest one. Creates a blank voyage row
  // for brand-new users so all child tables always have a valid voyage_id.
  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function initVoyage() {
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

      // First login — create a blank voyage row.
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

  // ── Load voyage detail ───────────────────────────────────────────────────────
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

      // Budget: fetch items if the row exists, otherwise create it so
      // subsequent writes always have a valid budgetIdRef.current.
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

  // ── Sync error helper ────────────────────────────────────────────────────────
  const syncCheck = useCallback(({ error }) => {
    if (error) showToast('⚠️ Sync error — changes saved locally but not to the cloud.')
  }, [showToast])

  // ── update() — write-through to localStorage + Supabase ─────────────────────
  // Called by every section via its onChange prop. Optimistically updates React
  // state and localStorage, then debounces the Supabase write.
  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)

    // Voyage — immediate, no debounce (one row, small payload)
    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val)).eq('id', voyageId).then(syncCheck)
    }

    // Single-record sections — upsert on every change (tiny payload)
    if (key === 'foodFav' && voyageId) {
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val), { onConflict: 'voyage_id' }).then(syncCheck)
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val), { onConflict: 'voyage_id' }).then(syncCheck)
    }

    // Dynamic arrays — debounced delete-all + re-insert
    if (key === 'itinerary' && voyageId) {
      clearTimeout(itineraryTimer.current)
      itineraryTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('itinerary').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('itinerary').insert(toDbItinerary(voyageId, val)))
      }, 800)
    }
    if (key === 'dailyLogs' && voyageId) {
      clearTimeout(dailyLogsTimer.current)
      dailyLogsTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('daily_logs').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('daily_logs').insert(toDbDailyLogs(voyageId, val)))
      }, 800)
    }
    if (key === 'foodLogs' && voyageId) {
      clearTimeout(foodLogsTimer.current)
      foodLogsTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('food_logs').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('food_logs').insert(toDbFoodLogs(voyageId, val)))
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      clearTimeout(diningLogTimer.current)
      diningLogTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('dining_log').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('dining_log').insert(toDbDiningLog(voyageId, val)))
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      clearTimeout(entertainmentTimer.current)
      entertainmentTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('entertainment_log').insert(toDbEntertainmentLog(voyageId, val)))
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      clearTimeout(shoppingTimer.current)
      shoppingTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('shopping_items').delete().eq('voyage_id', voyageId))
        if (val.items?.length > 0) syncCheck(await supabase.from('shopping_items').insert(toDbShoppingItems(voyageId, val.items)))
      }, 800)
    }
    if (key === 'packing' && voyageId) {
      clearTimeout(packingTimer.current)
      packingTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('packing_items').delete().eq('voyage_id', voyageId))
        const rows = toDbPackingItems(voyageId, val)
        if (rows.length > 0) syncCheck(await supabase.from('packing_items').insert(rows))
      }, 800)
    }
    if (key === 'notes' && voyageId) {
      clearTimeout(notesTimer.current)
      notesTimer.current = setTimeout(async () => {
        syncCheck(await supabase.from('notes').delete().eq('voyage_id', voyageId))
        if (val.length > 0) syncCheck(await supabase.from('notes').insert(toDbNotes(voyageId, val)))
      }, 800)
    }

    // Budget — two-table write
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

  // ── switchVoyage ─────────────────────────────────────────────────────────────
  // Clears section data + localStorage cache, then sets the new voyageId which
  // re-triggers all load effects. App.jsx is responsible for resetting section
  // navigation state (e.g. setSection('dashboard')).
  const switchVoyage = useCallback((newId) => {
    if (newId === voyageId) return
    Object.keys(INIT).forEach(k => db.set(`csj-${k}`, INIT[k]))
    localStorage.setItem('csj-activeVoyageId', newId)
    setData(INIT)
    setVoyageId(newId)
  }, [voyageId])

  // ── createVoyage ─────────────────────────────────────────────────────────────
  // Inserts a new voyage row, appends to allVoyages, and switches to it.
  const createVoyage = useCallback(async (userId, partial = {}) => {
    const { data: created } = await supabase
      .from('voyages')
      .insert({ user_id: userId, ...partial })
      .select(VOYAGE_SELECT)
      .single()

    if (created) {
      setAllVoyages(prev => [...prev, created])
      switchVoyage(created.id)
    }
    return created
  }, [switchVoyage])

  // ── handleCoverPhotoChange ───────────────────────────────────────────────────
  // Called by VoyageProfile after a successful Supabase Storage upload.
  const handleCoverPhotoChange = useCallback((url) => {
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
