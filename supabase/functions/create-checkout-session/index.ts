// ─────────────────────────────────────────────────────────────────────────────
// create-checkout-session — Stripe Checkout for the Founder's Offer
//
// Resolves the active tier + price SERVER-SIDE (via get_founder_status; never trusts
// the client) and creates a Stripe Checkout Session: mode 'payment' for the lifetime
// tiers, mode 'subscription' for Standard. Anonymous (Stripe collects the email).
// Returns { url } for the client to redirect to.
//
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL.
// Deno deploy (Supabase Edge Functions).
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)
// Canonical site origin for redirects (the .vercel.app URL until deck-days.com is live).
const SITE = Deno.env.get('SITE_URL') ?? 'https://cruise-ship-journal.vercel.app'

interface Tier {
  key: string; label: string; priceCents: number; capacity: number | null
  mode: 'payment' | 'subscription'; interval: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { tierKey } = await req.json().catch(() => ({ tierKey: undefined }))

    // Authoritative status from the DB — the active tier and price come from here.
    const { data: status, error } = await supabase.rpc('get_founder_status')
    if (error) throw error
    const tiers: Tier[] = status.tiers
    const current: Tier = status.current

    // Honour the requested tier only if it's the live one (or Standard, always open);
    // otherwise fall back to the current active tier. Prevents buying a sold-out price.
    const requested = tiers.find((t) => t.key === tierKey)
    const tier: Tier =
      requested && (requested.key === 'standard' || requested.key === current.key)
        ? requested
        : current

    const lineItem = {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: tier.priceCents,
        product_data: { name: `Deck Days — ${tier.label}` },
        ...(tier.mode === 'subscription'
          ? { recurring: { interval: (tier.interval ?? 'month') as 'month' } }
          : {}),
      },
    }

    const session = await stripe.checkout.sessions.create({
      mode: tier.mode,
      line_items: [lineItem],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { tier_key: tier.key },
      success_url: `${SITE}/founder/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/founder/cancelled`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
