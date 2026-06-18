// ─────────────────────────────────────────────────────────────────────────────
// db/payloadMigrations.ts — Schema versioning for queued offline payloads
//
// The sync queue holds app-shape payloads captured when the user edited a section
// offline. They replay to Supabase later — possibly after a DB/converter change
// has shipped. To stop a stale-shape payload being pushed through a newer converter,
// each queued item is stamped with CURRENT_PAYLOAD_VERSION at enqueue time, and on
// replay we migrate it up to current before writing (see services/syncService.ts).
//
// Today the ladder is empty (everything is v1) — this is the mechanism for the
// FUTURE: when a schema change lands, bump CURRENT_PAYLOAD_VERSION and append a step
// to the relevant entity's array. Anything that can't be migrated is dead-lettered
// rather than written, so it's preserved and flagged instead of silently corrupting.
// ─────────────────────────────────────────────────────────────────────────────

import type { EntityType } from './localDb'

// Bump this whenever a shipped change makes an existing queued payload shape stale
// for the current converters, and append the matching migration step(s) below.
export const CURRENT_PAYLOAD_VERSION = 1

// One migration function per version step. For a given entity, MIGRATIONS[entity][i]
// migrates a payload from version (i + 1) to version (i + 2). Empty array = no steps
// (the entity has never needed a payload migration).
type MigrationStep = (payload: unknown) => unknown
const MIGRATIONS: Record<EntityType, MigrationStep[]> = {
  voyage:           [],
  itinerary:        [],
  dailyLogs:        [],
  foodLogs:         [],
  diningLog:        [],
  entertainmentLog: [],
  foodFav:          [],
  highlights:       [],
  budget:           [],
  shopping:         [],
  packing:          [],
  notes:            [],
}

export type MigrationResult =
  | { ok: true;  payload: unknown }
  | { ok: false; reason: string }

// Apply an ordered list of migration steps to carry a payload from fromVersion up
// to targetVersion. steps[i] migrates v(i+1) → v(i+2). Exported (and registry-free)
// so the ladder mechanism can be unit-tested with synthetic steps.
export function runLadder(
  steps:         MigrationStep[],
  fromVersion:   number,
  targetVersion: number,
  payload:       unknown,
  label = 'payload',
): MigrationResult {
  if (fromVersion > targetVersion) {
    return { ok: false, reason: `${label} v${fromVersion} is newer than supported v${targetVersion}` }
  }
  let version = fromVersion
  let current = payload
  while (version < targetVersion) {
    const step = steps[version - 1] // step at index i migrates v(i+1) → v(i+2)
    if (!step) return { ok: false, reason: `no migration for ${label} v${version} → v${version + 1}` }
    current = step(current)
    version += 1
  }
  return { ok: true, payload: current }
}

// Migrate a queued payload from its stamped version up to CURRENT_PAYLOAD_VERSION.
//   • missing/undefined fromVersion → treated as 1 (queued before versioning shipped)
//   • fromVersion newer than we understand → not ok (dead-letter, don't guess)
//   • a needed step that isn't registered → not ok (dead-letter)
//   • already current → clean pass-through
export function migrateQueuePayload(
  entityType:  EntityType,
  fromVersion: number | undefined,
  payload:     unknown,
): MigrationResult {
  const steps = MIGRATIONS[entityType]
  if (!steps) return { ok: false, reason: `unknown entity type: ${entityType}` }
  return runLadder(steps, fromVersion ?? 1, CURRENT_PAYLOAD_VERSION, payload, entityType)
}
