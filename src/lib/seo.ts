import { TikTokVideo } from './types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
  'this', 'that', 'these', 'those', 'my', 'your', 'their', 'our', 'i', 'you', 'we',
  'it', 'its', 'not', 'no', 'so', 'do', 'does', 'did', 'if', 'when', 'what', 'why',
  'how', 'me', 'my', 'us', 'them', 'he', 'she', 'they', 'just', 'like', 'get', 'got'
]);

function cleanTitle(description: string): string {
  return description.replace(/#[\p{L}0-9_]+/gu, '').trim();
}

export interface WordFrequency {
  word: string;
  count: number;
}

export function getTopWords(videos: TikTokVideo[], limit = 25): WordFrequency[] {
  const counts = new Map<string, number>();
  for (const v of videos) {
    const title = cleanTitle(v.description).toLowerCase();
    const words = title.match(/[\p{L}0-9']+/gu) || [];
    for (const w of words) {
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface HashtagStat {
  hashtag: string;
  count: number;
  totalViews: number;
  avgViews: number;
}

export function getHashtagStats(videos: TikTokVideo[]): HashtagStat[] {
  const map = new Map<string, { count: number; totalViews: number }>();
  for (const v of videos) {
    for (const h of v.hashtags) {
      const tag = h.toLowerCase();
      const entry = map.get(tag) || { count: 0, totalViews: 0 };
      entry.count++;
      entry.totalViews += v.views;
      map.set(tag, entry);
    }
  }
  return [...map.entries()]
    .map(([hashtag, { count, totalViews }]) => ({
      hashtag,
      count,
      totalViews,
      avgViews: Math.round(totalViews / count)
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTopHashtagsByUsage(videos: TikTokVideo[], limit = 20): HashtagStat[] {
  return getHashtagStats(videos).slice(0, limit);
}

export function getTopHashtagsByPerformance(videos: TikTokVideo[], minUsage = 2, limit = 15): HashtagStat[] {
  return getHashtagStats(videos)
    .filter((h) => h.count >= minUsage)
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, limit);
}

export interface TitleLengthBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  avgViews: number;
}

export function getTitleLengthPerformance(videos: TikTokVideo[]): TitleLengthBucket[] {
  const ranges: [string, number, number][] = [
    ['Short (<40 chars)', 0, 40],
    ['Medium (40-80)', 40, 80],
    ['Long (80-120)', 80, 120],
    ['Very long (120+)', 120, Infinity]
  ];
  return ranges.map(([label, min, max]) => {
    const matching = videos.filter((v) => {
      const len = cleanTitle(v.description).length;
      return len >= min && len < max;
    });
    const avgViews = matching.length
      ? Math.round(matching.reduce((s, v) => s + v.views, 0) / matching.length)
      : 0;
    return { label, min, max, count: matching.length, avgViews };
  });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface PostingTimeCell {
  weekday: string;
  weekdayIndex: number;
  hour: number;
  count: number;
  avgViews: number;
}

export function getPostingTimeHeatmap(videos: TikTokVideo[]): PostingTimeCell[] {
  const map = new Map<string, { count: number; totalViews: number }>();
  for (const v of videos) {
    const d = new Date(v.createdAt);
    const key = `${d.getDay()}-${d.getHours()}`;
    const entry = map.get(key) || { count: 0, totalViews: 0 };
    entry.count++;
    entry.totalViews += v.views;
    map.set(key, entry);
  }

  const cells: PostingTimeCell[] = [];
  for (let wd = 0; wd < 7; wd++) {
    for (let h = 0; h < 24; h++) {
      const entry = map.get(`${wd}-${h}`);
      cells.push({
        weekday: WEEKDAYS[wd],
        weekdayIndex: wd,
        hour: h,
        count: entry?.count ?? 0,
        avgViews: entry ? Math.round(entry.totalViews / entry.count) : 0
      });
    }
  }
  return cells;
}

export function getBestPostingSlot(videos: TikTokVideo[]): { weekday: string; hour: number; avgViews: number } | null {
  const cells = getPostingTimeHeatmap(videos).filter((c) => c.count >= 1);
  if (cells.length === 0) return null;
  const best = cells.reduce((a, b) => (b.avgViews > a.avgViews ? b : a));
  return { weekday: best.weekday, hour: best.hour, avgViews: best.avgViews };
}
