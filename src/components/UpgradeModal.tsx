'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';
import type { Plan } from '@/lib/plans';

export interface UpgradeModalProps {
  open: boolean;
  reason: string;
  plans?: Plan[];
  onClose?: () => void;
  dismissHref?: string;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

/** The "you hit your plan's limit" experience across the whole app — a
 * single attractive popup with the paid plans and a one-click Stripe
 * Checkout button, instead of a plain error string. Used both as a true
 * overlay (client pages catching a 402 from an API route, with onClose) and
 * as the dashboard layout's full-page state when loading a profile itself
 * hits the limit (server-rendered, plans passed as a prop, dismissHref
 * instead of a close button since there's no page underneath to return to).
 */
export default function UpgradeModal({ open, reason, plans: plansProp, onClose, dismissHref }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[] | null>(plansProp ?? null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plansProp || !open || plans) return;
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => setPlans(j.plans))
      .catch(() => {});
  }, [open, plansProp, plans]);

  async function upgrade(planId: string) {
    setLoadingId(planId);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not start checkout.');
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setLoadingId(null);
    }
  }

  if (!open) return null;

  const paidPlans = (plans ?? []).filter((p) => !p.isFreeTrial);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-neutral-950/70 p-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-neutral-500 shadow-sm backdrop-blur hover:bg-neutral-100 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        <div className="relative overflow-hidden bg-gradient-to-br from-tiktok-cyan/10 via-transparent to-tiktok-pink/10 px-6 py-8 text-center sm:px-10">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-tiktok-cyan/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tiktok-pink/20 blur-3xl" />
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-tiktok-cyan to-tiktok-pink shadow-lg shadow-tiktok-pink/30">
            <Sparkles size={26} className="text-white" />
          </div>
          <h2 className="relative mt-4 text-2xl font-extrabold">You&apos;ve reached your plan&apos;s limit</h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">{reason}</p>
        </div>

        <div className="px-6 pb-8 pt-2 sm:px-10">
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          {!plans ? (
            <p className="py-8 text-center text-sm text-neutral-400">Loading plans…</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {paidPlans.map((plan, i) => {
                const highlighted = i === 0;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col gap-4 rounded-2xl border p-6 text-center ${
                      highlighted
                        ? 'border-tiktok-pink/40 bg-gradient-to-b from-tiktok-pink/5 to-transparent shadow-lg shadow-tiktok-pink/10'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {highlighted && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-3 py-1 text-[11px] font-bold text-white shadow">
                        Most popular
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="mt-1 text-3xl font-extrabold">
                        {formatPrice(plan.priceCents, plan.currency)}
                        <span className="text-sm font-normal text-neutral-400"> / {plan.billingInterval}</span>
                      </p>
                    </div>
                    <ul className="mx-auto flex flex-1 flex-col gap-2 text-left text-xs text-neutral-600 dark:text-neutral-300">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check size={13} className="mt-0.5 shrink-0 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => upgrade(plan.id)}
                      disabled={loadingId !== null || !plan.stripePriceId}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${
                        highlighted
                          ? 'bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white hover:opacity-90'
                          : 'bg-neutral-900 text-white hover:opacity-90 dark:bg-white dark:text-neutral-900'
                      }`}
                    >
                      {loadingId === plan.id ? <Loader2 size={14} className="mx-auto animate-spin" /> : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            {dismissHref ? (
              <Link href={dismissHref} className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                Maybe later
              </Link>
            ) : (
              onClose && (
                <button onClick={onClose} className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  Maybe later
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
