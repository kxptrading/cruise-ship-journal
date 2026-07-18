// ─────────────────────────────────────────────────────────────────────────────
// features/passes/hooks.ts — React Query hooks + checkout for Voyage Passes
//
//   usePricingPlans()      — active rows from pricing_plans (world-readable)
//   useMyPasses()          — the current user's voyage_passes (RLS: own only)
//   startVoyageCheckout()  — create-voyage-checkout edge fn → Stripe redirect
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserId } from '@/context'

export interface PricingPlan {
  sku:            string
  name:           string
  description:    string | null
  amount_cents:   number
  currency:       string
  voyage_credits: number
  max_nights:     number | null
}

export type PassSource = 'purchase' | 'bundle' | 'founder' | 'promo'
export type PassStatus = 'available' | 'redeemed' | 'refunded'

export interface VoyagePass {
  id:                         string
  sku:                        string
  source:                     PassSource
  max_nights:                 number | null
  status:                     PassStatus
  needs_review:               boolean
  redeemed_voyage_id:         string | null
  stripe_checkout_session_id: string | null
  purchased_at:               string
  redeemed_at:                string | null
}

// ── Pricing plans (public) ────────────────────────────────────────────────────
export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing-plans'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PricingPlan[]> => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('sku, name, description, amount_cents, currency, voyage_credits, max_nights')
        .eq('active', true)
        .order('amount_cents', { ascending: true })
      if (error) throw error
      return (data ?? []) as PricingPlan[]
    },
  })
}

// ── My passes ─────────────────────────────────────────────────────────────────
// `poll` turns on a short refetch interval — used by the post-checkout success
// page to wait for the fulfilment webhook to land the pass rows.
export function useMyPasses(opts: { poll?: boolean } = {}) {
  const userId = useUserId()
  return useQuery({
    queryKey: ['voyage-passes', userId],
    enabled: !!userId,
    refetchInterval: opts.poll ? 2_000 : false,
    queryFn: async (): Promise<VoyagePass[]> => {
      const { data, error } = await supabase
        .from('voyage_passes')
        .select('id, sku, source, max_nights, status, needs_review, redeemed_voyage_id, stripe_checkout_session_id, purchased_at, redeemed_at')
        .order('purchased_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as VoyagePass[]
    },
  })
}

// ── Start checkout ────────────────────────────────────────────────────────────
// Requires a signed-in user (the edge function attaches client_reference_id from
// the bearer token). Redirects the browser to Stripe Checkout on success.
export async function startVoyageCheckout(sku: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-voyage-checkout', {
    body: { sku },
  })
  if (error) throw error
  const url = (data as { url?: string; error?: string } | null)?.url
  if (!url) throw new Error((data as { error?: string } | null)?.error || 'Could not start checkout — please try again.')
  window.location.href = url
}
