import { describe, it, expect } from 'vitest'
import {
  fromDbVoyage,    toDbVoyage,
  fromDbItinerary, toDbItinerary,
  fromDbDailyLogs, toDbDailyLogs,
  fromDbFoodLogs,  toDbFoodLogs,
  fromDbDiningLog, toDbDiningLog,
  fromDbEntertainmentLog, toDbEntertainmentLog,
  fromDbFoodFav,   toDbFoodFav,
  fromDbHighlights, toDbHighlights,
  fromDbBudget,
  fromDbShopping,  toDbShoppingItems,
  fromDbPacking,   toDbPackingItems,
  fromDbNotes,     toDbNotes,
} from './converters'

// ── Voyage ────────────────────────────────────────────────────────────────────

describe('fromDbVoyage', () => {
  it('maps snake_case DB columns to camelCase app fields', () => {
    const row = {
      ship_name: 'MS Exploration', cruise_line: 'Royal', cabin: '4B', deck: '9',
      departure_date: '2026-06-01', return_date: '2026-06-15',
      departure_port: 'Southampton', total_nights: 14,
      companion_1: 'Jane', companion_2: null, companion_3: null, companion_4: null,
      emergency_contact: 'Dad', phone: '07700900123',
      guest_services: '555', muster_station: 'A3',
      dining_time: 'Early', cover_photo_url: 'https://example.com/photo.jpg',
    }
    const result = fromDbVoyage(row)
    expect(result.shipName).toBe('MS Exploration')
    expect(result.cruiseLine).toBe('Royal')
    expect(result.cabin).toBe('4B')
    expect(result.totalNights).toBe('14')   // stringified
    expect(result.companion1).toBe('Jane')
    expect(result.companion2).toBe('')       // null → ''
    expect(result.coverPhotoUrl).toBe('https://example.com/photo.jpg')
  })

  it('returns empty strings for all null/missing fields', () => {
    const result = fromDbVoyage({})
    expect(result.shipName).toBe('')
    expect(result.totalNights).toBe('')
    expect(result.coverPhotoUrl).toBe('')
  })
})

describe('toDbVoyage', () => {
  it('maps camelCase app fields to snake_case DB columns', () => {
    const v = { shipName: 'QM2', cruiseLine: 'Cunard', totalNights: '7', cabin: '3A', deck: '5', departureDate: '2026-07-01', returnDate: '2026-07-08', departurePort: 'New York', companion1: 'Bob', companion2: '', companion3: '', companion4: '', emergencyContact: 'Mum', phone: '', guestServices: '', musterStation: 'B1', diningTime: 'Late', coverPhotoUrl: '' }
    const result = toDbVoyage(v)
    expect(result.ship_name).toBe('QM2')
    expect(result.total_nights).toBe(7)    // parsed to int
    expect(result.companion_2).toBeNull()  // '' → null
    expect(result.departure_date).toBe('2026-07-01')
  })

  it('converts empty strings to null', () => {
    const result = toDbVoyage({ shipName: '', cruiseLine: '', cabin: '', deck: '', departureDate: '', returnDate: '', departurePort: '', totalNights: '', companion1: '', companion2: '', companion3: '', companion4: '', emergencyContact: '', phone: '', guestServices: '', musterStation: '', diningTime: '', coverPhotoUrl: '' })
    expect(result.ship_name).toBeNull()
    expect(result.total_nights).toBeNull()
  })
})

// ── Itinerary ─────────────────────────────────────────────────────────────────

describe('fromDbItinerary', () => {
  it('sorts by day_number and slices time to HH:MM', () => {
    const rows = [
      { day_number: 2, date: '2026-06-02', port: 'Lisbon',   arrive: '08:00:00', depart: '18:00:00' },
      { day_number: 1, date: '2026-06-01', port: 'At Sea',   arrive: null,        depart: null },
    ]
    const result = fromDbItinerary(rows)
    expect(result[0].port).toBe('At Sea')     // day 1 first
    expect(result[0].arrive).toBe('')          // null → ''
    expect(result[1].port).toBe('Lisbon')
    expect(result[1].arrive).toBe('08:00')    // sliced to HH:MM
    expect(result[1].depart).toBe('18:00')
  })
})

describe('toDbItinerary', () => {
  it('sets voyage_id and 1-based day_number on each row', () => {
    const arr = [
      { date: '2026-06-01', port: 'At Sea',  arrive: '',      depart: '' },
      { date: '2026-06-02', port: 'Madeira', arrive: '09:00', depart: '17:00' },
    ]
    const result = toDbItinerary('voyage-1', arr)
    expect(result[0].voyage_id).toBe('voyage-1')
    expect(result[0].day_number).toBe(1)
    expect(result[0].port).toBe('At Sea')
    expect(result[0].arrive).toBeNull()        // '' → null
    expect(result[1].day_number).toBe(2)
    expect(result[1].arrive).toBe('09:00')
  })
})

// ── Daily Logs ────────────────────────────────────────────────────────────────

describe('fromDbDailyLogs', () => {
  it('maps exc_cost/exc_notes/best_moment to camelCase', () => {
    const rows = [
      { day_number: 1, date: '2026-06-01', port: 'Southampton', weather: ['Sunny'], highlights: 'Great day', breakfast: 'Eggs', lunch: null, dinner: 'Steak', drink: 'Wine', activity: 'Jet ski', duration: '2h', exc_cost: '50', exc_notes: 'Worth it', entertainment: 'Show', best_moment: 'Sunset', rating: 5, is_public: true },
    ]
    const result = fromDbDailyLogs(rows)
    expect(result[0].excCost).toBe('50')
    expect(result[0].excNotes).toBe('Worth it')
    expect(result[0].bestMoment).toBe('Sunset')
    expect(result[0].isPublic).toBe(true)
    expect(result[0].lunch).toBe('')     // null → ''
    expect(result[0].weather).toEqual(['Sunny'])
  })

  it('defaults weather to [] when null', () => {
    const result = fromDbDailyLogs([{ day_number: 1, weather: null }])
    expect(result[0].weather).toEqual([])
  })
})

describe('toDbDailyLogs', () => {
  it('maps camelCase back to snake_case', () => {
    const arr = [{ date: '2026-06-01', port: 'At Sea', weather: [], highlights: 'Fun', breakfast: '', lunch: '', dinner: '', drink: '', activity: '', duration: '', excCost: '', excNotes: '', entertainment: '', bestMoment: '', rating: 0, isPublic: false }]
    const result = toDbDailyLogs('v1', arr)
    expect(result[0].voyage_id).toBe('v1')
    expect(result[0].day_number).toBe(1)
    expect(result[0].exc_cost).toBeNull()
    expect(result[0].best_moment).toBeNull()
    expect(result[0].is_public).toBe(false)
  })
})

// ── Food Logs ─────────────────────────────────────────────────────────────────

describe('fromDbFoodLogs', () => {
  it('maps meal_type/what_i_had/tasting_notes/order_again', () => {
    const rows = [{ day: 3, date: '2026-06-03', meal_type: 'Dinner', port: 'Lisbon', venue: 'Britannia', what_i_had: 'Salmon', standout: 'Sauce', drinks: 'Wine', tasting_notes: 'Superb', rating: 4, cost: '35', order_again: 'Yes' }]
    const result = fromDbFoodLogs(rows)
    expect(result[0].meal).toBe('Dinner')
    expect(result[0].what).toBe('Salmon')
    expect(result[0].notes).toBe('Superb')
    expect(result[0].orderAgain).toBe('Yes')
    expect(result[0].rating).toBe(4)
  })
})

describe('toDbFoodLogs', () => {
  it('maps app fields back to DB columns', () => {
    const arr = [{ day: 3, date: '2026-06-03', meal: 'Dinner', port: 'Lisbon', venue: 'Britannia', what: 'Salmon', standout: '', drinks: '', notes: 'Superb', rating: 4, cost: '35', orderAgain: 'Yes' }]
    const result = toDbFoodLogs('v1', arr)
    expect(result[0].meal_type).toBe('Dinner')
    expect(result[0].what_i_had).toBe('Salmon')
    expect(result[0].tasting_notes).toBe('Superb')
    expect(result[0].order_again).toBe('Yes')
    expect(result[0].standout).toBeNull()
  })
})

// ── Dining Log ────────────────────────────────────────────────────────────────

describe('fromDbDiningLog / toDbDiningLog', () => {
  it('round-trips cleanly (columns match app fields)', () => {
    const rows = [{ venue: 'Lido', date: '2026-06-05', meal: 'Lunch', ordered: 'Burger', rating: 3, notes: 'Decent' }]
    const app  = fromDbDiningLog(rows)
    expect(app[0].venue).toBe('Lido')
    expect(app[0].rating).toBe(3)

    const db = toDbDiningLog('v1', app)
    expect(db[0].voyage_id).toBe('v1')
    expect(db[0].ordered).toBe('Burger')
    expect(db[0].notes).toBe('Decent')
  })
})

// ── Entertainment Log ─────────────────────────────────────────────────────────

describe('fromDbEntertainmentLog', () => {
  it('converts integer day to string', () => {
    const rows = [{ day: 3, date: '2026-06-03', name: 'Show', type: 'Theatre', venue: 'Royal Court', performers: 'Cast', duration: '90 min', rating: 5, notes: 'Brilliant' }]
    const result = fromDbEntertainmentLog(rows)
    expect(result[0].day).toBe('3')
    expect(result[0].name).toBe('Show')
  })
})

describe('toDbEntertainmentLog', () => {
  it('parses string day back to integer', () => {
    const arr = [{ day: '3', date: '2026-06-03', name: 'Show', type: 'Theatre', venue: 'Royal Court', performers: '', duration: '90 min', rating: 5, notes: '' }]
    const result = toDbEntertainmentLog('v1', arr)
    expect(result[0].day).toBe(3)
    expect(result[0].performers).toBeNull()
  })

  it('sets day to null for empty string', () => {
    const result = toDbEntertainmentLog('v1', [{ day: '', date: '', name: '', type: '', venue: '', performers: '', duration: '', rating: 0, notes: '' }])
    expect(result[0].day).toBeNull()
  })
})

// ── Food Favourites ───────────────────────────────────────────────────────────

describe('fromDbFoodFav', () => {
  it('returns {} for null/undefined input', () => {
    expect(fromDbFoodFav(null)).toEqual({})
    expect(fromDbFoodFav(undefined)).toEqual({})
  })

  it('maps all six fields', () => {
    const row = { best: 'Lobster', buffet: 'Sushi', specialty: 'Wagyu', surprising: 'Mochi', recreate: 'Pasta', regret: 'Salad' }
    const result = fromDbFoodFav(row)
    expect(result.best).toBe('Lobster')
    expect(result.regret).toBe('Salad')
  })
})

describe('toDbFoodFav', () => {
  it('includes voyage_id', () => {
    const result = toDbFoodFav('v1', { best: 'Lobster', buffet: '', specialty: '', surprising: '', recreate: '', regret: '' })
    expect(result.voyage_id).toBe('v1')
    expect(result.best).toBe('Lobster')
    expect(result.buffet).toBeNull()
  })
})

// ── Highlights ────────────────────────────────────────────────────────────────

describe('fromDbHighlights', () => {
  it('returns {} for null input', () => {
    expect(fromDbHighlights(null)).toEqual({})
  })

  it('maps first_time to firstTime', () => {
    const row = { port: 'Lisbon', meal: 'Pastel', funny: 'Lost map', view: 'Sunset', friends: 'Bar', first_time: 'Paragliding', moment: 'Dolphins' }
    const result = fromDbHighlights(row)
    expect(result.firstTime).toBe('Paragliding')
    expect(result.port).toBe('Lisbon')
  })
})

describe('toDbHighlights', () => {
  it('maps firstTime to first_time', () => {
    const result = toDbHighlights('v1', { port: '', meal: '', funny: '', view: '', friends: '', firstTime: 'Paragliding', moment: '' })
    expect(result.first_time).toBe('Paragliding')
    expect(result.voyage_id).toBe('v1')
    expect(result.port).toBeNull()
  })
})

// ── Budget ────────────────────────────────────────────────────────────────────

describe('fromDbBudget', () => {
  it('converts numeric amounts to strings', () => {
    const budgetRow = { total_budget: 2000 }
    const items = [{ date: '2026-06-01', item: 'Excursion', category: 'Activities', amount: 75.5 }]
    const result = fromDbBudget(budgetRow, items)
    expect(result.budget).toBe(2000)
    expect(result.items[0].amount).toBe('75.5')
  })

  it('handles missing budget row', () => {
    const result = fromDbBudget(null, [])
    expect(result.budget).toBe('')
    expect(result.items).toEqual([])
  })
})

// ── Shopping ──────────────────────────────────────────────────────────────────

describe('fromDbShopping', () => {
  it('wraps items and converts cost to string', () => {
    const rows = [{ item: 'Fridge magnet', port: 'Madeira', cost: 3.5 }]
    const result = fromDbShopping(rows)
    expect(result.items[0].cost).toBe('3.5')
    expect(result.items[0].item).toBe('Fridge magnet')
  })

  it('returns empty items array for empty input', () => {
    expect(fromDbShopping([]).items).toEqual([])
  })
})

describe('toDbShoppingItems', () => {
  it('parses cost string to float', () => {
    const result = toDbShoppingItems('v1', [{ item: 'Hat', port: 'Barcelona', cost: '12.99' }])
    expect(result[0].cost).toBeCloseTo(12.99)
    expect(result[0].voyage_id).toBe('v1')
  })

  it('sets cost to null for empty string', () => {
    const result = toDbShoppingItems('v1', [{ item: 'Hat', port: '', cost: '' }])
    expect(result[0].cost).toBeNull()
  })
})

// ── Packing ───────────────────────────────────────────────────────────────────

describe('fromDbPacking', () => {
  it('builds { [category]: string[] } from checked rows only', () => {
    const rows = [
      { category: 'Clothing', item: 'T-shirts', checked: true },
      { category: 'Clothing', item: 'Jeans',    checked: false },
      { category: 'Toiletries', item: 'Sunscreen', checked: true },
    ]
    const result = fromDbPacking(rows)
    expect(result.Clothing).toEqual(['T-shirts'])
    expect(result.Toiletries).toEqual(['Sunscreen'])
    expect(result.Jeans).toBeUndefined()
  })

  it('returns empty object when no rows are checked', () => {
    expect(fromDbPacking([{ category: 'x', item: 'y', checked: false }])).toEqual({})
  })
})

describe('toDbPackingItems', () => {
  it('flattens category→items object into rows', () => {
    const obj = { Clothing: ['T-shirts', 'Jeans'], Toiletries: ['Sunscreen'] }
    const result = toDbPackingItems('v1', obj)
    expect(result).toHaveLength(3)
    expect(result.every(r => r.voyage_id === 'v1')).toBe(true)
    expect(result.every(r => r.checked === true)).toBe(true)
    expect(result.find(r => r.item === 'T-shirts')?.category).toBe('Clothing')
  })
})

// ── Notes ─────────────────────────────────────────────────────────────────────

describe('fromDbNotes / toDbNotes', () => {
  it('round-trips { title, content } objects', () => {
    const rows = [
      { title: 'Day 1', content: 'Great start' },
      { title: null,    content: 'Random thought' },
    ]
    const app = fromDbNotes(rows)
    expect(app[0].title).toBe('Day 1')
    expect(app[1].title).toBe('')       // null → ''

    const db = toDbNotes('v1', app)
    expect(db[0].voyage_id).toBe('v1')
    expect(db[0].title).toBe('Day 1')
    expect(db[1].title).toBeNull()      // '' → null
    expect(db[0].content).toBe('Great start')
  })
})
