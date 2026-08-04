-- ════════════════════════════════════════════════════════════════════════════
-- Voyage creation is now pass-gated: block direct client INSERT on voyages.
--
-- Creating a voyage must go through create_voyage_with_pass() (SECURITY DEFINER,
-- which bypasses RLS), so a pass is always redeemed atomically. We drop the
-- broad "Users manage own voyages" ALL policy (which permitted client INSERT) and
-- replace it with explicit UPDATE / DELETE own-row policies. SELECT is unchanged
-- (the existing "Authenticated users can read all voyages" policy still applies),
-- and co-author edits still work via voyages_members_update. With no INSERT policy
-- present, anon/authenticated clients can no longer insert voyages directly.
-- ════════════════════════════════════════════════════════════════════════════

drop policy if exists "Users manage own voyages" on public.voyages;
-- Also drop the temporary own-row INSERT policy that was restored to keep the
-- pre-passes `main` frontend working while this branch was in flight. Once this
-- migration ships alongside the RPC-based creation flow, direct INSERT must be
-- closed again. (No-op if it was never created.)
drop policy if exists voyages_insert_own on public.voyages;

create policy voyages_update_own on public.voyages
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy voyages_delete_own on public.voyages
  for delete using (user_id = auth.uid());
