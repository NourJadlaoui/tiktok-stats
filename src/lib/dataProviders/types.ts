import { TikTokProfile, TikTokVideo, DataProviderName } from '@/lib/types';

export interface FetchResult {
  profile: TikTokProfile;
  videos: TikTokVideo[];
  provider: DataProviderName;
  /** False when we couldn't confirm we retrieved the channel's complete video history. */
  videosComplete: boolean;
}

export interface DataProvider {
  name: DataProviderName;
  /** `maxVideosOverride`, when set, caps how many videos this fetch pulls
   * below the server's own maxVideosToFetch config — used to enforce a
   * subscription plan's per-profile video cap without paginating (and
   * paying for, on RapidAPI) more than the plan allows. */
  fetchChannel(username: string, maxVideosOverride?: number): Promise<FetchResult>;
}

export class ChannelNotFoundError extends Error {
  constructor(username: string) {
    super(`TikTok account "@${username}" could not be found.`);
    this.name = 'ChannelNotFoundError';
  }
}

export class ScrapeBlockedError extends Error {
  constructor(reason: string) {
    super(`TikTok blocked or interrupted the request: ${reason}`);
    this.name = 'ScrapeBlockedError';
  }
}
