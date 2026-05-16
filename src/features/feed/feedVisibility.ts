// ─────────────────────────────────────────────────────────────────────────────
// features/feed/feedVisibility.ts — Client-side canSeeInFeed (spec §7)
//
// RELATIONSHIP TO PRODUCTION ENFORCEMENT:
//   The same logic is enforced by TWO server-side mechanisms:
//     1. get_feed() Postgres RPC — filters posts when building the feed query.
//     2. posts RLS policy         — prevents direct post reads that bypass the RPC.
//
//   Because enforcement happens server-side, posts that fail canSeeInFeed()
//   NEVER reach the client in production. This client-side function therefore
//   serves a different purpose than a security guard.
//
// USE THIS FUNCTION FOR:
//   1. Unit tests — verify the access rules match the spec without hitting Supabase.
//   2. Client-side optimistic UI filtering — e.g. when creating a post, predict
//      whether it will appear in the author's own feed immediately.
//   3. Documentation / specification — the function body IS the spec §7 rules,
//      written in readable code. The RPC SQL must match this exactly.
//
// DO NOT use this function as a security boundary. Always rely on the RLS policy
// and the get_feed() RPC for authoritative access control.
//
// VISIBILITY RULES SUMMARY (spec §7):
//   'private' → never visible to anyone (not even contacts). Private posts are
//               only shown on the author's own VoyageDetailPage (PostList).
//   'public'  → visible to all accepted contacts of the author.
//   'family'  → visible only to contacts where contact.isFamily === true.
//   own post  → the author always sees their own non-private posts in the feed
//               (they are their own contact for the purpose of the feed).
//   no contact → a viewer who is not an accepted contact sees nothing, regardless
//                of audience (no "public = anyone on the internet").
// ─────────────────────────────────────────────────────────────────────────────

import type { Audience } from '@/types/models'

// Minimal post shape needed to determine visibility.
// Using a narrow interface (not full PostRow) so this function can be used
// with any post-like object without importing the full model.
export interface VisibilityPost {
  userId:   string   // the post author's user id
  audience: Audience
}

// Minimal viewer shape — just the id for the ownership check.
export interface VisibilityViewer {
  id: string
}

// Contact relationship between viewer and post author.
// null means the viewer is NOT an accepted contact of the author.
// isFamily drives the 'family' audience tier.
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
 *
 * The rule order matters — short-circuit evaluation means earlier rules take
 * precedence. Rule 1 blocks private before Rule 2 can grant author access,
 * which is correct: the author does not see their own private posts in the feed
 * (they see them in their own VoyageDetailPage > Posts tab instead).
 */
export function canSeeInFeed(
  viewer:  VisibilityViewer,
  post:    VisibilityPost,
  contact: VisibilityContact | null,   // null = viewer is not a contact
): boolean {
  // Rule 1: Private posts never appear in feed (not even for the author).
  if (post.audience === 'private')           return false
  // Rule 2: Author always sees their own public/family posts in the feed.
  if (viewer.id     === post.userId)         return true   // own post
  // Rule 3: Non-contacts see nothing.
  if (!contact)                              return false  // not a contact
  // Rule 4: Public posts visible to all accepted contacts.
  if (post.audience === 'public')            return true
  // Rule 5: Family posts visible only to family contacts.
  if (post.audience === 'family')            return contact.isFamily
  // Exhaustive fallback — should never reach here if Audience type is complete.
  return false
}
