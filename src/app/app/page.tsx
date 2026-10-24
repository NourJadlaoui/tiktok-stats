'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, TrendingUp, Calendar, DollarSign, Hash } from 'lucide-react';
import ModeTabs from '@/components/ModeTabs';

interface RecentAccount {
  username: string;
  displayName: string;
  avatarUrl: string;
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [recent, setRecent] = useState<RecentAccount[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => setRecent(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  // Navigate immediately — no pre-fetch, no blocking popup. The destination
  // page does the real fetch itself and shows its own loading skeleton
  // (app/loading.tsx) while it works, and already handles a not-found
  // username or a plan-limit hit with its own dedicated screens (see
  // dashboard/[username]/layout.tsx), so there's nothing worth blocking on
  // here first.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    router.push(`/dashboard/${clean}/overview`);
  }

  return (
    <div className="flex flex-col items-center pt-10 sm:pt-20">
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
          disabled={!username.trim()}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          <Search size={18} />
          Analyze
        </button>
      </form>

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
                onClick={() => router.push(`/dashboard/${acc.username}/overview`)}
                className="card flex items-center gap-3 px-3 py-2.5 text-left transition hover:border-brand-600"
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
