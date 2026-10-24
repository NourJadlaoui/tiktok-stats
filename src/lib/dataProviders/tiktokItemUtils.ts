import { TikTokVideo } from '@/lib/types';

// Shared helpers for mapping TikTok's raw "item" JSON (used both by a
// profile's video list and by search results) into our own shapes.

export function extractHashtagsFromItem(item: any): string[] {
  const fromExtra: string[] = (item.textExtra || [])
    .map((t: any) => t.hashtagName)
    .filter((h: unknown): h is string => Boolean(h));
  const set = new Set(fromExtra.map((h) => h.toLowerCase()));
  if (set.size === 0) {
    const desc: string = item.desc || '';
    for (const m of desc.match(/#[\p{L}0-9_]+/gu) || []) set.add(m.slice(1).toLowerCase());
  }
  return [...set];
}

export function itemStats(item: any): Record<string, unknown> {
  return item.stats || item.statsV2 || {};
}

export function itemCreatedAtMs(item: any): number {
  return Number(item.createTime) * 1000;
}

export function itemThumbnail(item: any): string {
  return item.video?.cover || item.video?.dynamicCover || item.video?.originCover || '';
}

export function itemDurationSeconds(item: any): number {
  return Number(item.video?.duration ?? 0);
}

/** Maps a raw TikTok "item" to our TikTokVideo shape. `username` is the
 * item's own author for search results, or the profile being scraped for a
 * profile's video list — both cases share this exact mapping. */
export function mapItemToTikTokVideo(item: any, username: string): TikTokVideo {
  const stats = itemStats(item);
  const id = String(item.id);
  return {
    id,
    channelUsername: username,
    description: item.desc || '',
    createdAt: new Date(itemCreatedAtMs(item)).toISOString(),
    views: Number(stats.playCount ?? 0),
    likes: Number(stats.diggCount ?? 0),
    comments: Number(stats.commentCount ?? 0),
    shares: Number(stats.shareCount ?? 0),
    saves: Number(stats.collectCount ?? 0),
    durationSeconds: itemDurationSeconds(item),
    hashtags: extractHashtagsFromItem(item),
    thumbnailUrl: itemThumbnail(item),
    videoUrl: `https://www.tiktok.com/@${username}/video/${id}`
  };
}
