'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Sparkles, Hash, Clock, RefreshCw } from 'lucide-react';
import ModeTabs from '@/components/ModeTabs';
import ScrapeLoadingOverlay from '@/components/ScrapeLoadingOverlay';
import UpgradeModal from '@/components/UpgradeModal';
import NicheResultsTable from '@/components/NicheResultsTable';
import ScoreCard from '@/components/ScoreCard';
import NicheVerdictBanner from '@/components/NicheVerdictBanner';
import StatCard from '@/components/StatCard';
import TagCloud from '@/components/TagCloud';
import VideoCard from '@/components/VideoCard';
import { NicheSearchResult } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import { NICHE_SCORE_METHODOLOGY, computeNicheVerdict } from '@/lib/scoring';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

function NichePageInner() {
  const searchParams = useSearchParams();
  const initialTerm = searchParams.get('q') ?? '';

  const [term, setTerm] = useState(initialTerm);
  const [maxVideos, setMaxVideos] = useState(500);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searching, setSearching] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NicheSearchResult | null>(null);
  const [limitReason, setLimitReason] = useState<string | null>(null);

  async function runSearch(clean: string, max: number, forceRefresh = false) {
    if (!clean) return;
    if (forceRefresh) setSyncing(true);
    else setLoading(true);
    setSearching(clean);
    setError(null);
    if (!forceRefresh) setResult(null);
    try {
      const res = await fetch(
        `/api/niche-search?q=${encodeURIComponent(clean)}&max=${max}${forceRefresh ? '&refresh=1' : ''}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setLimitReason(body.error || "You've reached your plan's limit.");
          return;
        }
        throw new Error(body.error || 'Could not search TikTok for that term.');
      }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  // Auto-run when landing on /niche?q=... (e.g. from Accounts history) —
  // serves cached data as-is if it's within the configured auto-sync
  // interval (Settings > Sync & currency), otherwise re-scans automatically.
  useEffect(() => {
    if (initialTerm) runSearch(initialTerm, maxVideos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTerm]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await runSearch(term.trim(), maxVideos);
  }

  return (
    <div className="flex flex-col items-center pt-10 sm:pt-16">
      <UpgradeModal open={limitReason !== null} reason={limitReason ?? ''} onClose={() => setLimitReason(null)} />
      <ScrapeLoadingOverlay
        active={loading}
        subject={searching}
        mode="niche"
        progressUrl={searching ? `/api/niche-search/progress?q=${encodeURIComponent(searching)}` : ''}
      />

      <ModeTabs />

      <h1 className="mt-6 max-w-2xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
        Find the top <span className="gradient-text">creators</span> in any niche
      </h1>
      <p className="mt-4 max-w-xl text-center text-neutral-500 dark:text-neutral-400">
        Enter a topic, niche, or hashtag. We&apos;ll scan real TikTok search results and group them by
        creator, ranked by followers, recent activity, and more.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-lg flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. cooking, gym motivation, skincare…"
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-9 pr-4 text-base outline-none ring-brand-600 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !term.trim()}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          <Sparkles size={18} />
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      <label className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
        Scan up to
        <select
          value={maxVideos}
          onChange={(e) => setMaxVideos(Number(e.target.value))}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
        >
          {[200, 500, 1000].map((n) => (
            <option key={n} value={n}>
              {n} videos
            </option>
          ))}
        </select>
        (more = better coverage, slower)
      </label>

      {error && <p className="mt-4 max-w-md text-center text-sm text-red-500">{error}</p>}

      {result && (
        <div className="mt-10 flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Results for &quot;{result.term}&quot;</h2>
              <p className="text-sm text-neutral-400">
                {result.profilesFound} profiles found across {formatCompactNumber(result.videosScanned)} videos scanned
                {result.isPartial && ' (scan limit reached — increase "Scan up to" for more coverage)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400" title={new Date(result.fetchedAt).toLocaleString()}>
                Synced {formatDistanceToNow(new Date(result.fetchedAt), { addSuffix: true })}
              </span>
              <button
                onClick={() => runSearch(result.term, maxVideos, true)}
                disabled={syncing}
                title="Sync now — forces an instant re-scan from TikTok"
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <RefreshCw size={13} className={clsx(syncing && 'animate-spin')} />
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
          </div>

          <NicheVerdictBanner verdict={computeNicheVerdict(result.score)} />

          <ScoreCard
            title="Niche Score — is this a good niche?"
            overall={result.score.overall}
            grade={result.score.grade}
            methodology={NICHE_SCORE_METHODOLOGY}
            items={[
              { label: 'Demand', value: result.score.demand, weight: 35, description: 'Avg views per video, log-scaled.' },
              { label: 'Momentum', value: result.score.momentum, weight: 25, description: '% of videos from the last 30 days.' },
              { label: 'Engagement', value: result.score.engagement, weight: 20, description: '(likes+comments+shares)/views.' },
              { label: 'Competition', value: result.score.competition, weight: 20, description: '% of views held by the top 3 creators (higher = more saturated).' }
            ]}
          />

          <NicheResultsTable profiles={result.profiles} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Best time to post"
              value={result.bestPostingSlot ? `${result.bestPostingSlot.weekday} ${result.bestPostingSlot.hour}:00` : '—'}
              sub={result.bestPostingSlot ? `${formatCompactNumber(result.bestPostingSlot.avgViews)} avg views` : undefined}
              icon={Clock}
              accent="pink"
            />
            <StatCard
              label="Unique hashtags seen"
              value={String(result.topHashtags.length)}
              icon={Hash}
              accent="cyan"
            />
          </div>

          <div className="card p-4">
            <h2 className="mb-1 text-sm font-semibold">Most used hashtags in this niche</h2>
            <p className="mb-3 text-xs text-neutral-400">Across every video scanned for this search</p>
            <TagCloud items={result.topHashtags.map((h) => ({ hashtag: h.label, count: h.count }))} labelKey="hashtag" prefix="#" />
          </div>

          <div className="card p-4">
            <h2 className="mb-1 text-sm font-semibold">Most used words in titles</h2>
            <p className="mb-3 text-xs text-neutral-400">What successful titles in this niche tend to say</p>
            <TagCloud items={result.topWords.map((w) => ({ word: w.label, count: w.count }))} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Top performing videos in this niche</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {result.topVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NichePage() {
  return (
    <Suspense fallback={null}>
      <NichePageInner />
    </Suspense>
  );
}
