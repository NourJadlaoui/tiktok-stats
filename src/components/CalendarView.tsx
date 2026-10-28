'use client';

import { useMemo, useState } from 'react';
import { TikTokVideo } from '@/lib/types';
import { monthKey, monthLabel, formatCompactNumber } from '@/lib/stats';
import { videoRevenue } from '@/lib/revenue';
import Money from './Money';
import VideoCard from './VideoCard';
import clsx from 'clsx';
import { Search, ArrowUpDown, Eye, Heart, Share2, DollarSign } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAGE_SIZE = 18;

type SortMode = 'newest' | 'oldest' | 'views' | 'likes';

export default function CalendarView({
  videos,
  channelRpm,
  eurRate
}: {
  videos: TikTokVideo[];
  channelRpm: number;
  eurRate: number;
}) {
  const years = useMemo(() => {
    const set = new Set(videos.map((v) => new Date(v.createdAt).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [videos]);

  const [selectedYear, setSelectedYear] = useState<number | 'all'>(years[0] ?? new Date().getFullYear());
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hashtagFilter, setHashtagFilter] = useState('');
  const [minViews, setMinViews] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const countsByYearMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of videos) {
      const d = new Date(v.createdAt);
      const key = monthKey(d.getFullYear(), d.getMonth());
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [videos]);

  const yearTotals = useMemo(() => {
    const map = new Map<number, number>();
    for (const v of videos) {
      const y = new Date(v.createdAt).getFullYear();
      map.set(y, (map.get(y) || 0) + 1);
    }
    return map;
  }, [videos]);

  const maxMonthCount = Math.max(1, ...[...countsByYearMonth.values()]);

  const allHashtags = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) for (const h of v.hashtags) set.add(h);
    return [...set].sort();
  }, [videos]);

  const filtered = useMemo(() => {
    let result = videos;

    if (selectedMonthKey) {
      result = result.filter((v) => {
        const d = new Date(v.createdAt);
        return monthKey(d.getFullYear(), d.getMonth()) === selectedMonthKey;
      });
    } else if (selectedYear !== 'all') {
      result = result.filter((v) => new Date(v.createdAt).getFullYear() === selectedYear);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((v) => v.description.toLowerCase().includes(q));
    }

    if (hashtagFilter) {
      result = result.filter((v) => v.hashtags.includes(hashtagFilter));
    }

    if (minViews > 0) {
      result = result.filter((v) => v.views >= minViews);
    }

    const sorted = [...result];
    switch (sortMode) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'views':
        sorted.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        sorted.sort((a, b) => b.likes - a.likes);
        break;
    }
    return sorted;
  }, [videos, selectedMonthKey, selectedYear, search, hashtagFilter, minViews, sortMode]);

  // Recomputed automatically whenever `filtered` changes — i.e. every time
  // a filter above changes — since it derives straight from that memoized
  // list rather than tracking totals separately.
  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, v) => ({
          views: acc.views + v.views,
          likes: acc.likes + v.likes,
          shares: acc.shares + v.shares,
          revenue: acc.revenue + videoRevenue(v, channelRpm)
        }),
        { views: 0, likes: 0, shares: 0, revenue: 0 }
      ),
    [filtered, channelRpm]
  );

  function selectMonth(year: number, monthIdx: number) {
    const key = monthKey(year, monthIdx);
    if (selectedMonthKey === key) {
      setSelectedMonthKey(null);
    } else {
      setSelectedMonthKey(key);
      setSelectedYear(year);
    }
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Year x month heatmap */}
      <div className="card overflow-x-auto p-4">
        <h2 className="mb-3 text-sm font-semibold">Videos by month &amp; year</h2>
        <div className="min-w-[560px]">
          <div className="mb-1 grid grid-cols-[64px_repeat(12,1fr)_60px] gap-1 text-[11px] font-medium text-neutral-400">
            <div />
            {MONTH_NAMES.map((m) => (
              <div key={m} className="text-center">{m}</div>
            ))}
            <div className="text-center">Total</div>
          </div>
          {years.map((year) => (
            <div key={year} className="mb-1 grid grid-cols-[64px_repeat(12,1fr)_60px] items-center gap-1">
              <button
                onClick={() => {
                  setSelectedYear(year);
                  setSelectedMonthKey(null);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={clsx(
                  'rounded px-1.5 py-1 text-left text-xs font-semibold',
                  selectedYear === year && !selectedMonthKey ? 'text-tiktok-pink' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                )}
              >
                {year}
              </button>
              {MONTH_NAMES.map((_, idx) => {
                const key = monthKey(year, idx);
                const count = countsByYearMonth.get(key) || 0;
                const intensity = count === 0 ? 0 : Math.max(0.15, count / maxMonthCount);
                const isFuture = new Date(year, idx, 1) > new Date();
                return (
                  <button
                    key={key}
                    disabled={isFuture}
                    title={`${monthLabel(year, idx)}: ${count} videos`}
                    onClick={() => selectMonth(year, idx)}
                    className={clsx(
                      'aspect-square rounded text-[10px] font-medium transition disabled:cursor-default disabled:opacity-20',
                      selectedMonthKey === key ? 'ring-2 ring-tiktok-pink' : ''
                    )}
                    style={{
                      backgroundColor: count === 0 ? 'transparent' : `rgba(254,44,85,${intensity})`,
                      border: count === 0 ? '1px dashed rgba(163,163,163,0.3)' : 'none',
                      color: intensity > 0.55 ? 'white' : undefined
                    }}
                  >
                    {count > 0 ? count : ''}
                  </button>
                );
              })}
              <div className="text-center text-xs font-semibold text-neutral-500">{yearTotals.get(year) ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search titles…"
            className="rounded-lg border border-neutral-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <select
          aria-label="Filter by year"
          value={selectedYear === 'all' ? 'all' : String(selectedYear)}
          onChange={(e) => {
            setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value));
            setSelectedMonthKey(null);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          aria-label="Filter by hashtag"
          value={hashtagFilter}
          onChange={(e) => {
            setHashtagFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <option value="">Any hashtag</option>
          {allHashtags.map((h) => (
            <option key={h} value={h}>#{h}</option>
          ))}
        </select>

        <input
          type="number"
          min={0}
          value={minViews || ''}
          onChange={(e) => {
            setMinViews(Number(e.target.value) || 0);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Min views"
          className="w-28 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />

        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-neutral-400" />
          <select
            aria-label="Sort videos"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most views</option>
            <option value="likes">Most likes</option>
          </select>
        </div>

        {(selectedMonthKey || search || hashtagFilter || minViews > 0) && (
          <button
            onClick={() => {
              setSelectedMonthKey(null);
              setSearch('');
              setHashtagFilter('');
              setMinViews(0);
              setVisibleCount(PAGE_SIZE);
            }}
            className="text-xs font-medium text-tiktok-pink hover:underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-neutral-400">{filtered.length} videos</span>
      </div>

      {/* Totals for whatever's currently shown — recalculates live on every filter change above */}
      {filtered.length > 0 && (
        <div className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Eye size={13} /> Total views
            </div>
            <div className="mt-0.5 text-lg font-bold tabular-nums">{formatCompactNumber(totals.views)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Heart size={13} /> Total likes
            </div>
            <div className="mt-0.5 text-lg font-bold tabular-nums">{formatCompactNumber(totals.likes)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Share2 size={13} /> Total shares
            </div>
            <div className="mt-0.5 text-lg font-bold tabular-nums">{formatCompactNumber(totals.shares)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <DollarSign size={13} /> Est. monetization
            </div>
            <div className="mt-0.5 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              <Money usd={totals.revenue} eurRate={eurRate} />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-400">No videos match these filters.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.slice(0, visibleCount).map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mx-auto mt-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
