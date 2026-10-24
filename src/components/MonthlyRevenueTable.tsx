'use client';

import { Fragment, useMemo, useState } from 'react';
import { TikTokVideo } from '@/lib/types';
import { MonthlyRevenue } from '@/lib/revenue';
import { videoRevenue, isMonetizable } from '@/lib/revenue';
import { formatCompactNumber, formatDuration } from '@/lib/stats';
import Money from './Money';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronDown, ChevronRight, Trophy, Eye, Heart, MessageCircle, Share2, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

const RANK_STYLES = [
  { label: '#1', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { label: '#2', className: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200' },
  { label: '#3', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' }
];

function MonthDetail({ videos, channelRpm, eurRate, monthDate }: { videos: TikTokVideo[]; channelRpm: number; eurRate: number; monthDate: Date }) {
  const byDay = useMemo(() => {
    const map = new Map<string, TikTokVideo[]>();
    for (const v of videos) {
      const key = format(new Date(v.createdAt), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [videos]);

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) }), [monthDate]);
  const leadingBlanks = getDay(startOfMonth(monthDate)); // 0 = Sunday
  const maxPerDay = Math.max(1, ...days.map((d) => byDay.get(format(d, 'yyyy-MM-dd'))?.length ?? 0));

  const top3 = useMemo(() => [...videos].sort((a, b) => videoRevenue(b, channelRpm) - videoRevenue(a, channelRpm)).slice(0, 3), [videos, channelRpm]);

  const sortedByDate = useMemo(
    () => [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [videos]
  );

  return (
    <div className="animate-expand-down flex flex-col gap-5 border-t border-neutral-100 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-950/40">
      {/* Day-by-day posting calendar for the month */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Posting activity this month</h3>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-neutral-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day, i) => {
            const dayVideos = byDay.get(format(day, 'yyyy-MM-dd')) ?? [];
            const intensity = dayVideos.length === 0 ? 0 : Math.max(0.2, dayVideos.length / maxPerDay);
            const dayRevenue = dayVideos.reduce((s, v) => s + videoRevenue(v, channelRpm), 0);
            return (
              <div
                key={day.toISOString()}
                title={dayVideos.length ? `${format(day, 'MMM d')}: ${dayVideos.length} video(s), $${dayRevenue.toFixed(2)}` : format(day, 'MMM d')}
                className="animate-pop-in flex aspect-square flex-col items-center justify-center rounded text-[10px] font-semibold"
                style={{
                  animationDelay: `${i * 12}ms`,
                  backgroundColor: dayVideos.length === 0 ? 'transparent' : `rgba(37,244,238,${intensity})`,
                  border: dayVideos.length === 0 ? '1px dashed rgba(163,163,163,0.3)' : 'none',
                  color: intensity > 0.6 ? '#00332f' : undefined
                }}
              >
                <span>{format(day, 'd')}</span>
                {dayVideos.length > 0 && <span className="text-[9px] opacity-80">{dayVideos.length}v</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 videos of the month */}
      {top3.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <Trophy size={13} /> Top 3 this month
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {top3.map((v, i) => (
              <a
                key={v.id}
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-pop-in flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 transition hover:border-tiktok-pink dark:border-neutral-800 dark:bg-neutral-900"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold', RANK_STYLES[i].className)}>
                  {RANK_STYLES[i].label}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnailUrl} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium">{v.description}</p>
                  <p className="text-[11px] text-neutral-400">{formatCompactNumber(v.views)} views</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Money usd={videoRevenue(v, channelRpm)} eurRate={eurRate} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Every video this month with full stats + monetization */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">All videos this month ({videos.length})</h3>
        <div className="flex flex-col gap-1.5">
          {sortedByDate.map((v) => {
            const monetized = isMonetizable(v);
            return (
              <a
                key={v.id}
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg bg-white p-2 text-xs transition hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnailUrl} alt="" className="h-11 w-8 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{v.description}</p>
                  <p className="text-[11px] text-neutral-400">
                    {format(new Date(v.createdAt), 'MMM d, yyyy')} · {formatDuration(v.durationSeconds)}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-neutral-400 sm:flex">
                  <Eye size={12} /> {formatCompactNumber(v.views)}
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-neutral-400 sm:flex">
                  <Heart size={12} /> {formatCompactNumber(v.likes)}
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-neutral-400 md:flex">
                  <MessageCircle size={12} /> {formatCompactNumber(v.comments)}
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-neutral-400 md:flex">
                  <Share2 size={12} /> {formatCompactNumber(v.shares)}
                </span>
                <span
                  className={clsx(
                    'hidden shrink-0 items-center gap-1 font-medium sm:flex',
                    monetized ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
                  )}
                >
                  {monetized ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                </span>
                <span className="w-16 shrink-0 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  <Money usd={videoRevenue(v, channelRpm)} eurRate={eurRate} />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MonthlyRevenueTable({
  monthly,
  videos,
  channelRpm,
  eurRate
}: {
  monthly: MonthlyRevenue[];
  videos: TikTokVideo[];
  channelRpm: number;
  eurRate: number;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const videosByMonthKey = useMemo(() => {
    const map = new Map<string, TikTokVideo[]>();
    for (const v of videos) {
      const d = new Date(v.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [videos]);

  const reversedMonthly = [...monthly].reverse();

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
            <th className="px-3 py-2.5" />
            <th className="px-3 py-2.5">Month</th>
            <th className="px-3 py-2.5">Videos</th>
            <th className="px-3 py-2.5">Views</th>
            <th className="px-3 py-2.5">Est. revenue</th>
          </tr>
        </thead>
        <tbody>
          {reversedMonthly.map((m) => {
            const expanded = expandedKey === m.key;
            const monthVideos = videosByMonthKey.get(m.key) ?? [];
            const [year, month] = m.key.split('-').map(Number);
            return (
              <Fragment key={m.key}>
                <tr
                  onClick={() => setExpandedKey(expanded ? null : m.key)}
                  className={clsx(
                    'cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-900/60',
                    !expanded && 'last:border-0'
                  )}
                >
                  <td className="px-3 py-2 text-neutral-400">
                    {m.count > 0 ? expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
                  </td>
                  <td className="px-3 py-2 font-medium">{m.label}</td>
                  <td className="px-3 py-2 tabular-nums">{m.count}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCompactNumber(m.views)}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    <Money usd={m.revenue} eurRate={eurRate} />
                  </td>
                </tr>
                {expanded && monthVideos.length > 0 && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <MonthDetail videos={monthVideos} channelRpm={channelRpm} eurRate={eurRate} monthDate={new Date(year, month - 1, 1)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
