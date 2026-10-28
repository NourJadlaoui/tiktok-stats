import type { Metadata } from 'next';
import Link from 'next/link';
import MoneyCalculator from '@/components/tools/MoneyCalculator';
import ToolFaq from '@/components/landing/ToolFaq';

export const metadata: Metadata = {
  title: 'TikTok Money Calculator (Free Estimate)',
  description:
    "Estimate potential TikTok Creator Rewards earnings from your own monthly view count and RPM assumption — free, no login, with the math shown.",
  alternates: { canonical: '/free-tools/money-calculator' }
};

const FAQ_ITEMS = [
  {
    q: 'How is the estimate calculated?',
    a: '(monthly views ÷ 1,000) × your RPM. RPM stands for "revenue per thousand views" — it\'s the one number that actually drives the estimate, and it is entirely up to you, not something this tool knows in advance.'
  },
  {
    q: 'Where do I get an RPM number?',
    a: "TikTok doesn't publish RPM rates, and real payouts vary enormously by niche, region, audience and how TikTok's Creator Rewards Program is performing that month — there is no single correct number. If you already have TikTok Creator Rewards payout history, divide a recent payout by (views ÷ 1,000) to get your own real RPM. Otherwise this is a what-if tool: try a few RPM values to see the range."
  },
  {
    q: 'Why does it ask for views from "eligible" videos specifically?',
    a: "TikTok's Creator Rewards Program only pays out on videos at least 60 seconds long — views from shorter videos aren't eligible and would overstate the estimate if included."
  },
  {
    q: 'Is this what I\'ll actually earn?',
    a: "No — this is a what-if estimate from numbers you supply, not a real payout figure, a guarantee, or data sourced from TikTok. Nothing here is fetched from TikTok or any other provider."
  }
];

export default function MoneyCalculatorPage() {
  return (
    <div className="flex flex-col gap-10 text-white">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">TikTok Money Calculator</h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          A what-if estimate of Creator Rewards earnings from your own monthly view count and an RPM you set
          yourself — no account connection, nothing fetched from TikTok.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
        <MoneyCalculator />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
        <h2 className="text-lg font-semibold">Methodology &amp; assumptions</h2>
        <p className="mt-2 text-sm text-neutral-300">
          <strong>Formula:</strong> (monthly views ÷ 1,000) × RPM
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          <strong>Example</strong> (illustrative only, not real data): 500,000 eligible monthly views at an RPM
          of $0.40 gives (500,000 ÷ 1,000) × $0.40 = <strong>$200.00</strong> estimated for that month.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          <strong>Limits:</strong> This covers Creator Rewards estimates only — it doesn't include brand deals,
          affiliate links, TikTok Shop commissions, livestream gifts or any other income source, since those
          depend on deals and platforms this tool has no data about. RPM is entirely your own input; see the
          FAQ below for how to estimate one.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">FAQ</h2>
        <ToolFaq items={FAQ_ITEMS} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
        <p className="text-sm text-neutral-300">
          Want this computed automatically per-video, with a niche-based default RPM and revenue broken down by
          month, from real TikTok data?
        </p>
        <Link
          href="/login"
          className="btn-sheen mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Try the full dashboard free
        </Link>
        <p className="mt-4 text-xs text-neutral-500">
          Also see the{' '}
          <Link href="/free-tools/engagement-rate-calculator" className="text-tiktok-pink hover:underline">
            Engagement Rate Calculator
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
