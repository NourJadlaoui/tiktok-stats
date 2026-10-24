'use client';

import { useEffect, useState } from 'react';
import { Tags, Plus, Trash2 } from 'lucide-react';

export default function CategoryManager() {
  const [categories, setCategories] = useState<string[] | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch('/api/settings/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setError('Could not load categories.'));
  }

  useEffect(load, []);

  async function addCategory() {
    const clean = newCategory.trim();
    if (!clean) return;
    setError(null);
    const res = await fetch('/api/settings/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: clean })
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'Could not add category.');
    setCategories(body);
    setNewCategory('');
  }

  async function deleteCat(name: string) {
    setError(null);
    const res = await fetch(`/api/settings/categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    const body = await res.json();
    if (!res.ok) return setError('Could not delete category.');
    setCategories(body);
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Tags size={16} /> Creator categories
      </h2>
      <p className="mb-3 text-xs text-neutral-400">
        The shared list of category labels available when tagging a creator from their Overview tab — used to
        filter the Accounts and Tracked pages. Deleting one here removes it from every creator it&apos;s assigned to.
      </p>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {!categories ? (
        <p className="text-xs text-neutral-400">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="mb-3 text-xs text-neutral-400">
          No categories yet — add one below, or create one directly from a creator&apos;s Overview tab.
        </p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {c}
              <button onClick={() => deleteCat(c)} className="text-neutral-400 hover:text-red-500">
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          placeholder="New category…"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={addCategory}
          disabled={!newCategory.trim()}
          className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}
