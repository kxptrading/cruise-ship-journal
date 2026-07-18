import { describe, it, expect } from 'vitest'
import { passCoversNights, selectEligiblePass, fulfillmentPlan } from './eligibility'
import { tierForNights, SKU_STANDARD, SKU_EXTENDED } from './pricing'

// Shorthands for building available passes.
const std = (purchased_at = '2026-01-01') => ({ max_nights: 7, status: 'available', purchased_at })
const ext = (purchased_at = '2026-01-01') => ({ max_nights: null, status: 'available', purchased_at })

describe('passCoversNights — the 7 vs 8 boundary', () => {
  it('a standard pass (≤7) covers exactly 7 nights but not 8', () => {
    expect(passCoversNights({ max_nights: 7 }, 7)).toBe(true)
    expect(passCoversNights({ max_nights: 7 }, 8)).toBe(false)
  })

  it('a standard pass covers shorter trips', () => {
    expect(passCoversNights({ max_nights: 7 }, 1)).toBe(true)
    expect(passCoversNights({ max_nights: 7 }, 5)).toBe(true)
  })

  it('an any-length pass (null) covers any number of nights', () => {
    expect(passCoversNights({ max_nights: null }, 8)).toBe(true)
    expect(passCoversNights({ max_nights: null }, 30)).toBe(true)
    expect(passCoversNights({ max_nights: null }, 7)).toBe(true)
  })
})

describe('tierForNights — preselected tier at the boundary', () => {
  it('routes ≤7 nights to Standard, 8+ to Extended', () => {
    expect(tierForNights(7)).toBe(SKU_STANDARD)
    expect(tierForNights(8)).toBe(SKU_EXTENDED)
    expect(tierForNights(0)).toBe(SKU_STANDARD)
    expect(tierForNights(14)).toBe(SKU_EXTENDED)
  })
})

describe('selectEligiblePass', () => {
  it('redeems a standard pass for a 7-night voyage', () => {
    expect(selectEligiblePass([std()], 7)).not.toBeNull()
  })

  it('returns null when only a standard pass exists for an 8-night voyage', () => {
    expect(selectEligiblePass([std()], 8)).toBeNull()
  })

  it('redeems an extended pass for an 8-night voyage', () => {
    const passes = [ext()]
    expect(selectEligiblePass(passes, 8)).toBe(passes[0])
  })

  it('prefers the most-restricted pass for a short trip (preserves any-length)', () => {
    const standard = std()
    const extended = ext()
    // Short trip: both qualify, but the standard (cap 7) should be consumed first.
    expect(selectEligiblePass([extended, standard], 5)).toBe(standard)
  })

  it('falls back to the any-length pass when the standard cannot cover the trip', () => {
    const standard = std()
    const extended = ext()
    expect(selectEligiblePass([standard, extended], 10)).toBe(extended)
  })

  it('breaks ties on max_nights by oldest purchase first', () => {
    const older = ext('2026-01-01')
    const newer = ext('2026-02-01')
    expect(selectEligiblePass([newer, older], 10)).toBe(older)
  })

  it('ignores redeemed and refunded passes', () => {
    const redeemed = { max_nights: null, status: 'redeemed', purchased_at: '2026-01-01' }
    const refunded = { max_nights: null, status: 'refunded', purchased_at: '2026-01-01' }
    expect(selectEligiblePass([redeemed, refunded], 3)).toBeNull()
  })

  it('returns null for an empty wallet', () => {
    expect(selectEligiblePass([], 3)).toBeNull()
  })
})

describe('fulfillmentPlan — mirrors idempotent webhook fulfilment', () => {
  it('a single standard pass grants 1 purchase credit', () => {
    expect(fulfillmentPlan({ voyage_credits: 1, max_nights: 7 })).toEqual({ credits: 1, source: 'purchase', maxNights: 7 })
  })

  it('an extended pass grants 1 purchase credit, any length', () => {
    expect(fulfillmentPlan({ voyage_credits: 1, max_nights: null })).toEqual({ credits: 1, source: 'purchase', maxNights: null })
  })

  it('a bundle grants 3 credits atomically, sourced as bundle', () => {
    expect(fulfillmentPlan({ voyage_credits: 3, max_nights: null })).toEqual({ credits: 3, source: 'bundle', maxNights: null })
  })

  it('never grants fewer than 1 credit even on a malformed plan', () => {
    expect(fulfillmentPlan({ voyage_credits: 0, max_nights: 7 }).credits).toBe(1)
  })
})
