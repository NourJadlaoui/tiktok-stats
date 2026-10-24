import { listTrackedAccounts } from '@/lib/channel';
import { getProfileHistory } from '@/lib/history';
import { getUsdToEurRate } from '@/lib/settings';
import TrackedDashboard, { TrackedCreatorRow } from '@/components/TrackedDashboard';

export const dynamic = 'force-dynamic';

export default async function TrackedPage() {
  const [accounts, eurRate] = await Promise.all([listTrackedAccounts(), getUsdToEurRate()]);
  const tracked = accounts.filter((a) => a.tracked);

  const rows: TrackedCreatorRow[] = await Promise.all(
    tracked.map(async (a): Promise<TrackedCreatorRow> => {
      const history = await getProfileHistory(a.username);
      const first = history[0];
      const last = history[history.length - 1];
      const followerGrowthPct =
        history.length >= 2 && first.followers > 0
          ? ((last.followers - first.followers) / first.followers) * 100
          : null;
      return {
        username: a.username,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        niche: a.niche,
        categories: a.categories,
        myScore: a.myScore,
        followers: last?.followers ?? 0,
        totalRevenue: last?.totalRevenue ?? 0,
        followerGrowthPct,
        firstSyncedAt: a.firstSyncedAt,
        syncCount: history.length
      };
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Tracked creators</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Progression across everyone you&apos;re tracking — follower growth, revenue, and scores in one place.
      </p>
      <div className="mt-6">
        <TrackedDashboard rows={rows} eurRate={eurRate} />
      </div>
    </div>
  );
}
