-- ════════════════════════════════════════════════════════════════════════════
-- Per-voyage pricing: Voyage Passes
--
-- Replaces the subscription model with one-time, per-cruise passes. A pass gates
-- CREATION of a new voyage journal; it never gates access to existing journals.
-- The Founder's Offer tables/functions are left intact and grandfathered — this
-- migration only adds new objects and does not touch anything founder-related.
--
-- Conventions mirror the existing schema: uuid_generate_v4() ids, RLS on every
-- table, and SECURITY DEFINER ... SET search_path TO 'public' helper functions.
-- ════════════════════════════════════════════════════════════════════════════

-- ── pricing_plans ────────────────────────────────────────────────────────────
-- Single source of truth for SKUs → Stripe price ids + amounts. World-readable
-- for active rows only; never written by clients. Checkout reads the price here
-- server-side, so the frontend never carries an amount.
create table if not exists public.pricing_plans (
  -- gen_random_uuid() (pg_catalog) rather than uuid_generate_v4() (extensions):
  -- the SECURITY DEFINER functions pin search_path='public', where the extensions
  -- schema is not visible, so a uuid_generate_v4() default would fail inside them.
  id              uuid primary key default gen_random_uuid(),
  sku             text    not null unique,
  name            text    not null,
  description     text,
  stripe_price_id text,                              -- filled by the Stripe setup script
  amount_cents    integer not null,
  currency        text    not null default 'usd',
  voyage_credits  integer not null default 1,
  max_nights      integer,                           -- null = any voyage length
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

create policy pricing_plans_read_active on public.pricing_plans
  for select using (active = true);

-- Seed the three SKUs. stripe_price_id is filled in by
-- scripts/stripe-setup-voyage-passes.mjs once the Stripe Prices exist.
insert into public.pricing_plans (sku, name, description, amount_cents, voyage_credits, max_nights)
values
  ('VOYAGE_PASS_STANDARD', 'Standard Voyage Pass', 'One cruise journal, up to 7 nights.',    1999, 1, 7),
  ('VOYAGE_PASS_EXTENDED', 'Extended Voyage Pass', 'One cruise journal, 8 nights or longer.', 2999, 1, null),
  ('VOYAGE_BUNDLE_3',      '3-Voyage Bundle',      'Three cruise journals, any length.',       4999, 3, null)
on conflict (sku) do nothing;

-- ── voyage_passes ────────────────────────────────────────────────────────────
-- One row per redeemable credit. A bundle purchase inserts 3 rows
-- (credit_index 0..2) under one checkout session. Rows are written ONLY by the
-- SECURITY DEFINER functions below (webhook fulfilment, admin grant, redemption)
-- — there is no client write policy.
create table if not exists public.voyage_passes (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references auth.users(id) on delete cascade,
  sku                        text not null,
  source                     text not null check (source in ('purchase','bundle','founder','promo')),
  credit_index               integer not null default 0,
  stripe_payment_intent_id   text,
  stripe_checkout_session_id text,
  max_nights                 integer,                -- null = any voyage length
  status                     text not null default 'available'
                               check (status in ('available','redeemed','refunded')),
  needs_review               boolean not null default false,  -- refund/dispute on a redeemed pass
  redeemed_voyage_id         uuid references public.voyages(id) on delete set null,
  purchased_at               timestamptz not null default now(),
  redeemed_at                timestamptz
);

-- Idempotent webhook fulfilment: a given (session, sku, credit_index) exists once,
-- so Stripe's at-least-once redelivery cannot grant duplicate credits. Multiple
-- NULL session ids are allowed by Postgres, so promo/founder passes never collide.
create unique index if not exists voyage_passes_session_sku_credit_key
  on public.voyage_passes (stripe_checkout_session_id, sku, credit_index)
  where stripe_checkout_session_id is not null;

create index if not exists voyage_passes_user_status_idx
  on public.voyage_passes (user_id, status);

alter table public.voyage_passes enable row level security;

-- Users may read only their own passes. No client insert/update/delete.
create policy voyage_passes_read_own on public.voyage_passes
  for select using (user_id = auth.uid());

-- ── fulfill_pass_purchase (webhook) ──────────────────────────────────────────
-- Inserts one row per credit for a paid checkout. Idempotent via the partial
-- unique index, so replayed webhooks are no-ops. Returns the number of rows
-- actually inserted (0 on a replay). Service-role only.
create or replace function public.fulfill_pass_purchase(
  p_user_id        uuid,
  p_session        text,
  p_payment_intent text,
  p_sku            text,
  p_credits        integer,
  p_max_nights     integer,
  p_source         text
) returns integer
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare n int;
begin
  insert into voyage_passes
    (user_id, sku, source, credit_index, stripe_payment_intent_id, stripe_checkout_session_id, max_nights)
  select p_user_id, p_sku, p_source, gs, p_payment_intent, p_session, p_max_nights
  from generate_series(0, greatest(p_credits, 1) - 1) as gs
  on conflict (stripe_checkout_session_id, sku, credit_index)
    where stripe_checkout_session_id is not null
    do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ── create_voyage_with_pass (redemption + creation, atomic) ──────────────────
-- Locks one eligible available pass, creates the voyage, and links the pass —
-- all in a single transaction. Eligibility: a <=7-night voyage accepts any pass;
-- an 8+-night voyage requires a pass with max_nights IS NULL (extended/bundle).
-- Short trips prefer the most-restricted pass first (max_nights asc nulls last)
-- so flexible passes are not wasted. Raises 'NO_ELIGIBLE_PASS' when none qualify.
create or replace function public.create_voyage_with_pass(p_voyage jsonb, p_nights integer)
  returns public.voyages
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_uid  uuid := auth.uid();
  v_pass uuid;
  v_row  voyages;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id into v_pass
  from voyage_passes
  where user_id = v_uid
    and status = 'available'
    and (max_nights is null or coalesce(p_nights, 0) <= max_nights)
  order by max_nights asc nulls last, purchased_at asc
  for update skip locked
  limit 1;

  if v_pass is null then
    raise exception 'NO_ELIGIBLE_PASS' using errcode = 'P0001';
  end if;

  -- id / user_id / created_at are forced here; all other columns come from
  -- p_voyage (missing keys → NULL). Using jsonb_populate_record keeps this robust
  -- as new voyage columns are added.
  insert into voyages
  select rr.*
  from jsonb_populate_record(
    null::voyages,
    p_voyage || jsonb_build_object(
      'id',         gen_random_uuid(),
      'user_id',    v_uid,
      'created_at', now()
    )
  ) rr
  returning * into v_row;

  update voyage_passes
     set status = 'redeemed', redeemed_voyage_id = v_row.id, redeemed_at = now()
   where id = v_pass;

  return v_row;
end;
$$;

-- ── refund_voyage_pass (webhook: charge.refunded / dispute) ───────────────────
-- Reclaims still-available passes (→ refunded). Redeemed passes are flagged for
-- admin review instead of revoking journal access. Matches by session id or
-- payment intent. Returns the count of passes reclaimed. Service-role only.
create or replace function public.refund_voyage_pass(p_session text, p_payment_intent text)
  returns integer
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare n int;
begin
  update voyage_passes
     set status = 'refunded'
   where status = 'available'
     and (stripe_checkout_session_id = p_session
          or (p_payment_intent is not null and stripe_payment_intent_id = p_payment_intent));
  get diagnostics n = row_count;

  update voyage_passes
     set needs_review = true
   where status = 'redeemed'
     and (stripe_checkout_session_id = p_session
          or (p_payment_intent is not null and stripe_payment_intent_id = p_payment_intent));

  return n;
end;
$$;

-- ── Admin RPCs (guarded by is_admin_user(), mirroring existing admin pattern) ─
create or replace function public.admin_grant_promo_pass(p_user_id uuid, p_max_nights integer)
  returns public.voyage_passes
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare v_row voyage_passes;
begin
  if not is_admin_user() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into voyage_passes (user_id, sku, source, max_nights)
  values (p_user_id, 'PROMO', 'promo', p_max_nights)
  returning * into v_row;

  insert into moderation_audit_log (admin_id, action, target_type, target_id, notes)
  values (auth.uid(), 'grant_promo_pass', 'user', p_user_id,
          case when p_max_nights is null then 'promo pass (any length)'
               else 'promo pass (max_nights=' || p_max_nights::text || ')' end);

  return v_row;
end;
$$;

create or replace function public.admin_list_user_passes(p_user_id uuid)
  returns setof public.voyage_passes
  language plpgsql
  security definer
  set search_path to 'public'
as $$
begin
  if not is_admin_user() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select * from voyage_passes where user_id = p_user_id order by purchased_at desc;
end;
$$;

create or replace function public.admin_list_flagged_passes()
  returns setof public.voyage_passes
  language plpgsql
  security definer
  set search_path to 'public'
as $$
begin
  if not is_admin_user() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
    select * from voyage_passes where needs_review = true order by redeemed_at desc nulls last;
end;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Redemption + admin RPCs are callable by authenticated users (they self-authorize
-- via auth.uid() / is_admin_user()). Webhook-only functions are locked to the
-- service role: revoke the default PUBLIC execute so anon/authenticated cannot call
-- fulfilment or refund directly.
grant execute on function public.create_voyage_with_pass(jsonb, integer) to authenticated;
grant execute on function public.admin_grant_promo_pass(uuid, integer)   to authenticated;
grant execute on function public.admin_list_user_passes(uuid)            to authenticated;
grant execute on function public.admin_list_flagged_passes()             to authenticated;

revoke execute on function public.fulfill_pass_purchase(uuid, text, text, text, integer, integer, text) from public, anon, authenticated;
revoke execute on function public.refund_voyage_pass(text, text)                                         from public, anon, authenticated;
