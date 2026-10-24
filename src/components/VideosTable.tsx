'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TikTokVideo } from '@/lib/types';
import { formatCompactNumber, formatDuration } from '@/lib/stats';
import { videoRevenue, isMonetizable, MONETIZABLE_MIN_DURATION_SECONDS } from '@/lib/revenue';
import { useChannelData } from './dashboard/ChannelDataContext';
import Money from './Money';
import { format } from 'date-fns';
import { ArrowUpDown, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

type SortKey = 'date' | 'views' | 'likes' | 'comments' | 'duration' | 'revenue';
type MonetizedFilter = 'all' | 'monetized' | 'not-monetized';

export default function VideosTable({
  username,
  initialVideos,
  channelRpm,
  eurRate
}: {
  username: string;
  initialVideos: TikTokVideo[];
  channelRpm: number;
  eurRate: number;
}) {
  const searchParams = useSearchParams();
  const { updateVideoRpmOverride } = useChannelData();
  const [videos, setVideos] = useState(initialVideos);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [hashtagFilter, setHashtagFilter] = useState(searchParams.get('hashtag') ?? '');
  const [monetizedFilter, setMonetizedFilter] = useState<MonetizedFilter>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const monetizedCounts = useMemo(() => {
    const monetized = videos.filter(isMonetizable).length;
    return { monetized, notMonetized: videos.length - monetized };
  }, [videos]);

  const filtered = useMemo(() => {
    let result = videos;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((v) => v.description.toLowerCase().includes(q));
    }
    if (hashtagFilter) {
      result = result.filter((v) => v.hashtags.includes(hashtagFilter));
    }
    if (monetizedFilter === 'monetized') result = result.filter(isMonetizable);
    if (monetizedFilter === 'not-monetized') result = result.filter((v) => !isMonetizable(v));

    const sorted = [...result].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case 'date':
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'views':
          diff = a.views - b.views;
          break;
        case 'likes':
          diff = a.likes - b.likes;
          break;
        case 'comments':
          diff = a.comments - b.comments;
          break;
        case 'duration':
          diff = a.durationSeconds - b.durationSeconds;
          break;
        case 'revenue':
          diff = videoRevenue(a, channelRpm) - videoRevenue(b, channelRpm);
          break;
      }
      return sortDir === 'asc' ? diff : -diff;
    });
    return sorted;
  }, [videos, search, hashtagFilter, monetizedFilter, sortKey, sortDir, channelRpm]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  async function updateRpm(video: TikTokVideo, value: string) {
    const rpm = value.trim() === '' ? null : Number(value);
    if (rpm !== null && (Number.isNaN(rpm) || rpm < 0)) return;
    setSavingId(video.id);
    setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, rpmOverride: rpm } : v)));
    updateVideoRpmOverride(video.id, rpm);
    try {
      await fetch(`/api/channel/${username}/video/${encodeURIComponent(video.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpm })
      });
    } finally {
      setSavingId(null);
    }
  }

  const Header = ({ label, sortK }: { label: string; sortK: SortKey }) => (
    <button
      onClick={() => toggleSort(sortK)}
      className={clsx(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
        sortKey === sortK ? 'text-tiktok-pink' : 'text-neutral-400'
      )}
    >
      {label} <ArrowUpDown size={11} />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos…"
          className="w-64 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />

        <select
          value={monetizedFilter}
          onChange={(e) => setMonetizedFilter(e.target.value as MonetizedFilter)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="all">All videos</option>
          <option value="monetized">Monetized only ({monetizedCounts.monetized})</option>
          <option value="not-monetized">Not monetized ({monetizedCounts.notMonetized})</option>
        </select>

        {hashtagFilter && (
          <button
            onClick={() => setHashtagFilter('')}
            className="flex items-center gap-1 rounded-full bg-tiktok-pink/10 px-2.5 py-1 text-xs font-medium text-tiktok-pink"
          >
            #{hashtagFilter} ✕
          </button>
        )}

        <span className="ml-auto flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} /> {monetizedCounts.monetized} monetized
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <XCircle size={13} /> {monetizedCounts.notMonetized} not monetized
          </span>
          <span>{filtered.length} shown</span>
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
              <th className="px-3 py-2.5">Video</th>
              <th className="px-3 py-2.5"><Header label="Date" sortK="date" /></th>
              <th className="px-3 py-2.5"><Header label="Duration" sortK="duration" /></th>
              <th className="px-3 py-2.5">Monetized</th>
              <th className="px-3 py-2.5"><Header label="Views" sortK="views" /></th>
              <th className="px-3 py-2.5"><Header label="Likes" sortK="likes" /></th>
              <th className="px-3 py-2.5"><Header label="Comments" sortK="comments" /></th>
              <th className="px-3 py-2.5">RPM ($/1k)</th>
              <th className="px-3 py-2.5"><Header label="Est. revenue" sortK="revenue" /></th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const monetized = isMonetizable(v);
              return (
                <tr
                  key={v.id}
                  onClick={() => window.open(v.videoUrl, '_blank', 'noopener,noreferrer')}
                  className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 last:border-0 dark:border-neutral-800/60 dark:hover:bg-neutral-900/60"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnailUrl} alt="" className="h-12 w-9 rounded object-cover" />
                      <span className="line-clamp-2 max-w-xs text-xs">{v.description}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{format(new Date(v.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-3 py-2 tabular-nums">{formatDuration(v.durationSeconds)}</td>
                  <td className="px-3 py-2">
                    {monetized ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} /> Yes
                      </span>
                    ) : (
                      <span
                        title={`Under ${MONETIZABLE_MIN_DURATION_SECONDS}s`}
                        className="flex items-center gap-1 text-xs font-medium text-neutral-400"
                      >
                        <XCircle size={13} /> No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatCompactNumber(v.views)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCompactNumber(v.likes)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCompactNumber(v.comments)}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={channelRpm.toFixed(2)}
                      defaultValue={v.rpmOverride ?? undefined}
                      onBlur={(e) => updateRpm(v, e.target.value)}
                      disabled={savingId === v.id}
                      className="w-20 rounded border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold tabular-nums">
                    <Money usd={videoRevenue(v, channelRpm)} eurRate={eurRate} />
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open on TikTok"
                      className="text-neutral-400 hover:text-tiktok-pink"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        Leave RPM blank to use the channel default (${channelRpm.toFixed(2)}/1k views). Videos under{' '}
        {MONETIZABLE_MIN_DURATION_SECONDS}s aren&apos;t eligible for TikTok&apos;s Creator Rewards Program and are
        estimated at $0 unless you set a per-video override — useful for sponsored posts regardless of length.
      </p>
    </div>
  );
}
