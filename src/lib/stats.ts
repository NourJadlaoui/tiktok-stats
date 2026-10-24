import { TikTokVideo, OverviewStats, MonthBucket } from './types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function monthKey(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}`;
}

export function monthLabel(year: number, month0: number): string {
  return `${MONTH_LABELS[month0]} ${year}`;
}

/** All calendar months from `start` to `end`, inclusive, as {year, month0} pairs. */
export function monthRange(start: Date, end: Date): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    out.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

export function buildMonthBuckets(videos: TikTokVideo[]): MonthBucket[] {
  if (videos.length === 0) return [];

  const sorted = [...videos].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const first = new Date(sorted[0].createdAt);
  const now = new Date();

  const grouped = new Map<string, TikTokVideo[]>();
  for (const v of videos) {
    const d = new Date(v.createdAt);
    const key = monthKey(d.getFullYear(), d.getMonth());
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(v);
  }

  return monthRange(first, now).map(({ year, month }) => {
    const key = monthKey(year, month);
    const monthVideos = (grouped.get(key) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return {
      key,
      year,
      month: month + 1,
      label: monthLabel(year, month),
      count: monthVideos.length,
      videos: monthVideos,
      views: monthVideos.reduce((s, v) => s + v.views, 0),
      revenue: 0
    };
  });
}

export function getOverviewStats(videos: TikTokVideo[], followers: number, trueVideoCount?: number): OverviewStats {
  const totalVideos = trueVideoCount && trueVideoCount > videos.length ? trueVideoCount : videos.length;
  const isPartial = totalVideos > videos.length;

  if (videos.length === 0) {
    return {
      firstVideoDate: null,
      followers,
      totalVideos,
      fetchedVideos: 0,
      isPartial,
      avgVideosPerMonth: 0,
      thisMonthCount: 0,
      lastMonthCount: 0,
      bestMonth: null,
      worstMonth: null,
      last7DaysCount: 0,
      last7DaysViews: 0,
      last7DaysVideos: [],
      monthlySeries: [],
      cumulativeMonthlySeries: []
    };
  }

  const sorted = [...videos].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const firstVideoDate = sorted[0].createdAt;

  const buckets = buildMonthBuckets(videos);
  const monthsCount = Math.max(buckets.length, 1);
  const avgVideosPerMonth = videos.length / monthsCount;

  const now = new Date();
  const thisKey = monthKey(now.getFullYear(), now.getMonth());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = monthKey(lastMonthDate.getFullYear(), lastMonthDate.getMonth());

  const thisMonthCount = buckets.find((b) => b.key === thisKey)?.count ?? 0;
  const lastMonthCount = buckets.find((b) => b.key === lastKey)?.count ?? 0;

  let bestMonth: OverviewStats['bestMonth'] = null;
  let worstMonth: OverviewStats['worstMonth'] = null;
  for (const b of buckets) {
    if (!bestMonth || b.count > bestMonth.count) bestMonth = { key: b.key, label: b.label, count: b.count };
    if (!worstMonth || b.count < worstMonth.count) worstMonth = { key: b.key, label: b.label, count: b.count };
  }

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last7DaysVideos = videos
    .filter((v) => new Date(v.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const monthlySeries = buckets.map((b) => ({ key: b.key, label: b.label, count: b.count }));

  let cumVideos = 0;
  let cumViews = 0;
  const cumulativeMonthlySeries = buckets.map((b) => {
    cumVideos += b.count;
    cumViews += b.views;
    return { key: b.key, label: b.label, videos: cumVideos, views: cumViews };
  });

  return {
    firstVideoDate,
    followers,
    totalVideos,
    fetchedVideos: videos.length,
    isPartial,
    avgVideosPerMonth,
    thisMonthCount,
    lastMonthCount,
    bestMonth,
    worstMonth,
    last7DaysCount: last7DaysVideos.length,
    last7DaysViews: last7DaysVideos.reduce((s, v) => s + v.views, 0),
    last7DaysVideos,
    monthlySeries,
    cumulativeMonthlySeries
  };
}

export function formatCompactNumber(n: number): string {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
