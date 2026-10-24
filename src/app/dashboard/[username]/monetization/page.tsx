'use client';

import Link from 'next/link';
import { useChannelData } from '@/components/dashboard/ChannelDataContext';
import {
  getMonthlyRevenue,
  getTotalRevenue,
  getRevenueThisMonth,
  videoRevenue,
  getMonetizableStats,
  MONETIZABLE_MIN_DURATION_SECONDS
} from '@/lib/revenue';
import { formatCompactNumber } from '@/lib/stats';
import StatCard from '@/components/StatCard';
import ChannelSettingsForm from '@/components/ChannelSettingsForm';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import MonthlyRevenueTable from '@/components/MonthlyRevenueTable';
import Money from '@/components/Money';
import { DollarSign, TrendingUp, Video, ArrowRight, CircleSlash } from 'lucide-react';

export default function MonetizationPage() {
  const { data, eurRate } = useChannelData();
  const { videos, settings } = data;

  const monthly = getMonthlyRevenue(videos, settings.rpm);
  const totalRevenue = getTotalRevenue(videos, settings.rpm);
  const thisMonthRevenue = getRevenueThisMonth(videos, settings.rpm);
  const { monetizableCount, nonMonetizableCount, monetizablePercentage } = getMonetizableStats(videos);
  const avgPerVideo = monetizableCount ? totalRevenue / monetizableCount : 0;

  const topEarners = [...videos]
    .sort((a, b) => videoRevenue(b, settings.rpm) - videoRevenue(a, settings.rpm))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <ChannelSettingsForm settings={settings} />

      <div className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        <CircleSlash size={14} className="mt-0.5 shrink-0" />
        <span>
          Only videos {MONETIZABLE_MIN_DURATION_SECONDS}s or longer are counted below (TikTok&apos;s Creator
          Rewards Program requires at least 1 minute) — <strong>{monetizableCount}</strong> of{' '}
          <strong>{videos.length}</strong> videos qualify ({monetizablePercentage}%). Set a per-video RPM override
          on the Videos tab to force revenue on a specific short video anyway (e.g. a paid sponsorship).
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Estimated total revenue" value={<Money usd={totalRevenue} eurRate={eurRate} />} icon={DollarSign} accent="green" />
        <StatCard label="This month" value={<Money usd={thisMonthRevenue} eurRate={eurRate} />} icon={TrendingUp} accent="cyan" />
        <StatCard label="Avg per monetized video" value={<Money usd={avgPerVideo} eurRate={eurRate} />} icon={Video} />
        <StatCard label="Current RPM" value={`$${settings.rpm.toFixed(2)}`} sub="per 1,000 views" icon={DollarSign} accent="pink" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Monetizable videos" value={`${monetizableCount}`} sub={`≥${MONETIZABLE_MIN_DURATION_SECONDS}s · ${monetizablePercentage}% of total`} icon={Video} accent="green" />
        <StatCard label="Not monetizable" value={`${nonMonetizableCount}`} sub={`<${MONETIZABLE_MIN_DURATION_SECONDS}s videos`} icon={CircleSlash} accent="amber" />
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Estimated revenue by month</h2>
        <p className="mb-2 text-xs text-neutral-400">Based on channel RPM, with any per-video overrides applied</p>
        <MonthlyBarChart data={monthly} dataKey="revenue" color="#10b981" valueLabel="Revenue ($)" />
      </div>

      <div>
        <p className="mb-2 text-xs text-neutral-400">Click a month to see its day-by-day posting activity, top videos, and full per-video breakdown.</p>
        <MonthlyRevenueTable monthly={monthly} videos={videos} channelRpm={settings.rpm} eurRate={eurRate} />
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Top earning videos</h2>
          <Link
            href={`/dashboard/${settings.username}/videos`}
            className="flex items-center gap-1 text-xs font-medium text-tiktok-pink hover:underline"
          >
            Edit per-video RPM <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {topEarners.map((v) => (
            <a
              key={v.id}
              href={v.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2.5 hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnailUrl} alt="" className="h-12 w-9 rounded object-cover" />
              <span className="line-clamp-1 flex-1 text-xs">{v.description}</span>
              <span className="text-xs text-neutral-400">{formatCompactNumber(v.views)} views</span>
              <span className="w-16 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Money usd={videoRevenue(v, settings.rpm)} eurRate={eurRate} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
