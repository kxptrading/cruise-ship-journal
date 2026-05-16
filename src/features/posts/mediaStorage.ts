// ─────────────────────────────────────────────────────────────────────────────
// features/posts/mediaStorage.ts — Upload / delete / URL helpers for post media
//
// BUCKET: 'daily-photos' (shared with legacy daily-log photo uploads)
//   Post media is stored under: {userId}/posts/{uuid}.{ext}
//   This path convention keeps post media separate from legacy daily-log photos
//   which are stored under {userId}/{day}/{filename} — no collision is possible.
//
// PUBLIC vs SIGNED URLs:
//   This bucket is configured as PUBLIC in Supabase Storage settings.
//   We use getPublicUrl() (no expiry, no auth required) rather than
//   createSignedUrl() (1-hour TTL, requires auth). This is intentional because:
//     - Post photos are shown in the feed to contacts — they may not have a
//       valid Supabase session cookie when viewing a shared link.
//     - Public URLs are permanent, so stored paths in posts.media_paths can be
//       resolved to display URLs at any time without a DB round-trip.
//   CONTRAST WITH legacy photoStorage.ts which uses signed URLs — those photos
//   are private (daily log memories) and should NOT be publicly accessible.
//
//   If you ever need to make the bucket private, you must migrate all existing
//   media_paths to use createSignedUrl() and update pathsToUrls() accordingly.
//
// STORAGE PATH STORED IN DB:
//   posts.media_paths stores the raw storage path (e.g. 'user123/posts/abc.jpg')
//   NOT the full public URL. This means the bucket name and CDN host can change
//   without requiring a data migration — just update publicUrl() here.
//
// UUID FILE NAMES:
//   crypto.randomUUID() generates the filename, not the original file name.
//   This prevents collisions if a user uploads files with the same name twice,
//   and avoids exposing the original file name in the public URL.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'

const BUCKET = 'daily-photos'

// Convert a storage path to a permanent public URL.
// getPublicUrl does NOT hit the network — it is a synchronous URL construction.
export function publicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export interface UploadResult {
  path:       string  // storage path — stored in posts.media_paths
  url:        string  // public URL  — used for display
  name:       string  // original filename (stored for display name only)
}

// ── uploadPostMedia ───────────────────────────────────────────────────────────
// Uploads a single file and returns the path + url for immediate display.
// upsert: false ensures we never silently overwrite an existing file — a UUID
// collision would be a bug and should throw rather than corrupt data.

export async function uploadPostMedia(
  file:   File,
  userId: string,
): Promise<UploadResult> {
  const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = crypto.randomUUID()
  // Path format: {userId}/posts/{uuid}.{ext}
  // The userId prefix is required by the storage RLS policy that restricts
  // uploads to objects under the user's own folder.
  const path = `${userId}/posts/${uuid}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  return { path, url: publicUrl(path), name: file.name }
}

// ── deletePostMedia ───────────────────────────────────────────────────────────
// Called when a post is deleted or when the user removes a photo during editing.
// The storage RLS policy allows users to delete only objects under their own
// userId prefix, so passing a path from another user would throw.

export async function deletePostMedia(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

// ── pathsToUrls ───────────────────────────────────────────────────────────────
// Convenience function to convert an array of stored paths (from posts.media_paths)
// to display URLs in one call. No network request — getPublicUrl is synchronous.

/** Convert an array of storage paths to public display URLs */
export function pathsToUrls(paths: string[]): string[] {
  return paths.map(publicUrl)
}
