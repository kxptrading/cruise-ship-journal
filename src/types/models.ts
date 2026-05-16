// ─────────────────────────────────────────────────────────────────────────────
// types/models.ts — Canonical data model (CRUISE_VOYAGE_JOURNAL_SPEC §3)
//
// PURPOSE:
//   These are the spec-level interfaces used by new pages and features.
//   They represent the intended final shape of the domain model once the React
//   Query migration is complete.
//
// RELATIONSHIP TO src/types.ts:
//   Legacy interfaces remain in src/types.ts for backward-compat with existing
//   section components (DailyLog, FoodLog, etc.) that use `VoyageData`, `DailyLogEntry`,
//   etc. Migrate callers to these canonical models over time.
//   RULE: New code (new pages, new hooks) should use types from this file.
//         Existing section code can continue to use src/types.ts until migrated.
//
// AUDIENCE TYPE:
//   The Audience union controls post visibility in the feed (spec §7):
//     'private' — visible only to the author (stored in DB, shown only on own voyage)
//     'family'  — visible to contacts where friend_requests.is_family = true
//     'public'  — visible to all accepted contacts
//   This type is imported by feedVisibility.ts, PostRow, FeedRow, and all post forms.
// ─────────────────────────────────────────────────────────────────────────────

export type UUID    = string
export type ISODate = string

// Three-tier visibility model for posts.
// Maps directly to the `audience` column in the posts table (type: text CHECK constraint).
export type Audience = 'private' | 'family' | 'public'

// ── User ─────────────────────────────────────────────────────────────────────
// Represents the user-facing profile, not the raw Supabase Auth user.
// Profiles are stored in the `profiles` table with user_id FK to auth.users.

export interface User {
  id:          UUID
  email:       string
  displayName: string
  avatarUrl?:  string
  createdAt:   ISODate
}

// ── Voyage ───────────────────────────────────────────────────────────────────
// Top-level entity — all journal data (posts, daily logs, itinerary) belongs to
// a voyage, which belongs to a user. Voyages are the unit of sharing/export.

export interface PortStop {
  date:     ISODate
  portName: string
  notes?:   string
}

export interface Voyage {
  id:             UUID
  userId:         UUID
  title:          string          // e.g. "Mediterranean — Sept 2026"
  shipName?:      string
  cruiseLine?:    string
  startDate:      ISODate
  endDate:        ISODate
  coverImageUrl?: string
  itinerary?:     PortStop[]
  createdAt:      ISODate
  updatedAt:      ISODate
}

// ── Post ─────────────────────────────────────────────────────────────────────
// A Post is the primary social/journal unit. It can be a quick text update,
// a photo post, or a structured daily log entry (the latter stored in metadata).
//
// DESIGN NOTES:
//   - postDate: the date the entry DESCRIBES (e.g. Day 3 of the cruise),
//     which can differ from createdAt (e.g. if the user writes it up later).
//   - userId is denormalized from voyage.userId for query speed — the feed
//     RPC joins posts with users directly without going through voyages.
//   - mediaIds: UUIDs referencing a future 'media' table (not yet live).
//     Currently posts.media_paths (storage paths) are used instead.
//   - metadata: flexible JSON bag for migrated daily-log fields (weather, meals,
//     ratings). Allows journal section data to be attached to a post without
//     schema changes.
//   - audience: defaults to 'private' at the DB level (column default).

export interface Post {
  id:        UUID
  voyageId:  UUID
  userId:    UUID            // denormalized from voyage.userId for query speed
  title?:    string
  body:      string
  postDate:  ISODate         // the date the entry describes (can differ from createdAt)
  location?: string
  mediaIds:  UUID[]
  audience:  Audience        // default: 'private'
  metadata?: Record<string, unknown>  // migrated daily-log fields (weather, meals, etc.)
  createdAt: ISODate
  updatedAt: ISODate
}

// ── Media ────────────────────────────────────────────────────────────────────
// Future media table (not yet live). Currently post media is tracked via
// posts.media_paths (storage paths) and posts.media_ids (future media row ids).
// This interface represents the intended final shape when the media table exists.

export interface Media {
  id:      UUID
  postId:  UUID
  url:     string
  type:    'image' | 'video'
  width?:  number
  height?: number
}

// ── Contact ──────────────────────────────────────────────────────────────────
// Represents an accepted friendship. The underlying DB table is `friend_requests`
// with a status of 'accepted'. The is_family boolean is the single tier of
// grouping — there is no multi-group system (spec §3).
//
// NOTE: The `id` here is friend_requests.id (not a separate contacts table).

export interface Contact {
  id:            UUID
  ownerId:       UUID    // the user who owns this contact entry
  contactUserId: UUID    // the user being contacted
  isFamily:      boolean // single tag — no multi-group system
  createdAt:     ISODate
}

// ── Feed ─────────────────────────────────────────────────────────────────────
// FeedEntry is the spec-level type for a feed item. The actual API response type
// is FeedRow (features/feed/hooks.ts) which mirrors what the get_feed() RPC returns.
// FeedEntry is the intended final normalised shape once the media table is live.

/** A Post enriched with author + voyage context for display in the Feed */
export interface FeedEntry {
  post:        Post
  author:      User
  voyageTitle: string
  voyageId:    UUID
}
