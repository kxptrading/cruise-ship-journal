// ─────────────────────────────────────────────────────────────────────────────
// hooks/useVoyageData.ts — Data layer for the active voyage
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

  const itineraryTimer     = useRef<number | null>(null)
  const dailyLogsTimer     = useRef<number | null>(null)
  const foodLogsTimer      = useRef<number | null>(null)
  const diningLogTimer     = useRef<number | null>(null)
  const entertainmentTimer = useRef<number | null>(null)
  const shoppingTimer      = useRef<number | null>(null)
  const budgetTimer        = useRef<number | null>(null)
  const packingTimer       = useRef<number | null>(null)
  const notesTimer         = useRef<number | null>(null)

  const budgetIdRef = useRef<string | null>(null)

  // ── Seed from localStorage on mount ─────────────────────────────────────────
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
        const savedId = localStorage.getItem('csj-activeVoyageId')
        const active  = (rows as VoyageListRow[]).find(r => r.id === savedId) || rows[0] as VoyageListRow
        setVoyageId(active.id)
        localStorage.setItem('csj-activeVoyageId', active.id)
        return
      }

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

      let budgetItemRows: Array<{ date?: string | null; item?: string | null; category?: string | null; amount?: number | null }> = []
      if (budgetRow) {
        budgetIdRef.current = (budgetRow as { id: string }).id
        const { data: items } = await supabase
          .from('budget_items')
          .select('date,item,category,amount')
          .eq('budget_id', (budgetRow as { id: string }).id)
        budgetItemRows = items || []
      } else {
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
      Object.entries(updates).forEach(([k, v]) => db.set(`csj-${k}`, v))
    }

    loadRemaining()
  }, [voyageId])

  // ── Sync error helper ────────────────────────────────────────────────────────
  const syncCheck = useCallback(({ error }: { error: unknown }) => {
    if (error) showToast('⚠️ Sync error — changes saved locally but not to the cloud.')
  }, [showToast])

  // ── update() ────────────────────────────────────────────────────────────────
  const update = useCallback((key: keyof VoyageData, val: VoyageData[keyof VoyageData]) => {
    setData(prev => ({ ...prev, [key]: val }))
    db.set(`csj-${key}`, val)

    if (key === 'voyage' && voyageId) {
      supabase.from('voyages').update(toDbVoyage(val as VoyageData['voyage'])).eq('id', voyageId).then(syncCheck)
    }
    if (key === 'foodFav' && voyageId) {
      supabase.from('food_favourites').upsert(toDbFoodFav(voyageId, val as VoyageData['foodFav']), { onConflict: 'voyage_id' }).then(syncCheck)
    }
    if (key === 'highlights' && voyageId) {
      supabase.from('highlights').upsert(toDbHighlights(voyageId, val as VoyageData['highlights']), { onConflict: 'voyage_id' }).then(syncCheck)
    }
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
    if (key === 'foodLogs' && voyageId) {
      clearTimeout(foodLogsTimer.current ?? undefined)
      foodLogsTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['foodLogs']
        syncCheck(await supabase.from('food_logs').delete().eq('voyage_id', voyageId))
        if (rows.length > 0) syncCheck(await supabase.from('food_logs').insert(toDbFoodLogs(voyageId, rows)))
      }, 800)
    }
    if (key === 'diningLog' && voyageId) {
      clearTimeout(diningLogTimer.current ?? undefined)
      diningLogTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['diningLog']
        syncCheck(await supabase.from('dining_log').delete().eq('voyage_id', voyageId))
        if (rows.length > 0) syncCheck(await supabase.from('dining_log').insert(toDbDiningLog(voyageId, rows)))
      }, 800)
    }
    if (key === 'entertainmentLog' && voyageId) {
      clearTimeout(entertainmentTimer.current ?? undefined)
      entertainmentTimer.current = window.setTimeout(async () => {
        const rows = val as VoyageData['entertainmentLog']
        syncCheck(await supabase.from('entertainment_log').delete().eq('voyage_id', voyageId))
        if (rows.length > 0) syncCheck(await supabase.from('entertainment_log').insert(toDbEntertainmentLog(voyageId, rows)))
      }, 800)
    }
    if (key === 'shopping' && voyageId) {
      clearTimeout(shoppingTimer.current ?? undefined)
      shoppingTimer.current = window.setTimeout(async () => {
        const s = val as VoyageData['shopping']
        syncCheck(await supabase.from('shopping_items').delete().eq('voyage_id', voyageId))
        if (s.items?.length > 0) syncCheck(await supabase.from('shopping_items').insert(toDbShoppingItems(voyageId, s.items)))
      }, 800)
    }
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
        syncCheck(await supabase.from('notes').delete().eq('voyage_id', voyageId))
        if (n.length > 0) syncCheck(await supabase.from('notes').insert(toDbNotes(voyageId, n)))
      }, 800)
    }
    if (key === 'budget' && voyageId && budgetIdRef.current) {
      clearTimeout(budgetTimer.current ?? undefined)
      budgetTimer.current = window.setTimeout(async () => {
        const b   = val as VoyageData['budget']
        const bid = budgetIdRef.current
        syncCheck(await supabase.from('budget').update({ total_budget: b.budget || null }).eq('id', bid))
        syncCheck(await supabase.from('budget_items').delete().eq('budget_id', bid))
        if (b.items?.length > 0) {
          syncCheck(await supabase.from('budget_items').insert(b.items.map(item => ({
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
  const switchVoyage = useCallback((newId: string) => {
    if (newId === voyageId) return
    Object.keys(INIT).forEach(k => db.set(`csj-${k}`, INIT[k as keyof VoyageData]))
    localStorage.setItem('csj-activeVoyageId', newId)
    setData(INIT)
    setVoyageId(newId)
  }, [voyageId])

  // ── createVoyage ─────────────────────────────────────────────────────────────
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
