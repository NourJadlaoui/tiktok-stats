import { createClient } from './supabase/server';
import { requireEffectiveUser } from './auth';

export interface ProfileHistoryPoint {
  capturedAt: string;
  followers: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  videoCount: number;
  totalRevenue: number;
}

/** Appends one snapshot of a channel's headline numbers — called every time
 * a channel is actually synced (not on every cache-hit page view), so the
 * history graph reflects real syncs over time rather than every visit. */
export async function appendProfileHistory(username: string, point: ProfileHistoryPoint): Promise<void> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { error } = await supabase.from('profile_history').insert({
    user_id: effectiveUserId,
    username,
    captured_at: point.capturedAt,
    followers: point.followers,
    total_views: point.totalViews,
    total_likes: point.totalLikes,
    total_shares: point.totalShares,
    video_count: point.videoCount,
    total_revenue: point.totalRevenue
  });
  if (error) throw error;
}

export async function getProfileHistory(username: string): Promise<ProfileHistoryPoint[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  // Explicit user_id filter — an admin's own session could otherwise see
  // every user's history rows for this username via the RLS admin bypass
  // (see supabase/schema.sql), not just the effective user's own.
  const { data, error } = await supabase
    .from('profile_history')
    .select('captured_at, followers, total_views, total_likes, total_shares, video_count, total_revenue')
    .eq('user_id', effectiveUserId)
    .eq('username', username)
    .order('captured_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    capturedAt: row.captured_at,
    followers: row.followers,
    totalViews: row.total_views,
    totalLikes: row.total_likes,
    totalShares: row.total_shares,
    videoCount: row.video_count,
    totalRevenue: row.total_revenue
  }));
}

export interface NicheHistoryPoint {
  capturedAt: string;
  scoreOverall: number;
  profilesFound: number;
  videosScanned: number;
}

export async function appendNicheHistory(term: string, point: NicheHistoryPoint & { data: unknown }): Promise<void> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { error } = await supabase.from('niche_history').insert({
    user_id: effectiveUserId,
    term: term.toLowerCase(),
    captured_at: point.capturedAt,
    score_overall: point.scoreOverall,
    profiles_found: point.profilesFound,
    videos_scanned: point.videosScanned,
    data: point.data as object
  });
  if (error) throw error;
}

export async function getNicheHistory(term: string): Promise<NicheHistoryPoint[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('niche_history')
    .select('captured_at, score_overall, profiles_found, videos_scanned')
    .eq('user_id', effectiveUserId)
    .eq('term', term.toLowerCase())
    .order('captured_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    capturedAt: row.captured_at,
    scoreOverall: row.score_overall,
    profilesFound: row.profiles_found,
    videosScanned: row.videos_scanned
  }));
}

/** All requested channels' most recent history point in one query — powers
 * the Tracked dashboard's combined progression view without N+1 lookups. */
export async function getLatestHistoryForUsernames(usernames: string[]): Promise<Record<string, ProfileHistoryPoint | undefined>> {
  if (!usernames.length) return {};
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profile_history')
    .select('username, captured_at, followers, total_views, total_likes, total_shares, video_count, total_revenue')
    .eq('user_id', effectiveUserId)
    .in('username', usernames)
    .order('captured_at', { ascending: true });
  if (error) throw error;

  const result: Record<string, ProfileHistoryPoint | undefined> = {};
  for (const row of data ?? []) {
    result[row.username] = {
      capturedAt: row.captured_at,
      followers: row.followers,
      totalViews: row.total_views,
      totalLikes: row.total_likes,
      totalShares: row.total_shares,
      videoCount: row.video_count,
      totalRevenue: row.total_revenue
    };
  }
  return result;
}

/** Picks the history point closest to (but not after) `daysAgo` days back —
 * used to compute "this week" / "this year" follower deltas for the
 * profile gallery (see galleryRows.ts). */
export function historyPointNearDaysAgo(history: ProfileHistoryPoint[], daysAgo: number): ProfileHistoryPoint | null {
  if (!history.length) return null;
  const targetTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  let best: ProfileHistoryPoint | null = null;
  for (const point of history) {
    const t = new Date(point.capturedAt).getTime();
    if (t <= targetTime && (!best || t > new Date(best.capturedAt).getTime())) best = point;
  }
  return best ?? history[0];
}
