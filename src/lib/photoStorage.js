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
