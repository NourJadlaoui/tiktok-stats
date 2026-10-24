'use client';

import { useChannelData } from '@/components/dashboard/ChannelDataContext';
import { getOverviewStats, formatCompactNumber } from '@/lib/stats';
import { computeProfileScore, computeCreatorVerdict, PROFILE_SCORE_METHODOLOGY } from '@/lib/scoring';
import StatCard from '@/components/StatCard';
import VideoCard from '@/components/VideoCard';
import ScoreCard from '@/components/ScoreCard';
import CreatorVerdictCard from '@/components/CreatorVerdictCard';
import CreatorTrackingCard from '@/components/CreatorTrackingCard';
import ProfileHistoryCard from '@/components/ProfileHistoryCard';
import SimilarCreators from '@/components/SimilarCreators';
import CumulativeVideosChart from '@/components/charts/CumulativeVideosChart';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import { Users, Calendar, Video, TrendingUp, TrendingDown, Flame, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function OverviewPage() {
  const { data, isAdmin, eurRate, thresholds, history, tracking, categories: allCategories } = useChannelData();
  const stats = getOverviewStats(data.videos, data.profile.followers, data.profile.videoCount);
  const score = computeProfileScore(data.profile.followers, data.videos);
  const verdict = computeCreatorVerdict(data.videos, data.settings.rpm, thresholds);

  const momDelta = stats.lastMonthCount === 0 ? null : ((stats.thisMonthCount - stats.lastMonthCount) / stats.lastMonthCount) * 100;

  return (
    <div className="flex flex-col gap-8">
      {stats.isPartial && stats.fetchedVideos === 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {isAdmin ? (
            <span>
              TikTok reported {formatCompactNumber(stats.totalVideos)} total videos but the scraper fetched none —
              this is <strong>not</strong> a <code className="rounded bg-red-100 px-1 dark:bg-red-900/40">maxVideosToFetch</code> limit
              issue, it means the video-list request itself was likely blocked or returned empty (TikTok showing a
              verification wall, or no session cookie configured). Set{' '}
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/40">tiktokAccount.cookie</code> in{' '}
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/40">config/credentials.json</code> (or the{' '}
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/40">TIKTOK_COOKIE</code> env var), then enable{' '}
              <code className="rounded bg-red-100 px-1 dark:bg-red-900/40">scrapeDebug</code> and check the server
              terminal for details — see the README troubleshooting section.
            </span>
          ) : (
            <span>We couldn&apos;t fetch this profile&apos;s videos right now — try Sync now in a moment, or contact support if it keeps happening.</span>
          )}
        </div>
      )}
      {stats.isPartial && stats.fetchedVideos > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle size={14} className="shrink-0" />
          {isAdmin ? (
            <span>
              Showing the {stats.fetchedVideos} most recent videos out of {formatCompactNumber(stats.totalVideos)} total —
              TikTok limits how much history can be pulled without logging in. &quot;First video&quot;, monthly averages
              and the earliest months below reflect only the fetched videos. Increase{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">maxVideosToFetch</code> in
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">config/credentials.json</code> to fetch more.
            </span>
          ) : (
            <span>
              Showing the {stats.fetchedVideos} most recent videos out of {formatCompactNumber(stats.totalVideos)} total —
              &quot;First video&quot;, monthly averages and the earliest months below reflect only the fetched videos.
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreCard
          title="Creator Score"
          overall={score.overall}
          grade={score.grade}
          methodology={PROFILE_SCORE_METHODOLOGY}
          items={[
            { label: 'Audience', value: score.audience, weight: 25, description: 'Follower count, log-scaled.' },
            { label: 'Engagement', value: score.engagement, weight: 30, description: '(likes+comments+shares)/views.' },
            { label: 'Growth', value: score.growth, weight: 20, description: 'Last 30 days vs prior 30 days.' },
            { label: 'Consistency', value: score.consistency, weight: 15, description: 'Steadiness of monthly posting.' },
            { label: 'Monetization', value: score.monetization, weight: 10, description: '% of videos ≥60s + view size.' }
          ]}
        />
        <CreatorVerdictCard verdict={verdict} thresholds={thresholds} eurRate={eurRate} />
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label={stats.isPartial ? 'Earliest fetched video' : 'First video'}
          value={stats.firstVideoDate ? format(new Date(stats.firstVideoDate), 'MMM d, yyyy') : '—'}
          sub={stats.firstVideoDate ? `${format(new Date(stats.firstVideoDate), 'MMMM yyyy')}${stats.isPartial ? '' : ' · channel start'}` : undefined}
          icon={Calendar}
          accent="cyan"
        />
        <StatCard
          label="Subscribers"
          value={formatCompactNumber(stats.followers)}
          icon={Users}
          accent="pink"
        />
        <StatCard
          label="Total videos"
          value={formatCompactNumber(stats.totalVideos)}
          sub={stats.isPartial ? `${stats.fetchedVideos} fetched` : `${stats.avgVideosPerMonth.toFixed(1)} avg / month`}
          icon={Video}
        />
        <StatCard
          label="Last 7 days"
          value={`${stats.last7DaysCount} videos`}
          sub={`${formatCompactNumber(stats.last7DaysViews)} views`}
          icon={Clock}
          accent="green"
        />
        <StatCard
          label="This month"
          value={`${stats.thisMonthCount} videos`}
          sub={momDelta === null ? undefined : `${momDelta >= 0 ? '+' : ''}${momDelta.toFixed(0)}% vs last month`}
          icon={momDelta !== null && momDelta < 0 ? TrendingDown : TrendingUp}
          accent={momDelta !== null && momDelta < 0 ? 'amber' : 'green'}
        />
        <StatCard label="Last month" value={`${stats.lastMonthCount} videos`} icon={Calendar} />
        <StatCard
          label="Best month"
          value={stats.bestMonth ? `${stats.bestMonth.count} videos` : '—'}
          sub={stats.bestMonth?.label}
          icon={Flame}
          accent="pink"
        />
        <StatCard
          label="Lowest month"
          value={stats.worstMonth ? `${stats.worstMonth.count} videos` : '—'}
          sub={stats.worstMonth?.label}
          icon={TrendingDown}
          accent="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-1 text-sm font-semibold">Growth since creation</h2>
          <p className="mb-2 text-xs text-neutral-400">Cumulative videos (left) and views (right) by month</p>
          <CumulativeVideosChart data={stats.cumulativeMonthlySeries} />
        </div>
        <div className="card p-4">
          <h2 className="mb-1 text-sm font-semibold">Videos posted per month</h2>
          <p className="mb-2 text-xs text-neutral-400">Posting cadence by calendar month</p>
          <MonthlyBarChart data={stats.monthlySeries} />
        </div>
      </div>

      <ProfileHistoryCard history={history} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CreatorTrackingCard username={data.profile.username} initial={tracking} allCategories={allCategories} />
        <SimilarCreators username={data.profile.username} />
      </div>

      {/* Last 7 days activity */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Activity — last 7 days</h2>
        {stats.last7DaysVideos.length === 0 ? (
          <p className="text-sm text-neutral-400">No videos posted in the last 7 days.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stats.last7DaysVideos.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
