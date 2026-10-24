'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface PricingPlan {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year' | 'one_time';
  isFreeTrial: boolean;
  features: string[];
  hasStripePrice: boolean;
}

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

export default function PricingPlans({
  plans,
  currentPlanId,
  paymentsEnabled,
  hasStripeCustomer
}: {
  plans: PricingPlan[];
  currentPlanId: string | null;
  paymentsEnabled: boolean;
  hasStripeCustomer: boolean;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upgrade(planId: string) {
    setError(null);
    setLoadingId(planId);
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

  async function manageBilling() {
    setError(null);
    setLoadingId('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not open billing portal.');
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      {!paymentsEnabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          Payments are currently disabled by the admin — plan changes aren&apos;t available right now.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <div
              key={plan.id}
              className={clsx(
                'card flex flex-col gap-4 p-5',
                isCurrent && 'ring-2 ring-tiktok-pink'
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-tiktok-pink/10 px-2 py-0.5 text-[11px] font-semibold text-tiktok-pink">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {formatPrice(plan.priceCents, plan.currency)}
                  {plan.priceCents > 0 && plan.billingInterval !== 'one_time' && (
                    <span className="text-sm font-normal text-neutral-400"> / {plan.billingInterval}</span>
                  )}
                </p>
              </div>

              <ul className="flex flex-1 flex-col gap-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                hasStripeCustomer && plan.priceCents > 0 ? (
                  <button
                    onClick={manageBilling}
                    disabled={loadingId === 'portal'}
                    className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-800"
                  >
                    {loadingId === 'portal' ? <Loader2 size={14} className="mx-auto animate-spin" /> : 'Manage billing'}
                  </button>
                ) : (
                  <div className="rounded-lg bg-neutral-100 px-4 py-2 text-center text-sm text-neutral-400 dark:bg-neutral-800">
                    Your current plan
                  </div>
                )
              ) : (
                <button
                  onClick={() => upgrade(plan.id)}
                  disabled={!paymentsEnabled || !plan.hasStripePrice || loadingId !== null || plan.isFreeTrial}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
                >
                  {loadingId === plan.id ? <Loader2 size={14} className="mx-auto animate-spin" /> : plan.priceCents === 0 ? 'Switch to Free' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
