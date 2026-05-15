// ─────────────────────────────────────────────────────────────────────────────
// features/feed/feedVisibility.ts — Client-side canSeeInFeed (spec §7)
//
// This is the reference implementation. In production the same logic is
// enforced by the get_feed() Postgres RPC (Phase 4) and the posts RLS policy,
// so posts that fail this check never reach the client.
//
// Use this function for:
//   - Unit tests
//   - Client-side optimistic filtering before a mutation is confirmed
//   - Documentation of the access rules
// ─────────────────────────────────────────────────────────────────────────────

import type { Audience } from '@/types/models'

export interface VisibilityPost {
  userId:   string
  audience: Audience
}

export interface VisibilityViewer {
  id: string
}

export interface VisibilityContact {
  isFamily: boolean
}

/**
 * Returns true if `viewer` is allowed to see `post` in their Feed.
 *
 * Rules (spec §7):
 *  1. Private posts are never visible to anyone except the author.
 *  2. The author always sees their own shared posts.
 *  3. If the viewer is not a contact of the author, they see nothing.
 *  4. Public posts are visible to all contacts.
 *  5. Family posts are visible only to contacts where contact.isFamily === true.
 */
export function canSeeInFeed(
  viewer:  VisibilityViewer,
  post:    VisibilityPost,
  contact: VisibilityContact | null,   // null = viewer is not a contact
): boolean {
  if (post.audience === 'private')           return false
  if (viewer.id     === post.userId)         return true   // own post
  if (!contact)                              return false  // not a contact
  if (post.audience === 'public')            return true
  if (post.audience === 'family')            return contact.isFamily
  return false
}
