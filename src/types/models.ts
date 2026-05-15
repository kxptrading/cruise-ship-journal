// ─────────────────────────────────────────────────────────────────────────────
// types/models.ts — Canonical data model (CRUISE_VOYAGE_JOURNAL_SPEC §3)
//
// These are the spec-level interfaces used by new pages and features.
// Legacy interfaces from src/types.ts remain for backward-compat with existing
// sections; migrate callers to these over time.
// ─────────────────────────────────────────────────────────────────────────────

export type UUID    = string
export type ISODate = string

export type Audience = 'private' | 'family' | 'public'

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:          UUID
  email:       string
  displayName: string
  avatarUrl?:  string
  createdAt:   ISODate
}

// ── Voyage ───────────────────────────────────────────────────────────────────

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

export interface Media {
  id:      UUID
  postId:  UUID
  url:     string
  type:    'image' | 'video'
  width?:  number
  height?: number
}

// ── Contact ──────────────────────────────────────────────────────────────────

export interface Contact {
  id:            UUID
  ownerId:       UUID    // the user who owns this contact entry
  contactUserId: UUID    // the user being contacted
  isFamily:      boolean // single tag — no multi-group system
  createdAt:     ISODate
}

// ── Feed ─────────────────────────────────────────────────────────────────────

/** A Post enriched with author + voyage context for display in the Feed */
export interface FeedEntry {
  post:        Post
  author:      User
  voyageTitle: string
  voyageId:    UUID
}
