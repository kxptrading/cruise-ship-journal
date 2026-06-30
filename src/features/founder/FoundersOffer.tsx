// ─────────────────────────────────────────────────────────────────────────────
// features/founder/FoundersOffer.tsx — Founder's Offer hero (live tiered counter)
//
// Shows the current pricing tier and a live "spots claimed" counter, sourced from
// the get_founder_status() Supabase RPC (completed purchases only — never trusted
// from the client). Tiers roll over automatically: when one fills, the RPC returns
// the next as `current`, so this UI and the checkout follow without any branching.
//
// NOTE: not yet wired into the landing page or backend — pending review. The RPC
// and Stripe wiring are the next step (see FoundersOffer notes / chat).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import { supabase } from '@/lib/supabase'

// ── Data contract (matches the get_founder_status() RPC, camelCase) ──────────────
export interface FounderTier {
  key:        string
  label:      string
  priceCents: number
  capacity:   number | null   // null = unlimited (Standard Access)
  sold:       number
  soldOut:    boolean
}
export interface FounderStatus {
  totalSold: number
  tiers:     FounderTier[]
  current:   FounderTier & { remaining: number | null; pct: number }
}

export function useFounderStatus() {
  return useQuery({
    queryKey: ['founder-status'],
    queryFn: async (): Promise<FounderStatus | null> => {
      const { data, error } = await supabase.rpc('get_founder_status')
      if (error) throw error
      return (data as FounderStatus) ?? null
    },
    refetchInterval: 20_000,  // keep the live counter fresh as purchases land
    staleTime: 10_000,
  })
}

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`

interface Props {
  onCheckout?: (tierKey: string) => void
  status?: FounderStatus      // optional override (preview/testing); else uses the hook
}

export default function FoundersOffer({ onCheckout, status: override }: Props) {
  const query  = useFounderStatus()
  const status = override ?? query.data ?? null

  if (!override && query.isLoading) return <FoundersOfferSkeleton />
  if (!status) return null  // backend not live yet / error — render nothing

  const { current, tiers } = status
  const pct      = Math.min(100, current.pct)
  const urgent   = pct >= 80                                    // >80% full → urgency styling
  const soldOut  = tiers.filter(t => t.soldOut)                 // previous tiers, for the "sold out" line

  const accent = urgent ? '#D97706' : '#C9A227'                 // amber when urgent, else gold

  return (
    <section className="relative mx-auto w-full max-w-xl rounded-3xl bg-[#14293F] px-6 py-8 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:px-9 sm:py-10">
      {/* Kicker + sold-out roll-up */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C9A227]">
          Founding Member Offer
        </span>
        {soldOut.length > 0 && (
          <span className="text-[11px] font-medium text-white/55">
            {soldOut.map(t => t.label).join(' · ')} — sold out
          </span>
        )}
      </div>

      {/* Tier + price */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl leading-tight text-white sm:text-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            {current.label}
          </h2>
          <p className="mt-1 text-sm text-white/70">Lifetime access · one-time payment</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-4xl leading-none sm:text-5xl" style={{ fontFamily: 'Georgia, serif', color: accent }}>
            {money(current.priceCents)}
          </div>
          {current.priceCents < 3500 && (
            <div className="mt-1 text-xs text-white/45 line-through">{money(3500)} later</div>
          )}
        </div>
      </div>

      {/* Live counter */}
      {current.capacity != null && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">
              <AnimatedNumber value={current.sold} /> <span className="text-white/55">/ {current.capacity.toLocaleString()} {current.label} spots claimed</span>
            </span>
            {urgent && (
              <motion.span
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full bg-[#D97706] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
              >
                Selling fast
              </motion.span>
            )}
          </div>
          {/* Progress bar — width transitions smoothly when the count increments */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%`, background: accent }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: urgent ? '#FBBF24' : 'rgba(255,255,255,0.5)' }}>
            {current.remaining != null && current.remaining <= 25
              ? `Only ${current.remaining} left at this price — then ${money(nextPrice(tiers, current.key))}.`
              : `When these fill, the price rises to ${money(nextPrice(tiers, current.key))}.`}
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onCheckout?.(current.key)}
        className="mt-7 w-full rounded-full px-6 py-3.5 text-[15px] font-bold text-[#14293F] transition-transform active:scale-[0.98]"
        style={{ background: accent }}
      >
        Claim your lifetime pass — {money(current.priceCents)}
      </button>

      {/* Value proposition */}
      <p className="mt-4 text-center text-[13px] leading-relaxed text-white/70">
        One-time payment. Lifetime access. <span className="text-white/90">No cruise Wi-Fi required</span> —
        Deck Days works fully offline and syncs when you’re back on land.
      </p>
    </section>
  )
}

// Smoothly tweens to the new value when the live counter increments.
function AnimatedNumber({ value }: { value: number }) {
  const mv      = useMotionValue(value)
  const rounded = useTransform(mv, v => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' })
    return controls.stop
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return <motion.span>{rounded}</motion.span>
}

// Price of the next tier after `key` (for the "price rises to…" line); falls back
// to the standard price if we're already on the last tier.
function nextPrice(tiers: FounderTier[], key: string): number {
  const i = tiers.findIndex(t => t.key === key)
  return tiers[i + 1]?.priceCents ?? tiers[i]?.priceCents ?? 3500
}

function FoundersOfferSkeleton() {
  return (
    <section className="mx-auto h-[340px] w-full max-w-xl animate-pulse rounded-3xl bg-[#14293F]/80" />
  )
}
