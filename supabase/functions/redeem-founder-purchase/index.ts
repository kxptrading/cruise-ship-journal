// ─────────────────────────────────────────────────────────────────────────────
// redeem-founder-purchase — turn a paid Founder's Offer checkout into an account
//
// This is the ONLY way to create an account (public /signup stays closed), which
// is what enforces "paying members only". Security-critical:
//   1. Retrieve the Checkout Session from Stripe (STRIPE_SECRET_KEY) and confirm
//      it is genuinely PAID — a forged/unpaid session_id is rejected here.
//   2. The buyer's email comes from Stripe, not the client (can't be spoofed).
//   3. The purchase must exist and be UNCLAIMED; claiming is atomic (one account
//      per purchase).
// Creates the auth user with email_confirm:true (they just paid — no confirm email),
// links the purchase, and upserts the profile. The client then signs in normally.
//
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Deploy with --no-verify-jwt (called by anonymous post-checkout visitors).
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
// Business/validation failures return 200 with { ok:false } so the client can read
// the friendly message directly from the body (supabase-js hides non-2xx bodies).
const fail = (error: string, code?: string) => json({ ok: false, error, code }, 200)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { session_id, password, firstName, lastName, age } = await req.json().catch(() => ({}))

    // ── Input validation ────────────────────────────────────────────────────
    if (!session_id || typeof session_id !== 'string') return fail('Missing checkout session.')
    if (!password || String(password).length < 6)      return fail('Password must be at least 6 characters.')
    if (!firstName?.trim() || !lastName?.trim())        return fail('Please enter your first and last name.')
    const parsedAge = parseInt(age, 10)
    if (!parsedAge || parsedAge < 1 || parsedAge > 120) return fail('Please enter a valid age.')

    // ── 1. Authoritative check: is this session actually paid? ────────────────
    const session = await stripe.checkout.sessions.retrieve(session_id)
    const paid = session.payment_status === 'paid' || session.status === 'complete'
    if (!paid) return fail('This checkout has not been paid.')

    const email = session.customer_details?.email ?? session.customer_email
    if (!email) return fail('Could not read the email for this purchase.')

    // ── 2. Make sure the purchase is recorded (idempotent; covers webhook lag) ─
    await supabase.rpc('record_founder_purchase', {
      p_session:      session.id,
      p_email:        email,
      p_tier:         session.metadata?.tier_key ?? 'standard',
      p_amount:       session.amount_total ?? 0,
      p_mode:         session.mode,
      p_customer:     typeof session.customer === 'string' ? session.customer : null,
      p_subscription: typeof session.subscription === 'string' ? session.subscription : null,
    })

    // ── 3. Must be unclaimed. If already linked, send them to sign in. ────────
    const { data: purchase } = await supabase
      .from('founder_purchases')
      .select('user_id')
      .eq('stripe_checkout_session', session.id)
      .maybeSingle()
    if (purchase?.user_id) return fail('This purchase is already linked to an account. Please sign in.', 'already_claimed')

    // ── 4. Create the account (already email-verified — they paid) ────────────
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName.trim(), last_name: lastName.trim(), age: parsedAge },
    })
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? 'Could not create your account.'
      const exists = /registered|already/i.test(msg)
      return fail(exists ? 'An account already exists for this email. Please sign in.' : msg, exists ? 'account_exists' : undefined)
    }
    const userId = created.user.id

    // ── 5. Atomically claim the purchase for this user. ───────────────────────
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_founder_purchase', {
      p_session: session.id,
      p_user_id: userId,
    })
    if (claimErr || claimed === 0) {
      // Lost a race (claimed in the gap) — roll back the account we just made.
      await supabase.auth.admin.deleteUser(userId)
      return fail('This purchase was just claimed. Please sign in.', 'already_claimed')
    }

    // ── 6. Profile row (name/email; onboarded defaults false → shows /welcome) ─
    await supabase.from('profiles').upsert({
      user_id:      userId,
      email,
      first_name:   firstName.trim(),
      last_name:    lastName.trim(),
      display_name: `${firstName.trim()} ${lastName.trim()}`,
      age:          parsedAge,
    }, { onConflict: 'user_id' })

    return json({ ok: true, email })
  } catch (e) {
    // e.g. Stripe "No such checkout session" for a bogus id — surface it cleanly.
    return fail((e as Error).message || 'Could not complete sign-up. Please try again.')
  }
})
