'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertTriangle } from 'lucide-react';
import ScrapeLoadingOverlay from './ScrapeLoadingOverlay';
import UpgradeModal from './UpgradeModal';

/** Fetches the profile before navigating (same pattern as the main search
 * on /app) instead of pushing the route immediately and hoping the
 * destination's own loading state shows real progress — this way the
 * overlay's "X of Y videos" progress is reliable, and a not-found or
 * blocked scrape shows right here with a retry instead of a dead-end page. */
export default function AccountSearchBox() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReason, setLimitReason] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(clean)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setLimitReason(body.error || "You've reached your plan's limit.");
          return;
        }
        throw new Error(body.error || 'Could not fetch that TikTok account.');
      }
      router.push(`/dashboard/${clean}/overview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <UpgradeModal open={limitReason !== null} reason={limitReason ?? ''} onClose={() => setLimitReason(null)} />
      <ScrapeLoadingOverlay
        active={loading}
        subject={username.trim().replace(/^@/, '').toLowerCase()}
        mode="profile"
        progressUrl={loading ? `/api/profile/${encodeURIComponent(username.trim().replace(/^@/, '').toLowerCase())}/progress` : ''}
      />
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="add a username to track"
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || loading}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          <Search size={14} />
          Add
        </button>
      </form>
      {error && (
        <div className="flex max-w-sm items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
