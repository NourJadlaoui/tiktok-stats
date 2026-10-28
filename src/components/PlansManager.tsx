'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Power } from 'lucide-react';

interface Plan {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  billingInterval: 'month' | 'year' | 'one_time';
  monthlyRequestLimit: number | null;
  maxTrackedProfiles: number | null;
  maxVideosPerProfile: number | null;
  bulkScanMaxUsernames: number;
  isFreeTrial: boolean;
  isActive: boolean;
  stripePriceId: string | null;
}

function numOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [paymentsEnabled, setPaymentsEnabledState] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [togglingPayments, setTogglingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch('/api/admin/plans')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => {
        setPlans(j.plans);
        setPaymentsEnabledState(j.paymentsEnabled);
      })
      .catch(() => setError('Could not load plans.'));
  }

  useEffect(load, []);

  function updateField<K extends keyof Plan>(id: string, field: K, value: Plan[K]) {
    setPlans((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)) : prev));
  }

  async function save(plan: Plan) {
    setSavingId(plan.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          priceCents: plan.priceCents,
          monthlyRequestLimit: plan.monthlyRequestLimit,
          maxTrackedProfiles: plan.maxTrackedProfiles,
          maxVideosPerProfile: plan.maxVideosPerProfile,
          bulkScanMaxUsernames: plan.bulkScanMaxUsernames,
          isActive: plan.isActive,
          stripePriceId: plan.stripePriceId
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save plan.');
    } finally {
      setSavingId(null);
    }
  }

  async function togglePayments() {
    setTogglingPayments(true);
    const next = !paymentsEnabled;
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentsEnabled: next })
      });
      if (!res.ok) throw new Error();
      setPaymentsEnabledState(next);
    } catch {
      setError('Could not update payments toggle.');
    } finally {
      setTogglingPayments(false);
    }
  }

  if (error && !plans) return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  if (!plans) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-semibold">Payment gateway</p>
          <p className="text-xs text-neutral-400">
            {paymentsEnabled ? 'Stripe Checkout is live — users can upgrade plans.' : 'Disabled — upgrade buttons are hidden/blocked for everyone.'}
          </p>
        </div>
        <button
          onClick={togglePayments}
          disabled={togglingPayments}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            paymentsEnabled
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
          }`}
        >
          {togglingPayments ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
          {paymentsEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-400 dark:border-neutral-800">
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Price ($/mo)</th>
              <th className="py-2 pr-3">Req. limit</th>
              <th className="py-2 pr-3">Max profiles</th>
              <th className="py-2 pr-3">Max videos/profile</th>
              <th className="py-2 pr-3">Bulk batch max</th>
              <th className="py-2 pr-3">Stripe price ID</th>
              <th className="py-2 pr-3">Active</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-3 font-medium">
                  {plan.name} {plan.isFreeTrial && <span className="text-[10px] text-neutral-400">(trial)</span>}
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    step="0.01"
                    className="w-20 rounded border border-neutral-200 bg-transparent px-1.5 py-1 dark:border-neutral-700"
                    value={plan.priceCents / 100}
                    onChange={(e) => updateField(plan.id, 'priceCents', Math.round(Number(e.target.value) * 100))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    placeholder="∞"
                    className="w-20 rounded border border-neutral-200 bg-transparent px-1.5 py-1 dark:border-neutral-700"
                    value={plan.monthlyRequestLimit ?? ''}
                    onChange={(e) => updateField(plan.id, 'monthlyRequestLimit', numOrNull(e.target.value))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    placeholder="∞"
                    className="w-20 rounded border border-neutral-200 bg-transparent px-1.5 py-1 dark:border-neutral-700"
                    value={plan.maxTrackedProfiles ?? ''}
                    onChange={(e) => updateField(plan.id, 'maxTrackedProfiles', numOrNull(e.target.value))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    placeholder="∞"
                    className="w-20 rounded border border-neutral-200 bg-transparent px-1.5 py-1 dark:border-neutral-700"
                    value={plan.maxVideosPerProfile ?? ''}
                    onChange={(e) => updateField(plan.id, 'maxVideosPerProfile', numOrNull(e.target.value))}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    className="w-16 rounded border border-neutral-200 bg-transparent px-1.5 py-1 dark:border-neutral-700"
                    value={plan.bulkScanMaxUsernames}
                    onChange={(e) => updateField(plan.id, 'bulkScanMaxUsernames', Number(e.target.value) || 0)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    placeholder="price_..."
                    className="w-36 rounded border border-neutral-200 bg-transparent px-1.5 py-1 text-xs dark:border-neutral-700"
                    value={plan.stripePriceId ?? ''}
                    onChange={(e) => updateField(plan.id, 'stripePriceId', e.target.value || null)}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={plan.isActive}
                    onChange={(e) => updateField(plan.id, 'isActive', e.target.checked)}
                  />
                </td>
                <td className="py-2">
                  <button
                    onClick={() => save(plan)}
                    disabled={savingId === plan.id}
                    className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
                  >
                    {savingId === plan.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
