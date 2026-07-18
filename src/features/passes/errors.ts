// features/passes/errors.ts — shared error signalling for Voyage Pass gating.
//
// create_voyage_with_pass raises 'NO_ELIGIBLE_PASS' when the user has no available
// pass that covers the entered voyage length. We surface that as a typed error so
// the editor can route to the pricing screen instead of showing a raw DB message.

export const NO_ELIGIBLE_PASS = 'NO_ELIGIBLE_PASS'

export class NoEligiblePassError extends Error {
  constructor() {
    super(NO_ELIGIBLE_PASS)
    this.name = 'NoEligiblePassError'
  }
}

export function isNoEligiblePass(e: unknown): boolean {
  const msg = (e as { message?: unknown } | null)?.message
  return typeof msg === 'string' && msg.includes(NO_ELIGIBLE_PASS)
}
