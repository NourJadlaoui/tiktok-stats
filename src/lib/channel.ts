import { cache } from 'react';
import { getStore, saveStore, ChannelRow } from './db';
import { createClient } from './supabase/server';
import { requireEffectiveUser } from './auth';
import { enforceRequestLimit, enforceDistinctProfilesLimit, getSubscriptionForUser } from './plans';
import { logUsageEvent } from './usage';
import { appendProfileHistory } from './history';
import { getTotalRevenue } from './revenue';
import { getDataProvider, ChannelNotFoundError } from './dataProviders';
import { ChannelData, ChannelSettings, DataProviderName, TikTokProfile, TikTokVideo } from './types';
import { detectChannelLanguage } from './langDetect';
import { getConfig } from './config';

function detectNiche(bio: string, hashtags: string[]): string {
  const text = `${bio} ${hashtags.join(' ')}`.toLowerCase();
  const NICHE_HINTS: Record<string, string[]> = {
    finance: ['money', 'invest', 'finance', 'stock', 'budget'],
    beauty: ['skincare', 'makeup', 'beauty', 'glow'],
    gaming: ['gaming', 'gamer', 'gameplay', 'esports'],
    fitness: ['fitness', 'gym', 'workout', 'gains'],
    food: ['food', 'recipe', 'cooking', 'foodie'],
    tech: ['tech', 'gadget', 'coding', 'ai'],
    education: ['learnontiktok', 'facts', 'education', 'study']
  };
  for (const [niche, hints] of Object.entries(NICHE_HINTS)) {
    if (hints.some((h) => text.includes(h))) return niche;
  }
  return 'default';
}

// Wrapped in React's cache() so the dashboard layout and the active tab's
// page — both server components that independently call this for the same
// username on every navigation — share one call instead of two. Keyed by
// effectiveUserId too (not just username) since two different effective
// users — e.g. an admin "Acting as" different people in the same render —
// must never share a cached result for the same username.
export const getChannelData = cache(async function getChannelData(
  usernameRaw: string,
  forceRefresh = false,
  effectiveUserIdForCache?: string
): Promise<ChannelData> {
  const username = usernameRaw.trim().toLowerCase().replace(/^@/, '');
  const { effectiveUserId } = effectiveUserIdForCache ? { effectiveUserId: effectiveUserIdForCache } : await requireEffectiveUser();
  const store = await getStore(effectiveUserId);

  let profile: TikTokProfile;
  let videos: TikTokVideo[];
  let provider: DataProviderName;
  let videosComplete: boolean;

  const cacheEntry = store.profileCache[username];
  const existingRow = store.channels[username];
  // Read directly off the already-loaded `store` rather than calling
  // settings.ts's getSyncIntervalHours()/getRpmByNiche() helpers, which do
  // their own independent getStore() fetch (and, for RPM, their own
  // saveStore() to seed defaults) — now that getStore() is no longer a
  // process-wide cached singleton (it can't be, once one server process
  // serves many different signed-in users), calling those helpers here
  // would create a second, separately-fetched store object; whichever of
  // the two gets saved last would silently overwrite the other's changes.
  const syncIntervalHours = store.settings.syncIntervalHours || 24;
  const syncIntervalMs = syncIntervalHours * 60 * 60 * 1000;
  const lastSyncedAt = existingRow?.lastSyncedAt;
  const isStale = !lastSyncedAt || Date.now() - new Date(lastSyncedAt).getTime() >= syncIntervalMs;

  let didFreshFetch = false;

  if (cacheEntry && !forceRefresh && !isStale) {
    profile = cacheEntry.profile as TikTokProfile;
    videos = cacheEntry.videos as TikTokVideo[];
    provider = cacheEntry.provider as DataProviderName;
    videosComplete = cacheEntry.videosComplete;
  } else {
    // Only a real scan (about to actually hit TikTok/RapidAPI) costs
    // anything and counts against a plan — a cache hit above never reaches
    // here. Check the request allowance, and — only for a genuinely new
    // username this account hasn't scanned before — the distinct-profiles
    // cap, before spending the request.
    await enforceRequestLimit(effectiveUserId, ['profile_scan']);
    if (!existingRow) {
      await enforceDistinctProfilesLimit(effectiveUserId, Object.keys(store.channels).length);
    }

    const sub = await getSubscriptionForUser(effectiveUserId);
    const result = await getDataProvider().fetchChannel(username, sub?.plan.maxVideosPerProfile ?? undefined);
    profile = result.profile;
    videos = result.videos;
    provider = result.provider;
    videosComplete = result.videosComplete;
    didFreshFetch = true;

    store.profileCache[username] = {
      provider,
      profile,
      videos,
      videosComplete,
      fetchedAt: new Date().toISOString()
    };
    await saveStore(store, effectiveUserId);
    await logUsageEvent(effectiveUserId, 'profile_scan', username);
  }

  let channelRow = store.channels[username];
  const nowIso = new Date().toISOString();

  if (!channelRow) {
    const allHashtags = videos.flatMap((v) => v.hashtags);
    const niche = detectNiche(profile.bio, allHashtags);
    if (Object.keys(store.settings.rpmByNiche).length === 0) {
      store.settings.rpmByNiche = { ...getConfig().defaultRpmByNiche };
    }
    const rpmByNiche = store.settings.rpmByNiche;
    const rpm = rpmByNiche[niche] ?? rpmByNiche.default ?? 0.4;
    const language = detectChannelLanguage(
      profile.bio,
      videos.map((v) => v.description)
    );
    channelRow = {
      username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      niche,
      language,
      rpm,
      lastViewedAt: nowIso,
      firstSyncedAt: nowIso,
      lastSyncedAt: nowIso,
      categories: [],
      myScore: null,
      notes: '',
      tracked: false
    };
    store.channels[username] = channelRow;
  } else {
    channelRow.displayName = profile.displayName;
    channelRow.avatarUrl = profile.avatarUrl;
    channelRow.lastViewedAt = nowIso;
    if (!channelRow.firstSyncedAt) channelRow.firstSyncedAt = channelRow.lastSyncedAt || nowIso;
    if (didFreshFetch) channelRow.lastSyncedAt = nowIso;
  }
  await saveStore(store, effectiveUserId);

  if (didFreshFetch) {
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
    const totalShares = videos.reduce((sum, v) => sum + v.shares, 0);
    await appendProfileHistory(username, {
      capturedAt: nowIso,
      followers: profile.followers,
      totalViews,
      totalLikes,
      totalShares,
      videoCount: videos.length,
      totalRevenue: getTotalRevenue(videos, channelRow.rpm)
    });
  }

  const overrideMap = store.videoOverrides[username] || {};

  const videosWithOverrides = videos.map((v) => ({
    ...v,
    rpmOverride: v.id in overrideMap ? overrideMap[v.id] : null
  }));

  const settings: ChannelSettings = {
    username,
    niche: channelRow.niche,
    language: channelRow.language,
    rpm: channelRow.rpm
  };

  return {
    profile,
    videos: videosWithOverrides,
    settings,
    fetchedAt: new Date().toISOString(),
    provider,
    videosComplete,
    lastSyncedAt: channelRow.lastSyncedAt,
    firstSyncedAt: channelRow.firstSyncedAt
  };
});

/** Thin wrapper that resolves the effective user once and passes it into
 * the cache()-wrapped getChannelData above, so the cache key correctly
 * varies per effective user (see the comment there). Use this from
 * pages/API routes instead of calling getChannelData directly. */
export async function loadChannelData(username: string, forceRefresh = false): Promise<ChannelData> {
  const { effectiveUserId } = await requireEffectiveUser();
  return getChannelData(username, forceRefresh, effectiveUserId);
}

export async function updateChannelSettings(
  username: string,
  updates: Partial<Pick<ChannelSettings, 'niche' | 'language' | 'rpm'>>
): Promise<ChannelSettings> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const existing = store.channels[username];

  if (!existing) {
    throw new ChannelNotFoundError(username);
  }

  existing.niche = updates.niche ?? existing.niche;
  existing.language = updates.language ?? existing.language;
  existing.rpm = updates.rpm ?? existing.rpm;
  await saveStore(store, effectiveUserId);

  return { username, niche: existing.niche, language: existing.language, rpm: existing.rpm };
}

export async function setVideoRpmOverride(username: string, videoId: string, rpm: number | null): Promise<void> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (rpm === null) {
    if (store.videoOverrides[username]) {
      delete store.videoOverrides[username][videoId];
    }
  } else {
    if (!store.videoOverrides[username]) store.videoOverrides[username] = {};
    store.videoOverrides[username][videoId] = rpm;
  }
  await saveStore(store, effectiveUserId);
}

export interface ChannelTracking {
  categories: string[];
  myScore: number | null;
  notes: string;
  tracked: boolean;
}

export async function getChannelTracking(username: string): Promise<ChannelTracking> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const row = store.channels[username];
  if (!row) throw new ChannelNotFoundError(username);
  return {
    categories: row.categories ?? [],
    myScore: row.myScore ?? null,
    notes: row.notes ?? '',
    tracked: row.tracked ?? false
  };
}

/** Updates the user's personal tracking data for a channel — categories,
 * a manual 0-10 score, free-text notes, and the explicit "track this one"
 * flag. All independent of the computed Creator Score, which is why they
 * live here rather than in scoring.ts. */
export async function updateChannelTracking(username: string, updates: Partial<ChannelTracking>): Promise<ChannelTracking> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const existing = store.channels[username];
  if (!existing) throw new ChannelNotFoundError(username);

  if (updates.categories !== undefined) existing.categories = updates.categories;
  if (updates.myScore !== undefined) {
    if (updates.myScore !== null && (!Number.isFinite(updates.myScore) || updates.myScore < 0 || updates.myScore > 10)) {
      throw new Error('My Score must be between 0 and 10.');
    }
    existing.myScore = updates.myScore;
  }
  if (updates.notes !== undefined) existing.notes = updates.notes;
  if (updates.tracked !== undefined) existing.tracked = updates.tracked;
  await saveStore(store, effectiveUserId);

  return {
    categories: existing.categories ?? [],
    myScore: existing.myScore ?? null,
    notes: existing.notes ?? '',
    tracked: existing.tracked ?? false
  };
}

export interface TrackedAccount {
  username: string;
  displayName: string;
  avatarUrl: string;
  niche: string;
  language: string;
  rpm: number;
  lastViewedAt: string;
  lastSyncedAt?: string;
  firstSyncedAt?: string;
  categories: string[];
  myScore: number | null;
  notes: string;
  tracked: boolean;
}

function toTrackedAccount(r: ChannelRow): TrackedAccount {
  return {
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    niche: r.niche,
    language: r.language,
    rpm: r.rpm,
    lastViewedAt: r.lastViewedAt,
    lastSyncedAt: r.lastSyncedAt,
    firstSyncedAt: r.firstSyncedAt,
    categories: r.categories ?? [],
    myScore: r.myScore ?? null,
    notes: r.notes ?? '',
    tracked: r.tracked ?? false
  };
}

export async function listTrackedAccounts(): Promise<TrackedAccount[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  return Object.values(store.channels)
    .map(toTrackedAccount)
    .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime());
}

/** Admin-only: lists a SPECIFIC other user's channels, for the Admin
 * "view data" page. kv_channels' RLS policy lets an admin's own session
 * read any row, so this just adds an explicit user_id filter to see one
 * user's rows in isolation instead of everyone's mixed together. Returns
 * an empty list rather than throwing if the caller isn't actually an
 * admin — RLS still means a non-admin's query for someone else's user_id
 * simply comes back empty, since the "select own or admin" policy won't
 * match. */
export async function listChannelsForUser(userId: string): Promise<TrackedAccount[]> {
  const supabase = await createClient();
  const { data, error } = (await supabase.from('kv_channels').select('data').eq('user_id', userId)) as {
    data: { data: ChannelRow }[] | null;
    error: { message: string } | null;
  };
  if (error) throw error;

  return (data ?? [])
    .map((row) => toTrackedAccount(row.data))
    .sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime());
}
