# Cruise Voyage Journal — Architecture & Build Spec

> Working spec for the Cruise Voyage Journal web app. This document is the source of truth for product behavior, data model, page structure, and architectural rules. Update this file as decisions change.

---

## 1. Product Overview

A **journal-first** web app for documenting cruise voyages. Users keep private day-by-day journals organized by voyage. Individual posts can be **opt-in shared** to a social Feed visible to the user's contacts. The journal is the primary surface; the Feed is secondary.

### Core Principles

1. **Journal-first.** Voyages and their posts are the primary surface. The Feed is a secondary view.
2. **Privacy by default.** New posts are `private` until the user explicitly chooses an audience.
3. **Per-post sharing only.** Sharing happens on individual posts. There is no "share entire voyage" action.
4. **Three-state audience model.** Each post is `private`, `family`, or `public`. No multi-group system.
5. **Live edits propagate.** Shared posts are *not* snapshot-copied to the Feed. Edits and deletes propagate immediately.
6. **Edit-confirm guardrail.** Editing a non-private post shows a banner reminding the user of the current audience.
7. **Flat chronological Feed.** Feed is not grouped by voyage; each item links back to its source voyage.

---

## 2. Recommended Tech Stack

Opinionated defaults. Swap any layer; the architecture sections below are stack-agnostic.

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type-safety across data model |
| Framework | React 18 | Component model fits the page/tree spec |
| Build | Vite | Fast dev server, simple config |
| Routing | React Router v6 | Standard, file-route friendly |
| Server state | TanStack Query (React Query) | Cache + invalidation for live-edit propagation |
| Client state | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind CSS | Matches component-first design |
| Forms | React Hook Form + Zod | Validated composer/editor |
| Backend | Node + Express OR Supabase | Either works; Supabase saves boilerplate for auth + storage |
| Database | PostgreSQL | Relational fit (voyages → posts → media) |
| Media storage | S3 / Supabase Storage | Photo uploads |
| Auth | Supabase Auth OR Auth0 | Email + social login |

---

## 3. Data Model

### TypeScript interfaces

```ts
// src/types/models.ts

export type UUID = string;
export type ISODate = string;

export type Audience = 'private' | 'family' | 'public';

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: ISODate;
}

export interface Voyage {
  id: UUID;
  userId: UUID;            // owner
  title: string;           // e.g. "Mediterranean — Sept 2026"
  shipName?: string;
  cruiseLine?: string;
  startDate: ISODate;
  endDate: ISODate;
  coverImageUrl?: string;
  itinerary?: PortStop[];  // optional
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PortStop {
  date: ISODate;
  portName: string;
  notes?: string;
}

export interface Post {
  id: UUID;
  voyageId: UUID;
  userId: UUID;            // denormalized from voyage.userId for query speed
  title?: string;
  body: string;
  postDate: ISODate;       // the date the entry describes (can differ from createdAt)
  location?: string;
  mediaIds: UUID[];
  audience: Audience;      // default: 'private'
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Media {
  id: UUID;
  postId: UUID;
  url: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface Contact {
  id: UUID;
  ownerId: UUID;           // the user who owns this contact entry
  contactUserId: UUID;     // the user being contacted
  isFamily: boolean;       // single tag, no multi-group system
  createdAt: ISODate;
}
```

### Defaults

- `Post.audience` defaults to `'private'` on creation.
- `Contact.isFamily` defaults to `false`.
- `Voyage` has no audience field — only individual posts are shareable.

### Indexing recommendations (Postgres)

```sql
CREATE INDEX idx_posts_voyage      ON posts (voyage_id, post_date DESC);
CREATE INDEX idx_posts_user        ON posts (user_id, created_at DESC);
CREATE INDEX idx_posts_feed        ON posts (audience, created_at DESC)
                                  WHERE audience IN ('family','public');
CREATE INDEX idx_contacts_owner    ON contacts (owner_id, contact_user_id);
CREATE INDEX idx_contacts_reverse  ON contacts (contact_user_id, owner_id);
```

The partial index on `posts(audience, created_at)` keeps the Feed query fast and excludes private posts entirely.

---

## 4. Routing / Pages

| Route | Page | Auth |
|---|---|---|
| `/login` | LoginPage | public |
| `/signup` | SignupPage | public |
| `/` → `/voyages` | redirect | private |
| `/voyages` | VoyagesPage (My Voyages) | private |
| `/voyages/new` | VoyageEditorPage (create) | private |
| `/voyages/:voyageId` | VoyageDetailPage | private |
| `/voyages/:voyageId/edit` | VoyageEditorPage (edit) | private |
| `/voyages/:voyageId/posts/new` | PostComposerPage | private |
| `/voyages/:voyageId/posts/:postId` | PostDetailPage | private |
| `/voyages/:voyageId/posts/:postId/edit` | PostEditorPage | private |
| `/feed` | FeedPage | private |
| `/contacts` | ContactsPage | private |
| `/profile` | ProfilePage | private |

### Page-level specs

#### VoyagesPage

- Header: "My Voyages" + `[+ New Voyage]` button
- Body: grid/list of `VoyageCard` (cover image, title, date range, post count)
- Click → `/voyages/:voyageId`

#### VoyageDetailPage

- Header: voyage title, dates, ship, `[Edit Voyage]`
- Subheader: `[+ New Post]`
- Body: reverse-chronological list of `PostCard`
- Each `PostCard` shows `AudiencePill` (Private/Family/Public) inline and `[Edit]` / `[Delete]` actions

#### PostComposerPage / PostEditorPage

Same component, mode-toggled.

- Fields: voyage picker (defaulted from route), date, title, body, media uploader, location
- `AudienceSelector` — segmented control: `[Private] [Family] [Public]`
- New post: default `Private`
- Edit mode: if existing `audience != 'private'`, show `EditConfirmBanner` at top (see §6)
- `[Save]` / `[Cancel]`

#### FeedPage

- Header: "Feed"
- Body: flat chronological list of `FeedItem`
- Each `FeedItem` shows: author avatar + name, relative timestamp, voyage breadcrumb (linkable), post content preview, media, audience pill on own posts
- Reads live from the underlying `Post` (no snapshot)
- Filter chip (future): All / Family / Public

#### ContactsPage

- Search input
- Rows: avatar, name, email, `[Family]` toggle (boolean checkbox)
- Add contact via email lookup or invite

#### ProfilePage

- Avatar, display name, email
- Logout

---

## 5. Component Tree

```
App
├── AppShell
│   ├── TopNav  (Voyages | Feed | Contacts | Profile)
│   └── <Outlet/>
│
├── VoyagesPage
│   ├── VoyageCard (× N)
│   └── NewVoyageButton
│
├── VoyageEditorPage          (create + edit shared)
│   ├── VoyageForm
│   └── ItineraryEditor       (optional, port stops)
│
├── VoyageDetailPage
│   ├── VoyageHeader
│   ├── NewPostButton
│   └── PostList
│       └── PostCard (× N)
│           ├── AudiencePill
│           ├── MediaThumbnails
│           └── PostActions   (Edit, Delete, Change audience)
│
├── PostComposerPage / PostEditorPage   (shared)
│   ├── EditConfirmBanner     (visible only in edit mode when audience != 'private')
│   ├── VoyagePicker
│   ├── DateField
│   ├── TitleField
│   ├── BodyEditor
│   ├── MediaUploader
│   ├── LocationField
│   └── AudienceSelector      (segmented control)
│
├── PostDetailPage
│   ├── PostHeader (author, voyage breadcrumb, audience pill)
│   ├── MediaGallery
│   ├── PostBody
│   └── PostActions
│
├── FeedPage
│   └── FeedItem (× N)
│       ├── AuthorChip
│       ├── VoyageBreadcrumb
│       ├── PostPreview
│       └── MediaThumbnails
│
├── ContactsPage
│   ├── ContactSearch
│   └── ContactRow (× N)
│       └── FamilyToggle
│
└── ProfilePage
    ├── AvatarUploader
    └── ProfileForm
```

### Shared / primitive components

```
ui/
├── AudiencePill.tsx        (read-only chip: Private | Family | Public)
├── AudienceSelector.tsx    (segmented control for editing)
├── EditConfirmBanner.tsx
├── MediaUploader.tsx
├── MediaThumbnails.tsx
├── Avatar.tsx
├── DateField.tsx
└── Modal.tsx
```

---

## 6. Audience & Sharing Rules

### Three-state audience

| Value | Meaning | Visible in Feed |
|---|---|---|
| `private` | Journal-only | Never |
| `family` | Contacts where `isFamily == true` | Yes — to Family contacts only |
| `public` | All contacts | Yes — to all contacts |

### AudienceSelector behavior

- Segmented control with three states. Always shows current state.
- Default for new posts: `private`.
- Changing audience is a single click; saved on form submit.

### EditConfirmBanner spec

Shown on `PostEditorPage` only when entering edit mode and `post.audience != 'private'`.

```
┌──────────────────────────────────────────────────────────┐
│ ⓘ This post is currently visible to {Family|Public}.     │
│   Your edit will be visible immediately.                 │
│   [ Change audience ▾ ]                  [ Got it ]      │
└──────────────────────────────────────────────────────────┘
```

- `[Got it]` dismisses for this edit session.
- `[Change audience ▾]` opens the `AudienceSelector` inline (or scrolls to it).
- Reappears every time the user enters edit mode (not stored as "dismissed forever").

### Edit propagation semantics

- Edits to a shared Post update the Feed live. The Feed reads the source row; there is no snapshot table.
- Deletes remove the Post from all Feeds immediately.
- Audience changes take effect immediately: setting `public → private` removes the post from all Feeds on the next read.

---

## 7. Feed Visibility Logic

Single source of truth for visibility. Implement once in the data layer.

### Pseudocode

```ts
function canSeeInFeed(viewer: User, post: Post, author: User): boolean {
  if (post.audience === 'private') return false;
  if (viewer.id === author.id) return true;  // own posts always visible to self
  const contact = getContact(authorId: author.id, contactUserId: viewer.id);
  if (!contact) return false;                // not a contact of the author
  if (post.audience === 'public') return true;
  if (post.audience === 'family') return contact.isFamily;
  return false;
}
```

### SQL — Feed query for a given viewer

```sql
SELECT p.*
FROM posts p
JOIN contacts c
  ON c.owner_id = p.user_id          -- author owns the contact entry
 AND c.contact_user_id = $viewerId   -- viewer is the contact
WHERE p.audience IN ('public', 'family')
  AND (p.audience = 'public' OR c.is_family = true)
UNION ALL
SELECT p.*
FROM posts p
WHERE p.user_id = $viewerId
  AND p.audience IN ('public', 'family')   -- viewer's own shared posts
ORDER BY created_at DESC
LIMIT 50;
```

Notes:
- The contact relationship is **author-owned**: only the author's contacts can see the author's posts. A viewer being in their own contact list of the author is what grants access.
- `private` posts are never returned. The partial index on `posts(audience)` excludes them at the index level.

---

## 8. Folder Structure

```
src/
├── main.tsx
├── App.tsx
├── router.tsx
│
├── pages/
│   ├── VoyagesPage.tsx
│   ├── VoyageDetailPage.tsx
│   ├── VoyageEditorPage.tsx
│   ├── PostComposerPage.tsx
│   ├── PostEditorPage.tsx
│   ├── PostDetailPage.tsx
│   ├── FeedPage.tsx
│   ├── ContactsPage.tsx
│   ├── ProfilePage.tsx
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
│
├── features/
│   ├── voyages/
│   │   ├── VoyageCard.tsx
│   │   ├── VoyageForm.tsx
│   │   ├── ItineraryEditor.tsx
│   │   └── hooks.ts          (useVoyages, useVoyage, useCreateVoyage, ...)
│   │
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostList.tsx
│   │   ├── PostEditorForm.tsx
│   │   ├── EditConfirmBanner.tsx
│   │   ├── AudienceSelector.tsx
│   │   ├── AudiencePill.tsx
│   │   └── hooks.ts          (usePost, usePostsByVoyage, useUpdatePost, ...)
│   │
│   ├── feed/
│   │   ├── FeedItem.tsx
│   │   ├── feedVisibility.ts (canSeeInFeed)
│   │   └── hooks.ts          (useFeed)
│   │
│   ├── contacts/
│   │   ├── ContactRow.tsx
│   │   ├── FamilyToggle.tsx
│   │   └── hooks.ts
│   │
│   └── auth/
│       ├── AuthProvider.tsx
│       └── hooks.ts
│
├── ui/                        (shared primitives)
│   ├── Avatar.tsx
│   ├── Modal.tsx
│   ├── DateField.tsx
│   ├── MediaUploader.tsx
│   └── MediaThumbnails.tsx
│
├── types/
│   └── models.ts
│
├── lib/
│   ├── api.ts                 (REST client OR Supabase client)
│   ├── queryClient.ts         (React Query setup)
│   └── format.ts              (date/relative time helpers)
│
└── styles/
    └── tailwind.css
```

---

## 9. Data Layer / API Surface

### REST endpoints (if rolling own backend)

```
GET    /api/voyages
POST   /api/voyages
GET    /api/voyages/:id
PATCH  /api/voyages/:id
DELETE /api/voyages/:id

GET    /api/voyages/:id/posts
POST   /api/voyages/:id/posts
GET    /api/posts/:id
PATCH  /api/posts/:id            // body OR audience can change
DELETE /api/posts/:id

GET    /api/feed                 // applies feed visibility for the viewer
GET    /api/contacts
POST   /api/contacts
PATCH  /api/contacts/:id         // toggle isFamily
DELETE /api/contacts/:id

GET    /api/me
PATCH  /api/me
```

### React Query hook surface

```ts
// voyages
useVoyages()
useVoyage(voyageId)
useCreateVoyage()
useUpdateVoyage()
useDeleteVoyage()

// posts
usePostsByVoyage(voyageId)
usePost(postId)
useCreatePost()
useUpdatePost()           // invalidates ['feed'] when audience or body changes
useDeletePost()           // invalidates ['feed']

// feed
useFeed()                 // single live query, server applies visibility

// contacts
useContacts()
useUpsertContact()
useToggleFamily(contactId)
```

### Cache invalidation rules

- `useUpdatePost` and `useDeletePost` MUST invalidate `['feed']` so live-edit propagation is visible without a page refresh.
- `useToggleFamily` MUST invalidate `['feed']` because audience-by-family resolution changes for that viewer.
- Voyage edits do not affect the Feed (no voyage-level audience).

---

## 10. Implementation Order (suggested milestones)

1. **Bootstrap** — Vite + React + TS + Tailwind + Router skeleton; auth stub (mock user).
2. **Data layer** — types, mock API or Supabase wire-up, React Query setup.
3. **Voyages CRUD** — VoyagesPage, VoyageEditorPage, VoyageDetailPage shells (no posts yet).
4. **Posts CRUD** — Composer/Editor with `AudienceSelector` (default Private). PostCard + PostList in VoyageDetail.
5. **EditConfirmBanner** — show when editing non-private post.
6. **Contacts** — ContactsPage + `FamilyToggle`.
7. **Feed** — FeedPage + `canSeeInFeed` + live invalidation.
8. **Media** — upload + thumbnails.
9. **Auth polish** — real auth, signup flow, password reset.
10. **Polish** — empty states, loading skeletons, error boundaries.

---

## 11. Open Questions / Future

- **Comments / reactions on Feed items.** Not in scope yet.
- **Voyage cover image upload.** Use same `MediaUploader` once built.
- **Push notifications** for new shared posts from Family — likely Phase 2.
- **Offline composing** for at-sea use — local-first store with sync on reconnect. Phase 2+.
- **Export voyage as PDF/photobook** — natural future feature, not architectural blocker.
- **Voyage templates** ("Caribbean 7-day") — UI sugar, no data-model change.
- **Multiple media per post ordering** — current model uses `mediaIds: UUID[]`; order = array order.
- **Soft delete vs hard delete on posts** — current spec: hard delete propagates. Revisit if undo is wanted.

---

## 12. Glossary

- **Voyage** — top-level container for a single cruise; the journal "book."
- **Post** — single entry within a voyage; the journal "page."
- **Audience** — `private` | `family` | `public`; per-post.
- **Feed** — flat chronological view of shared posts from contacts + self.
- **Family** — a single boolean tag on a Contact. Not a group; not extensible to other tags.
- **Live-edit propagation** — edits to shared posts appear in Feed immediately; no snapshot.

---

*Spec version: 0.1 — keep updated as decisions land.*
