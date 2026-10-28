import { getStore, saveStore } from './db';
import { getConfig } from './config';
import { appendNicheHistory } from './history';
import { requireEffectiveUser } from './auth';
import { enforceRequestLimit } from './plans';
import { logUsageEvent } from './usage';
import { searchTikTokByKeyword } from './dataProviders/tiktokSearch';
import { generateMockNicheSearch } from './dataProviders/mock';
import { computeNicheScore } from './scoring';
import { getTopWords, getTopHashtagsByUsage, getBestPostingSlot } from './seo';
import { NicheSearchResult, DataProviderName } from './types';

const TOP_VIDEOS_LIMIT = 15;

export async function getNicheSearchResult(
  termRaw: string,
  maxVideos: number,
  forceRefresh = false,
  eventType: 'niche_search' | 'niche_finder_term' = 'niche_search'
): Promise<NicheSearchResult> {
  const { effectiveUserId } = await requireEffectiveUser();
  const term = termRaw.trim();
  const key = term.toLowerCase();
  const store = await getStore(effectiveUserId);

  const cached = store.nicheSearchCache[key];
  // Read off the already-loaded store rather than settings.ts's
  // getSyncIntervalHours() helper — see the equivalent comment in
  // channel.ts's getChannelData for why calling that here (an independent
  // getStore() fetch) would be wasteful/risky now that getStore() isn't a
  // shared process-wide cache.
  const syncIntervalHours = store.settings.syncIntervalHours || 24;
  const syncIntervalMs = syncIntervalHours * 60 * 60 * 1000;
  const isStale = !cached || Date.now() - new Date(cached.fetchedAt).getTime() >= syncIntervalMs;

  if (cached && !forceRefresh && !isStale) {
    return cached;
  }

  // A real scan is about to happen — check the plan's request allowance
  // before spending it (a cache hit above never reaches here). Niche Finder
  // calls this with eventType 'niche_finder_term' so its per-term scans are
  // tracked/limited separately from direct Niche Stats searches.
  await enforceRequestLimit(effectiveUserId, [eventType]);

  const { dataProvider } = getConfig();
  const isMock = dataProvider === 'mock';

  const { profiles, allVideos, videosScanned, isPartial } = isMock
    ? await Promise.resolve(generateMockNicheSearch(term, maxVideos))
    : await searchTikTokByKeyword(term, effectiveUserId, maxVideos);

  const provider: DataProviderName = isMock ? 'mock' : 'tiktok';

  const score = computeNicheScore(profiles, allVideos);
  const bestSlot = getBestPostingSlot(allVideos);

  const result: NicheSearchResult = {
    term,
    profiles: profiles.sort((a, b) => b.followers - a.followers),
    videosScanned,
    profilesFound: profiles.length,
    fetchedAt: new Date().toISOString(),
    provider,
    isPartial,
    score,
    topHashtags: getTopHashtagsByUsage(allVideos, 20).map((h) => ({
      label: h.hashtag,
      count: h.count,
      avgViews: h.avgViews
    })),
    topWords: getTopWords(allVideos, 30).map((w) => ({ label: w.word, count: w.count })),
    bestPostingSlot: bestSlot,
    topVideos: [...allVideos].sort((a, b) => b.views - a.views).slice(0, TOP_VIDEOS_LIMIT)
  };

  store.nicheSearchCache[key] = result;
  await saveStore(store, effectiveUserId);
  await logUsageEvent(effectiveUserId, eventType, term);

  await appendNicheHistory(key, {
    capturedAt: result.fetchedAt,
    scoreOverall: score.overall,
    profilesFound: result.profilesFound,
    videosScanned: result.videosScanned,
    data: { grade: score.grade }
  });

  return result;
}

export interface NicheHistoryEntry {
  term: string;
  profilesFound: number;
  videosScanned: number;
  overallScore: number;
  grade: string;
  fetchedAt: string;
}

export async function listNicheSearchHistory(): Promise<NicheHistoryEntry[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  return Object.values(store.nicheSearchCache)
    .map((r) => ({
      term: r.term,
      profilesFound: r.profilesFound,
      videosScanned: r.videosScanned,
      overallScore: r.score.overall,
      grade: r.score.grade,
      fetchedAt: r.fetchedAt
    }))
    .sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
}
