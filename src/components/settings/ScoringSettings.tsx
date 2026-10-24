'use client';

import { useEffect, useState } from 'react';
import { Target, Check, Loader2 } from 'lucide-react';

interface Thresholds {
  monthlyRevenueGoal: number;
  lifetimeRevenueGoal: number;
  activeWindowDays: number;
}

export default function ScoringSettings() {
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/scoring-thresholds')
      .then((r) => r.json())
      .then(setThresholds)
      .catch(() => setError('Could not load scoring settings.'));
  }, []);

  async function save() {
    if (!thresholds) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/settings/scoring-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not save.');
      setThresholds(body);
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
        <Target size={16} /> Creator success goals
      </h2>
      <p className="mb-3 text-xs text-neutral-400">
        Drives the &quot;Winning / Promising / Not there yet&quot; verdict shown under a channel&apos;s Creator Score on
        its Overview tab — a profile only reads as truly winning when it&apos;s active AND clears both goals below.
      </p>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {!thresholds ? (
        <p className="text-xs text-neutral-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Monthly revenue goal ($)
            <input
              type="number"
              min={0}
              value={thresholds.monthlyRevenueGoal}
              onChange={(e) => setThresholds({ ...thresholds, monthlyRevenueGoal: Number(e.target.value) })}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Lifetime revenue goal ($)
            <input
              type="number"
              min={0}
              value={thresholds.lifetimeRevenueGoal}
              onChange={(e) => setThresholds({ ...thresholds, lifetimeRevenueGoal: Number(e.target.value) })}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Active window (days)
            <input
              type="number"
              min={1}
              value={thresholds.activeWindowDays}
              onChange={(e) => setThresholds({ ...thresholds, activeWindowDays: Number(e.target.value) })}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <span className="font-normal normal-case text-neutral-400">Default 90 ≈ last 3 months</span>
          </label>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving || !thresholds}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
        {saved ? 'Saved' : 'Save goals'}
      </button>
    </div>
  );
}
