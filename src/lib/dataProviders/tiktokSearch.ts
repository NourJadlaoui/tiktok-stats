import type { BrowserContext, Page } from 'playwright';
import { NicheProfile, TikTokVideo } from '@/lib/types';
import { getConfig } from '@/lib/config';
import { setProgress } from '@/lib/scrapeProgress';
import { getBrowser, newStealthContext, dismissCookieBanner, scrollToCollect, saveSessionState, hasNoMoreResultsBanner } from './browserUtils';
import { itemStats, mapItemToTikTokVideo } from './tiktokItemUtils';
import { computeProfileScore } from '@/lib/scoring';
import { ScrapeBlockedError } from './types';

/**
 * Searches TikTok for a keyword/niche term and groups the resulting videos
 * by author profile — same headless-browser technique as the per-channel
 * scraper (tiktokWeb.ts), just pointed at TikTok's search results page
 * instead of a profile page.
 *
 * The exact response shape of TikTok's search API is less thoroughly
 * verified than the profile item_list endpoint (this repo couldn't be
 * tested against live tiktok.com — see README). Parsing here is
 * deliberately defensive (multiple fallback field names) and logs raw
 * responses under TIKTOK_SCRAPE_DEBUG=1 to make it easy to adjust if
 * TikTok's real shape differs.
 */

const SAMPLE_VIDEOS_PER_PROFILE = 10;

export function nicheProgressKey(term: string): string {
  return `niche:${term.trim().toLowerCase()}`;
}

export async function searchTikTokByKeyword(
  termRaw: string,
  maxVideos: number
): Promise<{ profiles: NicheProfile[]; allVideos: TikTokVideo[]; videosScanned: number; isPartial: boolean }> {
  const term = termRaw.trim();
  if (!term) throw new ScrapeBlockedError('Search term is empty.');

  const { scrapeDebug } = getConfig();
  const log = (...args: unknown[]) => {
    if (scrapeDebug) console.log(`[tiktok-search:${term}]`, ...args);
  };
  const progressKey = nicheProgressKey(term);
  setProgress(progressKey, { status: 'starting', fetched: 0, total: maxVideos });

  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    await getBrowser();
    context = await newStealthContext();
    page = await context.newPage();

    const items = new Map<string, any>();
    let sawAnyResponse = false;
    let hasMore = true;
    let stalls = 0;
    let reachedEndMarker = false;

    page.on('response', async (response) => {
      const url = response.url();
      if (scrapeDebug && url.includes('tiktok.com/api/')) log(response.status(), url.replace(/\?.*/, ''));
      if (!/\/api\/search\/(item|general)\/full/.test(url)) return;
      sawAnyResponse = true;
      try {
        const json = await response.json();
        const list = json.item_list || json.data || [];
        for (const entry of list) {
          const item = entry?.item ?? entry;
          if (item?.id) items.set(String(item.id), item);
        }
        if (json.has_more === false || json.hasMore === false) hasMore = false;
      } catch {
        // ignore non-JSON / aborted responses
      }
    });

    await page.goto(`https://www.tiktok.com/search/video?q=${encodeURIComponent(term)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    if (await dismissCookieBanner(page)) log('dismissed cookie-consent banner');

    setProgress(progressKey, { status: 'scraping', fetched: 0, total: maxVideos });
    await page.waitForTimeout(1200 + Math.random() * 800);

    await scrollToCollect(page, {
      getCount: () => items.size,
      maxCount: maxVideos,
      hasMore: () => hasMore,
      onProgress: (count) => {
        setProgress(progressKey, { status: 'scraping', fetched: count, total: maxVideos });
        log(`scrolled: ${count} / ${maxVideos} videos scanned so far`);
      },
      onStall: (rounds) => {
        stalls = rounds;
      },
      // TikTok renders its own "No more results" marker at the true end of a
      // search's results — when it shows up, stop right away instead of
      // waiting out the stall-round heuristic (which exists for the more
      // ambiguous case where that marker never appears, e.g. it's cut off by
      // a rate limit rather than genuinely running out of results).
      isEnd: async () => {
        const ended = await hasNoMoreResultsBanner(page!);
        if (ended) {
          hasMore = false;
          reachedEndMarker = true;
        }
        return ended;
      }
    });

    log(
      `done scrolling: ${items.size} videos scanned, sawAnyResponse=${sawAnyResponse}, finalStallCount=${stalls}, reachedEndMarker=${reachedEndMarker}`
    );

    if (!sawAnyResponse) {
      throw new ScrapeBlockedError(
        'TikTok never returned search results — it may be showing a verification wall or blocking automated search requests. A session cookie (tiktokAccount.cookie or TIKTOK_COOKIE env var) helps a lot here, same as profile scraping.'
      );
    }

    const { profiles, allVideos } = groupItemsByAuthor([...items.values()]);
    const isPartial = hasMore && items.size >= maxVideos;

    await saveSessionState(context);

    setProgress(progressKey, { status: 'done', fetched: items.size, total: maxVideos });
    return { profiles, allVideos, videosScanned: items.size, isPartial };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setProgress(progressKey, { status: 'error', message });
    if (err instanceof ScrapeBlockedError) throw err;
    throw new ScrapeBlockedError(message);
  } finally {
    await page?.close().catch(() => {});
    await context?.close().catch(() => {});
  }
}

function groupItemsByAuthor(items: any[]): { profiles: NicheProfile[]; allVideos: TikTokVideo[] } {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  interface Accum {
    username: string;
    displayName: string;
    avatarUrl: string;
    verified: boolean;
    followers: number;
    totalLikes: number;
    videoCountOnProfile: number;
    videos: TikTokVideo[];
  }

  const byAuthor = new Map<string, Accum>();
  const allVideos: TikTokVideo[] = [];

  for (const item of items) {
    const author = item.author || {};
    const authorStats = item.authorStats || {};
    const username = String(author.uniqueId || author.id || '')
      .toLowerCase()
      .trim();
    if (!username) continue;

    const video = mapItemToTikTokVideo(item, username);
    allVideos.push(video);

    let acc = byAuthor.get(username);
    if (!acc) {
      acc = {
        username,
        displayName: author.nickname || username,
        avatarUrl: author.avatarLarger || author.avatarMedium || author.avatarThumb || '',
        verified: Boolean(author.verified),
        followers: Number(authorStats.followerCount ?? 0),
        totalLikes: Number(authorStats.heartCount ?? 0),
        videoCountOnProfile: Number(authorStats.videoCount ?? 0),
        videos: []
      };
      byAuthor.set(username, acc);
    }
    acc.videos.push(video);
  }

  const profiles: NicheProfile[] = [...byAuthor.values()].map((acc) => {
    const sorted = [...acc.videos].sort((a, b) => b.views - a.views);
    const totalViewsFound = acc.videos.reduce((s, v) => s + v.views, 0);
    const recentVideosFound = acc.videos.filter((v) => new Date(v.createdAt).getTime() >= thirtyDaysAgo).length;
    const top = sorted[0];

    return {
      username: acc.username,
      displayName: acc.displayName,
      avatarUrl: acc.avatarUrl,
      verified: acc.verified,
      followers: acc.followers,
      totalLikes: acc.totalLikes,
      videoCountOnProfile: acc.videoCountOnProfile,
      videosFoundInSearch: acc.videos.length,
      totalViewsFound,
      avgViewsFound: acc.videos.length ? Math.round(totalViewsFound / acc.videos.length) : 0,
      recentVideosFound,
      topVideoViews: top?.views ?? 0,
      topVideoUrl: top?.videoUrl ?? '',
      sampleVideos: sorted.slice(0, SAMPLE_VIDEOS_PER_PROFILE),
      score: computeProfileScore(acc.followers, acc.videos)
    };
  });

  return { profiles, allVideos };
}
