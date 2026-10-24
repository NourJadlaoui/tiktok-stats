import { createClient } from './supabase/server';
import { TrackedAccount } from './channel';
import { computeProfileScore } from './scoring';
import { historyPointNearDaysAgo, ProfileHistoryPoint } from './history';
import { TikTokProfile, TikTokVideo } from './types';
import type { GalleryProfileRow } from '@/components/ProfileGallery';

function pctChange(current: number, past: number): number | null {
  if (!past) return null;
  return ((current - past) / past) * 100;
}

/** Builds the rows the profile gallery (Accounts page, Bulk Search results,
 * Admin "view data") needs: the current Creator Score (from whatever's
 * already cached — no re-scraping) plus follower-growth deltas over the
 * last week and year, computed from sync-history snapshots.
 *
 * `userId` must be the id of whichever account these `accounts` actually
 * belong to (the signed-in user themselves, or — for the Admin "view as"
 * page — the user being viewed). It's required, not inferred, because an
 * admin's own session can read every user's kv_profile_cache/profile_history
 * rows via the RLS admin bypass; without an explicit user_id filter here, a
 * username two different users have both scanned would come back with
 * ambiguous/wrong-user data mixed together. */
export async function buildGalleryRows(accounts: TrackedAccount[], userId: string): Promise<GalleryProfileRow[]> {
  if (!accounts.length) return [];
  const supabase = await createClient();
  const usernames = accounts.map((a) => a.username);

  const { data: caches } = (await supabase
    .from('kv_profile_cache')
    .select('username, data')
    .eq('user_id', userId)
    .in('username', usernames)) as { data: { username: string; data: { profile: TikTokProfile; videos: TikTokVideo[] } }[] | null };

  const cacheByUsername = new Map((caches ?? []).map((c) => [c.username, c.data]));

  // Explicit user_id filter here too, for the same reason as kv_profile_cache
  // above — an admin's session can otherwise see every user's history rows
  // for a username two different people have both scanned.
  const { data: historyRows } = (await supabase
    .from('profile_history')
    .select('username, captured_at, followers, total_views, total_likes, total_shares, video_count, total_revenue')
    .eq('user_id', userId)
    .in('username', usernames)
    .order('captured_at', { ascending: true })) as {
    data:
      | {
          username: string;
          captured_at: string;
          followers: number;
          total_views: number;
          total_likes: number;
          total_shares: number;
          video_count: number;
          total_revenue: number;
        }[]
      | null;
  };

  const historyByUsername = new Map<string, ProfileHistoryPoint[]>();
  for (const row of historyRows ?? []) {
    const point: ProfileHistoryPoint = {
      capturedAt: row.captured_at,
      followers: row.followers,
      totalViews: row.total_views,
      totalLikes: row.total_likes,
      totalShares: row.total_shares,
      videoCount: row.video_count,
      totalRevenue: row.total_revenue
    };
    if (!historyByUsername.has(row.username)) historyByUsername.set(row.username, []);
    historyByUsername.get(row.username)!.push(point);
  }

  const rows = accounts.map((a): GalleryProfileRow => {
      const cache = cacheByUsername.get(a.username);
      const profile = cache?.profile;
      const videos = cache?.videos ?? [];
      const creatorScore = profile ? computeProfileScore(profile.followers, videos).overall : null;

      const history = historyByUsername.get(a.username) ?? [];
      const latest = history[history.length - 1];
      const weekAgo = historyPointNearDaysAgo(history, 7);
      const yearAgo = historyPointNearDaysAgo(history, 365);

      const row: GalleryProfileRow = {
        username: a.username,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        verified: Boolean(profile?.verified),
        niche: a.niche,
        language: a.language,
        rpm: a.rpm,
        categories: a.categories,
        myScore: a.myScore,
        tracked: a.tracked,
        notes: a.notes,
        lastViewedAt: a.lastViewedAt,
        followers: latest?.followers ?? profile?.followers ?? 0,
        creatorScore,
        scoreDeltaWeek: latest && weekAgo && weekAgo !== latest ? pctChange(latest.followers, weekAgo.followers) : null,
        scoreDeltaYear: latest && yearAgo && yearAgo !== latest ? pctChange(latest.followers, yearAgo.followers) : null
      };
    return row;
  });

  return rows;
}
