'use client';

import { useState } from 'react';
import { Bookmark, Plus, Check, Loader2, StickyNote, Star } from 'lucide-react';
import clsx from 'clsx';
import { useChannelData } from './dashboard/ChannelDataContext';

interface Tracking {
  categories: string[];
  myScore: number | null;
  notes: string;
  tracked: boolean;
}

export default function CreatorTrackingCard({
  username,
  initial,
  allCategories
}: {
  username: string;
  initial: Tracking;
  allCategories: string[];
}) {
  const { updateTracking, updateCategories } = useChannelData();
  const [tracked, setTracked] = useState(initial.tracked);
  const [categories, setCategories] = useState<string[]>(initial.categories);
  const [availableCategories, setAvailableCategories] = useState<string[]>(allCategories);
  const [newCategory, setNewCategory] = useState('');
  const [myScore, setMyScore] = useState<number | null>(initial.myScore);
  const [notes, setNotes] = useState(initial.notes);
  const [savingTracked, setSavingTracked] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [saved, setSaved] = useState(false);

  async function patchTracking(updates: Partial<Tracking>) {
    const res = await fetch(`/api/channel/${username}/tracking`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  }

  async function toggleTracked() {
    setSavingTracked(true);
    const next = !tracked;
    setTracked(next);
    updateTracking({ tracked: next });
    try {
      await patchTracking({ tracked: next });
    } finally {
      setSavingTracked(false);
    }
  }

  async function toggleCategory(cat: string) {
    const next = categories.includes(cat) ? categories.filter((c) => c !== cat) : [...categories, cat];
    setCategories(next);
    updateTracking({ categories: next });
    setSavingCategories(true);
    try {
      await patchTracking({ categories: next });
    } finally {
      setSavingCategories(false);
    }
  }

  async function addNewCategory() {
    const clean = newCategory.trim();
    if (!clean) return;
    setSavingCategories(true);
    try {
      const res = await fetch('/api/settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean })
      });
      const updatedList: string[] = await res.json();
      setAvailableCategories(updatedList);
      updateCategories(updatedList);
      const next = categories.includes(clean) ? categories : [...categories, clean];
      setCategories(next);
      updateTracking({ categories: next });
      await patchTracking({ categories: next });
      setNewCategory('');
    } finally {
      setSavingCategories(false);
    }
  }

  async function saveDetails() {
    setSavingDetails(true);
    setSaved(false);
    updateTracking({ myScore, notes });
    try {
      await patchTracking({ myScore, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <StickyNote size={16} /> My tracking
        </h2>
        <button
          onClick={toggleTracked}
          disabled={savingTracked}
          className={clsx(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50',
            tracked
              ? 'border-tiktok-pink bg-tiktok-pink text-white'
              : 'border-neutral-300 text-neutral-600 hover:border-tiktok-pink hover:text-tiktok-pink dark:border-neutral-700 dark:text-neutral-300'
          )}
        >
          {savingTracked ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} fill={tracked ? 'currentColor' : 'none'} />}
          {tracked ? 'Tracked' : 'Track this creator'}
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Categories</p>
        <div className="flex flex-wrap gap-1.5">
          {availableCategories.map((cat) => {
            const active = categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                disabled={savingCategories}
                className={clsx(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50',
                  active
                    ? 'border-tiktok-pink bg-tiktok-pink/10 text-tiktok-pink'
                    : 'border-neutral-300 text-neutral-500 hover:border-tiktok-pink hover:text-tiktok-pink dark:border-neutral-700 dark:text-neutral-400'
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewCategory()}
            placeholder="New category…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={addNewCategory}
            disabled={!newCategory.trim() || savingCategories}
            className="flex items-center gap-1 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          <Star size={12} /> My Score
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={myScore ?? 0}
            onChange={(e) => setMyScore(Number(e.target.value))}
            className="flex-1 accent-tiktok-pink"
          />
          <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums">
            {myScore !== null ? `${myScore}/10` : '—'}
          </span>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything worth remembering about this creator…"
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <button
        onClick={saveDetails}
        disabled={savingDetails}
        className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {savingDetails ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
        {saved ? 'Saved' : 'Save Score & Notes'}
      </button>
    </div>
  );
}
