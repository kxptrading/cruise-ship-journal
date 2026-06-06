// ─────────────────────────────────────────────────────────────────────────────
// services/imageCompressionService.ts
//
// Client-side image compression using the Canvas API.
// Used before storing photos in IndexedDB and before uploading to Supabase.
//
// Strategies:
//   compressImage()     — resizes to maxWidth, encodes as JPEG at given quality.
//   generateThumbnail() — produces a small (120px wide) base64 data URL for
//                         offline UI preview without loading the full blob.
// ─────────────────────────────────────────────────────────────────────────────

// Maximum dimension (width or height) for compressed photos stored offline.
const DEFAULT_MAX_DIMENSION = 1600
// JPEG quality [0–1]. 0.82 is a good balance of size vs. visible quality.
const DEFAULT_QUALITY = 0.82
// Thumbnail width in pixels for IndexedDB preview.
const THUMBNAIL_WIDTH = 120

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime  = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(base64)
  const arr   = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CompressionResult {
  blob:        Blob
  dataUrl:     string
  width:       number
  height:      number
  originalSize: number
  compressedSize: number
}

export async function compressImage(
  file: File | Blob,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
  quality: number = DEFAULT_QUALITY,
): Promise<CompressionResult> {
  const originalSize = file.size
  const srcUrl  = URL.createObjectURL(file)

  try {
    const img = await loadImage(srcUrl)
    const { naturalWidth: w, naturalHeight: h } = img

    // Scale so the largest dimension fits within maxDimension.
    const scale  = Math.min(1, maxDimension / Math.max(w, h))
    const outW   = Math.round(w * scale)
    const outH   = Math.round(h * scale)

    const canvas  = document.createElement('canvas')
    canvas.width  = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, outW, outH)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const blob    = dataUrlToBlob(dataUrl)

    return { blob, dataUrl, width: outW, height: outH, originalSize, compressedSize: blob.size }
  } finally {
    URL.revokeObjectURL(srcUrl)
  }
}

export async function generateThumbnail(file: File | Blob): Promise<string> {
  const srcUrl = URL.createObjectURL(file)
  try {
    const img    = await loadImage(srcUrl)
    const scale  = THUMBNAIL_WIDTH / img.naturalWidth
    const canvas = document.createElement('canvas')
    canvas.width  = THUMBNAIL_WIDTH
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } finally {
    URL.revokeObjectURL(srcUrl)
  }
}

// Store a photo locally: compresses it and saves blob + thumbnail to IndexedDB.
// Returns the PhotoCacheEntry id so callers can reference it later.
export async function storePhotoLocally(
  file:      File,
  voyageId:  string,
  dayNumber: number,
  caption?:  string,
): Promise<string> {
  const { localDb } = await import('../db/localDb')

  const [compressed, thumbnail] = await Promise.all([
    compressImage(file),
    generateThumbnail(file),
  ])

  const id = crypto.randomUUID()
  await localDb.photoCache.add({
    id,
    voyageId,
    dayNumber,
    blob:       compressed.blob,
    thumbnail,
    caption,
    syncStatus: 'local',
    createdAt:  new Date().toISOString(),
  })

  return id
}

// Queue all local photos for a voyage day to be uploaded when online.
export async function queuePhotoUploads(voyageId: string, dayNumber: number): Promise<void> {
  const { localDb } = await import('../db/localDb')
  const photos = await localDb.photoCache
    .where('[voyageId+dayNumber]')
    .equals([voyageId, dayNumber])
    .filter(p => p.syncStatus === 'local')
    .toArray()

  for (const photo of photos) {
    await localDb.photoCache.update(photo.id, { syncStatus: 'queued' })
  }
}
