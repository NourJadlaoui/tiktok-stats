'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Progress {
  status: 'starting' | 'profile' | 'scraping' | 'done' | 'error';
  fetched: number;
  total: number;
  message?: string;
}

/** Full-screen overlay shown while a search is in flight, polling a progress
 * endpoint for live "X of Y videos" updates. Used both for a single-profile
 * fetch and a Niche Stats keyword scan. */
export default function ScrapeLoadingOverlay({
  active,
  progressUrl,
  subject,
  mode = 'profile'
}: {
  active: boolean;
  progressUrl: string;
  subject: string;
  mode?: 'profile' | 'niche';
}) {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!active || !progressUrl) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(progressUrl, { cache: 'no-store' });
        if (!cancelled && res.ok) setProgress(await res.json());
      } catch {
        // ignore transient poll failures
      }
    };

    poll();
    const interval = setInterval(poll, 700);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [progressUrl, active]);

  if (!active) return null;

  const pct = progress && progress.total > 0 ? Math.min(100, Math.round((progress.fetched / progress.total) * 100)) : null;
  const unit = mode === 'niche' ? 'videos scanned' : 'videos';
  const verb = mode === 'niche' ? 'Scanning' : 'Fetching';

  let label = mode === 'niche' ? `Searching TikTok for "${subject}"…` : `Loading @${subject}'s TikTok data…`;
  if (progress?.status === 'starting') {
    label = mode === 'niche' ? `Opening TikTok search for "${subject}"…` : `Opening @${subject}'s TikTok profile…`;
  } else if (progress?.status === 'scraping' && progress.total > 0) {
    label = `${verb} videos — ${progress.fetched} of ${progress.total} ${unit}…`;
  } else if (progress?.status === 'scraping') {
    label = `${verb} videos — ${progress.fetched} ${unit} so far…`;
  } else if (progress?.status === 'done') {
    label = mode === 'niche' ? 'Grouping results by profile…' : 'Almost done…';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80">
      <div className="card flex w-full max-w-sm flex-col items-center gap-4 px-8 py-10 text-center">
        <Loader2 size={32} className="animate-spin text-tiktok-pink" />
        <div>
          <p className="font-semibold">{label}</p>
          <p className="mt-1 text-xs text-neutral-400">
            {mode === 'niche'
              ? 'Real TikTok search results load by scrolling — broader terms and higher scan limits take longer.'
              : 'Real TikTok data loads by scrolling the profile page — larger channels take longer.'}
          </p>
        </div>
        {pct !== null && (
          <div className="w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs tabular-nums text-neutral-400">{pct}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
