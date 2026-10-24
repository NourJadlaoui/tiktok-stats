'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, Compass, DollarSign, ListPlus, Sparkles, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const HIGHLIGHTS = [
  { icon: TrendingUp, text: 'Real growth stats & Creator Score for any TikTok page' },
  { icon: Compass, text: 'Auto-discover the best niches to enter right now' },
  { icon: DollarSign, text: 'Revenue estimates tuned to your own RPM' },
  { icon: ListPlus, text: 'Bulk-scan hundreds of profiles in one background job' }
];

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/app';
  const authError = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
  }

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 grid min-h-[calc(100vh-1px)] w-screen grid-cols-1 overflow-x-hidden md:grid-cols-2">
      {/* Brand / feature panel */}
      <div className="relative hidden overflow-hidden bg-neutral-950 px-8 py-12 text-white md:flex md:flex-col md:justify-center md:gap-12 lg:px-16">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-tiktok-cyan/35 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-tiktok-pink/35 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-3xl" />
        </div>

        <div className="animate-float pointer-events-none absolute left-10 top-16 hidden rotate-[-6deg] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold backdrop-blur lg:flex">
          <Star size={13} className="text-tiktok-pink" /> Creator Score: 82/100
        </div>
        <div
          className="animate-float pointer-events-none absolute bottom-24 right-10 hidden rotate-[5deg] items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold backdrop-blur lg:flex"
          style={{ animationDelay: '1.5s' }}
        >
          💰 Est. revenue: $4,820/mo
        </div>

        <div className="relative flex items-center gap-2 text-xl font-extrabold">
          <span className="gradient-text">TikTok</span>
          <span>Stats</span>
        </div>

        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-tiktok-pink">Free trial included</span>
          <h2 className="mt-2 max-w-sm text-3xl font-extrabold leading-tight lg:text-4xl">
            Everything you need to research TikTok, in one dashboard.
          </h2>
          <div className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} />
                </div>
                <span className="text-sm text-neutral-200">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-neutral-400">Free to start — no credit card required.</p>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
        <div className="mb-8 flex items-center gap-2 text-2xl font-bold md:hidden">
          <span className="gradient-text">TikTok</span>
          <span>Stats</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to see your own tracked creators, searches, and settings — everything here is
            private to your account.
          </p>

          {authError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              Something went wrong signing you in. Please try again.
            </p>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
              />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03z" />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97L3.67 7.3C4.38 5.17 6.37 3.58 9 3.58z"
              />
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Sparkles size={13} className="text-tiktok-pink" />
            New here? Signing in automatically starts your free trial.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
