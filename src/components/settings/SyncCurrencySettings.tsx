'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Euro, Check, Loader2 } from 'lucide-react';

const SYNC_OPTIONS = [4, 12, 24, 48];

export default function SyncCurrencySettings() {
  const [syncIntervalHours, setSyncIntervalHours] = useState<number | null>(null);
  const [usdToEurRate, setUsdToEurRate] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/sync-interval')
      .then((r) => r.json())
      .then((d) => setSyncIntervalHours(d.syncIntervalHours))
      .catch(() => {});
    fetch('/api/settings/currency')
      .then((r) => r.json())
      .then((d) => setUsdToEurRate(d.usdToEurRate))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const [syncRes, currencyRes] = await Promise.all([
        fetch('/api/settings/sync-interval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncIntervalHours })
        }),
        fetch('/api/settings/currency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usdToEurRate })
        })
      ]);
      const syncBody = await syncRes.json();
      const currencyBody = await currencyRes.json();
      if (!syncRes.ok) throw new Error(syncBody.error || 'Could not save sync interval.');
      if (!currencyRes.ok) throw new Error(currencyBody.error || 'Could not save currency rate.');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <RefreshCw size={16} /> Sync & currency
      </h2>
      <p className="mb-3 text-xs text-neutral-400">
        Controls how long cached profile/niche data is served before an automatic re-scan kicks in — a manual
        &quot;Sync now&quot; button always works regardless of this setting. Also sets the USD→EUR rate used for the
        &quot;≈ €X&quot; hover tooltip on money figures.
      </p>

      {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          Auto-sync after
          {syncIntervalHours === null ? (
            <span className="text-neutral-400">Loading…</span>
          ) : (
            <select
              value={syncIntervalHours}
              onChange={(e) => setSyncIntervalHours(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {SYNC_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} hours
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          <span className="flex items-center gap-1">
            <Euro size={12} /> USD → EUR rate
          </span>
          {usdToEurRate === null ? (
            <span className="text-neutral-400">Loading…</span>
          ) : (
            <input
              type="number"
              step="0.01"
              min={0}
              value={usdToEurRate}
              onChange={(e) => setUsdToEurRate(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          )}
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving || syncIntervalHours === null || usdToEurRate === null}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
}
