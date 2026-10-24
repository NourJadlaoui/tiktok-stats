'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NicheProfile } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import ScoreBadge from './ScoreBadge';
import { Users, Loader2, BadgeCheck, ArrowRight } from 'lucide-react';

export default function SimilarCreators({ username }: { username: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<NicheProfile[] | null>(null);

  async function findSimilar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/channel/${username}/similar`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not find similar creators.');
      }
      const data = await res.json();
      setTerm(data.term);
      setProfiles(data.profiles);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Similar creators</h2>
        {!profiles && (
          <button
            onClick={findSimilar}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
            {loading ? 'Searching…' : 'Find similar creators'}
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-neutral-400">
        {profiles && term
          ? `Other creators found scanning "${term}" — the same topic this channel posts about most, ranked by Creator Score.`
          : 'Scans real TikTok search results for this channel’s top topic and shows other creators posting about it.'}
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {profiles && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.length === 0 ? (
            <p className="col-span-full py-4 text-center text-sm text-neutral-400">
              No other creators found for this topic in the scanned sample.
            </p>
          ) : (
            profiles.map((p) => (
              <div key={p.username} className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-semibold">{p.displayName}</span>
                      {p.verified && <BadgeCheck size={12} className="shrink-0 text-cyan-500" />}
                    </div>
                    <p className="truncate text-[11px] text-neutral-400">@{p.username}</p>
                  </div>
                  <ScoreBadge overall={p.score.overall} label="Creator Score" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{p.followers > 0 ? `${formatCompactNumber(p.followers)} followers` : 'Followers unknown'}</span>
                  <span>{formatCompactNumber(p.avgViewsFound)} avg views</span>
                </div>
                <Link
                  href={`/dashboard/${p.username}/overview`}
                  className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-neutral-100 px-2 py-1.5 text-xs font-medium transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  Profile Stats <ArrowRight size={11} />
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
