export const db = {
  get: (k, fb) => {
    try {
      const r = localStorage.getItem(k)
      return r ? JSON.parse(r) : fb
    } catch {
      return fb
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {}
  },
}
