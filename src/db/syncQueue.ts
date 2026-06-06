// ─────────────────────────────────────────────────────────────────────────────
// db/syncQueue.ts — CRUD helpers for the offline sync queue
//
// All queue writes are fire-and-forget from the UI layer. Errors are swallowed
// because a failed queue write is non-critical (the data is still in
// localStorage and IndexedDB entries; a manual sync will re-queue it).
// ─────────────────────────────────────────────────────────────────────────────

import { localDb, type EntityType, type SyncOperation, type SyncQueueItem } from './localDb'

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
  opts?: { budgetId?: string; serverId?: string },
): Promise<void> {
  const entityId = entityKey(entityType, cruiseId)
  const now      = new Date().toISOString()

  const existing = await localDb.syncQueue
    .where('entityId').equals(entityId)
    .first()

  if (existing) {
    await localDb.syncQueue.update(existing.id, {
      operation,
      payload,
      budgetId:  opts?.budgetId,
      serverId:  opts?.serverId,
      updatedAt: now,
      attempts:  0,
      error:     undefined,
      lastAttemptAt: undefined,
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
      localId:    entityId,
      updatedAt:  now,
      attempts:   0,
    }
    await localDb.syncQueue.add(item)
  }

  // Mark the local entry as pending so the UI reflects un-synced state.
  await localDb.entries.update(entityId, { syncStatus: 'pending', updatedAt: now })
}

export async function getQueue(): Promise<SyncQueueItem[]> {
  return localDb.syncQueue.toArray()
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

export async function markFailed(queueId: string, entityId: string, error: string): Promise<void> {
  const item = await localDb.syncQueue.get(queueId)
  if (!item) return
  await localDb.syncQueue.update(queueId, {
    attempts:      item.attempts + 1,
    error,
    lastAttemptAt: new Date().toISOString(),
  })
  await localDb.entries.update(entityId, { syncStatus: 'failed' })
}

export async function removeFromQueue(queueId: string): Promise<void> {
  await localDb.syncQueue.delete(queueId)
}

export async function pendingCount(): Promise<number> {
  return localDb.syncQueue.count()
}

export async function failedCount(): Promise<number> {
  return localDb.syncQueue.where('attempts').above(0).count()
}

// Reset failed items so they are retried on the next sync pass.
export async function retryFailed(): Promise<void> {
  const failed = await localDb.syncQueue.where('attempts').above(0).toArray()
  for (const item of failed) {
    await localDb.syncQueue.update(item.id, { attempts: 0, error: undefined })
    await localDb.entries.update(item.entityId, { syncStatus: 'pending' })
  }
}
