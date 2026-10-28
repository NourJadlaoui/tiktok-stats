import type { Metadata } from 'next';
import Link from 'next/link';
import { Percent, DollarSign, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Free TikTok Tools',
  description:
    'Free, no-login TikTok calculators: work out an engagement rate or estimate creator revenue from your own numbers — no account required.',
  alternates: { canonical: '/free-tools' }
};

const TOOLS = [
  {
    href: '/free-tools/engagement-rate-calculator',
    icon: Percent,
    title: 'Engagement Rate Calculator',
    desc: 'Work out a TikTok video or account\'s engagement rate from views, likes, comments and shares — by views or by followers.'
  },
  {
    href: '/free-tools/money-calculator',
    icon: DollarSign,
    title: 'TikTok Money Calculator',
    desc: 'Estimate potential Creator Rewards earnings from your own view counts and RPM assumptions, with the math shown.'
  }
];

export default function FreeToolsPage() {
  return (
    <div className="flex flex-col gap-10 text-white">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-tiktok-pink">No login required</span>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Free TikTok Tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">
          Quick calculators that work entirely from numbers you type in — no TikTok account connection, no
          sign-up. For a full profile analysis with real, live TikTok data, see the{' '}
          <Link href="/app" className="font-medium text-tiktok-pink hover:underline">
            full dashboard
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {TOOLS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-tiktok-cyan/20 to-tiktok-pink/20">
              <Icon size={19} className="text-tiktok-pink" />
            </div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-neutral-400">{desc}</p>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-tiktok-pink">
              Open calculator <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
