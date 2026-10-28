import type { Metadata } from 'next';
import Link from 'next/link';
import ToolFaq from '@/components/landing/ToolFaq';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about NicheTok.io\'s data, pricing, free tools and account — how the Creator Score works, what the free trial includes, and how billing and cancellation work.',
  alternates: { canonical: '/faq' }
};

const PRODUCT_FAQ = [
  {
    q: 'Is this real TikTok data, or estimates?',
    a: "Profile stats, video counts, likes, and posting history are pulled live from real TikTok pages — not synthetic data. Revenue is the one estimated figure, computed from an editable RPM (revenue per thousand views) since TikTok doesn't publish real earnings publicly."
  },
  {
    q: 'How is the Creator Score calculated?',
    a: 'A weighted 0-100 score across audience size, engagement rate, recent growth, posting consistency, and monetization potential — the exact formula is shown on every score card, not a black box.'
  },
  {
    q: 'Can I track multiple creators at once?',
    a: "Yes — Bulk Search scans up to your plan's limit of usernames in one background job, and every profile you've looked up stays on your Accounts page with growth history over time."
  },
  {
    q: 'Do I need a TikTok account to use this?',
    a: 'No — everything works from public profile pages, no TikTok login required. You only need a Google account to sign in to NicheTok.io itself.'
  }
];

const PRICING_FAQ = [
  {
    q: 'What do I get on the free trial?',
    a: 'Two full profile scans and access to every tool — growth analytics, calendar, monetization estimator, SEO insights, Niche Stats, and Niche Finder — so you can see exactly what a paid plan gets you before committing.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — plans are month-to-month with no lock-in. Manage or cancel your subscription anytime from the Billing page, which opens Stripe\'s own billing portal for your account.'
  },
  {
    q: 'What happens to my data if I cancel?',
    a: "Your account and the profiles you've already tracked stay in place — cancelling stops future billing, it doesn't delete your history."
  }
];

const FREE_TOOLS_FAQ = [
  {
    q: 'Do the Free Tools need an account?',
    a: 'No — the Free Tools calculators work entirely from numbers you type in, with no sign-up and no TikTok connection.'
  },
  {
    q: 'How accurate are the Free Tools?',
    a: "Each calculator is exact for the formula it uses — the methodology and its limits are documented on that specific tool's page, since the engagement rate and money calculators have different assumptions."
  }
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-10 text-white">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-neutral-300">
          Product, pricing and the Free Tools. For a specific tool's own formula and limits, see its page under{' '}
          <Link href="/free-tools" className="text-tiktok-pink hover:underline">
            Free Tools
          </Link>
          .
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Product</h2>
        <ToolFaq items={PRODUCT_FAQ} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Pricing &amp; billing</h2>
        <ToolFaq items={PRICING_FAQ} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Free Tools</h2>
        <ToolFaq items={FREE_TOOLS_FAQ} />
        <p className="mt-2 text-xs text-neutral-500">
          See the{' '}
          <Link href="/free-tools/engagement-rate-calculator" className="text-tiktok-pink hover:underline">
            Engagement Rate Calculator
          </Link>{' '}
          and{' '}
          <Link href="/free-tools/money-calculator" className="text-tiktok-pink hover:underline">
            Money Calculator
          </Link>{' '}
          for their own detailed FAQ.
        </p>
      </section>
    </div>
  );
}
