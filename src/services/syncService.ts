// ─────────────────────────────────────────────────────────────────────────────
// services/syncService.ts — Process the offline sync queue
//
// processSyncQueue() is called:
//   • when the app regains network connectivity (useOnlineStatus event)
//   • when the app first mounts with an active session
//   • when the user taps "Sync now" in the SyncStatusPill
//
// Each queue item represents a full section snapshot (entityType + payload).
// We replay the same Supabase write pattern that useVoyageData uses.
//
// Conflict strategy: prefer the latest updatedAt timestamp.
//   - If the server row's updated_at is newer than the queue item's updatedAt,
//     we skip the push to avoid overwriting fresh server data with stale local data.
//   - If the local is newer (or the server has no row), we push.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase'
import { getActiveQueue, markSyncing, markSynced, markFailed, markDeadLetter, entityKey } from '../db/syncQueue'
import { migrateQueuePayload } from '../db/payloadMigrations'
import { isOnline } from '../hooks/useOnlineStatus'
import {
  toDbVoyage,
  toDbItinerary,
  toDbDailyLogs,
  toDbFoodLogs,
  toDbDiningLog,
  toDbEntertainmentLog,
  toDbFoodFav,
  toDbHighlights,
  toDbShoppingItems,
  toDbPackingItems,
  toDbNotes,
} from '../lib/converters'
import type {
  VoyageData,
} from '../types'
import type { SyncQueueItem } from '../db/localDb'

// Prevent concurrent queue runs (e.g. rapid reconnect events).
let running = false

export async function processSyncQueue(): Promise<void> {
  if (running || !isOnline()) return
  running = true

  try {
    // Only live items — dead-lettered ones are excluded so a permanently
    // failing payload can't be re-walked on every pass.
    const queue = await getActiveQueue()
    if (queue.length === 0) return

    // Process items sequentially to avoid Supabase rate limits.
    for (const item of queue) {
      await processItem(item)
    }
  } finally {
    running = false
  }
}

async function processItem(item: SyncQueueItem): Promise<void> {
  // Belt-and-suspenders: getActiveQueue already filters these out.
  if (item.dead) return

  // Migrate the payload from the version it was queued at up to current before
  // writing. If it can't be migrated (e.g. queued by a newer client, or a needed
  // step is missing), dead-letter it immediately — replaying a stale shape through
  // the current converters would risk a bad write.
  const migrated = migrateQueuePayload(item.entityType, item.schemaVersion, item.payload)
  if (!migrated.ok) {
    await markDeadLetter(item.id, item.entityId, 'unmigratable payload: ' + migrated.reason)
    return
  }

  await markSyncing(item.id)

  try {
    await writeToSupabase({ ...item, payload: migrated.payload })
    await markSynced(item.id, item.entityId)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markFailed(item.id, item.entityId, message)
  }
}

// ── Per-entity Supabase write handlers ────────────────────────────────────────
// These mirror the write patterns in useVoyageData exactly.

async function writeToSupabase(item: SyncQueueItem): Promise<void> {
  const { entityType, cruiseId, payload } = item
  const del = item.deletedIds  // rows the user removed offline → delete exactly these

  switch (entityType) {
    case 'voyage':       return writeVoyage(cruiseId, payload as VoyageData['voyage'])
    case 'itinerary':    return writeItinerary(cruiseId, payload as VoyageData['itinerary'])
    case 'dailyLogs':    return writeDailyLogs(cruiseId, payload as VoyageData['dailyLogs'])
    case 'foodLogs':     return writeFoodLogs(cruiseId, payload as VoyageData['foodLogs'], del)
    case 'diningLog':    return writeDiningLog(cruiseId, payload as VoyageData['diningLog'], del)
    case 'entertainmentLog': return writeEntertainmentLog(cruiseId, payload as VoyageData['entertainmentLog'], del)
    case 'foodFav':      return writeFoodFav(cruiseId, payload as VoyageData['foodFav'])
    case 'highlights':   return writeHighlights(cruiseId, payload as VoyageData['highlights'])
    case 'budget':       return writeBudget(cruiseId, payload as VoyageData['budget'], item.budgetId, del)
    case 'shopping':     return writeShopping(cruiseId, payload as VoyageData['shopping'], del)
    case 'packing':      return writePacking(cruiseId, payload as VoyageData['packing'])
    case 'notes':        return writeNotes(cruiseId, payload as VoyageData['notes'], del)
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

// Delete exactly the rows the user removed (by id), scoped to a column. Non-
// destructive: rows a co-author added (never in our deletedIds) are untouched.
async function deleteByIds(table: string, scopeCol: string, scopeVal: string, ids?: string[]) {
  if (!ids?.length) return
  check(await supabase.from(table).delete().eq(scopeCol, scopeVal).in('id', ids))
}

function check({ error }: { error: unknown }) {
  if (error) throw error
}

async function writeVoyage(voyageId: string, val: VoyageData['voyage']) {
  check(await supabase.from('voyages').update(toDbVoyage(val)).eq('id', voyageId))
}

async function writeItinerary(voyageId: string, val: VoyageData['itinerary']) {
  if (val.length > 0) {
    check(await supabase.from('itinerary').upsert(
      toDbItinerary(voyageId, val),
      { onConflict: 'voyage_id,day_number' },
    ))
  }
}

async function writeDailyLogs(voyageId: string, val: VoyageData['dailyLogs']) {
  if (val.length > 0) {
    check(await supabase.from('daily_logs').upsert(
      toDbDailyLogs(voyageId, val),
      { onConflict: 'voyage_id,day_number' },
    ))
  }
}

async function writeFoodLogs(voyageId: string, val: VoyageData['foodLogs'], deletedIds?: string[]) {
  if (val.length > 0) check(await supabase.from('food_logs').upsert(toDbFoodLogs(voyageId, val), { onConflict: 'id' }))
  await deleteByIds('food_logs', 'voyage_id', voyageId, deletedIds)
}

async function writeDiningLog(voyageId: string, val: VoyageData['diningLog'], deletedIds?: string[]) {
  if (val.length > 0) check(await supabase.from('dining_log').upsert(toDbDiningLog(voyageId, val), { onConflict: 'id' }))
  await deleteByIds('dining_log', 'voyage_id', voyageId, deletedIds)
}

async function writeEntertainmentLog(voyageId: string, val: VoyageData['entertainmentLog'], deletedIds?: string[]) {
  if (val.length > 0) check(await supabase.from('entertainment_log').upsert(toDbEntertainmentLog(voyageId, val), { onConflict: 'id' }))
  await deleteByIds('entertainment_log', 'voyage_id', voyageId, deletedIds)
}

async function writeFoodFav(voyageId: string, val: VoyageData['foodFav']) {
  check(await supabase.from('food_favourites').upsert(
    toDbFoodFav(voyageId, val),
    { onConflict: 'voyage_id' },
  ))
}

async function writeHighlights(voyageId: string, val: VoyageData['highlights']) {
  check(await supabase.from('highlights').upsert(
    toDbHighlights(voyageId, val),
    { onConflict: 'voyage_id' },
  ))
}

async function writeBudget(
  voyageId: string,
  val:      VoyageData['budget'],
  budgetId: string | undefined,
  deletedIds?: string[],
) {
  if (!budgetId) {
    // budgetId missing means the budget row hasn't been created yet — skip
    // and let useVoyageData handle it next time the section loads.
    throw new Error('budget row id missing; will retry after voyage loads')
  }
  check(await supabase.from('budget').update({ total_budget: val.budget || null }).eq('id', budgetId))
  if (val.items?.length > 0) {
    check(await supabase.from('budget_items').upsert(
      val.items.map(item => ({
        id:        item.id,
        budget_id: budgetId,
        date:      item.date     || null,
        item:      item.item     || null,
        category:  item.category || null,
        amount:    item.amount   ? parseFloat(item.amount as string) : null,
      })),
      { onConflict: 'id' },
    ))
  }
  await deleteByIds('budget_items', 'budget_id', budgetId, deletedIds)
}

async function writeShopping(voyageId: string, val: VoyageData['shopping'], deletedIds?: string[]) {
  if (val.items?.length > 0) check(await supabase.from('shopping_items').upsert(toDbShoppingItems(voyageId, val.items), { onConflict: 'id' }))
  await deleteByIds('shopping_items', 'voyage_id', voyageId, deletedIds)
}

// Packing is additive on replay: upsert the checked items (keyed on
// voyage_id,category,item). Offline un-checks are reconciled by the online path in
// useVoyageData (which has the previous state to diff); they don't propagate via
// the queue. This keeps replay non-destructive — a co-author's checks are never wiped.
async function writePacking(voyageId: string, val: VoyageData['packing']) {
  const rows = toDbPackingItems(voyageId, val)
  if (rows.length > 0) check(await supabase.from('packing_items').upsert(rows, { onConflict: 'voyage_id,category,item' }))
}

async function writeNotes(voyageId: string, val: VoyageData['notes'], deletedIds?: string[]) {
  if (val.length > 0) {
    check(await supabase.from('notes').upsert(toDbNotes(voyageId, val), { onConflict: 'id' }))
  }
  await deleteByIds('notes', 'voyage_id', voyageId, deletedIds)
}

// Re-export so App.tsx can call without importing syncQueue directly.
export { retryFailed } from '../db/syncQueue'
export { entityKey }
