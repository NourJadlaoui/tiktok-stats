'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

type Denominator = 'views' | 'followers';

function parseNonNegative(raw: string): { value: number | null; error: boolean } {
  if (raw.trim() === '') return { value: null, error: false };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: true };
  return { value: n, error: false };
}

export default function EngagementRateCalculator() {
  const [denominator, setDenominator] = useState<Denominator>('views');
  const [likesRaw, setLikesRaw] = useState('');
  const [commentsRaw, setCommentsRaw] = useState('');
  const [sharesRaw, setSharesRaw] = useState('');
  const [viewsRaw, setViewsRaw] = useState('');
  const [followersRaw, setFollowersRaw] = useState('');

  const likes = parseNonNegative(likesRaw);
  const comments = parseNonNegative(commentsRaw);
  const shares = parseNonNegative(sharesRaw);
  const views = parseNonNegative(viewsRaw);
  const followers = parseNonNegative(followersRaw);

  const hasInvalidInput = likes.error || comments.error || shares.error || views.error || followers.error;

  const result = useMemo(() => {
    if (hasInvalidInput) return null;
    const denomValue = denominator === 'views' ? views.value : followers.value;
    const numerator = (likes.value ?? 0) + (comments.value ?? 0) + (shares.value ?? 0);
    if (!denomValue || denomValue <= 0) return null;
    return (numerator / denomValue) * 100;
  }, [hasInvalidInput, denominator, views.value, followers.value, likes.value, comments.value, shares.value]);

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 rounded-lg border border-neutral-300 p-1 text-sm dark:border-neutral-700">
        {(['views', 'followers'] as Denominator[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDenominator(d)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
              denominator === d
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            By {d === 'views' ? 'views' : 'followers'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Likes
          <input inputMode="numeric" value={likesRaw} onChange={(e) => setLikesRaw(e.target.value)} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Comments
          <input inputMode="numeric" value={commentsRaw} onChange={(e) => setCommentsRaw(e.target.value)} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Shares
          <input inputMode="numeric" value={sharesRaw} onChange={(e) => setSharesRaw(e.target.value)} placeholder="0" className={inputClass} />
        </label>
        {denominator === 'views' ? (
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Views
            <input inputMode="numeric" value={viewsRaw} onChange={(e) => setViewsRaw(e.target.value)} placeholder="0" className={inputClass} />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Followers
            <input inputMode="numeric" value={followersRaw} onChange={(e) => setFollowersRaw(e.target.value)} placeholder="0" className={inputClass} />
          </label>
        )}
      </div>

      {hasInvalidInput && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>Numbers only, and nothing negative — fix the highlighted field to see a result.</span>
        </div>
      )}

      <div className="card flex flex-col items-center gap-1 p-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Engagement rate (by {denominator})
        </span>
        <span className="text-4xl font-extrabold tabular-nums">
          {result === null ? '—' : `${result.toFixed(2)}%`}
        </span>
        <span className="text-xs text-neutral-400">
          {result === null
            ? `Enter likes/comments/shares and a ${denominator === 'views' ? 'view' : 'follower'} count above`
            : 'Based on the numbers you entered — an estimate, not a TikTok-reported figure'}
        </span>
      </div>
    </div>
  );
}
