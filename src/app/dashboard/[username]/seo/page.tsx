'use client';

import Link from 'next/link';
import { useChannelData } from '@/components/dashboard/ChannelDataContext';
import {
  getTopWords,
  getTopHashtagsByUsage,
  getTopHashtagsByPerformance,
  getTitleLengthPerformance,
  getPostingTimeHeatmap,
  getBestPostingSlot
} from '@/lib/seo';
import { formatCompactNumber } from '@/lib/stats';
import StatCard from '@/components/StatCard';
import TagCloud from '@/components/TagCloud';
import PostingHeatmap from '@/components/PostingHeatmap';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import { Hash, Type, Clock, MessageSquare } from 'lucide-react';

export default function SeoPage() {
  const { data } = useChannelData();
  const { videos } = data;
  const username = data.profile.username;

  const videosHref = (search: URLSearchParams) => `/dashboard/${username}/videos?${search.toString()}`;
  const hashtagHref = (tag: string) => videosHref(new URLSearchParams({ hashtag: tag }));
  const wordHref = (word: string) => videosHref(new URLSearchParams({ q: word }));

  const topWords = getTopWords(videos, 30);
  const topHashtagsByUsage = getTopHashtagsByUsage(videos, 20);
  const topHashtagsByPerformance = getTopHashtagsByPerformance(videos, 2, 10);
  const titleLength = getTitleLengthPerformance(videos);
  const heatmapCells = getPostingTimeHeatmap(videos);
  const bestSlot = getBestPostingSlot(videos);

  const avgTitleLength = videos.length
    ? Math.round(videos.reduce((s, v) => s + v.description.replace(/#[\p{L}0-9_]+/gu, '').trim().length, 0) / videos.length)
    : 0;
  const avgHashtagsPerVideo = videos.length
    ? (videos.reduce((s, v) => s + v.hashtags.length, 0) / videos.length).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Avg title length" value={`${avgTitleLength} chars`} icon={Type} />
        <StatCard label="Avg hashtags / video" value={avgHashtagsPerVideo} icon={Hash} accent="cyan" />
        <StatCard label="Unique hashtags used" value={String(topHashtagsByUsage.length ? new Set(videos.flatMap((v) => v.hashtags)).size : 0)} icon={MessageSquare} />
        <StatCard
          label="Best time to post"
          value={bestSlot ? `${bestSlot.weekday} ${bestSlot.hour}:00` : '—'}
          sub={bestSlot ? `${formatCompactNumber(bestSlot.avgViews)} avg views` : undefined}
          icon={Clock}
          accent="pink"
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Most used words in titles</h2>
        <p className="mb-3 text-xs text-neutral-400">
          Bigger = used more often (stopwords &amp; hashtags excluded) · click a word to see those videos
        </p>
        <TagCloud items={topWords} hrefFor={wordHref} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-1 text-sm font-semibold">Most used hashtags</h2>
          <p className="mb-3 text-xs text-neutral-400">By number of videos using them · click to filter</p>
          <TagCloud items={topHashtagsByUsage} labelKey="hashtag" prefix="#" hrefFor={hashtagHref} />
        </div>
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Best performing hashtags</h2>
          <p className="mb-3 text-xs text-neutral-400">By average views (min. 2 uses) · click to filter</p>
          <div className="flex flex-col gap-2">
            {topHashtagsByPerformance.map((h) => (
              <Link
                key={h.hashtag}
                href={hashtagHref(h.hashtag)}
                className="flex items-center justify-between rounded-lg px-1.5 py-1 text-sm transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="font-medium text-tiktok-pink">#{h.hashtag}</span>
                <span className="text-xs text-neutral-400">{h.count} videos</span>
                <span className="font-semibold tabular-nums">{formatCompactNumber(h.avgViews)} avg views</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Title length vs. performance</h2>
        <p className="mb-2 text-xs text-neutral-400">Average views by title length bucket</p>
        <MonthlyBarChart
          data={titleLength.map((t) => ({ label: t.label, avgViews: t.avgViews, count: t.count }))}
          dataKey="avgViews"
          color="#f472b6"
          valueLabel="Avg views"
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">Posting time heatmap</h2>
        <p className="mb-3 text-xs text-neutral-400">Videos posted by day of week &amp; hour — darker means more posts</p>
        <PostingHeatmap cells={heatmapCells} />
      </div>
    </div>
  );
}
