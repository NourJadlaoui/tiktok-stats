import Link from 'next/link';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { Plan } from '@/lib/plans';

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

export default function LandingPricing({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, i) => {
        const highlighted = !plan.isFreeTrial && i === 1;
        return (
          <div
            key={plan.id}
            className={clsx(
              'card flex flex-col gap-4 p-6',
              highlighted && 'relative ring-2 ring-tiktok-pink'
            )}
          >
            {highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-3 py-1 text-xs font-bold text-white">
                Most popular
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-extrabold">
                {formatPrice(plan.priceCents, plan.currency)}
                {plan.priceCents > 0 && <span className="text-sm font-normal text-neutral-400"> / {plan.billingInterval}</span>}
              </p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className={clsx(
                'rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition',
                highlighted
                  ? 'bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-white hover:opacity-90'
                  : 'bg-neutral-900 text-white hover:opacity-90 dark:bg-white dark:text-neutral-900'
              )}
            >
              {plan.isFreeTrial ? 'Start free trial' : 'Get started'}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
