import type { Metadata } from 'next';
import './globals.css';
import TopNav from '@/components/TopNav';
import ActingAsBanner from '@/components/ActingAsBanner';
import { getEffectiveUser } from '@/lib/auth';
import { getSubscriptionForUser } from '@/lib/plans';
import { getUsageCountThisMonth, getUsageCountLifetime, UsageEventType } from '@/lib/usage';

const USAGE_EVENT_TYPES: UsageEventType[] = ['profile_scan', 'niche_search', 'niche_finder_term', 'bulk_scan_item'];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
const title = 'NicheTok.io — TikTok Analytics & Creator Growth Dashboard';
const description =
  "Track any TikTok creator's growth, content calendar, revenue estimates and SEO insights. Discover trending niches, bulk-scan hundreds of profiles, and grow smarter — free to start.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s — NicheTok.io' },
  description,
  keywords: [
    'TikTok analytics',
    'TikTok stats',
    'TikTok creator dashboard',
    'TikTok growth tracker',
    'TikTok niche finder',
    'TikTok revenue estimator'
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'NicheTok.io',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description
  },
  robots: { index: true, follow: true }
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const effective = await getEffectiveUser();
  const realUser = effective?.realUser ?? null;
  const sub = realUser ? await getSubscriptionForUser(realUser.id) : null;

  let usagePercent: number | null = null;
  let usageLabel: string | undefined;
  if (realUser && !realUser.isAdmin && sub?.plan.monthlyRequestLimit) {
    const used = sub.plan.isFreeTrial
      ? await getUsageCountLifetime(realUser.id, USAGE_EVENT_TYPES)
      : await getUsageCountThisMonth(realUser.id, USAGE_EVENT_TYPES);
    usagePercent = Math.min(100, Math.round((used / sub.plan.monthlyRequestLimit) * 100));
    usageLabel = `${Math.min(used, sub.plan.monthlyRequestLimit)} / ${sub.plan.monthlyRequestLimit} scans ${
      sub.plan.isFreeTrial ? 'used' : 'this month'
    }`;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        {effective?.isActingAs && <ActingAsBanner email={effective.effectiveEmail} />}
        {realUser && (
          <TopNav
            name={realUser.name}
            email={realUser.email}
            avatarUrl={realUser.avatarUrl}
            isAdmin={realUser.isAdmin}
            planName={sub?.plan.name}
            usagePercent={usagePercent}
            usageLabel={usageLabel}
          />
        )}
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
