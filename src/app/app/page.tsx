'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, TrendingUp, Calendar, DollarSign, Hash, AlertTriangle } from 'lucide-react';
import ModeTabs from '@/components/ModeTabs';
import ScrapeLoadingOverlay from '@/components/ScrapeLoadingOverlay';
import UpgradeModal from '@/components/UpgradeModal';

interface RecentAccount {
  username: string;
  displayName: string;
  avatarUrl: string;
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [recent, setRecent] = useState<RecentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [limitReason, setLimitReason] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => setRecent(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  // Fetches the profile BEFORE navigating (instead of pushing the route
  // immediately and letting the destination scrape on arrival) so this page
  // can show the real "X of Y videos" progress reliably via the same
  // overlay+polling pattern Niche Stats already uses, and so a transient
  // scrape hiccup or a genuine not-found shows right here — inline, with a
  // retry — instead of as the dashboard's dead-end "Account not found"
  // page. By the time we navigate, the profile is already cached, so the
  // destination layout just reads it back (fast, no second scrape).
  async function goToProfile(clean: string) {
    setLoading(true);
    setSearching(clean);
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    goToProfile(clean);
  }

  return (
    <div className="flex flex-col items-center pt-10 sm:pt-20">
      <UpgradeModal open={limitReason !== null} reason={limitReason ?? ''} onClose={() => setLimitReason(null)} />
      <ScrapeLoadingOverlay
        active={loading}
        subject={searching}
        mode="profile"
        progressUrl={searching ? `/api/profile/${encodeURIComponent(searching)}/progress` : ''}
      />

      <ModeTabs />

      <h1 className="mt-6 max-w-2xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
        Full stats for any <span className="gradient-text">TikTok</span> page
      </h1>
      <p className="mt-4 max-w-xl text-center text-neutral-500 dark:text-neutral-400">
        Enter a username to see growth, posting activity, a content calendar, revenue estimates and SEO insights.
        Looking for creators instead of one account?{' '}
        <Link href="/niche" className="font-medium text-tiktok-pink hover:underline">
          Try Niche Stats
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">@</span>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-8 pr-4 text-base outline-none ring-brand-600 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={!username.trim() || loading}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          <Search size={18} />
          Analyze
        </button>
      </form>

      {error && (
        <div className="mt-4 flex w-full max-w-md items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: TrendingUp, label: 'Growth stats' },
          { icon: Calendar, label: 'Video calendar' },
          { icon: DollarSign, label: 'Revenue estimator' },
          { icon: Hash, label: 'SEO insights' }
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="card flex flex-col items-center gap-2 px-4 py-5 text-center">
            <Icon className="text-brand-600" size={22} />
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="mt-12 w-full max-w-3xl">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Recently viewed
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recent.map((acc) => (
              <button
                key={acc.username}
                onClick={() => goToProfile(acc.username)}
                disabled={loading}
                className="card flex items-center gap-3 px-3 py-2.5 text-left transition hover:border-brand-600 disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={acc.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{acc.displayName}</div>
                  <div className="truncate text-xs text-neutral-400">@{acc.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
