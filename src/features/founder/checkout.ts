// ─────────────────────────────────────────────────────────────────────────────
// features/founder/checkout.ts — start a Founder's Offer Stripe Checkout
//
// Calls the create-checkout-session edge function (which resolves the tier + price
// server-side) and redirects to the returned Stripe Checkout URL.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'

export async function startCheckout(tierKey: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { tierKey },
  })
  if (error) throw error
  const url = (data as { url?: string } | null)?.url
  if (!url) throw new Error('Could not start checkout — please try again.')
  window.location.href = url
}

// ─────────────────────────────────────────────────────────────────────────────
// Redeem a paid checkout into an account. Calls redeem-founder-purchase (which
// verifies the session with Stripe server-side, creates the account, and links
// the purchase), then signs the new member in with the password they chose.
// ─────────────────────────────────────────────────────────────────────────────

export interface RedeemInput {
  sessionId: string
  password:  string
  firstName: string
  lastName:  string
  age:       string
}

export async function redeemPurchase(input: RedeemInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('redeem-founder-purchase', {
    body: {
      session_id: input.sessionId,
      password:   input.password,
      firstName:  input.firstName,
      lastName:   input.lastName,
      age:        input.age,
    },
  })
  // Edge function returns a descriptive { error } (and sometimes a `code`) on 4xx;
  // functions.invoke surfaces non-2xx as an error with the response in context.
  const payload = data as { ok?: boolean; email?: string; error?: string } | null
  if (error || !payload?.ok) {
    const msg = payload?.error || (error as { message?: string })?.message || 'Could not create your account. Please try again.'
    throw new Error(msg)
  }

  // Account exists and is email-confirmed server-side — sign straight in.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email:    payload.email!,
    password: input.password,
  })
  if (signInErr) throw new Error('Account created — please sign in with your new password.')
}
