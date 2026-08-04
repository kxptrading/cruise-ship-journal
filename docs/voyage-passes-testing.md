# Voyage Passes — testing & verification

Per-voyage, one-time purchase model. A **Voyage Pass** gates *creation* of a new
voyage journal; it never gates access to journals already started. Passes are
tiered by voyage length, with an optional 3-voyage bundle.

| SKU | Covers | Credits | Price |
|---|---|---|---|
| `VOYAGE_PASS_STANDARD` | up to 7 nights | 1 | $19.99 |
| `VOYAGE_PASS_EXTENDED` | any length (8+) | 1 | $29.99 |
| `VOYAGE_BUNDLE_3` | any length | 3 | $49.99 |

Prices/coverage are config-driven in the `pricing_plans` table — never hardcoded.

---

## Automated tests

`src/features/passes/eligibility.test.js` (Vitest) covers the pure logic that
mirrors the authoritative DB functions:

- **Eligibility boundary (7 vs 8 nights).** A Standard pass covers exactly 7
  nights, not 8; an any-length pass covers everything. `tierForNights` preselects
  Standard at ≤7 and Extended at 8+.
- **Redemption preference.** `selectEligiblePass` consumes the most-restricted
  eligible pass first (so any-length passes are preserved), ties broken by oldest
  purchase — matching `create_voyage_with_pass`'s `ORDER BY max_nights ASC NULLS
  LAST, purchased_at ASC`. Redeemed/refunded passes are ignored; an empty wallet
  returns null (→ `NO_ELIGIBLE_PASS`).
- **Fulfilment shape.** `fulfillmentPlan` grants 1 credit (`purchase`) for single
  passes and 3 credits (`bundle`) for the bundle — mirroring the webhook.

Run: `npx vitest run src/features/passes/eligibility.test.js`

> These are a **client-side mirror** for fast feedback. The real guarantees —
> atomic redemption (`FOR UPDATE SKIP LOCKED`), idempotent fulfilment (partial
> unique index on `(session, sku, credit_index)`), and bundle atomicity (N rows
> in one statement) — are enforced in Postgres and were verified directly against
> the database with rolled-back `DO` blocks during implementation:
> - redeem a Standard pass for a 5-night voyage → pass `redeemed` + linked;
> - an 8-night create with only a Standard pass → `NO_ELIGIBLE_PASS`;
> - an Extended pass redeems the 8-night voyage;
> - `admin_grant_promo_pass` grants + writes an audit row; a non-admin is denied.

---

## End-to-end happy path (Stripe test mode)

Prereq: run `scripts/stripe-setup-voyage-passes.mjs` (fills `stripe_price_id`),
deploy `create-voyage-checkout` + `stripe-webhook`, and register the webhook
events (`checkout.session.completed`, `charge.refunded`, `charge.dispute.created`).

1. Sign in (or sign up — `/signup` is open) and go to **/pricing**.
2. Buy the **Standard** pass. Use card `4242 4242 4242 4242`, any future expiry / CVC.
3. Land on **/passes/success**. It polls until the webhook fulfils — one
   `voyage_passes` row (`status = available`) should appear within seconds.
4. Click **Start your voyage journal** → create a **7-night** voyage.
   - It should succeed and the pass should flip to `redeemed`, linked to the new
     voyage (`redeemed_voyage_id`).
5. Try to create a **second** voyage → routed to `/pricing` (no eligible pass).

---

## Manual test matrix

### Refund of an *unredeemed* pass
1. Buy a pass; do **not** create a voyage.
2. In Stripe, refund the payment.
3. Expect: the `charge.refunded` webhook marks the pass `refunded`
   (`refund_voyage_pass` reclaims `available` passes). It disappears from
   available credits on **/passes**.

### Refund of a *redeemed* pass
1. Buy a pass and create a voyage with it (pass `redeemed`).
2. Refund the payment (or open a dispute) in Stripe.
3. Expect: journal access is **not** revoked. The pass is flagged
   (`needs_review = true`) and shows in **Admin → Passes** for manual handling.

### Duplicate webhook delivery (idempotency)
1. Complete a purchase.
2. In Stripe → Webhooks, **Resend** the `checkout.session.completed` event.
3. Expect: **no** additional `voyage_passes` rows — the partial unique index makes
   `fulfill_pass_purchase` a no-op on replay (logged as `granted: 0`).

### Bundle atomicity
1. Buy the **3-voyage bundle**.
2. Expect: exactly **3** `voyage_passes` rows (`source = bundle`,
   `credit_index` 0–2), any-length. Resending the event adds none.

### Offline journal creation (online-only redemption)
1. Go offline (DevTools → Network → Offline).
2. Attempt to create a voyage.
3. Expect: creation fails gracefully with a clear message (redemption is an online
   RPC by design). No pass is consumed. Back online, creation works normally.

### Admin
- **Grant promo:** Admin → Users → expand a user → **+ Promo (≤7n)** / **+ Promo
  (any)**. A pass appears for that user and a `grant_promo_pass` row lands in the
  Audit Log.
- **Non-admin guard:** the `admin_*` RPCs raise `Not authorized` for non-admins.
