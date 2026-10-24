'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatCompactNumber } from '@/lib/stats';
import Money from './Money';
import { BadgeCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

export interface TrackedCreatorRow {
  username: string;
  displayName: string;
  avatarUrl: string;
  niche: string;
  categories: string[];
  myScore: number | null;
  followers: number;
  totalRevenue: number;
  followerGrowthPct: number | null;
  firstSyncedAt?: string;
  syncCount: number;
}

export default function TrackedDashboard({ rows, eurRate }: { rows: TrackedCreatorRow[]; eurRate: number }) {
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const c of r.categories) set.add(c);
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(
    () => (categoryFilter ? rows.filter((r) => r.categories.includes(categoryFilter)) : rows),
    [rows, categoryFilter]
  );

  const chartData = useMemo(
    () =>
      filtered
        .filter((r) => r.followerGrowthPct !== null)
        .map((r) => ({ name: r.displayName, growth: Math.round((r.followerGrowthPct as number) * 10) / 10 }))
        .sort((a, b) => b.growth - a.growth),
    [filtered]
  );

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({ followers: acc.followers + r.followers, revenue: acc.revenue + r.totalRevenue }),
        { followers: 0, revenue: 0 }
      ),
    [filtered]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-neutral-400">Tracked creators</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{filtered.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-neutral-400">Combined followers</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{formatCompactNumber(totals.followers)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-neutral-400">Combined est. revenue</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            <Money usd={totals.revenue} eurRate={eurRate} />
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2">
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
          {categoryFilter && (
            <button onClick={() => setCategoryFilter('')} className="text-xs font-medium text-tiktok-pink hover:underline">
              Clear
            </button>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-1 text-sm font-semibold">Follower growth since first synced</h2>
          <p className="mb-2 text-xs text-neutral-400">% change in followers from each creator's first sync to their latest</p>
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 36)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}%`, 'Follower growth']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.growth >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-400">
          No tracked creators {categoryFilter ? 'in this category' : 'yet'} — open a creator&apos;s Overview tab and
          click &quot;Track this creator&quot; to add them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.username} className="card flex flex-col gap-2.5 p-4">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="truncate">{r.displayName}</span>
                    <BadgeCheck size={13} className="shrink-0 text-cyan-500" />
                  </div>
                  <p className="truncate text-xs text-neutral-400">@{r.username}</p>
                </div>
                {r.myScore !== null && (
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold dark:bg-neutral-800">
                    {r.myScore}/10
                  </span>
                )}
              </div>

              {r.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.categories.map((c) => (
                    <span key={c} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Followers</div>
                  <div className="font-semibold tabular-nums">{formatCompactNumber(r.followers)}</div>
                </div>
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Est. revenue</div>
                  <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    <Money usd={r.totalRevenue} eurRate={eurRate} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {r.followerGrowthPct === null ? (
                  <>
                    <Minus size={13} className="text-neutral-400" />
                    <span className="text-neutral-400">Not enough sync history yet</span>
                  </>
                ) : (
                  <>
                    {r.followerGrowthPct >= 0 ? (
                      <TrendingUp size={13} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={13} className="text-red-500" />
                    )}
                    <span className={clsx('font-semibold', r.followerGrowthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                      {r.followerGrowthPct >= 0 ? '+' : ''}
                      {r.followerGrowthPct.toFixed(1)}% followers
                    </span>
                    <span className="text-neutral-400">since first sync ({r.syncCount} syncs)</span>
                  </>
                )}
              </div>

              <Link
                href={`/dashboard/${r.username}/overview`}
                className="mt-auto rounded-lg bg-neutral-100 px-3 py-1.5 text-center text-xs font-medium transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                View full dashboard
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
