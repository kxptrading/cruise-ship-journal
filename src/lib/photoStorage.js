// ─────────────────────────────────────────────────────────────────────────────
// lib/photoStorage.js — IndexedDB-backed photo storage
//
// Stores photos as base64 data URLs keyed by voyage day index.
// IndexedDB is used instead of localStorage because photos are binary and
// can easily exceed localStorage's ~5 MB quota.
//
// When Supabase Storage is connected, replace the body of each function with
// a supabase.storage call — the DailyLog component interface stays the same.
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'csj-photos'
const STORE   = 'photos'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('dayIndex', 'dayIndex', { unique: false })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

// Read a File into a base64 data URL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = e => reject(e.target.error)
    reader.readAsDataURL(file)
  })
}

export async function addPhoto(dayIndex, file, caption = '') {
  const dataUrl = await fileToDataUrl(file)
  const photo = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dayIndex,
    dataUrl,
    caption,
    createdAt: new Date().toISOString(),
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add(photo)
    tx.oncomplete = () => resolve(photo)
    tx.onerror    = e => reject(e.target.error)
  })
}

export async function getPhotos(dayIndex) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).index('dayIndex').getAll(dayIndex)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

export async function deletePhoto(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror    = e => reject(e.target.error)
  })
}

export async function updateCaption(id, caption) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req   = store.get(id)
    req.onsuccess = e => {
      const photo = e.target.result
      if (photo) store.put({ ...photo, caption })
    }
    tx.oncomplete = () => resolve()
    tx.onerror    = e => reject(e.target.error)
  })
}
