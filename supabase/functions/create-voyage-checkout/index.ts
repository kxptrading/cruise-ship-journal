// ─────────────────────────────────────────────────────────────────────────────
// create-voyage-checkout — Stripe Checkout for a one-time Voyage Pass
//
// Resolves the price SERVER-SIDE from the pricing_plans table (never trusts a
// client-sent amount) and creates a one-time Checkout Session (mode: 'payment').
// Requires the caller to be signed in: the Supabase user id is attached as
// client_reference_id so the webhook can fulfil passes to the right account.
// metadata carries { sku, voyage_credits } for observability; the webhook re-reads
// pricing_plans authoritatively rather than trusting metadata.
//
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL.
// Deploy with --no-verify-jwt: we validate the bearer token ourselves via
// auth.getUser so we can return a friendly 401 rather than a gateway rejection.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)
// Canonical site origin for redirects (the .vercel.app URL until deck-days.com is live).
const SITE = Deno.env.get('SITE_URL') ?? 'https://cruise-ship-journal.vercel.app'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    // ── Who is buying? (bearer token → Supabase user) ────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: userData } = await supabase.auth.getUser(token)
    const user = userData?.user
    if (!user) return json({ error: 'Please sign in to buy a Voyage Pass.' }, 401)

    const { sku } = await req.json().catch(() => ({ sku: undefined }))
    if (!sku || typeof sku !== 'string') return json({ error: 'Missing plan.' }, 400)

    // ── Authoritative price from pricing_plans (active rows only) ─────────────
    const { data: plan, error: planErr } = await supabase
      .from('pricing_plans')
      .select('sku, name, description, stripe_price_id, amount_cents, currency, voyage_credits')
      .eq('sku', sku)
      .eq('active', true)
      .maybeSingle()
    if (planErr) throw planErr
    if (!plan) return json({ error: 'That plan is not available.' }, 400)

    // Prefer the configured Stripe Price; fall back to inline price_data from the
    // table so checkout still works before the Stripe setup script has run (test).
    const line_item = plan.stripe_price_id
      ? { price: plan.stripe_price_id, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency ?? 'usd',
            unit_amount: plan.amount_cents,
            product_data: { name: `Deck Days — ${plan.name}`, description: plan.description ?? undefined },
          },
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [line_item],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { sku: plan.sku, voyage_credits: String(plan.voyage_credits) },
      success_url: `${SITE}/passes/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/pricing`,
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
