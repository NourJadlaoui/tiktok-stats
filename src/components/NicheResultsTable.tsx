'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { NicheProfile } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import ScoreBadge from './ScoreBadge';
import { BadgeCheck, ArrowUpDown, ExternalLink, ArrowRight } from 'lucide-react';

type SortKey = 'score' | 'followers' | 'recent' | 'videosFound' | 'avgViews' | 'totalViews';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'score', label: 'Creator Score' },
  { value: 'followers', label: 'Followers' },
  { value: 'recent', label: 'Activity in last 30 days' },
  { value: 'videosFound', label: 'Videos found for this topic' },
  { value: 'avgViews', label: 'Avg views per video' },
  { value: 'totalViews', label: 'Total views found' }
];

function sortValue(p: NicheProfile, key: SortKey): number {
  switch (key) {
    case 'score':
      return p.score.overall;
    case 'followers':
      return p.followers;
    case 'recent':
      return p.recentVideosFound;
    case 'videosFound':
      return p.videosFoundInSearch;
    case 'avgViews':
      return p.avgViewsFound;
    case 'totalViews':
      return p.totalViewsFound;
  }
}

export default function NicheResultsTable({ profiles }: { profiles: NicheProfile[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [search, setSearch] = useState('');
  const [minFollowers, setMinFollowers] = useState(0);

  const filtered = useMemo(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.username.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q));
    }
    if (minFollowers > 0) {
      result = result.filter((p) => p.followers >= minFollowers);
    }
    return [...result].sort((a, b) => sortValue(b, sortKey) - sortValue(a, sortKey));
  }, [profiles, search, minFollowers, sortKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or @username…"
          className="w-64 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="number"
          min={0}
          value={minFollowers || ''}
          onChange={(e) => setMinFollowers(Number(e.target.value) || 0)}
          placeholder="Min followers"
          className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-neutral-400" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort by {o.label}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-neutral-400">{filtered.length} profiles</span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-400">No profiles match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <div key={p.username} className="card flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-neutral-300 dark:text-neutral-600">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold">{p.displayName}</span>
                    {p.verified && <BadgeCheck size={14} className="shrink-0 text-cyan-500" />}
                  </div>
                  <p className="truncate text-xs text-neutral-400">@{p.username}</p>
                </div>
                <ScoreBadge overall={p.score.overall} label="Creator Score" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Followers</div>
                  <div className="font-semibold tabular-nums">
                    {p.followers > 0 ? formatCompactNumber(p.followers) : '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Last 30 days</div>
                  <div className="font-semibold tabular-nums">{p.recentVideosFound} videos</div>
                </div>
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Found for topic</div>
                  <div className="font-semibold tabular-nums">{p.videosFoundInSearch} videos</div>
                </div>
                <div className="rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
                  <div className="text-neutral-400">Avg views</div>
                  <div className="font-semibold tabular-nums">{formatCompactNumber(p.avgViewsFound)}</div>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/dashboard/${p.username}/overview`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
                >
                  Profile Stats <ArrowRight size={12} />
                </Link>
                {p.topVideoUrl && (
                  <a
                    href={p.topVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Top matching video"
                    className="flex items-center justify-center rounded-lg border border-neutral-200 px-2.5 py-1.5 text-neutral-400 hover:text-tiktok-pink dark:border-neutral-700"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
