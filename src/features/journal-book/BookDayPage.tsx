// ─────────────────────────────────────────────────────────────────────────────
// features/journal-book/BookDayPage.tsx — one filled day page
//
// Header (Day N · date · location), weather chip + mood dots, a scrapbook cluster
// of ≤3 polaroids, the narrative paragraph, and the highlights checklist — laid
// out to match the filled sample pages in the design handoff. Page-number stamp
// bottom-right. Photo-cluster positions vary by photo count for scrapbook variety.
// ─────────────────────────────────────────────────────────────────────────────

import { BOOK, BOOK_FONT } from './tokens'
import { PageShell, Polaroid, WashiTape, WeatherChip, MoodDots, PageStamp } from './primitives'
import type { BookDay } from './mapping'

interface Slot { left: number; top: number; width: number; photoH: number; rotate: number; z: number }

// Preset polaroid arrangements by photo count (coordinates within the padded
// content box, ~504px wide). Mirrors the handoff Day 1/3/4 clusters.
const SLOTS: Record<number, Slot[]> = {
  1: [{ left: 150, top: 6, width: 210, photoH: 170, rotate: -3, z: 2 }],
  2: [
    { left: 6,   top: 16, width: 190, photoH: 150, rotate: 3,  z: 2 },
    { left: 240, top: 0,  width: 175, photoH: 155, rotate: -4, z: 3 },
  ],
  3: [
    { left: 0,   top: 16, width: 150, photoH: 118, rotate: -6, z: 2 },
    { left: 135, top: 0,  width: 160, photoH: 128, rotate: 4,  z: 3 },
    { left: 305, top: 28, width: 140, photoH: 108, rotate: -3, z: 4 },
  ],
}
const CLUSTER_H: Record<number, number> = { 1: 210, 2: 190, 3: 200 }

function PhotoCluster({ photos }: { photos: BookDay['photos'] }) {
  const n = Math.min(photos.length, 3) as 1 | 2 | 3
  const slots = SLOTS[n]
  return (
    <div style={{ position: 'relative', height: CLUSTER_H[n], marginTop: 6 }}>
      <WashiTape color="rgba(63,125,120,0.75)" w={60} h={20} rotate={-8} style={{ top: -6, left: 24, zIndex: 5 }} />
      {photos.slice(0, 3).map((p, i) => (
        <Polaroid
          key={i}
          url={p.url}
          caption={p.caption}
          photoH={slots[i].photoH}
          rotate={slots[i].rotate}
          style={{ position: 'absolute', left: slots[i].left, top: slots[i].top, width: slots[i].width, zIndex: slots[i].z }}
        />
      ))}
    </div>
  )
}

export default function BookDayPage({ day, pageNumber }: { day: BookDay; pageNumber: number }) {
  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: BOOK_FONT.hand, fontWeight: 700, fontSize: 42, color: BOOK.terracotta }}>Day {day.dayNumber}</span>
        {day.dateLabel && <span style={{ fontFamily: BOOK_FONT.body, fontSize: 12, color: BOOK.inkSoft, fontWeight: 700, letterSpacing: 0.5 }}>{day.dateLabel}</span>}
        {day.location && <span style={{ marginLeft: 'auto', fontFamily: BOOK_FONT.body, fontWeight: 800, fontSize: 12, letterSpacing: 1, color: BOOK.olive, textTransform: 'uppercase' }}>{day.location}</span>}
      </div>

      {/* Weather + mood */}
      {(day.weather || day.mood > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {day.weather && <WeatherChip value={day.weather} />}
          {day.mood > 0 && <span style={{ marginLeft: day.weather ? 8 : 0 }}><MoodDots value={day.mood} /></span>}
        </div>
      )}

      {/* Photo cluster */}
      {day.photos.length > 0 && <PhotoCluster photos={day.photos} />}

      {/* Narrative */}
      {day.story && (
        <div style={{ marginTop: 12, fontFamily: BOOK_FONT.body, fontSize: 13.5, lineHeight: 1.7, color: BOOK.ink }}>
          {day.story}
        </div>
      )}

      {/* Checklist */}
      {day.checklist.length > 0 && (
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {day.checklist.map((item, i) => (
            <div key={i}>
              <span style={{ fontFamily: BOOK_FONT.hand, fontWeight: 600, fontSize: 15, color: BOOK.terracotta }}>{item.label}</span>{' '}
              <span style={{ fontFamily: BOOK_FONT.body, fontSize: 12.5, color: BOOK.ink }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <PageStamp n={pageNumber} />
    </PageShell>
  )
}
