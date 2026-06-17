// hooks/useSyncStatus.ts — Aggregated sync state derived from the queue table

import { useState, useEffect, useCallback } from 'react'
import { localDb } from '../db/localDb'
import { useOnlineStatus } from './useOnlineStatus'

export type SyncState =
  | 'online'    // connected, nothing queued
  | 'offline'   // no connection
  | 'syncing'   // connected, actively flushing queue
  | 'failed'    // some items exhausted retries (dead-lettered)

export interface SyncStatus {
  state:         SyncState
  pending:       number   // live items still queued to sync (excludes dead-lettered)
  failed:        number   // dead-lettered items — gave up after MAX_SYNC_ATTEMPTS
  lastSyncedAt?: string
  refresh:       () => void
}

export function useSyncStatus(): SyncStatus {
  const isOnline = useOnlineStatus()

  const [pending,      setPending]      = useState(0)
  const [failed,       setFailed]       = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>()

  const refresh = useCallback(async () => {
    // pending = live items still in line; failed = dead-lettered items that gave
    // up and need explicit attention. Transient failures (attempts > 0 but not
    // yet dead) stay in `pending` because they'll retry automatically.
    const [p, f] = await Promise.all([
      localDb.syncQueue.filter(i => !i.dead).count(),
      localDb.syncQueue.filter(i => i.dead === true).count(),
    ])
    setPending(p)
    setFailed(f)

    // Check if anything is currently marked syncing in entries table.
    const syncingCount = await localDb.entries
      .where('syncStatus').equals('syncing')
      .count()
    setSyncing(syncingCount > 0)

    // Latest sync timestamp from any synced entry.
    const synced = await localDb.entries
      .where('syncStatus').equals('synced')
      .sortBy('lastSyncedAt')
    if (synced.length > 0) {
      const last = synced[synced.length - 1]
      setLastSyncedAt(last.lastSyncedAt)
    }
  }, [])

  // Poll every 3 seconds when online and there are pending items.
  // When idle (nothing queued), poll every 10 seconds to catch late arrivals.
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, pending > 0 && isOnline ? 3_000 : 10_000)
    return () => clearInterval(interval)
  }, [refresh, pending, isOnline])

  let state: SyncState
  if (!isOnline)        state = 'offline'
  else if (syncing)     state = 'syncing'
  else if (failed > 0)  state = 'failed'
  else                  state = 'online'

  return { state, pending, failed, lastSyncedAt, refresh }
}
