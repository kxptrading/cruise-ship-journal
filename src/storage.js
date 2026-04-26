// ─────────────────────────────────────────────────────────────────────────────
// storage.js — localStorage persistence layer (fast-render cache)
//
// Thin wrapper around localStorage that handles JSON serialisation and parse
// errors. All section data is stored under keys prefixed "csj-" (e.g.
// "csj-voyage", "csj-dailyLogs").
//
// Role in the two-tier data strategy:
//   1. On mount, App.jsx reads from localStorage (via db.get) for an instant
//      first render — no loading spinner for returning users.
//   2. Each Supabase load effect then overwrites the cached values with the
//      authoritative server data (via db.set), so the next page load is also
//      fast even if the user was offline during step 1.
//   3. Every update() call in App.jsx writes through to both Supabase AND
//      localStorage, keeping the cache in sync.
//
// The localStorage cache is always a snapshot of the last successful Supabase
// read — treat it as a performance optimisation, not the source of truth.
// ─────────────────────────────────────────────────────────────────────────────

export const db = {
  // Retrieve a value by key. Returns the fallback if the key doesn't exist or
  // if the stored JSON is malformed.
  get: (k, fb) => {
    try {
      const r = localStorage.getItem(k)
      return r ? JSON.parse(r) : fb
    } catch {
      return fb
    }
  },

  // Persist a value by key. Silently ignores storage errors (e.g. private
  // browsing quota exceeded) so the UI never crashes on a failed write.
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {}
  },
}
