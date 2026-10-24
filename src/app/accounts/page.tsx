import Link from 'next/link';
import { listTrackedAccounts } from '@/lib/channel';
import { listNicheSearchHistory } from '@/lib/nicheSearch';
import { getCategories } from '@/lib/settings';
import { buildGalleryRows } from '@/lib/galleryRows';
import { requireUser } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import AccountSearchBox from '@/components/AccountSearchBox';
import AccountsTable from '@/components/AccountsTable';
import ScoreBadge from '@/components/ScoreBadge';
import { formatCompactNumber } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listTrackedAccounts();
  const nicheHistory = await listNicheSearchHistory();
  const categories = await getCategories();
  const galleryRows = await buildGalleryRows(accounts, user.id);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Search History</h1>
            <p className="text-sm text-neutral-400">
              Every TikTok page you&apos;ve looked up with Profile Stats — filter by category, My Score, or
              whether you&apos;ve explicitly tracked it.
            </p>
          </div>
          <AccountSearchBox />
        </div>

        {accounts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-neutral-400">
            No accounts tracked yet. Search for a username to get started.
          </div>
        ) : (
          <AccountsTable accounts={galleryRows} categories={categories} />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold">Niche searches</h2>
          <p className="text-sm text-neutral-400">Every topic you&apos;ve searched with Niche Stats, cached for quick re-viewing.</p>
        </div>

        {nicheHistory.length === 0 ? (
          <div className="card p-10 text-center text-sm text-neutral-400">
            No niche searches yet. Try Niche Stats to discover top creators for a topic.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Profiles found</th>
                  <th className="px-4 py-3">Videos scanned</th>
                  <th className="px-4 py-3">Niche Score</th>
                  <th className="px-4 py-3">Searched</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {nicheHistory.map((entry) => (
                  <tr key={entry.term} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60">
                    <td className="px-4 py-3 font-semibold">&quot;{entry.term}&quot;</td>
                    <td className="px-4 py-3 tabular-nums">{entry.profilesFound}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCompactNumber(entry.videosScanned)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ScoreBadge overall={entry.overallScore} label="Niche Score" />
                        <span className="text-xs text-neutral-400">{entry.grade}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(entry.fetchedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/niche?q=${encodeURIComponent(entry.term)}`}
                        className="text-xs font-medium text-tiktok-pink hover:underline"
                      >
                        View results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
