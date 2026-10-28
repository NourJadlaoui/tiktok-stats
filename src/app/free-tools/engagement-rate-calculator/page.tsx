import type { Metadata } from 'next';
import Link from 'next/link';
import EngagementRateCalculator from '@/components/tools/EngagementRateCalculator';
import ToolFaq from '@/components/landing/ToolFaq';

export const metadata: Metadata = {
  title: 'TikTok Engagement Rate Calculator (Free)',
  description:
    'Calculate a TikTok video or account\'s engagement rate from likes, comments, shares and views or followers — free, no login, instant.',
  alternates: { canonical: '/free-tools/engagement-rate-calculator' }
};

const FAQ_ITEMS = [
  {
    q: 'How is engagement rate calculated here?',
    a: 'By views: (likes + comments + shares) ÷ views × 100. By followers: (likes + comments + shares) ÷ followers × 100. Pick one — mixing the two denominators in a single number isn\'t meaningful, which is why this tool keeps them as separate modes instead of combining them.'
  },
  {
    q: 'Which denominator should I use — views or followers?',
    a: "By-views engagement reflects how well a specific video performed with the people who actually saw it, and is the more common way to compare individual videos. By-followers engagement is sometimes used to gauge how active an audience is relative to account size, but it penalizes accounts whose videos reach far beyond their follower count (common on TikTok), so treat it as a rougher signal."
  },
  {
    q: 'Why does it say "—" instead of a number?',
    a: "That means the denominator (views or followers, depending on the mode selected) is empty or zero — dividing by zero isn't a real rate, so the tool shows that a result isn't available instead of a wrong number."
  },
  {
    q: 'Is this exact, or an estimate?',
    a: "It's an exact calculation of the formula above, but only as accurate as the numbers you type in. If you want this computed automatically from a real, live TikTok profile instead of typing numbers by hand, the full dashboard pulls them for you."
  }
];

export default function EngagementRateCalculatorPage() {
  return (
    <div className="flex flex-col gap-10 text-white">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">TikTok Engagement Rate Calculator</h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          Type in a video or account's likes, comments, shares, and either its view count or follower count —
          the engagement rate is calculated instantly below, no account or login needed.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
        <EngagementRateCalculator />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
        <h2 className="text-lg font-semibold">Formula &amp; methodology</h2>
        <p className="mt-2 text-sm text-neutral-300">
          <strong>By views:</strong> (likes + comments + shares) ÷ views × 100
          <br />
          <strong>By followers:</strong> (likes + comments + shares) ÷ followers × 100
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          <strong>Example</strong> (illustrative only, not real data): a video with 50,000 views, 4,000 likes, 150
          comments and 300 shares has a by-views engagement rate of (4,000 + 150 + 300) ÷ 50,000 × 100 ={' '}
          <strong>8.90%</strong>.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          <strong>Limits:</strong> TikTok doesn't publish an official "engagement rate" — this is a standard,
          widely-used formula, not a figure TikTok itself reports. Saves aren't included (TikTok doesn't expose
          a save count through any public source this app uses). Results are only as accurate as the numbers
          entered.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">FAQ</h2>
        <ToolFaq items={FAQ_ITEMS} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
        <p className="text-sm text-neutral-300">
          Want this computed automatically for every video on a real profile, plus growth, revenue estimates and
          SEO insights?
        </p>
        <Link
          href="/login"
          className="btn-sheen mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Try the full dashboard free
        </Link>
        <p className="mt-4 text-xs text-neutral-500">
          Also see the{' '}
          <Link href="/free-tools/money-calculator" className="text-tiktok-pink hover:underline">
            TikTok Money Calculator
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
