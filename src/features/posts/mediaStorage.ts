// ─────────────────────────────────────────────────────────────────────────────
// features/posts/mediaStorage.ts — Upload / delete / URL helpers for post media
//
// Photos are stored in the existing public 'daily-photos' bucket under the
// path:  {userId}/posts/{uuid}.{ext}
// Public URL construction doesn't need signed URLs because the bucket is public.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'

const BUCKET = 'daily-photos'

export function publicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export interface UploadResult {
  path:       string  // storage path — stored in posts.media_paths
  url:        string  // public URL  — used for display
  name:       string  // original filename
}

export async function uploadPostMedia(
  file:   File,
  userId: string,
): Promise<UploadResult> {
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = crypto.randomUUID()
  const path = `${userId}/posts/${uuid}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  return { path, url: publicUrl(path), name: file.name }
}

export async function deletePostMedia(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

/** Convert an array of storage paths to public display URLs */
export function pathsToUrls(paths: string[]): string[] {
  return paths.map(publicUrl)
}
