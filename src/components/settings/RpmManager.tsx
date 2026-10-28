'use client';

import { useEffect, useState } from 'react';
import { Coins, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function RpmManager() {
  const [rpm, setRpm] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newNiche, setNewNiche] = useState('');
  const [newRpm, setNewRpm] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function load() {
    fetch('/api/settings/rpm')
      .then((r) => r.json())
      .then(setRpm)
      .catch(() => setError('Could not load RPM settings.'));
  }

  useEffect(load, []);

  async function save(niche: string, value: number) {
    setError(null);
    const res = await fetch('/api/settings/rpm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, rpm: value })
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Could not save.');
      return;
    }
    setRpm(body);
  }

  async function handleAdd() {
    const value = Number(newRpm);
    if (!newNiche.trim() || !Number.isFinite(value)) return;
    await save(newNiche, value);
    setNewNiche('');
    setNewRpm('');
  }

  async function handleDelete(niche: string) {
    setError(null);
    const res = await fetch(`/api/settings/rpm?niche=${encodeURIComponent(niche)}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Could not delete.');
      return;
    }
    setRpm(body);
  }

  function startEdit(niche: string, current: number) {
    setEditing(niche);
    setEditValue(String(current));
  }

  async function commitEdit(niche: string) {
    const value = Number(editValue);
    if (Number.isFinite(value)) await save(niche, value);
    setEditing(null);
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Coins size={16} /> Niche RPM
      </h2>
      <p className="mb-3 text-xs text-neutral-400">
        The revenue-per-mille used for a channel&apos;s monetization estimate, based on its niche — applied the first
        time a channel is loaded (edit per-channel afterward from that channel&apos;s Monetization tab). Add your own
        niches, or edit/delete these defaults.
      </p>

      {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {!rpm ? (
        <p className="text-xs text-neutral-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(rpm)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([niche, value]) => (
              <div key={niche} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800">
                <span className="truncate capitalize text-neutral-600 dark:text-neutral-300">{niche}</span>
                {editing === niche ? (
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400">$</span>
                    <input
                      autoFocus
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitEdit(niche)}
                      className="w-16 rounded border border-neutral-300 bg-white px-1 py-0.5 text-right text-sm dark:border-neutral-600 dark:bg-neutral-900"
                    />
                    <button onClick={() => commitEdit(niche)} className="text-emerald-500 hover:text-emerald-600">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-neutral-600">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">${value.toFixed(2)}</span>
                    <button onClick={() => startEdit(niche, value)} className="text-neutral-400 hover:text-tiktok-pink" title="Edit">
                      <Pencil size={13} />
                    </button>
                    {niche !== 'default' && (
                      <button onClick={() => handleDelete(niche)} className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={newNiche}
          onChange={(e) => setNewNiche(e.target.value)}
          placeholder="New niche name…"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          value={newRpm}
          onChange={(e) => setNewRpm(e.target.value)}
          type="number"
          step="0.01"
          min="0"
          placeholder="RPM $"
          className="w-24 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={handleAdd}
          disabled={!newNiche.trim() || !newRpm}
          className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}
