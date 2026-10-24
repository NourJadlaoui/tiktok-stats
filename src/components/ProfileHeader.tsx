import { BadgeCheck } from 'lucide-react';
import { TikTokProfile, ChannelSettings, DataProviderName } from '@/lib/types';
import { formatCompactNumber } from '@/lib/stats';
import RefreshButton from './RefreshButton';
import ExportDataButton from './ExportDataButton';
import { formatDistanceToNow } from 'date-fns';

const PROVIDER_LABEL: Record<DataProviderName, string> = {
  tiktok: 'Live TikTok data',
  rapidapi: 'Live data (RapidAPI)',
  mock: 'Demo data'
};

export default function ProfileHeader({
  profile,
  settings,
  provider,
  lastSyncedAt,
  isAdmin
}: {
  profile: TikTokProfile;
  settings: ChannelSettings;
  provider: DataProviderName;
  lastSyncedAt?: string;
  isAdmin?: boolean;
}) {
  // Which scraper backend is serving this data is an operational detail —
  // regular users just see "Live data", admins see the specific provider
  // (useful for debugging why a profile loaded partial/no data).
  const providerLabel = isAdmin ? PROVIDER_LABEL[provider] : provider === 'mock' ? 'Demo data' : 'Live data';
  return (
    <div className="card mb-6 flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="h-16 w-16 shrink-0 rounded-full border-2 border-tiktok-pink object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl font-bold">{profile.displayName}</h1>
            {profile.verified && <BadgeCheck size={18} className="shrink-0 text-cyan-500" />}
          </div>
          <p className="text-sm text-neutral-400">@{profile.username}</p>
          <p className="mt-1 max-w-md text-sm text-neutral-500 dark:text-neutral-400">{profile.bio}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:shrink-0 lg:items-end">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{formatCompactNumber(profile.followers)}</div>
            <div className="text-xs text-neutral-400">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{formatCompactNumber(profile.videoCount)}</div>
            <div className="text-xs text-neutral-400">Videos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold tabular-nums">{formatCompactNumber(profile.totalLikes)}</div>
            <div className="text-xs text-neutral-400">Likes</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {settings.niche}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {settings.language}
          </span>
          <span
            className={
              provider === 'mock'
                ? 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }
          >
            {providerLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastSyncedAt && (
            <span className="text-xs text-neutral-400" title={new Date(lastSyncedAt).toLocaleString()}>
              Synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
            </span>
          )}
          <ExportDataButton />
          <RefreshButton username={profile.username} />
        </div>
      </div>
    </div>
  );
}
