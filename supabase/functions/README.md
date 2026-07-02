# Supabase Edge Functions — Founder's Offer

Two Deno edge functions power the Founder's Offer checkout + live counter.
Both are **inert until the Stripe secrets below are set**.

| Function | Purpose | `verify_jwt` |
|---|---|---|
| `create-checkout-session` | Resolves the active tier + price **server-side** (via `get_founder_status()`, never trusting the client) and creates a Stripe Checkout Session — one-time `payment` for the lifetime tiers, `subscription` for Standard. Returns `{ url }`. | `false` |
| `stripe-webhook` | Verifies the Stripe signature and, on `checkout.session.completed`, records **one** `founder_purchases` row via `record_founder_purchase()`. Idempotent (`ON CONFLICT (stripe_checkout_session) DO NOTHING`) so Stripe's at-least-once retries are safe. **This is the only path that increments the live counter.** | `false` |
| `redeem-founder-purchase` | Turns a paid checkout into an account — the **only** way to create one (public `/signup` stays closed → "paying members only"). Retrieves the session from Stripe and confirms it's **paid** (a forged `session_id` is rejected), creates the account with `admin.createUser({ email_confirm:true })` using the Stripe-provided email, then **atomically claims** the purchase (`claim_founder_purchase`, one account per purchase) and upserts the profile. | `false` |

`verify_jwt: false` on all three: they're called by anonymous (logged-out)
visitors — before/after checkout — and Stripe calls the webhook with no Supabase
auth header (it authenticates via the signature instead). `redeem-founder-purchase`
does its own authorization by verifying the paid Stripe session.

## Purchase → account flow (pay-first, members-only)

```
Landing → create-checkout-session → Stripe Checkout (pays)
  → /founder/success?session_id=…  (collect name + password)
  → redeem-founder-purchase  (verify paid · create account · claim purchase)
  → auto sign-in → /welcome (first-run onboarding) → app
```

Public `/signup` stays on `ComingSoonPage`; `/login` stays open for returning
members. Existing accounts are unaffected — this only governs *new* signups.
Not yet handled: Standard-subscription lifecycle (cancel/expiry revoking access).

## Database

The counter is server-authoritative — see the `founder_offer` migration:

- `founder_tiers` — seeded `early_bird` ($15, cap 200), `maiden_voyage` ($25, cap 500),
  `standard` ($8/mo subscription, no cap).
- `founder_purchases` — one row per completed checkout; `stripe_checkout_session` is
  `UNIQUE` and acts as the idempotency key. RLS on, no public row read.
- `get_founder_status()` — `security definer`, granted to `anon`/`authenticated`.
  Returns `{ totalSold, tiers[], current }` (camelCase). `current` is the first
  non-sold-out tier (Standard is the unlimited fallback).
- `record_founder_purchase(...)` — `security definer`, idempotent insert.

## Secrets (set in Supabase → Edge Functions → secrets)

| Secret | Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` (test mode first) | |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | From the Stripe webhook endpoint (step 2 below) |
| `SITE_URL` | `https://cruise-ship-journal.vercel.app` | Optional — this is the default. Used for `success_url`/`cancel_url`. Update when `deck-days.com` goes live. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | — | Injected automatically; do not set manually. |

## Go-live checklist (test mode)

1. **Deploy** both functions (already deployed via MCP; to redeploy with the CLI):
   ```bash
   supabase functions deploy create-checkout-session --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
2. **Stripe webhook endpoint** (test mode) → Developers → Webhooks → add endpoint:
   - URL: `https://dcsfglhvdxsgueuahzyu.supabase.co/functions/v1/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret (`whsec_…`) → set `STRIPE_WEBHOOK_SECRET`.
3. **Set `STRIPE_SECRET_KEY`** (test `sk_test_…`).
4. **End-to-end test** with card `4242 4242 4242 4242` (any future expiry / any CVC):
   - Complete a checkout from the landing pricing card.
   - Stripe dashboard shows the payment.
   - Exactly one `founder_purchases` row appears.
   - The landing counter ticks up (refetches every 20s, or reload).
   - Re-send the event from Stripe → **no duplicate row** (idempotency holds).
5. **Account creation** (entitlement): on `/founder/success`, set a name + password →
   account is created and signed in → land on `/welcome`. Then verify the guards:
   - Revisit the used `session_id` → "already linked, sign in".
   - A forged/bogus `session_id` → rejected (no account created).
   - An email that already has an account → "sign in instead".

## Redirects

`success_url` → `${SITE_URL}/founder/success?session_id={CHECKOUT_SESSION_ID}`
`cancel_url`  → `${SITE_URL}/founder/cancelled`

Both routes are public (the buyer is usually logged out after anonymous checkout) —
see `src/pages/FounderResultPage.tsx`.

## Follow-ups (not yet built)

- **Subscription lifecycle** — Standard is a monthly subscription; handle
  `customer.subscription.deleted` / failed payments to revoke access on cancel/expiry.
- **Access enforcement for existing accounts** — new accounts are members-only by
  construction (redeem-only). Pre-existing accounts aren't gated.
