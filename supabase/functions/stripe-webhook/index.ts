// ─────────────────────────────────────────────────────────────────────────────
// stripe-webhook — fulfils purchases from Stripe (Voyage Passes + Founder's Offer)
//
// Verifies the Stripe signature, then on:
//   • checkout.session.completed
//       – Voyage Pass (metadata.sku present): grants credits via
//         fulfill_pass_purchase(), idempotent on (session, sku, credit_index) so
//         Stripe's at-least-once redelivery cannot double-grant.
//       – Founder's Offer (metadata.tier_key): records ONE founder_purchases row
//         via record_founder_purchase() — unchanged, grandfathered.
//   • charge.refunded / charge.dispute.created
//       – refund_voyage_pass(): reclaims still-available passes, flags redeemed
//         ones for admin review (never auto-revokes journal access).
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

// A 5xx tells Stripe to retry; a 2xx is "handled" (including expected no-ops).
const ok  = () => new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
const retry = (msg: string) => new Response(msg, { status: 500 })

// ── Voyage Pass fulfilment ────────────────────────────────────────────────────
// Credits + eligibility come from pricing_plans (authoritative), NOT from metadata.
async function fulfilVoyagePass(s: Stripe.Checkout.Session): Promise<Response> {
  const userId = s.client_reference_id
  const sku    = s.metadata?.sku
  if (!userId || !sku) {
    console.error('[voyage-pass] missing client_reference_id or sku', { session: s.id })
    return ok() // nothing we can fulfil; don't wedge Stripe retrying forever
  }

  const { data: plan, error: planErr } = await supabase
    .from('pricing_plans')
    .select('sku, voyage_credits, max_nights')
    .eq('sku', sku)
    .maybeSingle()
  if (planErr) { console.error('[voyage-pass] plan lookup failed', planErr); return retry(planErr.message) }
  if (!plan)   { console.error('[voyage-pass] unknown sku', { sku, session: s.id }); return ok() }

  const source = plan.voyage_credits > 1 ? 'bundle' : 'purchase'
  const { data: granted, error } = await supabase.rpc('fulfill_pass_purchase', {
    p_user_id:        userId,
    p_session:        s.id,
    p_payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null,
    p_sku:            plan.sku,
    p_credits:        plan.voyage_credits,
    p_max_nights:     plan.max_nights,
    p_source:         source,
  })
  if (error) { console.error('[voyage-pass] fulfil failed', error); return retry(error.message) }

  // granted = rows inserted; 0 means this was a replay (already fulfilled) — expected.
  console.log('[voyage-pass] fulfilled', { session: s.id, sku: plan.sku, granted })
  return ok()
}

// ── Founder's Offer (unchanged) ───────────────────────────────────────────────
async function recordFounder(s: Stripe.Checkout.Session): Promise<Response> {
  const { error } = await supabase.rpc('record_founder_purchase', {
    p_session:      s.id,
    p_email:        s.customer_details?.email ?? s.customer_email ?? null,
    p_tier:         s.metadata?.tier_key ?? 'standard',
    p_amount:       s.amount_total ?? 0,
    p_mode:         s.mode,
    p_customer:     typeof s.customer === 'string' ? s.customer : null,
    p_subscription: typeof s.subscription === 'string' ? s.subscription : null,
  })
  if (error) { console.error('[founder] record failed', error); return retry(error.message) }
  return ok()
}

// ── Refund / dispute → reclaim or flag passes ─────────────────────────────────
async function handleRefund(session: string | null, paymentIntent: string | null): Promise<Response> {
  const { data: reclaimed, error } = await supabase.rpc('refund_voyage_pass', {
    p_session:        session,
    p_payment_intent: paymentIntent,
  })
  if (error) { console.error('[refund] failed', error); return retry(error.message) }
  console.log('[refund] processed', { session, paymentIntent, reclaimed })
  return ok()
}

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      const paid = s.payment_status === 'paid' || s.status === 'complete'
      if (!paid) return ok()
      // Route by what kind of checkout this was.
      if (s.metadata?.sku) return await fulfilVoyagePass(s)
      return await recordFounder(s)
    }
    case 'charge.refunded': {
      const c = event.data.object as Stripe.Charge
      return await handleRefund(null, typeof c.payment_intent === 'string' ? c.payment_intent : null)
    }
    case 'charge.dispute.created': {
      const d = event.data.object as Stripe.Dispute
      return await handleRefund(null, typeof d.payment_intent === 'string' ? d.payment_intent : null)
    }
    default:
      return ok()
  }
})
