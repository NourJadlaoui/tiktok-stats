import { TikTokVideo } from './types';
import { buildMonthBuckets } from './stats';

/** TikTok's Creator Rewards Program requires videos to be at least 1 minute
 * long to be eligible for monetization — shorter videos earn $0 regardless
 * of RPM, unless a manual per-video override says otherwise. */
export const MONETIZABLE_MIN_DURATION_SECONDS = 60;

export function isMonetizable(video: TikTokVideo): boolean {
  return video.durationSeconds >= MONETIZABLE_MIN_DURATION_SECONDS;
}

export function videoRevenue(video: TikTokVideo, channelRpm: number): number {
  // An explicit manual override is always respected (e.g. a sponsored short
  // video that pays regardless of Creator Rewards eligibility). Otherwise,
  // videos under the monetizable length simply don't earn anything.
  if (video.rpmOverride != null) return (video.views / 1000) * video.rpmOverride;
  if (!isMonetizable(video)) return 0;
  return (video.views / 1000) * channelRpm;
}

export interface MonthlyRevenue {
  key: string;
  label: string;
  count: number;
  views: number;
  revenue: number;
}

export function getMonthlyRevenue(videos: TikTokVideo[], channelRpm: number): MonthlyRevenue[] {
  const buckets = buildMonthBuckets(videos);
  return buckets.map((b) => ({
    key: b.key,
    label: b.label,
    count: b.count,
    views: b.views,
    revenue: b.videos.reduce((sum, v) => sum + videoRevenue(v, channelRpm), 0)
  }));
}

export function getTotalRevenue(videos: TikTokVideo[], channelRpm: number): number {
  return videos.reduce((sum, v) => sum + videoRevenue(v, channelRpm), 0);
}

export function getRevenueThisMonth(videos: TikTokVideo[], channelRpm: number): number {
  const now = new Date();
  return videos
    .filter((v) => {
      const d = new Date(v.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, v) => sum + videoRevenue(v, channelRpm), 0);
}

export interface MonetizableStats {
  monetizableCount: number;
  nonMonetizableCount: number;
  monetizablePercentage: number;
}

export function getMonetizableStats(videos: TikTokVideo[]): MonetizableStats {
  const monetizableCount = videos.filter(isMonetizable).length;
  const nonMonetizableCount = videos.length - monetizableCount;
  const monetizablePercentage = videos.length ? Math.round((monetizableCount / videos.length) * 100) : 0;
  return { monetizableCount, nonMonetizableCount, monetizablePercentage };
}
