'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { NicheFinderResult } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import ScoreBadge from './ScoreBadge';
import { ArrowUpDown, ArrowRight, Gem, TrendingUp, Flame, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

type SortKey = 'overall' | 'demand' | 'momentum' | 'engagement' | 'competition' | 'profilesFound';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'overall', label: 'Niche Score' },
  { value: 'demand', label: 'Demand' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'competition', label: 'Competition (low first)' },
  { value: 'profilesFound', label: 'Profiles found' }
];

const TAG_STYLES: Record<string, { className: string; icon: typeof Gem }> = {
  'Hidden gem': { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: Gem },
  'Hot right now': { className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300', icon: Flame },
  Rising: { className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', icon: TrendingUp },
  Saturated: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: AlertTriangle }
};

function sortValue(r: NicheFinderResult, key: SortKey): number {
  switch (key) {
    case 'overall':
      return r.score.overall;
    case 'demand':
      return r.score.demand;
    case 'momentum':
      return r.score.momentum;
    case 'engagement':
      return r.score.engagement;
    case 'competition':
      return -r.score.competition;
    case 'profilesFound':
      return r.profilesFound;
  }
}

export default function NicheFinderResultsTable({ results }: { results: NicheFinderResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('overall');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const languages = useMemo(() => [...new Set(results.map((r) => r.language))], [results]);

  const filtered = useMemo(() => {
    let result = results.filter((r) => !r.error);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.term.toLowerCase().includes(q));
    }
    if (tagFilter) result = result.filter((r) => r.opportunityTag === tagFilter);
    if (languageFilter) result = result.filter((r) => r.language === languageFilter);
    return [...result].sort((a, b) => sortValue(b, sortKey) - sortValue(a, sortKey));
  }, [results, search, tagFilter, languageFilter, sortKey]);

  const failedCount = results.filter((r) => r.error).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by term…"
          className="w-56 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {languages.length > 1 && (
          <select
            aria-label="Filter by language"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter by opportunity tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="">Any opportunity tag</option>
          {Object.keys(TAG_STYLES).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-neutral-400" />
          <select
            aria-label="Sort results"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort by {o.label}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-neutral-400">
          {filtered.length} niches{failedCount > 0 && ` · ${failedCount} failed to scan`}
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
              <th className="px-3 py-2.5">Niche</th>
              <th className="px-3 py-2.5">Score</th>
              <th className="px-3 py-2.5">Tag</th>
              <th className="px-3 py-2.5">Demand</th>
              <th className="px-3 py-2.5">Momentum</th>
              <th className="px-3 py-2.5">Competition</th>
              <th className="px-3 py-2.5">Profiles</th>
              <th className="px-3 py-2.5">Top creator</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const tag = r.opportunityTag ? TAG_STYLES[r.opportunityTag] : null;
              return (
                <tr key={r.term} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.term}</div>
                    <div className="text-xs text-neutral-400">{r.language}</div>
                  </td>
                  <td className="px-3 py-2">
                    <ScoreBadge overall={r.score.overall} label="Niche Score" />
                  </td>
                  <td className="px-3 py-2">
                    {tag && (
                      <span className={clsx('flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', tag.className)}>
                        <tag.icon size={11} /> {r.opportunityTag}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.score.demand}</td>
                  <td className="px-3 py-2 tabular-nums">{r.score.momentum}</td>
                  <td className="px-3 py-2 tabular-nums">{r.score.competition}</td>
                  <td className="px-3 py-2 tabular-nums">{r.profilesFound}</td>
                  <td className="px-3 py-2">
                    {r.topProfile ? (
                      <div className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.topProfile.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                        <span className="truncate text-xs">@{r.topProfile.username}</span>
                        <span className="text-xs text-neutral-400">{formatCompactNumber(r.topProfile.followers)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/niche?q=${encodeURIComponent(r.term)}`}
                      className="flex items-center gap-1 text-xs font-medium text-tiktok-pink hover:underline"
                    >
                      View <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
