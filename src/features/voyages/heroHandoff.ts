// ─────────────────────────────────────────────────────────────────────────────
// features/voyages/heroHandoff.ts — one-shot hero-photo handoff
//
// The book-open transition (BookOpenTransition) picks a random voyage photo for its
// "first page". So the voyage landing then shows the SAME picture (seamless handoff),
// the transition stashes its pick here and VoyageStoryPage takes it on mount.
// ─────────────────────────────────────────────────────────────────────────────

let pending: { voyageId: string; url: string } | null = null

export function setHeroHandoff(voyageId: string, url: string): void {
  pending = { voyageId, url }
}

// Read and clear the handoff for a voyage (returns undefined if none).
export function takeHeroHandoff(voyageId: string | null | undefined): string | undefined {
  if (pending && pending.voyageId === voyageId) {
    const url = pending.url
    pending = null
    return url
  }
  return undefined
}
