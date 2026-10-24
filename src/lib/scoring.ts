import { TikTokVideo, NicheProfile, ScoreBreakdown, NicheScoreBreakdown, OpportunityTag } from './types';
import { buildMonthBuckets } from './stats';
import { getMonetizableStats, getTotalRevenue, getRevenueThisMonth } from './revenue';
import { ScoringThresholds } from './settings';

export const PROFILE_SCORE_METHODOLOGY = `Creator Score combines five 0-100 sub-scores:

• Audience (25%) — follower count, log-scaled so accounts under 1M don't all read as ~zero.
• Engagement (30%) — avg (likes+comments+shares)/views. The biggest factor: it's the best proxy for "is the content good" regardless of account size.
• Growth (20%) — views in the last 30 days vs the 30 days before. Flat = 50, doubling = 100, halving = 0.
• Consistency (15%) — how steady the monthly posting cadence is.
• Monetization (10%) — share of videos ≥60s (TikTok's Creator Rewards minimum) combined with view size.

Grades: 80+ Excellent · 60+ Strong · 40+ Average · 20+ Weak · under 3 videos = not enough data.

Niche Stats scores use only the handful of videos found for that search term, so treat them as a rough, directional read — open that creator's Profile Stats for the full picture.`;

export const NICHE_SCORE_METHODOLOGY = `Niche Score answers "is this a good niche to get into?" from four 0-100 sub-scores:

• Demand (35%) — average views per video across everything scanned, log-scaled. Higher = this topic reliably gets watched.
• Momentum (25%) — % of found videos posted in the last 30 days. Higher = actively trending right now.
• Engagement (20%) — avg (likes+comments+shares)/views across the scan.
• Competition (20%, inverted) — % of total views held by the top 3 creators found. A niche dominated by a few huge accounts scores lower here (harder to break in); one with views spread across many creators scores higher.

Grades: 75+ Excellent opportunity · 55+ Good opportunity · 35+ Moderate · else Saturated (if competition is high) or Low demand.

This is based only on the videos scanned for this search (up to your chosen limit), not TikTok's full index — a useful signal, not a guarantee.`;

/**
 * ============================================================================
 * HOW SCORING WORKS
 * ============================================================================
 *
 * PROFILE SCORE (`computeProfileScore`) — 0-100, for one creator.
 * Five sub-scores, each 0-100, combined with fixed weights:
 *
 *   Audience      25%  — follower count, log-scaled (10 → ~25, 100K → ~65,
 *                        10M+ → 100). Log scale because raw follower counts
 *                        span several orders of magnitude; a linear scale
 *                        would make everyone under 1M look like zero.
 *   Engagement    30%  — average (likes + comments + shares) / views across
 *                        the available videos. 15%+ engagement scores 100;
 *                        this is the single biggest factor because it's the
 *                        best available proxy for "is the content actually
 *                        good," independent of how big the account already is.
 *   Growth        20%  — average views in the last 30 days vs the 30 days
 *                        before that. Flat = 50, doubling = 100, halving = 0.
 *                        With too little data to compare two windows, this
 *                        defaults to a neutral 50 rather than guessing.
 *   Consistency   15%  — how steady the monthly posting cadence is
 *                        (coefficient of variation of videos/month, inverted
 *                        — a channel posting a similar amount every month
 *                        scores higher than one with wild feast/famine gaps).
 *   Monetization  10%  — share of videos long enough to be monetizable
 *                        (≥60s, TikTok's Creator Rewards Program minimum)
 *                        combined with how large their view counts are.
 *
 * Grades: 80+ Excellent · 60+ Strong · 40+ Average · 20+ Weak · else
 * "New / not enough data".
 *
 * Profile Stats scores use a channel's full fetched history. Niche Stats
 * scores use only the (much smaller) sample of videos found for that search
 * term, so treat them as a rougher, directional read — not the full picture
 * you'd get from opening that creator's own Profile Stats dashboard.
 *
 * NICHE SCORE (`computeNicheScore`) — 0-100, for a whole search term, meant
 * to answer "is this a good niche to get into?" Four sub-scores:
 *
 *   Demand        35%  — average views per video across everything scanned,
 *                        log-scaled. Higher = this topic reliably gets watched.
 *   Momentum      25%  — % of found videos posted in the last 30 days.
 *                        Higher = the topic is actively trending right now,
 *                        not just historically popular.
 *   Engagement    20%  — average (likes+comments+shares)/views across the scan.
 *   Competition   20%  — INVERTED: the % of total views held by the top 3
 *                        creators found. A niche dominated by a few huge
 *                        accounts scores lower here (harder for a newcomer
 *                        to break in), a niche with views spread across many
 *                        creators scores higher.
 *
 * Grades: 75+ Excellent opportunity · 55+ Good opportunity · 35+ Moderate ·
 * else Saturated (if competition is high) or Low demand.
 * ============================================================================
 */

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Maps a value on [0, max] to roughly [0, 100] on a log curve, so huge
 * ranges (100 followers vs 10 million) don't all collapse to "near zero". */
function logScale(value: number, max: number): number {
  if (value <= 0) return 0;
  return clamp((Math.log10(value + 1) / Math.log10(max + 1)) * 100);
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function engagementRateScore(videos: TikTokVideo[]): number {
  const rates = videos.filter((v) => v.views > 0).map((v) => (v.likes + v.comments + v.shares) / v.views);
  if (rates.length === 0) return 0;
  return clamp((avg(rates) / 0.15) * 100);
}

function growthScore(videos: TikTokVideo[]): number {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const last30 = videos.filter((v) => now - new Date(v.createdAt).getTime() <= 30 * DAY);
  const prev30 = videos.filter((v) => {
    const age = now - new Date(v.createdAt).getTime();
    return age > 30 * DAY && age <= 60 * DAY;
  });

  if (last30.length === 0 && prev30.length === 0) return 50; // not enough data — stay neutral

  const recentAvg = avg(last30.map((v) => v.views));
  const priorAvg = avg(prev30.map((v) => v.views));

  if (priorAvg === 0) return recentAvg > 0 ? 75 : 50; // active now with no prior baseline reads as growth
  const ratio = recentAvg / priorAvg;
  return clamp(50 + (ratio - 1) * 50);
}

function consistencyScore(videos: TikTokVideo[]): number {
  const buckets = buildMonthBuckets(videos);
  if (buckets.length < 2) return 50; // too little history to judge a cadence
  const counts = buckets.map((b) => b.count);
  const mean = avg(counts);
  if (mean === 0) return 0;
  const variance = avg(counts.map((c) => (c - mean) ** 2));
  const coefficientOfVariation = Math.sqrt(variance) / mean;
  return clamp(100 - coefficientOfVariation * 60);
}

function monetizationScore(videos: TikTokVideo[]): number {
  if (videos.length === 0) return 0;
  const { monetizableCount } = getMonetizableStats(videos);
  const monetizableRatio = monetizableCount / videos.length;
  const viewsScore = logScale(avg(videos.map((v) => v.views)), 5_000_000);
  return clamp(monetizableRatio * 50 + viewsScore * 0.5);
}

function profileGrade(overall: number, sampleSize: number): ScoreBreakdown['grade'] {
  if (sampleSize < 3) return 'New / not enough data';
  if (overall >= 80) return 'Excellent';
  if (overall >= 60) return 'Strong';
  if (overall >= 40) return 'Average';
  if (overall >= 20) return 'Weak';
  return 'New / not enough data';
}

/** Computes a 0-100 Creator Score from a follower count and whatever sample
 * of videos is available. Works equally for a full Profile Stats history or
 * a handful of videos found via a Niche Stats search — see the module doc
 * comment above for exactly what each sub-score means. */
export function computeProfileScore(followers: number, videos: TikTokVideo[]): ScoreBreakdown {
  const audience = Math.round(logScale(followers, 10_000_000));
  const engagement = Math.round(engagementRateScore(videos));
  const growth = Math.round(growthScore(videos));
  const consistency = Math.round(consistencyScore(videos));
  const monetization = Math.round(monetizationScore(videos));

  const overall = Math.round(
    audience * 0.25 + engagement * 0.3 + growth * 0.2 + consistency * 0.15 + monetization * 0.1
  );

  return {
    audience,
    engagement,
    growth,
    consistency,
    monetization,
    overall,
    grade: profileGrade(overall, videos.length)
  };
}

function nicheGrade(overall: number, competition: number): NicheScoreBreakdown['grade'] {
  if (overall >= 75) return 'Excellent opportunity';
  if (overall >= 55) return 'Good opportunity';
  if (overall >= 35) return 'Moderate';
  if (competition >= 60) return 'Saturated';
  return 'Low demand';
}

/** Computes a 0-100 Niche Score summarizing whether a Niche Stats search
 * term looks like a good niche to enter — see the module doc comment above
 * for exactly what each sub-score means. */
export function computeNicheScore(profiles: NicheProfile[], allVideos: TikTokVideo[]): NicheScoreBreakdown {
  if (profiles.length === 0 || allVideos.length === 0) {
    return { demand: 0, momentum: 0, competition: 0, engagement: 0, overall: 0, grade: 'Low demand' };
  }

  const avgViewsPerVideo = avg(allVideos.map((v) => v.views));
  const demand = Math.round(logScale(avgViewsPerVideo, 2_000_000));

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const recentCount = allVideos.filter((v) => now - new Date(v.createdAt).getTime() <= THIRTY_DAYS).length;
  const momentum = Math.round(clamp((recentCount / allVideos.length) * 100));

  const engagement = Math.round(engagementRateScore(allVideos));

  const totalViews = profiles.reduce((s, p) => s + p.totalViewsFound, 0);
  const top3Views = [...profiles]
    .sort((a, b) => b.totalViewsFound - a.totalViewsFound)
    .slice(0, 3)
    .reduce((s, p) => s + p.totalViewsFound, 0);
  const competition = Math.round(clamp(totalViews > 0 ? (top3Views / totalViews) * 100 : 0));

  const overall = Math.round(demand * 0.35 + momentum * 0.25 + engagement * 0.2 + (100 - competition) * 0.2);

  return { demand, momentum, competition, engagement, overall, grade: nicheGrade(overall, competition) };
}

/** A quick, scannable label for Niche Finder results — highlights the
 * specific combination of factors that makes a niche worth a second look
 * (or worth avoiding), beyond just the single overall number. */
export function computeOpportunityTag(score: NicheScoreBreakdown): OpportunityTag {
  if (score.demand >= 60 && score.competition <= 40) return 'Hidden gem';
  if (score.demand >= 70 && score.momentum >= 60) return 'Hot right now';
  if (score.momentum >= 70) return 'Rising';
  if (score.competition >= 70) return 'Saturated';
  return null;
}

export type NicheRecommendation = 'Start now' | 'Worth testing' | 'Proceed with caution' | 'Avoid for now';

export interface NicheVerdict {
  recommendation: NicheRecommendation;
  summary: string;
}

/** Turns the four Niche Score sub-scores into a plain-English answer to the
 * actual question a creator has — "should I start posting in this niche or
 * not" — instead of leaving them to interpret a bare 0-100 number. */
export function computeNicheVerdict(score: NicheScoreBreakdown): NicheVerdict {
  if (score.overall >= 70 && score.competition <= 50) {
    return {
      recommendation: 'Start now',
      summary: 'Strong demand with room to break in — few large creators dominate the views here, so a new channel has a real shot.'
    };
  }
  if (score.overall >= 55) {
    return {
      recommendation: 'Worth testing',
      summary: 'Solid fundamentals but not a slam dunk — post a handful of videos in this niche and watch how they perform before committing fully.'
    };
  }
  if (score.competition >= 70) {
    return {
      recommendation: 'Proceed with caution',
      summary: 'A handful of large creators hold most of the views here — you can still break in with a distinct angle, but expect it to be harder to get noticed.'
    };
  }
  return {
    recommendation: 'Avoid for now',
    summary: 'Demand looks low relative to the effort involved — look at other niches, or revisit this one once real momentum shows up.'
  };
}

export type CreatorEarningsVerdict = 'Winning' | 'Promising' | 'Inactive' | 'Not there yet';

export interface CreatorVerdictResult {
  isActive: boolean;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  meetsMonthlyGoal: boolean;
  meetsLifetimeGoal: boolean;
  verdict: CreatorEarningsVerdict;
  summary: string;
}

/** Answers the actual question behind the Creator Score for someone
 * deciding whether an account (their own, or one found via Niche Stats) is
 * "a winner": is it earning real, configurable money per month, has it
 * earned a meaningful amount lifetime, and is it still active — not just
 * "does it have a high engagement rate." All three thresholds are
 * user-configurable from Settings (see settings.ts ScoringThresholds). */
export function computeCreatorVerdict(
  videos: TikTokVideo[],
  channelRpm: number,
  thresholds: ScoringThresholds
): CreatorVerdictResult {
  const now = Date.now();
  const windowMs = thresholds.activeWindowDays * 24 * 60 * 60 * 1000;
  const isActive = videos.some((v) => now - new Date(v.createdAt).getTime() <= windowMs);

  const monthlyRevenue = getRevenueThisMonth(videos, channelRpm);
  const lifetimeRevenue = getTotalRevenue(videos, channelRpm);
  const meetsMonthlyGoal = monthlyRevenue >= thresholds.monthlyRevenueGoal;
  const meetsLifetimeGoal = lifetimeRevenue >= thresholds.lifetimeRevenueGoal;

  const activeWindowLabel = thresholds.activeWindowDays === 90 ? 'last 3 months' : `last ${thresholds.activeWindowDays} days`;

  let verdict: CreatorEarningsVerdict;
  let summary: string;

  if (!isActive) {
    verdict = 'Inactive';
    summary = `No videos posted in the ${activeWindowLabel} — even strong past earnings don't count as an active, ongoing win.`;
  } else if (meetsMonthlyGoal && meetsLifetimeGoal) {
    verdict = 'Winning';
    summary = `Active in the ${activeWindowLabel}, earning above your monthly goal, and past your lifetime earnings goal — this is a real, working income stream.`;
  } else if (meetsMonthlyGoal) {
    verdict = 'Promising';
    summary = `Currently earning above your monthly goal and active, but hasn't yet crossed your lifetime earnings goal — likely still ramping up.`;
  } else if (meetsLifetimeGoal) {
    verdict = 'Promising';
    summary = `Has earned past your lifetime goal historically, but this month is currently below your monthly goal — worth watching for a slowdown.`;
  } else {
    verdict = 'Not there yet';
    summary = `Active, but both current monthly earnings and lifetime earnings are below your configured goals.`;
  }

  return { isActive, monthlyRevenue, lifetimeRevenue, meetsMonthlyGoal, meetsLifetimeGoal, verdict, summary };
}
