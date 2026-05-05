// ─────────────────────────────────────────────────────────────────────────────
// storage.ts — localStorage persistence layer (fast-render cache)
// ─────────────────────────────────────────────────────────────────────────────

export const db = {
  get: <T>(k: string, fb: T): T => {
    try {
      const r = localStorage.getItem(k)
      return r ? (JSON.parse(r) as T) : fb
    } catch {
      return fb
    }
  },

  set: (k: string, v: unknown): void => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {}
  },
}
