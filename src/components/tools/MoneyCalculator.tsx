'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

function parseNonNegative(raw: string): { value: number | null; error: boolean } {
  if (raw.trim() === '') return { value: null, error: false };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: true };
  return { value: n, error: false };
}

export default function MoneyCalculator() {
  const [viewsRaw, setViewsRaw] = useState('');
  const [rpmRaw, setRpmRaw] = useState('');

  const views = parseNonNegative(viewsRaw);
  const rpm = parseNonNegative(rpmRaw);
  const hasInvalidInput = views.error || rpm.error;

  const estimate = useMemo(() => {
    if (hasInvalidInput) return null;
    if (views.value === null || rpm.value === null) return null;
    return (views.value / 1000) * rpm.value;
  }, [hasInvalidInput, views.value, rpm.value]);

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Monthly views (from eligible videos, 60s+)
          <input
            inputMode="numeric"
            value={viewsRaw}
            onChange={(e) => setViewsRaw(e.target.value)}
            placeholder="e.g. 500000"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Your RPM ($ per 1,000 views)
          <input
            inputMode="decimal"
            value={rpmRaw}
            onChange={(e) => setRpmRaw(e.target.value)}
            placeholder="e.g. 0.40"
            className={inputClass}
          />
        </label>
      </div>

      {hasInvalidInput && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Numbers only, and nothing negative — fix the highlighted field to see an estimate.</span>
        </div>
      )}

      <div className="card flex flex-col items-center gap-1 p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Estimated monthly revenue</span>
        <span className="text-4xl font-extrabold tabular-nums">
          {estimate === null ? '—' : `$${estimate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        </span>
        <span className="text-xs text-neutral-400">
          {estimate === null ? 'Enter monthly views and an RPM above' : 'An estimate from the numbers you entered — not a guaranteed or TikTok-reported payout'}
        </span>
      </div>
    </div>
  );
}
