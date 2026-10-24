'use client';

import { useState } from 'react';
import { LayoutGrid, Calendar, DollarSign, Hash } from 'lucide-react';
import { Users, Video, TrendingUp, Clock, Eye, Heart, Share2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ScoreCard from '@/components/ScoreCard';
import TagCloud from '@/components/TagCloud';

const CALENDAR_ROWS = [
  { year: 2026, months: [2, 6, 8, 6, 9, 6, 5, 0, 0, 0, 0, 0] },
  { year: 2025, months: [0, 0, 0, 0, 0, 6, 2, 2, 1, 2, 7, 4] }
];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function heatColor(count: number, max: number): string {
  if (count === 0) return 'bg-neutral-100 dark:bg-neutral-800/60';
  const t = count / max;
  if (t > 0.75) return 'bg-tiktok-pink';
  if (t > 0.45) return 'bg-tiktok-pink/70';
  if (t > 0.15) return 'bg-tiktok-pink/40';
  return 'bg-tiktok-pink/20';
}

const HASHTAGS = [
  { hashtag: 'fyp', count: 8 },
  { hashtag: 'kaicenat', count: 22 },
  { hashtag: 'streameruniversity', count: 2 },
  { hashtag: 'amg', count: 2 },
  { hashtag: 'duet', count: 1 }
];

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'monetization', label: 'Monetization', icon: DollarSign },
  { id: 'seo', label: 'SEO', icon: Hash }
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProductTour() {
  const [tab, setTab] = useState<TabId>('overview');
  const maxCount = Math.max(...CALENDAR_ROWS.flatMap((r) => r.months));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-tiktok-pink/10 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-1.5 border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-neutral-400">tiktokstats.app/dashboard/@creator/{tab}</span>
        </div>

        <div className="p-5">
          {tab === 'overview' && (
            <div className="flex flex-col gap-4">
              <ScoreCard
                title="Creator Score"
                overall={82}
                grade="Excellent"
                methodology=""
                items={[
                  { label: 'Audience', value: 88, weight: 25, description: '' },
                  { label: 'Engagement', value: 79, weight: 30, description: '' },
                  { label: 'Growth', value: 91, weight: 20, description: '' },
                  { label: 'Consistency', value: 74, weight: 15, description: '' }
                ]}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Subscribers" value="4.2M" icon={Users} accent="pink" />
                <StatCard label="Total videos" value="612" sub="18.4 avg / month" icon={Video} />
                <StatCard label="This month" value="24 videos" sub="+12% vs last month" icon={TrendingUp} accent="green" />
                <StatCard label="Last 7 days" value="6 videos" sub="3.1M views" icon={Clock} accent="cyan" />
              </div>
            </div>
          )}

          {tab === 'calendar' && (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-center text-xs">
                  <thead>
                    <tr className="text-neutral-400">
                      <th className="w-12 pb-2 text-left font-normal">Year</th>
                      {MONTH_LABELS.map((m) => (
                        <th key={m} className="pb-2 font-normal">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CALENDAR_ROWS.map((row) => (
                      <tr key={row.year}>
                        <td className="pr-2 text-left font-semibold text-tiktok-pink">{row.year}</td>
                        {row.months.map((count, i) => (
                          <td key={i} className="p-0.5">
                            <div className={`flex h-8 items-center justify-center rounded font-medium text-white ${heatColor(count, maxCount)} ${count === 0 ? '!text-neutral-300 dark:!text-neutral-600' : ''}`}>
                              {count || ''}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400">Click any month to filter every video posted in it — see gaps, streaks, and posting cadence at a glance.</p>
            </div>
          )}

          {tab === 'monetization' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total views" value="2.3B" icon={Eye} accent="cyan" />
                <StatCard label="Total likes" value="182.4M" icon={Heart} accent="pink" />
                <StatCard label="Total shares" value="3.4M" icon={Share2} />
                <StatCard label="Est. monetization" value="$37,678" icon={DollarSign} accent="green" />
              </div>
              <p className="text-xs text-neutral-400">
                Revenue is estimated from an editable RPM (revenue per thousand views) tuned per niche — override it
                per creator, or per video for one-off sponsorships.
              </p>
            </div>
          )}

          {tab === 'seo' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Avg title length" value="22 chars" />
                <StatCard label="Hashtags / video" value="0.9" />
                <StatCard label="Unique hashtags" value="9" />
                <StatCard label="Best time to post" value="Sun 2:00" sub="96.2M avg views" icon={Clock} accent="pink" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Most used hashtags</p>
                <TagCloud items={HASHTAGS} labelKey="hashtag" prefix="#" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
