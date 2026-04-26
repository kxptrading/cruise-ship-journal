// ─────────────────────────────────────────────────────────────────────────────
// lib/photoStorage.js — Supabase Storage-backed photo storage
//
// Stores photos in the `daily-photos` Supabase Storage bucket under:
//   {userId}/{voyageId}/{dayNumber}/{photoId}.{ext}
//
// Metadata (caption, path) lives in the `photos` table so captions can be
// edited without re-uploading the file.
//
// Each function accepts a context object { voyageId, userId } as the last
// argument, provided by the calling component via useVoyageId() and UserCtx.
//
// ⚠️  DAY NUMBERING CONVENTION — IMPORTANT
// All callers must pass 1-based day numbers (Day 1 = 1, Day 2 = 2, …).
// This matches the `daily_logs.day_number` and `itinerary.day_number`
// columns, keeping cross-table JOINs and display logic consistent.
//
// Callers:
//   DailyLog.jsx  → getPhotos(day + 1, …)  and addPhoto(day + 1, …)
//   DayDetail.jsx → getPhotos(dayIndex + 1, …)
//   Feed.jsx      → getPhotos(i + 1, …)  and addPhoto(idx + 1, …)
//   (friend photo cross-reference uses daily_logs.day_number which is already
//    1-based, so no adjustment is needed on that path)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

const BUCKET = 'daily-photos'

// Returns the Supabase public URL for a given storage path.
function publicUrl(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Upload a photo file and insert a metadata row.
// Returns a photo object compatible with DailyLog + Feed (has id, dataUrl, caption, storage_path).
export async function addPhoto(dayNumber, file, { voyageId, userId }, caption = '') {
  const ext     = file.name.split('.').pop().toLowerCase() || 'jpg'
  const photoId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path    = `${userId}/${voyageId}/${dayNumber}/${photoId}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })

  if (uploadErr) throw uploadErr

  const { data: row, error: dbErr } = await supabase
    .from('photos')
    .insert({ voyage_id: voyageId, day_number: dayNumber, storage_path: path, caption })
    .select('id, storage_path, caption, created_at')
    .single()

  if (dbErr) throw dbErr

  return { ...row, dataUrl: publicUrl(path) }
}

// Fetch all photos for a given day, ordered oldest-first.
// Returns array of { id, storage_path, caption, created_at, dataUrl }.
export async function getPhotos(dayNumber, { voyageId }) {
  const { data: rows } = await supabase
    .from('photos')
    .select('id, storage_path, caption, created_at')
    .eq('voyage_id', voyageId)
    .eq('day_number', dayNumber)
    .order('created_at', { ascending: true })

  if (!rows) return []
  return rows.map(row => ({ ...row, dataUrl: publicUrl(row.storage_path) }))
}

// Remove a photo from Storage and delete its metadata row.
export async function deletePhoto(id, storagePath) {
  await supabase.storage.from(BUCKET).remove([storagePath])
  await supabase.from('photos').delete().eq('id', id).then(() => {})
}

// Update the caption text for a photo (DB only — file unchanged).
export async function updateCaption(id, caption) {
  supabase.from('photos').update({ caption }).eq('id', id).then(() => {})
}
