// ─────────────────────────────────────────────────────────────────────────────
// db/localDb.ts — Dexie (IndexedDB) schema for offline-first storage
//
// Three tables:
//   entries    — one record per section per voyage (mirrors useVoyageData shape)
//   syncQueue  — pending Supabase writes that need to be replayed when online
//   photoCache — offline photo blobs + thumbnails before Supabase upload
//
// Record IDs use the compound key `${entityType}::${cruiseId}` so there is
// always exactly one live record per section per voyage, matching how
// useVoyageData manages state.
// ─────────────────────────────────────────────────────────────────────────────

import Dexie, { type Table } from 'dexie'

// All journal section entity types — matches keys in VoyageData
export type EntityType =
  | 'voyage'
  | 'itinerary'
  | 'dailyLogs'
  | 'foodLogs'
  | 'diningLog'
  | 'entertainmentLog'
  | 'foodFav'
  | 'highlights'
  | 'budget'
  | 'shopping'
  | 'packing'
  | 'notes'

export type SyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'failed'

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE'

// One record per section per voyage.
// id = `${entityType}::${cruiseId}` (always unique within a voyage section).
export interface LocalEntry {
  id:            string       // `${entityType}::${cruiseId}`
  entityType:    EntityType
  cruiseId:      string
  data:          unknown      // full section payload (matches VoyageData[entityType])
  syncStatus:    SyncStatus
  createdAt:     string       // ISO string
  updatedAt:     string       // ISO string
  lastSyncedAt?: string
  deleted:       boolean
}

// One item per pending Supabase write, keyed by the same entity compound id
// so duplicate queue entries for the same entity are naturally deduped.
export interface SyncQueueItem {
  id:              string
  entityId:        string       // LocalEntry.id
  entityType:      EntityType
  operation:       SyncOperation
  cruiseId:        string
  payload:         unknown      // full section data to write to Supabase
  serverId?:       string       // Supabase row id (if known)
  localId:         string       // same as entityId for section-level writes
  budgetId?:       string       // budget row UUID (needed for two-table budget write)
  updatedAt:       string
  attempts:        number
  lastAttemptAt?:  string
  error?:          string
  // Dead-letter flag: set once attempts exhaust MAX_SYNC_ATTEMPTS. Dead items are
  // skipped by the sync loop and excluded from the pending count so a permanently
  // rejecting payload (e.g. malformed data Supabase keeps refusing) can't block the
  // queue forever. They remain stored — flagged, not lost — until the user retries
  // them or the section is edited again (which revives the item via enqueue).
  dead?:           boolean
  deadLetteredAt?: string
  // Payload schema version stamped at enqueue time (see db/payloadMigrations.ts).
  // On replay the payload is migrated from this version up to current before being
  // written; anything unmigratable is dead-lettered. Absent on items queued before
  // versioning shipped — treated as version 1.
  schemaVersion?:  number
}

// Per-photo cache entry for offline photo viewing and deferred upload.
export interface PhotoCacheEntry {
  id:           string
  voyageId:     string
  dayNumber:    number
  blob?:        Blob           // raw file (cleared after upload to save space)
  thumbnail:    string         // base64 data URL, generated client-side, kept forever
  storagePath?: string         // Supabase storage path once uploaded
  caption?:     string
  syncStatus:   'local' | 'queued' | 'uploading' | 'uploaded' | 'failed'
  createdAt:    string
}

class LocalDatabase extends Dexie {
  entries!:    Table<LocalEntry,       string>
  syncQueue!:  Table<SyncQueueItem,    string>
  photoCache!: Table<PhotoCacheEntry,  string>

  constructor() {
    super('DeckDaysDB')
    this.version(1).stores({
      entries:    'id, entityType, cruiseId, syncStatus, updatedAt',
      syncQueue:  'id, entityId, entityType, cruiseId, attempts, updatedAt',
      photoCache: 'id, voyageId, dayNumber, syncStatus',
    })
  }
}

export const localDb = new LocalDatabase()
