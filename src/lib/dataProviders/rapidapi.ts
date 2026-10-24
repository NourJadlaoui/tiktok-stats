import { TikTokProfile, TikTokVideo } from '@/lib/types';
import { getConfig } from '@/lib/config';
import { setProgress } from '@/lib/scrapeProgress';
import { DataProvider, ChannelNotFoundError } from './types';

/**
 * Implementation targets the "TikTok Scraper" family of APIs on RapidAPI
 * (e.g. tiktok-scraper7 by yi005), which is the most common/affordable
 * option. If you subscribe to a different provider, only this file needs
 * to change — adjust the endpoint paths and field mapping below to match
 * that provider's response shape.
 */

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}0-9_]+/gu) || [];
  return matches.map((h) => h.slice(1).toLowerCase());
}

async function rapidApiFetch(pathAndQuery: string) {
  const { rapidApi } = getConfig();
  const res = await fetch(`https://${rapidApi.host}${pathAndQuery}`, {
    headers: {
      'X-RapidAPI-Key': rapidApi.key,
      'X-RapidAPI-Host': rapidApi.host
    },
    // TikTok data changes often; avoid Next.js's default fetch cache.
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`RapidAPI request failed (${res.status}): ${pathAndQuery}`);
  }
  return res.json();
}

export const rapidApiProvider: DataProvider = {
  name: 'rapidapi',
  async fetchChannel(usernameRaw: string, maxVideosOverride?: number) {
    const username = usernameRaw.trim().toLowerCase().replace(/^@/, '');
    const { maxVideosToFetch: configMax } = getConfig();
    // Respecting a smaller plan-driven cap here (not just after the fact)
    // is what actually saves paid RapidAPI requests — stopping pagination
    // early instead of fetching the server's full configured max and
    // discarding the extra afterward.
    const maxVideosToFetch = maxVideosOverride ? Math.min(configMax, maxVideosOverride) : configMax;

    setProgress(username, { status: 'starting', fetched: 0, total: 0 });

    try {
      const userInfo = await rapidApiFetch(`/user/info?unique_id=${encodeURIComponent(username)}`);
      const userData = userInfo?.data?.user;
      const stats = userInfo?.data?.stats;
      if (!userData) {
        throw new ChannelNotFoundError(username);
      }

      const profile: TikTokProfile = {
        username,
        displayName: userData.nickname || username,
        avatarUrl: userData.avatarLarger || userData.avatarMedium || userData.avatarThumb || '',
        bio: userData.signature || '',
        verified: !!userData.verified,
        followers: Number(stats?.followerCount ?? 0),
        following: Number(stats?.followingCount ?? 0),
        totalLikes: Number(stats?.heartCount ?? stats?.heart ?? 0),
        videoCount: Number(stats?.videoCount ?? 0)
      };

      // RapidAPI requests are billed per call — cap pagination at what the
      // app is actually configured to use (maxVideosToFetch, same limit the
      // built-in scraper respects) instead of an arbitrary high page count,
      // and stop as soon as the profile's own reported video count is
      // reached so a small channel never pages past its real total.
      const total = Math.min(profile.videoCount || maxVideosToFetch, maxVideosToFetch);
      setProgress(username, { status: 'scraping', fetched: 0, total });

      const videos: TikTokVideo[] = [];
      let cursor = 0;
      let hasMore = true;

      while (hasMore && videos.length < maxVideosToFetch && (profile.videoCount === 0 || videos.length < profile.videoCount)) {
        const page = await rapidApiFetch(
          `/user/posts?unique_id=${encodeURIComponent(username)}&count=35&cursor=${cursor}`
        );
        const items = page?.data?.videos || page?.data?.itemList || [];

        for (const item of items) {
          const desc: string = item.title || item.desc || '';
          // Some RapidAPI "TikTok Scraper" responses nest per-video stats
          // under `stats`/`statistics`; others put play_count/digg_count/etc
          // directly on the item itself. Falling back to the item means
          // either shape works instead of every stat silently reading as 0
          // when the API doesn't nest them.
          const rawStats = item.stats || item.statistics || item;
          const id = String(item.video_id || item.id || `${username}_${item.createTime}`);
          videos.push({
            id,
            channelUsername: username,
            description: desc,
            createdAt: new Date(Number(item.create_time || item.createTime || 0) * 1000).toISOString(),
            views: Number(rawStats.playCount ?? rawStats.play_count ?? 0),
            likes: Number(rawStats.diggCount ?? rawStats.digg_count ?? 0),
            comments: Number(rawStats.commentCount ?? rawStats.comment_count ?? 0),
            shares: Number(rawStats.shareCount ?? rawStats.share_count ?? 0),
            saves: Number(rawStats.collectCount ?? rawStats.collect_count ?? 0),
            durationSeconds: Number(item.video?.duration ?? item.duration ?? 0),
            hashtags: extractHashtags(desc),
            thumbnailUrl: item.video?.cover || item.cover || item.origin_cover || '',
            videoUrl: `https://www.tiktok.com/@${username}/video/${id}`
          });
        }

        setProgress(username, { status: 'scraping', fetched: videos.length, total: Math.max(total, videos.length) });

        hasMore = Boolean(page?.data?.hasMore ?? page?.hasMore) && items.length > 0;
        cursor = Number(page?.data?.cursor ?? cursor + items.length);
        if (items.length === 0) hasMore = false;
      }

      const videosComplete = !hasMore && (profile.videoCount === 0 || videos.length >= profile.videoCount);

      setProgress(username, { status: 'done', fetched: videos.length, total: videos.length });
      return { profile, videos, provider: 'rapidapi' as const, videosComplete };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setProgress(username, { status: 'error', message });
      throw err;
    }
  }
};
