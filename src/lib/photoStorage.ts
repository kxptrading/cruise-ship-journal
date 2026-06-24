// ─────────────────────────────────────────────────────────────────────────────
// lib/photoStorage.ts — Supabase Storage-backed photo storage
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'
import type { PhotoRecord } from '../types'

const BUCKET = 'daily-photos'
const SIGNED_URL_TTL = 3600

interface PhotoContext {
  voyageId: string
  userId:   string
}

interface VoyageContext {
  voyageId: string
}

async function signedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  return data?.signedUrl || ''
}

async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
  const map: Record<string, string> = {}
  ;(data || []).forEach(({ path: p, signedUrl: url }) => { if (p) map[p] = url || '' })
  return map
}

export async function addPhoto(
  dayNumber: number,
  file: File,
  { voyageId, userId }: PhotoContext,
  caption = '',
): Promise<PhotoRecord> {
  const ext     = file.name.split('.').pop()?.toLowerCase() || 'jpg'
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

  return { ...(row as Omit<PhotoRecord, 'dataUrl'>), dataUrl: await signedUrl(path) }
}

export async function getPhotos(dayNumber: number, { voyageId }: VoyageContext): Promise<PhotoRecord[]> {
  const { data: rows } = await supabase
    .from('photos')
    .select('id, storage_path, caption, created_at')
    .eq('voyage_id', voyageId)
    .eq('day_number', dayNumber)
    .order('created_at', { ascending: true })

  if (!rows?.length) return []
  const urlMap = await signedUrls(rows.map((r: { storage_path: string }) => r.storage_path))
  return rows.map((row: Omit<PhotoRecord, 'dataUrl'>) => ({ ...row, dataUrl: urlMap[row.storage_path] || '' }))
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  return signedUrls(paths)
}

export async function deletePhoto(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath])
  await supabase.from('photos').delete().eq('id', id).then(() => {})
}

export async function updateCaption(id: string, caption: string): Promise<void> {
  supabase.from('photos').update({ caption }).eq('id', id).then(() => {})
}

// ── Voyage-level (Notes board) images ───────────────────────────────────────────
// Storage-only: upload to the bucket under a `notes/` folder and return the path +
// signed URL. Deliberately does NOT insert a `photos` table row — board photos must
// not appear in the Daily-Log gallery or PDF export (those key off day_number).
export async function uploadVoyageImage(
  file: File,
  { voyageId, userId }: PhotoContext,
): Promise<{ path: string; url: string }> {
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const id   = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${userId}/${voyageId}/notes/${id}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw error
  return { path, url: await signedUrl(path) }
}

// Resolve a single board-image path to a signed URL.
export async function boardPhotoUrl(path: string): Promise<string> {
  return signedUrl(path)
}

// Best-effort removal of a board image's storage object (no photos-table row exists).
export async function removeImage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]).then(() => {}, () => {})
}
