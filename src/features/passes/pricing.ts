// ─────────────────────────────────────────────────────────────────────────────
// features/passes/pricing.ts — pure helpers for presenting Voyage Pass prices.
// Everything is derived from live pricing_plans data; no amounts are hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

import type { PricingPlan } from './hooks'

export const SKU_STANDARD = 'VOYAGE_PASS_STANDARD'
export const SKU_EXTENDED = 'VOYAGE_PASS_EXTENDED'
export const SKU_BUNDLE   = 'VOYAGE_BUNDLE_3'

export function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export const isBundle = (p: PricingPlan) => p.voyage_credits > 1

// What a plan covers, in words — drives the card copy without hardcoded numbers.
export function coversLabel(p: PricingPlan): string {
  if (p.max_nights == null) return 'Any voyage length'
  return `Up to ${p.max_nights} nights`
}

// The eligible tier SKU for a given voyage length (used to preselect on the paywall).
export function tierForNights(nights: number): string {
  return nights >= 8 ? SKU_EXTENDED : SKU_STANDARD
}

// Per-voyage saving for the bundle, computed against the single pass that covers
// the same lengths (Extended — both are any-length). Falls back to Standard.
export interface BundleSaving {
  perVoyageCents: number
  savingPct:      number
  comparedTo:     PricingPlan
}
export function bundleSaving(plans: PricingPlan[]): BundleSaving | null {
  const bundle = plans.find(isBundle)
  if (!bundle || bundle.voyage_credits < 1) return null
  const compare =
    plans.find(p => p.sku === SKU_EXTENDED) ??
    plans.find(p => p.sku === SKU_STANDARD)
  if (!compare) return null

  const perVoyageCents = Math.round(bundle.amount_cents / bundle.voyage_credits)
  const savingPct = Math.max(0, Math.round((1 - perVoyageCents / compare.amount_cents) * 100))
  return { perVoyageCents, savingPct, comparedTo: compare }
}
