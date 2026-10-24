export interface TikTokVideo {
  id: string;
  channelUsername: string;
  description: string;
  createdAt: string; // ISO timestamp
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  durationSeconds: number;
  hashtags: string[];
  thumbnailUrl: string;
  videoUrl: string;
  /** Manual per-video RPM override in USD per 1000 views, if set by the user */
  rpmOverride?: number | null;
}

export interface TikTokProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  verified: boolean;
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
}

export interface ChannelSettings {
  username: string;
  niche: string;
  language: string;
  /** USD revenue per 1000 views, used when a video has no rpmOverride */
  rpm: number;
}

export type DataProviderName = 'tiktok' | 'rapidapi' | 'mock';

export interface ChannelData {
  profile: TikTokProfile;
  videos: TikTokVideo[];
  settings: ChannelSettings;
  fetchedAt: string;
  provider: DataProviderName;
  /** False when we couldn't fetch the channel's full video history (e.g. TikTok stopped paginating without login). */
  videosComplete: boolean;
  /** Last time this channel was actually re-scraped from TikTok (not just viewed). */
  lastSyncedAt?: string;
  /** First time this channel was ever tracked — the start of its history graph. */
  firstSyncedAt?: string;
}

export interface MonthBucket {
  key: string; // "YYYY-MM"
  year: number;
  month: number; // 1-12
  label: string; // "Jan 2024"
  count: number;
  videos: TikTokVideo[];
  views: number;
  revenue: number;
}

/** 0-100 sub-scores plus a weighted overall score and a human-readable grade.
 * Used for both a full Profile Stats channel and a single Niche Stats
 * profile (computed from whatever sample of videos is available — see
 * scoring.ts for exactly how, and how each sub-score is derived). */
export interface ScoreBreakdown {
  audience: number;
  engagement: number;
  growth: number;
  consistency: number;
  monetization: number;
  overall: number;
  grade: 'Excellent' | 'Strong' | 'Average' | 'Weak' | 'New / not enough data';
}

/** 0-100 sub-scores summarizing a whole Niche Stats search — is this a good
 * niche to enter? See scoring.ts for exactly how each is derived. */
export interface NicheScoreBreakdown {
  demand: number;
  momentum: number;
  competition: number;
  engagement: number;
  overall: number;
  grade: 'Excellent opportunity' | 'Good opportunity' | 'Moderate' | 'Saturated' | 'Low demand';
}

export interface NicheProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  /** Follower count as reported alongside the search hit, if TikTok included it (0 if unknown). */
  followers: number;
  totalLikes: number;
  /** The profile's stated total video count, if TikTok included it (0 if unknown) — NOT the count found in this search sample. */
  videoCountOnProfile: number;
  videosFoundInSearch: number;
  totalViewsFound: number;
  avgViewsFound: number;
  /** How many of the videos found for this profile were posted in the last 30 days (recency/activity signal). */
  recentVideosFound: number;
  topVideoViews: number;
  topVideoUrl: string;
  /** Up to ~10 of this profile's videos found in the search (used both to preview on the card and to compute `score`). */
  sampleVideos: TikTokVideo[];
  score: ScoreBreakdown;
}

export interface NicheTagStat {
  label: string;
  count: number;
  avgViews: number;
}

export interface NicheSearchResult {
  term: string;
  profiles: NicheProfile[];
  videosScanned: number;
  profilesFound: number;
  fetchedAt: string;
  provider: DataProviderName;
  /** True if we stopped because we hit the video-scan cap, not because TikTok ran out of results. */
  isPartial: boolean;
  score: NicheScoreBreakdown;
  topHashtags: NicheTagStat[];
  topWords: { label: string; count: number }[];
  bestPostingSlot: { weekday: string; hour: number; avgViews: number } | null;
  /** Best-performing videos across the whole scan (not just per-profile samples). */
  topVideos: TikTokVideo[];
}

export type OpportunityTag = 'Hidden gem' | 'Rising' | 'Hot right now' | 'Saturated' | null;

export interface NicheFinderResult {
  term: string;
  /** Which of the run's selected languages this term was drawn from. */
  language: string;
  score: NicheScoreBreakdown;
  profilesFound: number;
  videosScanned: number;
  topProfile: { username: string; displayName: string; avatarUrl: string; followers: number } | null;
  opportunityTag: OpportunityTag;
  fetchedAt: string;
  error?: string;
}

export interface NicheFinderRun {
  id: string;
  languages: string[];
  maxVideosPerNiche: number;
  status: 'running' | 'done' | 'error';
  startedAt: string;
  finishedAt?: string;
  termsTotal: number;
  termsCompleted: number;
  currentTerm?: string;
  results: NicheFinderResult[];
  error?: string;
}

export interface OverviewStats {
  firstVideoDate: string | null;
  followers: number;
  totalVideos: number;
  fetchedVideos: number;
  isPartial: boolean;
  avgVideosPerMonth: number;
  thisMonthCount: number;
  lastMonthCount: number;
  bestMonth: { key: string; label: string; count: number } | null;
  worstMonth: { key: string; label: string; count: number } | null;
  last7DaysCount: number;
  last7DaysViews: number;
  last7DaysVideos: TikTokVideo[];
  monthlySeries: { key: string; label: string; count: number }[];
  cumulativeMonthlySeries: { key: string; label: string; videos: number; views: number }[];
}
