'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Progress {
  status: 'starting' | 'profile' | 'scraping' | 'done' | 'error';
  fetched: number;
  total: number;
}

/** Shown while navigating into a profile for the very first time (or a
 * fresh page load) — the layout itself (header + tab bar) hasn't rendered
 * yet at this point since IT is the thing doing the real scrape, so this
 * covers the whole content area, not just a tab's content. Tab-to-tab
 * navigation within an already-loaded profile never hits this (the
 * layout isn't re-rendered on sibling-route navigation), it hits the
 * lighter per-tab loading.tsx files instead. Polls the same progress
 * endpoint the old pre-navigation overlay used — navigation itself is now
 * instant (see app/page.tsx), the live "X of Y videos" detail just moved
 * to live inside the destination page instead of blocking the trip there. */
export default function Loading() {
  const params = useParams<{ username?: string | string[] }>();
  const username = typeof params?.username === 'string' ? params.username : '';
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}/progress`, { cache: 'no-store' });
        if (!cancelled && res.ok) setProgress(await res.json());
      } catch {
        // ignore transient poll failures — next tick retries
      }
    };
    poll();
    const interval = setInterval(poll, 700);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [username]);

  const pct = progress && progress.total > 0 ? Math.min(100, Math.round((progress.fetched / progress.total) * 100)) : null;

  let label = username ? `Opening @${username}'s TikTok profile…` : 'Loading…';
  if (progress?.status === 'scraping' && progress.total > 0) {
    label = `Fetching videos — ${progress.fetched} of ${progress.total} videos…`;
  } else if (progress?.status === 'scraping') {
    label = `Fetching videos — ${progress.fetched} videos so far…`;
  } else if (progress?.status === 'done') {
    label = 'Almost done…';
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" aria-busy="true" aria-live="polite">
      <Loader2 size={32} className="animate-spin text-tiktok-pink" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-neutral-400">
          Real TikTok data loads by scrolling the profile page — larger channels take longer.
        </p>
      </div>
      {pct !== null && (
        <div className="w-full max-w-xs">
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
  );
}
