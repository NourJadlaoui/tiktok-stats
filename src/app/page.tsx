import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Hash,
  Search,
  Compass,
  ListPlus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Bookmark,
  Users,
  LineChart
} from 'lucide-react';
import { listActivePlans } from '@/lib/plans';
import ProductTour from '@/components/landing/ProductTour';
import LandingPricing from '@/components/landing/LandingPricing';
import Faq from '@/components/landing/Faq';
import Reveal from '@/components/landing/Reveal';
import Marquee from '@/components/landing/Marquee';

export const metadata: Metadata = {
  title: 'TikTok Stats — TikTok Analytics & Creator Growth Dashboard',
  description:
    'Track any TikTok creator\'s growth, content calendar, revenue estimates and SEO insights. Discover trending niches, bulk-scan hundreds of profiles, and grow smarter — free to start.',
  alternates: { canonical: '/' }
};

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Growth analytics',
    desc: 'A 0-100 Creator Score with a full breakdown, plus follower, view and engagement trends over time.'
  },
  {
    icon: Calendar,
    title: 'Content calendar',
    desc: 'Every video mapped by month in a heatmap — spot posting streaks, gaps, and cadence at a glance.'
  },
  {
    icon: DollarSign,
    title: 'Revenue estimator',
    desc: 'RPM-based earnings estimates by niche, editable per creator or even per video for one-off deals.'
  },
  {
    icon: Hash,
    title: 'SEO insights',
    desc: 'Top hashtags and title keywords that actually drive views, plus the best day and hour to post.'
  },
  {
    icon: Search,
    title: 'Niche Stats',
    desc: 'Type any topic or hashtag and instantly see the top creators posting about it, ranked and scored.'
  },
  {
    icon: Compass,
    title: 'Niche Finder',
    desc: 'Auto-scan dozens of niches across up to 3 languages at once to spot where demand is high and competition is low.'
  },
  {
    icon: ListPlus,
    title: 'Bulk Search',
    desc: 'Paste hundreds of usernames and scan them all in one background job — walk away, come back to results.'
  },
  {
    icon: Bookmark,
    title: 'Tracking & history',
    desc: 'Save any creator, tag them by category, and watch their growth history chart itself over every sync.'
  },
  {
    icon: Users,
    title: 'Similar creators',
    desc: 'From any profile, one click surfaces other real accounts posting about the same topic — instant competitor research.'
  }
];

const STEPS = [
  { title: 'Sign in free', desc: 'One click with Google — no credit card, no setup.' },
  { title: 'Drop a username', desc: 'Or search a niche keyword — real TikTok data loads in seconds.' },
  { title: 'Act on the insights', desc: 'Track creators, compare niches, and export what matters.' }
];

const REASONS = [
  {
    title: 'Built for speed, not spreadsheets',
    desc: 'What used to mean opening dozens of TikTok profiles by hand and eyeballing engagement is one search here — a full breakdown in seconds, not an afternoon.'
  },
  {
    title: 'Numbers you can act on',
    desc: 'Every score and estimate shows its own methodology — no black-box grades. Know exactly why a creator scored what they scored before you pitch, hire, or invest.'
  },
  {
    title: 'Scales from one creator to hundreds',
    desc: 'Vet a single influencer before a campaign, or bulk-scan an entire shortlist overnight. The same tools work at either size.'
  }
];

export default async function LandingPage() {
  const plans = await listActivePlans();

  return (
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 w-screen flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-neutral-950/80 px-4 py-3 text-white backdrop-blur sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="gradient-text">TikTok</span>
          <span>Stats</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="#features" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
            Features
          </Link>
          <Link href="#pricing" className="hidden text-sm font-medium text-neutral-300 hover:text-white sm:block">
            Pricing
          </Link>
          <Link href="#faq" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
            FAQ
          </Link>
          <Link
            href="/login"
            className="btn-sheen rounded-lg bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:px-4"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero — bold dark aurora background */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 pb-0 pt-14 text-white sm:px-6 sm:pt-20 lg:px-8">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-tiktok-cyan/40 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-tiktok-pink/40 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="mx-auto flex max-w-3xl flex-col items-center pb-16 text-center sm:pb-24">
          <span className="animate-fade-in-up inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-200 backdrop-blur">
            <Sparkles size={13} className="animate-spin-slow text-tiktok-pink" />
            Free trial — no credit card required
          </span>

          <h1 className="animate-fade-in-up mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl" style={{ animationDelay: '0.05s' }}>
            Know exactly why a <span className="gradient-text">TikTok</span> creator is winning
          </h1>

          <p className="animate-fade-in-up mt-6 max-w-xl text-base text-neutral-300 sm:text-lg" style={{ animationDelay: '0.1s' }}>
            Growth trends, content calendars, revenue estimates and SEO insights for any TikTok
            account — plus niche discovery and bulk scanning for research at scale. All from real,
            live TikTok data.
          </p>

          <div className="animate-fade-in-up mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" style={{ animationDelay: '0.15s' }}>
            <Link
              href="/login"
              className="btn-sheen animate-glow-pulse flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-7 py-4 font-semibold text-white shadow-xl shadow-tiktok-pink/30 transition hover:scale-[1.02] hover:opacity-95"
            >
              Start free — try 2 profile scans
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#pricing"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>

          <div className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400" style={{ animationDelay: '0.2s' }}>
            <span>9 tools in one dashboard</span>
            <span className="hidden sm:inline">·</span>
            <span>Real TikTok data, not estimates</span>
            <span className="hidden sm:inline">·</span>
            <span>Cancel anytime</span>
          </div>
        </div>

        <Marquee />

        <div className="animate-fade-in-up relative z-10 py-16 sm:py-20" style={{ animationDelay: '0.3s' }}>
          <div className="relative mx-auto w-full max-w-4xl">
            <div
              className="animate-float pointer-events-none absolute -left-4 top-6 z-20 hidden items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur lg:flex"
              style={{ animationDelay: '0.5s' }}
            >
              📈 +18% growth this month
            </div>
            <div
              className="animate-float pointer-events-none absolute -right-4 bottom-10 z-20 hidden items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-900/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur lg:flex"
              style={{ animationDelay: '1.8s' }}
            >
              🔥 Hidden gem niche found
            </div>

            <div className="gradient-border">
              <div className="rounded-[1.5rem] bg-white px-3 py-6 dark:bg-neutral-900 sm:px-6 sm:py-8">
                <ProductTour />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full feature list */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-tiktok-pink">Everything included</span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Everything you need to research TikTok, in one place</h2>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400">
            Nine tools built for creators sizing up competitors, and agencies scouting talent at scale — no more
            juggling spreadsheets and a dozen open tabs.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={Math.min(i * 0.05, 0.3)}>
              <div className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-tiktok-cyan/15 to-tiktok-pink/15 transition group-hover:from-tiktok-cyan/30 group-hover:to-tiktok-pink/30">
                  <Icon size={19} className="text-tiktok-pink" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-neutral-100/60 py-16 dark:bg-neutral-900/40 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Up and running in under a minute</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1} className="flex flex-col items-center text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink text-lg font-bold text-white shadow-lg shadow-tiktok-pink/20">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why teams choose this */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Why creators &amp; agencies use TikTok Stats</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.1}>
              <LineChart size={20} className="text-tiktok-pink" />
              <h3 className="mt-3 font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{r.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-10 text-sm text-neutral-500 dark:text-neutral-400 sm:py-14">
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-tiktok-pink" /> Google sign-in, no passwords stored
        </span>
        <span className="flex items-center gap-2">
          <Zap size={16} className="text-tiktok-pink" /> Real TikTok data, refreshed automatically
        </span>
        <span className="flex items-center gap-2">
          <Search size={16} className="text-tiktok-pink" /> Cancel or change plans anytime
        </span>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-tiktok-pink">Pricing</span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Simple, transparent pricing</h2>
          <p className="mt-3 text-neutral-500 dark:text-neutral-400">
            Start free. Upgrade when you need more scans, more tracked profiles, or bigger bulk
            batches.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <LandingPricing plans={plans} />
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-neutral-100/60 py-16 dark:bg-neutral-900/40 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          </Reveal>
          <Reveal className="mt-10" delay={0.1}>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* Final CTA — bold dark bookend */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute left-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-tiktok-cyan/25 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute right-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-tiktok-pink/25 blur-3xl" />
        </div>
        <Reveal className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-extrabold sm:text-5xl">Ready to see the numbers behind the growth?</h2>
          <p className="mt-4 text-neutral-300">
            Free to start — sign in with Google and run your first scan in seconds.
          </p>
          <Link
            href="/login"
            className="btn-sheen animate-glow-pulse mt-9 flex items-center gap-2 rounded-xl bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-8 py-4 font-semibold text-white shadow-xl shadow-tiktok-pink/30 transition hover:scale-[1.02] hover:opacity-95"
          >
            Start free
            <ArrowRight size={18} />
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="gradient-text">TikTok</span>
            <span>Stats</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href="#faq" className="hover:text-white">FAQ</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} TikTok Stats. Not affiliated with TikTok Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
