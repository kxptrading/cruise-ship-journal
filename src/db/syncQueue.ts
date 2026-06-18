// ─────────────────────────────────────────────────────────────────────────────
// db/syncQueue.ts — CRUD helpers for the offline sync queue
//
// All queue writes are fire-and-forget from the UI layer. Errors are swallowed
// because a failed queue write is non-critical (the data is still in
// localStorage and IndexedDB entries; a manual sync will re-queue it).
// ─────────────────────────────────────────────────────────────────────────────

import { localDb, type EntityType, type SyncOperation, type SyncQueueItem } from './localDb'
import { CURRENT_PAYLOAD_VERSION } from './payloadMigrations'
import { mergeDeletedIds } from './rowDiff'

// Extract row ids from a section payload, when it's a row array (or {items:[]}).
// Used to drop pending deletes for rows that are present again in the latest save.
function payloadIds(payload: unknown): string[] {
  const arr = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items))
      ? (payload as { items: unknown[] }).items
      : []
  return (arr as Array<{ id?: string }>).map(r => r?.id).filter((id): id is string => !!id)
}

// How many times we replay a queue item before giving up and dead-lettering it.
// Past this, automatic retries stop so a permanently-failing item (a payload the
// server keeps rejecting) cannot block the queue loop. Recovery is explicit:
// the user retries from the SyncStatusPill, or editing the section re-enqueues it.
export const MAX_SYNC_ATTEMPTS = 5

// Stable compound key for a section: `${entityType}::${cruiseId}`.
// One queue slot per entity — re-enqueueing the same entity updates in place.
export function entityKey(entityType: EntityType, cruiseId: string): string {
  return `${entityType}::${cruiseId}`
}

// Add (or update) a queue item for a section write.
// If the same entity already has a pending item, the payload is refreshed and
// the attempt counter is reset — we only need to replay the latest state.
export async function enqueue(
  entityType: EntityType,
  operation:  SyncOperation,
  cruiseId:   string,
  payload:    unknown,
  opts?: { budgetId?: string; serverId?: string; deletedIds?: string[] },
): Promise<void> {
  const entityId = entityKey(entityType, cruiseId)
  const now      = new Date().toISOString()

  const existing = await localDb.syncQueue
    .where('entityId').equals(entityId)
    .first()

  if (existing) {
    // Carry forward any deletes already pending on this slot, add the new ones, and
    // drop ids that are present again in the fresh payload (re-added rows).
    const deletedIds = mergeDeletedIds(existing.deletedIds, opts?.deletedIds, payloadIds(payload))
    await localDb.syncQueue.update(existing.id, {
      operation,
      payload,
      budgetId:  opts?.budgetId,
      serverId:  opts?.serverId,
      deletedIds,
      updatedAt: now,
      attempts:  0,
      error:     undefined,
      lastAttemptAt: undefined,
      // Re-editing a section revives a previously dead-lettered item: the user
      // gave us fresh data, so it deserves a clean run of attempts again.
      dead:           false,
      deadLetteredAt: undefined,
      // Fresh payload → current schema version.
      schemaVersion:  CURRENT_PAYLOAD_VERSION,
    })
  } else {
    const item: SyncQueueItem = {
      id:         crypto.randomUUID(),
      entityId,
      entityType,
      operation,
      cruiseId,
      payload,
      budgetId:   opts?.budgetId,
      serverId:   opts?.serverId,
      deletedIds: mergeDeletedIds([], opts?.deletedIds, payloadIds(payload)),
      localId:    entityId,
      updatedAt:  now,
      attempts:   0,
      schemaVersion: CURRENT_PAYLOAD_VERSION,
    }
    await localDb.syncQueue.add(item)
  }

  // Mark the local entry as pending so the UI reflects un-synced state.
  await localDb.entries.update(entityId, { syncStatus: 'pending', updatedAt: now })
}

export async function getQueue(): Promise<SyncQueueItem[]> {
  return localDb.syncQueue.toArray()
}

// Items the sync loop should actually attempt: everything except dead-lettered
// ones. Dead items are left in place (flagged) but never auto-retried.
export async function getActiveQueue(): Promise<SyncQueueItem[]> {
  return localDb.syncQueue.filter(i => !i.dead).toArray()
}

export async function markSyncing(queueId: string): Promise<void> {
  await localDb.syncQueue.update(queueId, {
    lastAttemptAt: new Date().toISOString(),
  })
  // Find the associated entry and mark it syncing.
  const item = await localDb.syncQueue.get(queueId)
  if (item) await localDb.entries.update(item.entityId, { syncStatus: 'syncing' })
}

export async function markSynced(queueId: string, entityId: string): Promise<void> {
  await localDb.syncQueue.delete(queueId)
  await localDb.entries.update(entityId, {
    syncStatus:    'synced',
    lastSyncedAt:  new Date().toISOString(),
  })
}

// Immediately dead-letter an item without burning retry attempts — used when a
// payload can't be migrated to the current schema, so retrying is pointless.
export async function markDeadLetter(queueId: string, entityId: string, error: string): Promise<void> {
  const now = new Date().toISOString()
  await localDb.syncQueue.update(queueId, {
    error,
    dead:           true,
    deadLetteredAt: now,
    lastAttemptAt:  now,
  })
  await localDb.entries.update(entityId, { syncStatus: 'failed' })
}

export async function markFailed(queueId: string, entityId: string, error: string): Promise<void> {
  const item = await localDb.syncQueue.get(queueId)
  if (!item) return
  const now      = new Date().toISOString()
  const attempts = item.attempts + 1
  // Once attempts are exhausted, dead-letter the item: it stays in the table
  // (flagged) but is no longer auto-retried, so it can't stall the queue loop.
  const dead     = attempts >= MAX_SYNC_ATTEMPTS
  await localDb.syncQueue.update(queueId, {
    attempts,
    error,
    lastAttemptAt:  now,
    dead:           dead || undefined,
    deadLetteredAt: dead ? now : undefined,
  })
  await localDb.entries.update(entityId, { syncStatus: 'failed' })
}

export async function removeFromQueue(queueId: string): Promise<void> {
  await localDb.syncQueue.delete(queueId)
}

// Live items still in line to sync (excludes dead-lettered ones, which are no
// longer the queue's responsibility until explicitly revived).
export async function pendingCount(): Promise<number> {
  return localDb.syncQueue.filter(i => !i.dead).count()
}

// Items that exhausted their retries and need explicit user attention.
export async function deadLetterCount(): Promise<number> {
  return localDb.syncQueue.filter(i => i.dead === true).count()
}

export async function getDeadLetter(): Promise<SyncQueueItem[]> {
  return localDb.syncQueue.filter(i => i.dead === true).toArray()
}

// Permanently discard dead-lettered items (the data still lives in localStorage
// and the entries table; this only drops the un-syncable write). Pass a queueId
// to clear one, or omit to clear them all.
export async function clearDeadLetter(queueId?: string): Promise<void> {
  if (queueId) { await localDb.syncQueue.delete(queueId); return }
  const dead = await getDeadLetter()
  await localDb.syncQueue.bulkDelete(dead.map(i => i.id))
}

// Reset failed items — including dead-lettered ones — so they get a clean run of
// attempts on the next sync pass. This is the explicit recovery path behind the
// "Retry" action.
export async function retryFailed(): Promise<void> {
  const failed = await localDb.syncQueue.filter(i => i.attempts > 0 || i.dead === true).toArray()
  for (const item of failed) {
    await localDb.syncQueue.update(item.id, {
      attempts: 0, error: undefined, dead: undefined, deadLetteredAt: undefined,
    })
    await localDb.entries.update(item.entityId, { syncStatus: 'pending' })
  }
}
