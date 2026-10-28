import type { BrowserContext, Page } from 'playwright';
import { TikTokProfile } from '@/lib/types';
import { getConfig } from '@/lib/config';
import { setProgress } from '@/lib/scrapeProgress';
import { getBrowser, newStealthContext, dismissCookieBanner, scrollToCollect, saveSessionState } from './browserUtils';
import { mapItemToTikTokVideo } from './tiktokItemUtils';
import { DataProvider, ChannelNotFoundError, ScrapeBlockedError } from './types';

/**
 * Scrapes public TikTok profile + video data using a real headless browser —
 * no API key and no TikTok login required for public accounts. This works by
 * reading the same JSON TikTok's own web app embeds in the page (profile
 * stats) and listening for the same `/api/post/item_list/` XHR calls the
 * page itself makes while scrolling (video list) — the browser signs those
 * requests itself, we just have to trigger and capture them.
 *
 * TikTok changes its site and anti-bot measures over time, and rate-limits,
 * CAPTCHAs, or silently empties responses for automated/headless traffic,
 * especially from datacenter IPs with no cookies. This is best-effort: it
 * will not always get 100% of a very large channel's history in one pass,
 * and it can occasionally get blocked outright. Set TIKTOK_SCRAPE_DEBUG=1
 * to log every TikTok API response the scraper sees (helps diagnose empty
 * results), and TIKTOK_SCRAPE_HEADLESS=false to watch the browser live.
 */

async function extractProfile(page: Page, username: string): Promise<TikTokProfile> {
  const raw = await page
    .locator('#__UNIVERSAL_DATA_FOR_REHYDRATION__')
    .textContent({ timeout: 15000 })
    .catch(() => null);

  if (!raw) {
    const notFound = await page
      .getByText(/couldn.?t find this account/i)
      .isVisible()
      .catch(() => false);
    if (notFound) throw new ChannelNotFoundError(username);
    throw new ScrapeBlockedError('TikTok did not return the expected page data (site structure may have changed, or a verification/captcha wall appeared — try TIKTOK_SCRAPE_HEADLESS=false to see what loaded).');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ScrapeBlockedError('Could not parse TikTok profile data.');
  }

  const userDetail = parsed?.__DEFAULT_SCOPE__?.['webapp.user-detail'];
  const userInfo = userDetail?.userInfo;

  if (!userInfo) {
    if (userDetail?.statusCode) throw new ChannelNotFoundError(username);
    throw new ScrapeBlockedError('TikTok profile data was empty — the account may be private, restricted, or the request was blocked.');
  }

  const user = userInfo.user || {};
  const stats = userInfo.stats || userInfo.statsV2 || {};

  return {
    username,
    displayName: user.nickname || username,
    avatarUrl: user.avatarLarger || user.avatarMedium || user.avatarThumb || '',
    bio: user.signature || '',
    verified: Boolean(user.verified),
    followers: Number(stats.followerCount ?? 0),
    following: Number(stats.followingCount ?? 0),
    totalLikes: Number(stats.heartCount ?? stats.heart ?? 0),
    videoCount: Number(stats.videoCount ?? 0)
  };
}

export const tiktokWebProvider: DataProvider = {
  name: 'tiktok',
  async fetchChannel(usernameRaw: string, ownerId: string, maxVideosOverride?: number) {
    const username = usernameRaw.trim().toLowerCase().replace(/^@/, '');
    const { maxVideosToFetch: configMax, scrapeDebug } = getConfig();
    const maxVideosToFetch = maxVideosOverride ? Math.min(configMax, maxVideosOverride) : configMax;
    const log = (...args: unknown[]) => {
      if (scrapeDebug) console.log(`[tiktok-scrape:${username}]`, ...args);
    };

    let context: BrowserContext | undefined;
    let page: Page | undefined;

    setProgress(ownerId, username, { status: 'starting', fetched: 0, total: 0 });

    try {
      await getBrowser();
      context = await newStealthContext();

      page = await context.newPage();
      const items = new Map<string, any>();
      let apiSaysHasMore = true;
      let sawAnyApiResponse = false;
      let sawEmptyVerificationResponse = false;

      page.on('response', async (response) => {
        const url = response.url();
        if (scrapeDebug && url.includes('tiktok.com/api/')) {
          log(response.status(), url.replace(/\?.*/, ''));
        }
        if (!url.includes('/api/post/item_list')) return;
        sawAnyApiResponse = true;
        try {
          const json = await response.json();
          const itemList = json.itemList || [];
          for (const item of itemList) {
            items.set(String(item.id), item);
          }
          if (json.hasMore === false) apiSaysHasMore = false;
          if (itemList.length === 0 && json.statusCode) {
            sawEmptyVerificationResponse = true;
            log('item_list responded with statusCode', json.statusCode, json.statusMsg);
          }
        } catch {
          // ignore non-JSON / aborted responses
        }
      });

      await page.goto(`https://www.tiktok.com/@${username}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Give TikTok's client-side JS time to run (anti-bot checks, token
      // generation, and the initial video-grid XHR all happen here).
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      if (await dismissCookieBanner(page)) log('dismissed cookie-consent banner');

      const profile = await extractProfile(page, username);
      log('profile OK:', profile.displayName, `${profile.followers} followers, ${profile.videoCount} videos`);
      setProgress(ownerId, username, { status: 'scraping', fetched: items.size, total: profile.videoCount });

      await page.waitForTimeout(1200 + Math.random() * 800);

      await scrollToCollect(page, {
        getCount: () => items.size,
        maxCount: maxVideosToFetch,
        hasMore: () => apiSaysHasMore,
        onProgress: (count) => {
          setProgress(ownerId, username, { status: 'scraping', fetched: count, total: Math.max(profile.videoCount, count) });
          log(`scrolled: ${count} / ~${Math.min(maxVideosToFetch, profile.videoCount || maxVideosToFetch)} videos collected so far`);
        }
      });

      log(`done scrolling: ${items.size} videos collected, sawAnyApiResponse=${sawAnyApiResponse}, sawEmptyVerificationResponse=${sawEmptyVerificationResponse}`);

      if (items.size === 0 && profile.videoCount > 0) {
        // TikTok reports videos exist but we got none — always treat this as
        // a failure (never silently return an empty list as if that were
        // normal), with the most specific reason we could observe.
        if (sawEmptyVerificationResponse) {
          throw new ScrapeBlockedError(
            'TikTok returned an empty video list with a verification/error status — it is likely showing a bot-check wall. Add a real browser session cookie (tiktokAccount.cookie in config/credentials.json, or TIKTOK_COOKIE env var) and try again, or set TIKTOK_SCRAPE_HEADLESS=false to see it live.'
          );
        }
        if (!sawAnyApiResponse) {
          throw new ScrapeBlockedError(
            'TikTok never made its usual video-list request — it likely served a CAPTCHA/verification page instead of the normal profile page. Add a real browser session cookie (tiktokAccount.cookie in config/credentials.json, or TIKTOK_COOKIE env var), or set TIKTOK_SCRAPE_HEADLESS=false and TIKTOK_SCRAPE_DEBUG=1 to see what loaded.'
          );
        }
        throw new ScrapeBlockedError(
          `TikTok reported ${profile.videoCount} videos for this profile but the video-list request(s) came back empty — most likely a missing/invalid session cookie. Add a real browser session cookie (tiktokAccount.cookie in config/credentials.json, or TIKTOK_COOKIE env var) and try again. Set scrapeDebug=true to see the raw responses.`
        );
      }

      const videos = [...items.values()]
        .map((item) => mapItemToTikTokVideo(item, username))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, maxVideosToFetch);

      const videosComplete = !apiSaysHasMore || (profile.videoCount > 0 && videos.length >= profile.videoCount);

      await saveSessionState(context);

      setProgress(ownerId, username, { status: 'done', fetched: videos.length, total: profile.videoCount });
      return { profile, videos, provider: 'tiktok' as const, videosComplete };
    } catch (err) {
      if (err instanceof ChannelNotFoundError || err instanceof ScrapeBlockedError) {
        setProgress(ownerId, username, { status: 'error', message: err.message });
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      setProgress(ownerId, username, { status: 'error', message });
      throw new ScrapeBlockedError(message);
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
    }
  }
};
