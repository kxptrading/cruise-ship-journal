// ─────────────────────────────────────────────────────────────────────────────
// db/rowDiff.ts — Row-level diff helpers for non-destructive section sync
//
// Co-editing requires that a section save NOT prune the server with a blanket
// "delete everything not in my snapshot" (which would wipe a co-author's rows).
// Instead we upsert the present rows and delete only the ids this client actually
// removed. These pure helpers compute that, and merge pending deletes when the
// offline queue coalesces multiple edits into one slot.
// ─────────────────────────────────────────────────────────────────────────────

interface HasId { id: string }

// Ids present in prev but absent from next — i.e. rows this client removed.
export function removedRowIds(prev: readonly HasId[] = [], next: readonly HasId[] = []): string[] {
  const live = new Set(next.map(r => r.id))
  return prev.filter(r => !live.has(r.id)).map(r => r.id)
}

// Merge a freshly-removed id list into the deletes already pending on a queued
// section slot, then drop any id that's present again in the latest payload — a
// row that was deleted and re-added must NOT be deleted on replay.
export function mergeDeletedIds(
  existing:      readonly string[] = [],
  removed:       readonly string[] = [],
  survivingIds:  readonly string[] = [],
): string[] {
  const surviving = new Set(survivingIds)
  const merged = new Set<string>()
  for (const id of existing) if (!surviving.has(id)) merged.add(id)
  for (const id of removed)  if (!surviving.has(id)) merged.add(id)
  return [...merged]
}
