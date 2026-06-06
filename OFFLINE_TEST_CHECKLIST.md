# Offline-First PWA — Manual Test Checklist

## Setup
1. Build the app: `npm run build && npm run preview`
2. Open Chrome DevTools → Application → Service Workers — confirm SW is registered and active.
3. Use DevTools → Network → "Offline" toggle to simulate no connection.

---

## A. App shell loads offline

- [ ] Toggle offline. Hard-refresh the page.
- [ ] App loads fully (nav, layout, logo) without a network error screen.
- [ ] Cached journal data from previous session is visible.

---

## B. Journal entry while offline

- [ ] Toggle offline.
- [ ] Open a voyage → Daily Log. Edit any field (highlights, meals, weather).
- [ ] **Expected**: field saves immediately; no error or spinner.
- [ ] SyncStatusPill shows **"Saving to this device"** (amber pill).
- [ ] OfflineBanner appears below the top nav.
- [ ] Hard-refresh — edited content is still there (from localStorage + IndexedDB).

---

## C. Create new items while offline (food log, shopping, notes)

- [ ] Toggle offline.
- [ ] Add a food log entry. Confirm it appears in the list immediately.
- [ ] Add a shopping item. Confirm it appears immediately.
- [ ] Add a note. Confirm it saves.
- [ ] Hard-refresh — all three items still present.

---

## D. Checklist item while offline

- [ ] Toggle offline.
- [ ] Open Packing List. Check / uncheck an item.
- [ ] Hard-refresh — checked state persists.

---

## E. Reconnect + auto-sync

- [ ] After B/C/D, toggle **online** again.
- [ ] **Expected**: SyncStatusPill transitions to **"Uploading your memories…"** (blue).
- [ ] After a few seconds: **"Everything synced"** (teal, auto-hides).
- [ ] Open Supabase → verify rows exist in the relevant tables.

---

## F. Failed sync → retry

- [ ] Simulate a sync failure: temporarily point VITE_SUPABASE_URL to an invalid URL in .env.local.
- [ ] Make an edit while online — sync attempt fires and fails.
- [ ] SyncStatusPill shows **"Sync failed"** (red pill with Retry button).
- [ ] Restore correct URL. Click **Retry**.
- [ ] **Expected**: data syncs successfully, pill returns to teal.

---

## G. No duplicate entries on re-sync

- [ ] Make an edit. Confirm it syncs (teal pill).
- [ ] Manually delete the queue item from IndexedDB (DevTools → Application → IndexedDB → DeckDaysDB → syncQueue).
- [ ] Make the same edit again and re-sync.
- [ ] **Expected**: only one row in Supabase (UPSERT, not duplicate INSERT).

---

## H. Photos remain visible offline

- [ ] While online, upload a photo to the Daily Log.
- [ ] Toggle offline.
- [ ] Navigate to the same day.
- [ ] **Expected**: thumbnail is visible (cached). Full photo may not load if signed URL is expired — that is acceptable for now.

---

## I. PWA install prompt

- [ ] On Chrome desktop: address bar shows an install icon. Click it.
- [ ] App opens as a standalone window (no browser chrome).
- [ ] On Android Chrome: "Add to Home Screen" prompt appears after a few visits.
- [ ] On iOS Safari: Share → Add to Home Screen. App opens in standalone mode.

---

## J. App still works after browser refresh with service worker update

- [ ] Deploy a new build. Open app in existing tab.
- [ ] Hard-refresh — new SW activates automatically (autoUpdate).
- [ ] No stale content served from old cache.

---

## Notes
- IndexedDB state can be inspected in Chrome DevTools → Application → IndexedDB → DeckDaysDB.
- Service worker cache can be inspected under Cache Storage → workbox-precache-* and workbox-runtime-*.
- The sync queue table shows items with `attempts > 0` for failed retries.
