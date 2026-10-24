import { NicheSearchResult } from './types';
import { kvGetAll, kvSetAll } from './sql/engine';

// Backed by Supabase/Postgres (see src/lib/sql/engine.ts) instead of a
// single flat JSON file or local SQLite database. This module keeps the
// exact same in-memory shape and getStore()/saveStore() call pattern the
// rest of the app already uses — callers still mutate the object returned
// by getStore() directly and then call saveStore(store) to persist it.
//
// Unlike the old single-user local version, getStore() is NOT cached in a
// process-global variable — this server process now handles requests for
// many different signed-in users, and a global cache would leak one
// user's data into another user's request. Every call fetches fresh (RLS-
// scoped to whoever's signed in for the current request), and saveStore()
// takes the store object explicitly rather than re-reading a shared
// singleton, so within one function's mutate-then-save flow nothing is
// re-fetched — it's just no longer shared across requests/users.

export interface ProfileCacheEntry {
  provider: string;
  profile: unknown;
  videos: unknown[];
  videosComplete: boolean;
  fetchedAt: string;
}

export interface ChannelRow {
  username: string;
  displayName: string;
  avatarUrl: string;
  niche: string;
  language: string;
  rpm: number;
  lastViewedAt: string;
  /** Last time this channel was actually re-scraped from TikTok (vs lastViewedAt, which just
   * tracks when the user last opened the page). Drives the sync-staleness check. */
  lastSyncedAt?: string;
  /** When this channel was first tracked — the starting point for its history graph. */
  firstSyncedAt?: string;
  /** User-assigned category labels (e.g. "Competitor", "Client") — free-form but drawn from the
   * shared global list in settings.categories so they stay consistent and filterable. */
  categories?: string[];
  /** A personal 0-10 rating the user assigns manually, independent of the computed Creator Score. */
  myScore?: number | null;
  /** Free-text notes the user has written about this creator. */
  notes?: string;
  /** Explicit opt-in "keep an eye on this one" flag — distinct from just having been looked up once.
   * Only tracked channels show up on the Tracked dashboard. */
  tracked?: boolean;
}

export interface AppSettings {
  /** niche -> RPM, editable from the Settings page. Seeded once from config/credentials.json's
   * defaultRpmByNiche the first time settings are read, then this is the source of truth. */
  rpmByNiche: Record<string, number>;
  /** language -> full list of Niche Finder search terms, editable from the Settings page.
   * Only languages the user has actually edited/translated appear here — anything absent falls
   * back to the built-in curated list in nicheFinderTerms.ts. */
  nicheTermsByLanguage: Record<string, string[]>;
  /** Approximate USD->EUR rate for the hover tooltip on money figures. */
  usdToEurRate: number;
  /** How stale a channel/niche's data must be (hours) before Sync considers it due for an
   * automatic re-scan — otherwise cached data is served as-is until manually synced. */
  syncIntervalHours: number;
  /** Thresholds behind the "is this worth it" scoring verdicts — see scoring.ts. */
  scoringThresholds: {
    /** A profile earning at least this much per month reads as a real income stream. */
    monthlyRevenueGoal: number;
    /** A profile that's earned at least this much lifetime reads as an established earner. */
    lifetimeRevenueGoal: number;
    /** A profile/niche with no activity within this many days reads as inactive/dormant. */
    activeWindowDays: number;
  };
  /** Global list of creator category labels the user has created — shared across all channels so
   * they stay consistent and filterable (Accounts page, Tracked dashboard). */
  categories: string[];
}

export interface StoreShape {
  channels: Record<string, ChannelRow>;
  profileCache: Record<string, ProfileCacheEntry>;
  /** username -> videoId -> rpm override */
  videoOverrides: Record<string, Record<string, number>>;
  /** lowercased search term -> cached Niche Stats result */
  nicheSearchCache: Record<string, NicheSearchResult>;
  settings: AppSettings;
}

function emptySettings(): AppSettings {
  return {
    rpmByNiche: {},
    nicheTermsByLanguage: {},
    usdToEurRate: 0,
    syncIntervalHours: 24,
    scoringThresholds: { monthlyRevenueGoal: 1000, lifetimeRevenueGoal: 10000, activeWindowDays: 90 },
    categories: []
  };
}

export async function getStore(userId: string): Promise<StoreShape> {
  const store: StoreShape = {
    channels: await kvGetAll<ChannelRow>('kv_channels', 'username', userId),
    profileCache: await kvGetAll<ProfileCacheEntry>('kv_profile_cache', 'username', userId),
    videoOverrides: await kvGetAll<Record<string, number>>('kv_video_overrides', 'username', userId),
    nicheSearchCache: await kvGetAll<NicheSearchResult>('kv_niche_search_cache', 'term', userId),
    settings: emptySettings()
  };

  const settingsRows = await kvGetAll<AppSettings>('kv_settings', 'key', userId);
  if (settingsRows.main) store.settings = { ...emptySettings(), ...settingsRows.main };

  return store;
}

export async function saveStore(store: StoreShape, userId: string): Promise<void> {
  await kvSetAll('kv_channels', 'username', store.channels, userId);
  await kvSetAll('kv_profile_cache', 'username', store.profileCache, userId);
  await kvSetAll('kv_video_overrides', 'username', store.videoOverrides, userId);
  await kvSetAll('kv_niche_search_cache', 'term', store.nicheSearchCache, userId);
  await kvSetAll('kv_settings', 'key', { main: store.settings }, userId);
}
