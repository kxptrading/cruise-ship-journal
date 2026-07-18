// ─────────────────────────────────────────────────────────────────────────────
// features/passes/eligibility.ts — pure, client-side mirror of the redemption
// rules that create_voyage_with_pass / fulfill_pass_purchase enforce in the DB.
//
// The database remains the source of truth (atomic redemption, FOR UPDATE SKIP
// LOCKED, idempotent fulfilment). These helpers exist for unit testing and for
// cheap client-side previews (e.g. "you already have a pass for this trip"); they
// never bypass the server-side guard.
// ─────────────────────────────────────────────────────────────────────────────

export interface EligiblePassLike {
  max_nights:   number | null
  status:       string
  purchased_at: string
}

// Does a pass cover a voyage of `nights`? Any-length passes (max_nights null)
// always qualify; otherwise nights must be within the cap. Mirrors the SQL
// predicate `(max_nights is null or nights <= max_nights)`.
export function passCoversNights(pass: { max_nights: number | null }, nights: number): boolean {
  return pass.max_nights == null || nights <= pass.max_nights
}

// The pass create_voyage_with_pass would redeem for a `nights`-long voyage: the
// eligible, available pass that is most restrictive first (max_nights ascending,
// nulls last) then oldest (purchased_at ascending) — so flexible/any-length
// passes are preserved for trips that need them. Returns null when none qualify
// (which is what raises NO_ELIGIBLE_PASS server-side).
export function selectEligiblePass<T extends EligiblePassLike>(passes: T[], nights: number): T | null {
  const eligible = passes.filter(p => p.status === 'available' && passCoversNights(p, nights))
  if (eligible.length === 0) return null
  return [...eligible].sort(comparePreference)[0]
}

function comparePreference(a: EligiblePassLike, b: EligiblePassLike): number {
  if (a.max_nights !== b.max_nights) {
    if (a.max_nights == null) return 1   // nulls last
    if (b.max_nights == null) return -1
    return a.max_nights - b.max_nights   // smaller cap first
  }
  return a.purchased_at < b.purchased_at ? -1 : a.purchased_at > b.purchased_at ? 1 : 0
}

// What a paid checkout should grant — mirrors the webhook's fulfilment decision,
// where credits + coverage come from pricing_plans (never trusted from metadata).
// The DB then inserts this many rows atomically and idempotently.
export interface FulfillmentPlan {
  credits:   number
  source:    'purchase' | 'bundle'
  maxNights: number | null
}
export function fulfillmentPlan(plan: { voyage_credits: number; max_nights: number | null }): FulfillmentPlan {
  return {
    credits:   Math.max(1, plan.voyage_credits),
    source:    plan.voyage_credits > 1 ? 'bundle' : 'purchase',
    maxNights: plan.max_nights,
  }
}
