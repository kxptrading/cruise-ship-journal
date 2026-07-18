#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// stripe-setup-voyage-passes.mjs — create the Stripe Products + one-time Prices
// for the three Voyage Pass SKUs, idempotently, and wire them into pricing_plans.
//
// Source of truth for amounts is the pricing_plans table (not this script): it
// reads the active plans, then ensures a matching Stripe Product + Price for each.
//
// Idempotency:
//   • Product — found by metadata.sku (Search API); created only if missing.
//   • Price   — found by lookup_key = sku. Reused when amount+currency match;
//               if the amount changed, a new Price is created with
//               transfer_lookup_key=true and the old one archived.
// Safe to run repeatedly; a no-op run makes no changes.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_…  node scripts/stripe-setup-voyage-passes.mjs
//
// Env:
//   STRIPE_SECRET_KEY          (required) test key first: sk_test_…
//   VITE_SUPABASE_URL          (required) read from .env.local if not exported
//   VITE_SUPABASE_ANON_KEY     (required) reads active pricing_plans (world-readable)
//   SUPABASE_SERVICE_ROLE_KEY  (optional) if set, writes stripe_price_id back to
//                              pricing_plans; otherwise the script prints the SQL.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from 'node:fs'

// ── Tiny .env.local loader (only fills vars not already in the environment) ────
function loadDotEnv(path = '.env.local') {
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}
loadDotEnv()

const STRIPE_KEY   = process.env.STRIPE_SECRET_KEY
const SUPA_URL     = process.env.VITE_SUPABASE_URL
const SUPA_ANON    = process.env.VITE_SUPABASE_ANON_KEY
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(msg) { console.error(`\n✗ ${msg}\n`); process.exit(1) }
if (!STRIPE_KEY) fail('STRIPE_SECRET_KEY is required (use a test key: sk_test_…).')
if (!SUPA_URL || !SUPA_ANON) fail('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required (put them in .env.local).')

const LIVE = STRIPE_KEY.startsWith('sk_live_')

// ── Stripe REST helper (form-encoded; no SDK dependency) ──────────────────────
function encode(params, prefix = '') {
  const parts = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object' && !Array.isArray(v)) parts.push(encode(v, key))
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
  }
  return parts.filter(Boolean).join('&')
}

async function stripe(method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? encode(params) : undefined,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${json.error?.message ?? res.status}`)
  return json
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────
async function readActivePlans() {
  const url = `${SUPA_URL}/rest/v1/pricing_plans?select=sku,name,description,amount_cents,currency,stripe_price_id&active=eq.true&order=amount_cents.asc`
  const res = await fetch(url, { headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}` } })
  if (!res.ok) throw new Error(`Read pricing_plans failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function writePriceId(sku, priceId) {
  const url = `${SUPA_URL}/rest/v1/pricing_plans?sku=eq.${encodeURIComponent(sku)}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_SERVICE,
      Authorization: `Bearer ${SUPA_SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ stripe_price_id: priceId }),
  })
  if (!res.ok) throw new Error(`Update ${sku} failed: ${res.status} ${await res.text()}`)
}

// ── Idempotent ensure-product / ensure-price ──────────────────────────────────
async function ensureProduct(plan) {
  const found = await stripe('GET', `products/search?query=${encodeURIComponent(`metadata['sku']:'${plan.sku}'`)}`)
  if (found.data?.length) return found.data[0]
  return stripe('POST', 'products', {
    name: `Deck Days — ${plan.name}`,
    description: plan.description ?? undefined,
    metadata: { sku: plan.sku },
  })
}

async function ensurePrice(plan, productId) {
  const currency = (plan.currency ?? 'usd').toLowerCase()
  const list = await stripe('GET', `prices?lookup_keys[]=${encodeURIComponent(plan.sku)}&active=true&limit=1`)
  const existing = list.data?.[0]

  if (existing) {
    if (existing.unit_amount === plan.amount_cents && existing.currency === currency) {
      return { id: existing.id, action: 'reused' }
    }
    // Amount/currency changed — mint a new price, move the lookup_key, archive the old.
    const next = await stripe('POST', 'prices', {
      product: productId,
      currency,
      unit_amount: plan.amount_cents,
      lookup_key: plan.sku,
      transfer_lookup_key: 'true',
      metadata: { sku: plan.sku },
    })
    await stripe('POST', `prices/${existing.id}`, { active: 'false' })
    return { id: next.id, action: 'replaced' }
  }

  const created = await stripe('POST', 'prices', {
    product: productId,
    currency,
    unit_amount: plan.amount_cents,
    lookup_key: plan.sku,
    metadata: { sku: plan.sku },
  })
  return { id: created.id, action: 'created' }
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log(`\nStripe Voyage Pass setup — ${LIVE ? 'LIVE ⚠️' : 'TEST'} mode\n`)

const plans = await readActivePlans()
if (!plans.length) fail('No active rows in pricing_plans — run the migration first.')

const results = []
for (const plan of plans) {
  const product = await ensureProduct(plan)
  const price   = await ensurePrice(plan, product.id)
  results.push({ sku: plan.sku, amount: plan.amount_cents, priceId: price.id, action: price.action })
  console.log(`  ${plan.sku.padEnd(22)} $${(plan.amount_cents / 100).toFixed(2).padStart(6)}  ${price.id}  (${price.action})`)
}

console.log('')
if (SUPA_SERVICE) {
  for (const r of results) await writePriceId(r.sku, r.priceId)
  console.log('✓ Wrote stripe_price_id back to pricing_plans.\n')
} else {
  console.log('No SUPABASE_SERVICE_ROLE_KEY set — run this SQL to store the price ids:\n')
  for (const r of results) {
    console.log(`  update public.pricing_plans set stripe_price_id = '${r.priceId}' where sku = '${r.sku}';`)
  }
  console.log('')
}
