'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, StickyNote, Search, Table2, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import ProfileGallery, { GalleryProfileRow } from './ProfileGallery';

export default function AccountsTable({ accounts, categories }: { accounts: GalleryProfileRow[]; categories: string[] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [trackedOnly, setTrackedOnly] = useState(false);
  const [minMyScore, setMinMyScore] = useState(0);
  const [view, setView] = useState<'table' | 'gallery'>('table');

  const filtered = useMemo(() => {
    let result = accounts;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => a.username.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q));
    }
    if (categoryFilter) result = result.filter((a) => a.categories.includes(categoryFilter));
    if (trackedOnly) result = result.filter((a) => a.tracked);
    if (minMyScore > 0) result = result.filter((a) => (a.myScore ?? -1) >= minMyScore);
    return result;
  }, [accounts, search, categoryFilter, trackedOnly, minMyScore]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
          <button
            onClick={() => setView('table')}
            title="Table view"
            className={clsx('rounded-full p-1.5', view === 'table' ? 'bg-white shadow-sm dark:bg-neutral-800' : 'text-neutral-400')}
          >
            <Table2 size={14} />
          </button>
          <button
            onClick={() => setView('gallery')}
            title="Card gallery view"
            className={clsx('rounded-full p-1.5', view === 'gallery' ? 'bg-white shadow-sm dark:bg-neutral-800' : 'text-neutral-400')}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="rounded-lg border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Any category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <select
          value={minMyScore}
          onChange={(e) => setMinMyScore(Number(e.target.value))}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value={0}>Any My Score</option>
          {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}+ My Score
            </option>
          ))}
        </select>
        <button
          onClick={() => setTrackedOnly((v) => !v)}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition',
            trackedOnly
              ? 'border-tiktok-pink bg-tiktok-pink text-white'
              : 'border-neutral-300 text-neutral-600 hover:border-tiktok-pink hover:text-tiktok-pink dark:border-neutral-700 dark:text-neutral-300'
          )}
        >
          <Bookmark size={13} fill={trackedOnly ? 'currentColor' : 'none'} />
          Tracked only
        </button>
        {(search || categoryFilter || trackedOnly || minMyScore > 0) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setTrackedOnly(false);
              setMinMyScore(0);
            }}
            className="text-xs font-medium text-tiktok-pink hover:underline"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{filtered.length} of {accounts.length}</span>
      </div>

      {view === 'gallery' ? (
        <ProfileGallery rows={filtered} />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-400">No accounts match these filters.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">My Score</th>
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Last viewed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.username} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={acc.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-semibold">
                          {acc.tracked && <Bookmark size={12} className="shrink-0 fill-tiktok-pink text-tiktok-pink" />}
                          <span className="truncate">{acc.displayName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <span className="truncate">@{acc.username}</span>
                          {acc.notes && (
                            <span title={acc.notes}>
                              <StickyNote size={11} className="shrink-0" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {acc.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {acc.categories.map((c) => (
                          <span
                            key={c}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {acc.myScore !== null ? (
                      <span className="font-semibold">{acc.myScore}/10</span>
                    ) : (
                      <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{acc.niche}</td>
                  <td className="px-4 py-3">{acc.language}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(acc.lastViewedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/${acc.username}/overview`} className="text-xs font-medium text-tiktok-pink hover:underline">
                      View dashboard
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
