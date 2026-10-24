import Link from 'next/link';
import { loadChannelData, getChannelTracking } from '@/lib/channel';
import { ChannelNotFoundError, ScrapeBlockedError } from '@/lib/dataProviders';
import { PlanLimitError, listActivePlans } from '@/lib/plans';
import { getCurrentUser } from '@/lib/auth';
import { getUsdToEurRate, getScoringThresholds, getCategories } from '@/lib/settings';
import { getProfileHistory } from '@/lib/history';
import ProfileHeader from '@/components/ProfileHeader';
import DashboardTabs from '@/components/DashboardTabs';
import UpgradeModal from '@/components/UpgradeModal';
import { ChannelDataProvider } from '@/components/dashboard/ChannelDataContext';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  try {
    const [data, user, eurRate, thresholds, categories] = await Promise.all([
      loadChannelData(username),
      getCurrentUser(),
      getUsdToEurRate(),
      getScoringThresholds(),
      getCategories()
    ]);
    // Depend on data.profile.username (case-normalized by loadChannelData)
    // rather than the raw route param, matching what each tab looked up before.
    const [history, tracking] = await Promise.all([
      getProfileHistory(data.profile.username),
      getChannelTracking(data.profile.username)
    ]);
    const isAdmin = Boolean(user?.isAdmin);

    return (
      <ChannelDataProvider bundle={{ data, eurRate, thresholds, history, tracking, categories, isAdmin }}>
        <div>
          <ProfileHeader
            profile={data.profile}
            settings={data.settings}
            provider={data.provider}
            lastSyncedAt={data.lastSyncedAt}
            isAdmin={isAdmin}
          />
          <DashboardTabs username={data.profile.username} />
          {children}
        </div>
      </ChannelDataProvider>
    );
  } catch (err) {
    if (err instanceof PlanLimitError) {
      const plans = await listActivePlans();
      return (
        <div className="mx-auto max-w-md py-20">
          <UpgradeModal open reason={err.message} plans={plans} dismissHref="/app" />
        </div>
      );
    }
    if (err instanceof ChannelNotFoundError) {
      return (
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="text-2xl font-bold">Account not found</h1>
          <p className="mt-2 text-neutral-500">We couldn&apos;t find @{username}.</p>
          <Link href="/app" className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900">
            Back to search
          </Link>
        </div>
      );
    }
    if (err instanceof ScrapeBlockedError) {
      const errUser = await getCurrentUser();
      return (
        <div className="mx-auto max-w-lg py-20 text-center">
          <h1 className="text-2xl font-bold">Couldn&apos;t reach TikTok</h1>
          <p className="mt-2 text-neutral-500">{err.message}</p>
          <p className="mt-2 text-sm text-neutral-400">
            {errUser?.isAdmin ? (
              <>
                This usually means TikTok is temporarily rate-limiting automated requests. Wait a bit and try again,
                or configure a RapidAPI key in <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">config/credentials.json</code> for a more reliable data source.
              </>
            ) : (
              'This usually means TikTok is temporarily rate-limiting automated requests. Wait a bit and try again.'
            )}
          </p>
          <Link href="/app" className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-neutral-900">
            Back to search
          </Link>
        </div>
      );
    }
    throw err;
  }
}
