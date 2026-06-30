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
