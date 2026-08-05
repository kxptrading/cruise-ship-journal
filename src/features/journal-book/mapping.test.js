import { describe, it, expect } from 'vitest'
import {
  buildBook, buildChecklist, buildStory, toWeatherChip, dateLabel, MAX_PHOTOS_PER_DAY,
} from './mapping'

describe('toWeatherChip', () => {
  it('maps the app vocabulary to the four design chips', () => {
    expect(toWeatherChip(['Sunny'])).toBe('SUNNY')
    expect(toWeatherChip(['Hot'])).toBe('SUNNY')
    expect(toWeatherChip(['Cloudy'])).toBe('CLOUDY')
    expect(toWeatherChip(['Mild'])).toBe('CLOUDY')
    expect(toWeatherChip(['Cool'])).toBe('CLOUDY')
    expect(toWeatherChip(['Rainy'])).toBe('RAINY')
    expect(toWeatherChip(['Windy'])).toBe('STORMY')
  })
  it('is case-insensitive and uses the first tag', () => {
    expect(toWeatherChip(['sunny', 'Rainy'])).toBe('SUNNY')
  })
  it('returns null for empty or unknown weather (chip hidden)', () => {
    expect(toWeatherChip([])).toBeNull()
    expect(toWeatherChip(null)).toBeNull()
    expect(toWeatherChip(['Foggy'])).toBeNull()
  })
})

describe('dateLabel', () => {
  it('formats an ISO date as "MONTH D" uppercase', () => {
    expect(dateLabel('2026-06-03')).toBe('JUNE 3')
  })
  it('returns empty for missing/invalid dates', () => {
    expect(dateLabel(null)).toBe('')
    expect(dateLabel('not-a-date')).toBe('')
  })
})

describe('buildChecklist', () => {
  it('includes only rows whose source has content', () => {
    const items = buildChecklist({ breakfast: 'pastry', best_moment: 'sunset' })
    expect(items).toEqual([
      { label: 'I ate:', value: 'pastry' },
      { label: 'Favorite moment:', value: 'sunset' },
    ])
  })
  it('joins meal fields for "I ate" and activity+entertainment for "I saw"', () => {
    const items = buildChecklist({ breakfast: 'eggs', dinner: 'pasta', activity: 'museum', entertainment: 'jazz' })
    expect(items[0]).toEqual({ label: 'I ate:', value: 'eggs, pasta' })
    expect(items[1]).toEqual({ label: 'I saw:', value: 'museum, jazz' })
  })
  it('returns nothing when all sources are empty', () => {
    expect(buildChecklist({})).toEqual([])
  })
})

describe('buildStory', () => {
  it('prefers highlights, then best_moment, then activity', () => {
    expect(buildStory({ highlights: 'H', best_moment: 'B', activity: 'A' })).toBe('H')
    expect(buildStory({ best_moment: 'B', activity: 'A' })).toBe('B')
    expect(buildStory({ activity: 'A' })).toBe('A')
    expect(buildStory({})).toBe('')
  })
})

describe('buildBook', () => {
  const voyage = {
    id: 'v1', destination: 'Italy', ship_name: 'Azure', cruise_line: 'Celestia',
    departure_date: '2026-06-03', return_date: '2026-06-10', cover_photo_url: 'cover.jpg',
  }

  it('builds a cover from the voyage + owner', () => {
    const { cover } = buildBook(voyage, [], [], 'Sam Lee')
    expect(cover).toEqual({
      title: 'Italy', subtitle: 'Celestia', dateRange: 'JUNE 3 – JUNE 10',
      owner: 'Sam Lee', photoUrl: 'cover.jpg',
    })
  })

  it('falls back to ship name and a default subtitle', () => {
    const { cover } = buildBook({ id: 'v', ship_name: 'Azure' }, [], [], '')
    expect(cover.title).toBe('Azure')
    expect(cover.subtitle).toBe('wander often · write always')
    expect(cover.photoUrl).toBeNull()
  })

  it('orders days by day_number and drops empty days', () => {
    const logs = [
      { day_number: 3, highlights: 'third' },
      { day_number: 1, highlights: 'first' },
      { day_number: 2 }, // empty → dropped
    ]
    const { days } = buildBook(voyage, logs, [], 'x')
    expect(days.map(d => d.dayNumber)).toEqual([1, 3])
  })

  it('keeps an otherwise-empty day if it has photos', () => {
    const logs = [{ day_number: 1 }]
    const photos = [{ day_number: 1, url: 'a.jpg', caption: 'hi' }]
    const { days } = buildBook(voyage, logs, photos, 'x')
    expect(days).toHaveLength(1)
    expect(days[0].photos).toEqual([{ url: 'a.jpg', caption: 'hi' }])
  })

  it('caps photos per day at MAX_PHOTOS_PER_DAY', () => {
    const logs = [{ day_number: 1, highlights: 'x' }]
    const photos = Array.from({ length: 5 }, (_, i) => ({ day_number: 1, url: `${i}.jpg`, caption: '' }))
    const { days } = buildBook(voyage, logs, photos, 'x')
    expect(days[0].photos).toHaveLength(MAX_PHOTOS_PER_DAY)
    expect(days[0].photos.map(p => p.url)).toEqual(['0.jpg', '1.jpg', '2.jpg'])
  })

  it('clamps mood to 0–5 and hides it at 0', () => {
    const { days } = buildBook(voyage, [
      { day_number: 1, highlights: 'a', rating: 9 },
      { day_number: 2, highlights: 'b', rating: 0 },
    ], [], 'x')
    expect(days[0].mood).toBe(5)
    expect(days[1].mood).toBe(0)
  })
})
