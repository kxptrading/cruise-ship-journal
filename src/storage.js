// ─────────────────────────────────────────────────────────────────────────────
// storage.js — Phase 1 persistence layer
//
// Thin wrapper around localStorage that handles JSON serialisation and parse
// errors. All section data is stored under keys prefixed "csj-" (e.g.
// "csj-voyage", "csj-dailyLogs"). When Phase 2 arrives, swap this module for
// a Supabase client — App.jsx's update() callback is the only call site.
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
