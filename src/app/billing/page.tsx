import { requireEffectiveUser } from '@/lib/auth';
import { listActivePlans, getMySubscription, getPaymentsEnabled } from '@/lib/plans';
import { getUsageCountThisMonth, getUsageCountLifetime } from '@/lib/usage';
import PricingPlans from '@/components/PricingPlans';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const { effectiveUserId } = await requireEffectiveUser();
  const [plans, subscription, paymentsEnabled] = await Promise.all([
    listActivePlans(),
    getMySubscription(),
    getPaymentsEnabled()
  ]);

  const plan = subscription?.plan;
  const usageEventTypes = ['profile_scan', 'niche_search', 'niche_finder_term', 'bulk_scan_item'] as const;
  const used = plan
    ? plan.isFreeTrial
      ? await getUsageCountLifetime(effectiveUserId, [...usageEventTypes])
      : await getUsageCountThisMonth(effectiveUserId, [...usageEventTypes])
    : 0;

  const limit = plan?.monthlyRequestLimit ?? null;
  const usagePct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;

  return (
    <div className="mx-auto max-w-5xl py-10">
      <h1 className="text-2xl font-bold">Billing &amp; plans</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Manage your subscription and see how much of your plan you&apos;ve used.
      </p>

      {plan && (
        <div className="card mt-6 flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {plan.isFreeTrial ? 'Lifetime scans used' : 'Scans used this month'}
            </span>
            <span className="tabular-nums text-neutral-400">
              {used}
              {limit !== null ? ` / ${limit}` : ' (unlimited)'}
            </span>
          </div>
          {usagePct !== null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink transition-all duration-300"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <PricingPlans
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            priceCents: p.priceCents,
            currency: p.currency,
            billingInterval: p.billingInterval,
            isFreeTrial: p.isFreeTrial,
            features: p.features,
            hasStripePrice: Boolean(p.stripePriceId)
          }))}
          currentPlanId={plan?.id ?? null}
          paymentsEnabled={paymentsEnabled}
          hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
        />
      </div>
    </div>
  );
}
