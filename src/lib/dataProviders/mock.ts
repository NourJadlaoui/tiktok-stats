import { TikTokProfile, TikTokVideo, NicheProfile } from '@/lib/types';
import { DataProvider, FetchResult, ChannelNotFoundError } from './types';
import { computeProfileScore } from '@/lib/scoring';

// --- deterministic PRNG seeded from the username, so the same handle always
// produces the same "channel" (stable demo data across reloads). ---
function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Niche {
  key: string;
  label: string;
  hashtags: string[];
  titleWords: string[];
  titleTemplates: string[];
}

const NICHES: Niche[] = [
  {
    key: 'comedy',
    label: 'Comedy & Sketches',
    hashtags: ['funny', 'comedy', 'skit', 'lol', 'relatable', 'fyp', 'viral', 'humor'],
    titleWords: ['when', 'pov', 'bro', 'literally', 'nobody', 'me', 'my', 'friends', 'family', 'work'],
    titleTemplates: [
      'POV: {word} {word}',
      'When your {word} says {word}',
      'Nobody: ... Me: {word}',
      'This is why I {word}',
      'Tell me you {word} without telling me'
    ]
  },
  {
    key: 'beauty',
    label: 'Beauty & Skincare',
    hashtags: ['skincare', 'makeup', 'grwm', 'beautytips', 'glowup', 'fyp', 'skincareroutine', 'makeuptutorial'],
    titleWords: ['glow', 'routine', 'skin', 'makeup', 'affordable', 'drugstore', 'tutorial', 'tips', 'night', 'morning'],
    titleTemplates: [
      'My {word} {word} routine',
      '{word} tips that actually work',
      'GRWM: {word} edition',
      'Affordable {word} dupes',
      'Get that {word} glow'
    ]
  },
  {
    key: 'gaming',
    label: 'Gaming',
    hashtags: ['gaming', 'gamer', 'fyp', 'gameplay', 'twitch', 'esports', 'gamingclips', 'letsplay'],
    titleWords: ['clutch', 'insane', 'noob', 'win', 'fail', 'ranked', 'update', 'build', 'boss', 'speedrun'],
    titleTemplates: [
      'Insane {word} {word} clip',
      'This {word} build is broken',
      'Ranked {word} highlights',
      'When you {word} at the last second',
      'New update {word} is here'
    ]
  },
  {
    key: 'finance',
    label: 'Finance & Investing',
    hashtags: ['money', 'investing', 'personalfinance', 'fyp', 'sidehustle', 'financetips', 'stockmarket', 'budgeting'],
    titleWords: ['save', 'invest', 'budget', 'stocks', 'passive', 'income', 'debt', 'money', 'rich', 'credit'],
    titleTemplates: [
      'How to {word} your {word}',
      '{word} mistakes that keep you broke',
      '3 ways to build {word} income',
      'Stop doing this with your {word}',
      'What nobody tells you about {word}'
    ]
  },
  {
    key: 'fitness',
    label: 'Fitness & Health',
    hashtags: ['fitness', 'gymtok', 'workout', 'fyp', 'fitnessmotivation', 'homeworkout', 'gains', 'healthylifestyle'],
    titleWords: ['workout', 'gains', 'abs', 'legday', 'protein', 'cardio', 'form', 'routine', 'motivation', 'progress'],
    titleTemplates: [
      '5 minute {word} workout',
      'Fix your {word} form',
      'My {word} progress after 90 days',
      'Do this for better {word}',
      'The only {word} exercises you need'
    ]
  },
  {
    key: 'food',
    label: 'Food & Cooking',
    hashtags: ['foodtok', 'recipe', 'cooking', 'fyp', 'easyrecipe', 'foodie', 'homecooking', 'mealprep'],
    titleWords: ['recipe', 'easy', 'quick', 'dinner', 'dessert', 'meal', 'prep', 'homemade', 'spicy', 'comfort'],
    titleTemplates: [
      'Easy {word} recipe in 10 minutes',
      'You need to try this {word}',
      '{word} meal prep for the week',
      'The best {word} I ever made',
      'Quick {word} hack'
    ]
  },
  {
    key: 'tech',
    label: 'Tech & Gadgets',
    hashtags: ['tech', 'gadgets', 'fyp', 'techreview', 'coding', 'ai', 'productivity', 'techtok'],
    titleWords: ['review', 'unboxing', 'setup', 'app', 'hack', 'ai', 'gadget', 'productivity', 'tips', 'new'],
    titleTemplates: [
      '{word} you need in 2026',
      'Is this {word} worth it?',
      'My {word} setup tour',
      'This {word} hack saved me hours',
      'Testing the new {word}'
    ]
  },
  {
    key: 'education',
    label: 'Education & Facts',
    hashtags: ['learnontiktok', 'facts', 'education', 'fyp', 'didyouknow', 'studytips', 'history', 'science'],
    titleWords: ['fact', 'history', 'science', 'study', 'explained', 'why', 'how', 'did', 'know', 'lesson'],
    titleTemplates: [
      'Did you know this {word} fact?',
      '{word} explained in 60 seconds',
      'The {word} history you never learned',
      'Study tip: {word}',
      'Why does {word} happen?'
    ]
  }
];

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Indonesian'];

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickMany<T>(rand: () => number, arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function buildTitle(rand: () => number, niche: Niche): string {
  const template = pick(rand, niche.titleTemplates);
  const title = template.replace(/\{word\}/g, () => pick(rand, niche.titleWords));
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function generateMockChannel(usernameRaw: string): FetchResult {
  const username = usernameRaw.trim().toLowerCase().replace(/^@/, '');
  if (!username || !/^[a-z0-9._]{2,32}$/.test(username)) {
    throw new ChannelNotFoundError(usernameRaw);
  }

  const seed = hashString(username);
  const rand = mulberry32(seed);

  const niche = pick(rand, NICHES);
  const language = pick(rand, LANGUAGES);

  const now = new Date();
  const monthsActive = randInt(rand, 8, 42); // channel age
  const createdAt = new Date(now.getFullYear(), now.getMonth() - monthsActive, randInt(rand, 1, 28));

  // channel "size tier" drives followers/views scale
  const tier = rand();
  const tierMultiplier = tier < 0.5 ? 1 : tier < 0.8 ? 4 : tier < 0.95 ? 15 : 40;

  const videos: TikTokVideo[] = [];
  let videoCounter = 0;
  let cumulativeViews = 0;

  for (let m = 0; m <= monthsActive; m++) {
    const monthDate = new Date(createdAt.getFullYear(), createdAt.getMonth() + m, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // growth curve: fewer videos early on, ramps up, occasional quiet months
    const progress = m / Math.max(monthsActive, 1);
    const baseRate = 4 + progress * 14;
    const isQuietMonth = rand() < 0.08;
    const isBurstMonth = rand() < 0.06;
    let postsThisMonth = Math.round(baseRate * (0.6 + rand() * 0.8));
    if (isQuietMonth) postsThisMonth = randInt(rand, 0, 2);
    if (isBurstMonth) postsThisMonth = Math.round(postsThisMonth * 1.8);

    // don't generate future months
    if (monthDate > now) break;
    const maxDay = monthDate.getFullYear() === now.getFullYear() && monthDate.getMonth() === now.getMonth()
      ? now.getDate()
      : daysInMonth(year, month + 1);

    for (let p = 0; p < postsThisMonth; p++) {
      const day = Math.min(randInt(rand, 1, Math.max(maxDay, 1)), maxDay);
      const hour = randInt(rand, 6, 23);
      const minute = randInt(rand, 0, 59);
      const createdDate = new Date(year, month, day, hour, minute);
      if (createdDate > now || createdDate < createdAt) continue;

      videoCounter++;
      const viralityRoll = rand();
      const baseViews = 800 * tierMultiplier * (0.5 + progress);
      let views = Math.round(baseViews * (0.3 + rand() * 1.4));
      if (viralityRoll > 0.97) views = Math.round(views * randInt(rand, 15, 60)); // viral hit
      else if (viralityRoll > 0.85) views = Math.round(views * randInt(rand, 3, 8));

      const likeRatio = 0.04 + rand() * 0.09;
      const commentRatio = 0.002 + rand() * 0.006;
      const shareRatio = 0.003 + rand() * 0.01;
      const saveRatio = 0.004 + rand() * 0.012;

      const hashtags = pickMany(rand, niche.hashtags, randInt(rand, 2, 5));
      const id = `${username}_${createdDate.getTime()}_${videoCounter}`;

      videos.push({
        id,
        channelUsername: username,
        description: `${buildTitle(rand, niche)} ${hashtags.map((h) => `#${h}`).join(' ')}`,
        createdAt: createdDate.toISOString(),
        views,
        likes: Math.round(views * likeRatio),
        comments: Math.round(views * commentRatio),
        shares: Math.round(views * shareRatio),
        saves: Math.round(views * saveRatio),
        durationSeconds: randInt(rand, 8, 180),
        hashtags,
        thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/400/700`,
        videoUrl: `https://www.tiktok.com/@${username}/video/${7000000000000000000n + BigInt(videoCounter)}`
      });

      cumulativeViews += views;
    }
  }

  videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const followers = Math.round((cumulativeViews / 55) * (0.8 + rand() * 0.6));
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);

  const displayNameWords = ['The', pick(rand, niche.titleWords), niche.label.split(' ')[0]];
  const displayName = `${username.charAt(0).toUpperCase()}${username.slice(1)}`;

  const profile: TikTokProfile = {
    username,
    displayName,
    avatarUrl: `https://i.pravatar.cc/300?u=${encodeURIComponent(username)}`,
    bio: `${niche.label} creator ${pick(rand, ['✨', '🔥', '🎬', '💡', '🚀'])} | ${pick(rand, ['New videos daily', 'Posting weekly', 'DM for collabs', 'Business inquiries below'])}`,
    verified: followers > 500_000 && rand() > 0.4,
    followers,
    following: randInt(rand, 20, 900),
    totalLikes,
    videoCount: videos.length
  };

  return { profile, videos, provider: 'mock', videosComplete: true };
}

export const mockProvider: DataProvider = {
  name: 'mock',
  async fetchChannel(username: string, maxVideosOverride?: number) {
    // simulate network latency for a realistic loading state
    await new Promise((r) => setTimeout(r, 250));
    const result = generateMockChannel(username);
    if (maxVideosOverride && result.videos.length > maxVideosOverride) {
      return { ...result, videos: result.videos.slice(0, maxVideosOverride), videosComplete: false };
    }
    return result;
  }
};

/** Deterministic demo data for Niche Stats — same search term always
 * returns the same set of "profiles", for a stable offline demo. */
export function generateMockNicheSearch(
  termRaw: string,
  maxVideos: number
): { profiles: NicheProfile[]; allVideos: TikTokVideo[]; videosScanned: number; isPartial: boolean } {
  const term = termRaw.trim().toLowerCase();
  const seed = hashString(term || 'niche');
  const rand = mulberry32(seed);
  const niche = pick(rand, NICHES);

  const profileCount = randInt(rand, 8, 18);
  const profiles: NicheProfile[] = [];
  const allVideos: TikTokVideo[] = [];

  for (let i = 0; i < profileCount; i++) {
    const username = `${niche.key}_${term.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'creator'}${i}`;
    const tier = rand();
    const followers = Math.round(tier < 0.6 ? randInt(rand, 2_000, 80_000) : tier < 0.9 ? randInt(rand, 80_000, 900_000) : randInt(rand, 900_000, 6_000_000));
    const videoCount = randInt(rand, 1, 12);

    const videos: TikTokVideo[] = Array.from({ length: videoCount }, (_, j) => {
      const avgViews = Math.round(followers * (0.15 + rand() * 0.6));
      const views = Math.round(avgViews * (0.5 + rand()));
      const daysAgo = randInt(rand, 0, 120);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const id = `${username}_${j}_${seed}`;
      const hashtags = pickMany(rand, niche.hashtags, randInt(rand, 2, 5));
      const allTags = [term.replace(/\s+/g, ''), ...hashtags].filter(Boolean);
      return {
        id,
        channelUsername: username,
        description: `${buildTitle(rand, niche)} ${allTags.map((h) => `#${h}`).join(' ')}`,
        createdAt,
        views,
        likes: Math.round(views * (0.04 + rand() * 0.08)),
        comments: Math.round(views * 0.003),
        shares: Math.round(views * 0.004),
        saves: Math.round(views * 0.005),
        durationSeconds: randInt(rand, 8, 180),
        hashtags: allTags,
        thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(id)}/400/700`,
        videoUrl: `https://www.tiktok.com/@${username}/video/${id}`
      };
    });

    allVideos.push(...videos);
    const sorted = [...videos].sort((a, b) => b.views - a.views);
    const totalViewsFound = videos.reduce((s, v) => s + v.views, 0);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentVideosFound = videos.filter((v) => new Date(v.createdAt).getTime() >= thirtyDaysAgo).length;
    const top = sorted[0];

    profiles.push({
      username,
      displayName: `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
      avatarUrl: `https://i.pravatar.cc/300?u=${encodeURIComponent(username)}`,
      verified: followers > 500_000 && rand() > 0.5,
      followers,
      totalLikes: Math.round(followers * randInt(rand, 5, 40)),
      videoCountOnProfile: randInt(rand, 20, 800),
      videosFoundInSearch: videos.length,
      totalViewsFound,
      avgViewsFound: videos.length ? Math.round(totalViewsFound / videos.length) : 0,
      recentVideosFound,
      topVideoViews: top?.views ?? 0,
      topVideoUrl: top?.videoUrl ?? '',
      sampleVideos: sorted.slice(0, 10),
      score: computeProfileScore(followers, videos)
    });
  }

  return {
    profiles,
    allVideos,
    videosScanned: Math.min(maxVideos, allVideos.length),
    isPartial: false
  };
}

export { NICHES };
