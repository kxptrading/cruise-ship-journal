# Supabase Edge Functions — Payments

Deno edge functions powering **Voyage Passes** (per-voyage one-time purchases) and
the legacy **Founder's Offer** (grandfathered). All are **inert until the Stripe
secrets below are set**.

| Function | Purpose | `verify_jwt` |
|---|---|---|
| `create-voyage-checkout` | Resolves the price **server-side** from `pricing_plans` (never trusts a client amount), requires a signed-in user, and creates a one-time (`mode:'payment'`) Checkout Session with `client_reference_id = user id` + metadata `{ sku, voyage_credits }`. Returns `{ url }`. | `false` |
| `create-checkout-session` | *(Founder's Offer, legacy)* Resolves the active tier + price via `get_founder_status()` and creates a Checkout Session. | `false` |
| `stripe-webhook` | Verifies the signature. On `checkout.session.completed`, routes by metadata: `sku` → `fulfill_pass_purchase()` (grants Voyage Pass credits, idempotent on `(session, sku, credit_index)`); `tier_key` → `record_founder_purchase()` (unchanged). On `charge.refunded` / `charge.dispute.created` → `refund_voyage_pass()` (reclaims available passes, flags redeemed ones for admin review). | `false` |
| `redeem-founder-purchase` | *(Founder's Offer, legacy)* Turns a paid founder checkout into an account; retrieves + verifies the paid session, creates the account, atomically claims the purchase. | `false` |

## Voyage Pass go-live (test mode)

1. **Seed the Stripe prices** — with the migration applied (`pricing_plans` seeded):
   ```bash
   STRIPE_SECRET_KEY=sk_test_… node scripts/stripe-setup-voyage-passes.mjs
   ```
   Idempotent: ensures a Stripe Product + one-time Price per SKU and (with
   `SUPABASE_SERVICE_ROLE_KEY` set) writes `stripe_price_id` back into
   `pricing_plans`; otherwise prints the `update … pricing_plans` SQL to run.
2. **Deploy**:
   ```bash
   supabase functions deploy create-voyage-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. **Register webhook events** on the existing endpoint (Developers → Webhooks):
   add `checkout.session.completed` (already present for founder),
   `charge.refunded`, and `charge.dispute.created`.
4. **Smoke test** with card `4242 4242 4242 4242`: buy a Standard pass →
   one `voyage_passes` row appears `available` → re-send the event → **no**
   duplicate row (idempotency holds).

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
