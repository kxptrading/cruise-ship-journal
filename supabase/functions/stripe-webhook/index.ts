// ─────────────────────────────────────────────────────────────────────────────
// stripe-webhook — records a completed Founder's Offer purchase (counter source)
//
// Verifies the Stripe signature, and on checkout.session.completed records ONE
// founder_purchases row via record_founder_purchase(), which is idempotent
// (ON CONFLICT (stripe_checkout_session) DO NOTHING) — safe under Stripe's
// at-least-once retries. This is the ONLY path that increments the live counter.
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//          SUPABASE_SERVICE_ROLE_KEY. Deploy with --no-verify-jwt (Stripe calls it).
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()
  let event: Stripe.Event
  try {
    // async variant required in Deno (SubtleCrypto-based verification).
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret)
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${(e as Error).message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    // Only record genuinely paid sessions (payment) or active subscriptions.
    const ok = s.payment_status === 'paid' || s.status === 'complete'
    if (ok) {
      const { error } = await supabase.rpc('record_founder_purchase', {
        p_session:      s.id,
        p_email:        s.customer_details?.email ?? s.customer_email ?? null,
        p_tier:         s.metadata?.tier_key ?? 'standard',
        p_amount:       s.amount_total ?? 0,
        p_mode:         s.mode,
        p_customer:     typeof s.customer === 'string' ? s.customer : null,
        p_subscription: typeof s.subscription === 'string' ? s.subscription : null,
      })
      if (error) return new Response(`record failed: ${error.message}`, { status: 500 }) // Stripe will retry
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
