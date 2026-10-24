import fs from 'fs';
import path from 'path';
import { DataProviderName } from './types';

export interface AppConfig {
  dataProvider: DataProviderName;
  rapidApi: { key: string; host: string };
  tiktokAccount: { username: string; password: string; cookie: string };
  /** Max videos to pull per channel when scraping live TikTok data (higher = slower, more likely to get rate-limited). */
  maxVideosToFetch: number;
  /** Max videos to scan per Niche Stats keyword search. */
  nicheMaxVideos: number;
  /** Run the scraper's browser visibly (for debugging why a channel returns no videos). */
  scrapeHeadless: boolean;
  /** Log every TikTok API response the scraper sees, to help diagnose blocked/empty responses. */
  scrapeDebug: boolean;
  /** Reuse a saved browser session (cookies/localStorage) across scrapes, so a session that
   * already passed TikTok's bot check once doesn't have to again. See data/session-state.json. */
  persistSession: boolean;
  defaultRpmByNiche: Record<string, number>;
  /** Machine-translation endpoint used by Settings' "Translate from English" button for Niche
   * Finder terms — must speak the LibreTranslate API shape (POST {q,source,target,format} ->
   * {translatedText}). Defaults to the public LibreTranslate instance; point this at your own
   * self-hosted instance (see https://github.com/LibreTranslate/LibreTranslate) for reliability,
   * since free public instances can be rate-limited or occasionally unavailable. */
  translateApiUrl: string;
  /** Optional API key, only needed for instances that require one. */
  translateApiKey: string;
  /** Approximate USD->EUR conversion rate used only for the small "≈ €X" hover tooltip on money
   * figures — not a live feed, just a manually-set approximation editable from Settings. */
  usdToEurRate: number;
}

const DEFAULTS: AppConfig = {
  dataProvider: 'tiktok',
  rapidApi: { key: '', host: 'tiktok-scraper7.p.rapidapi.com' },
  tiktokAccount: { username: '', password: '', cookie: '' },
  maxVideosToFetch: 300,
  nicheMaxVideos: 500,
  scrapeHeadless: true,
  scrapeDebug: false,
  persistSession: true,
  translateApiUrl: 'https://libretranslate.com/translate',
  translateApiKey: '',
  usdToEurRate: 0.92,
  defaultRpmByNiche: {
    default: 0.4,
    finance: 1.2,
    beauty: 0.6,
    gaming: 0.35,
    comedy: 0.3,
    education: 0.55,
    food: 0.45,
    fashion: 0.55,
    tech: 0.7,
    fitness: 0.5
  }
};

let cached: AppConfig | null = null;

function readJsonConfig(): Partial<AppConfig> {
  const filePath = path.join(process.cwd(), 'config', 'credentials.json');
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // A malformed config/credentials.json (most commonly: a pasted cookie
    // value containing raw " or \ characters that were never escaped for
    // JSON) is a silent, confusing failure if we just fall back quietly —
    // every setting in the file (provider, cookie, maxVideosToFetch, RPM
    // defaults, ...) would be ignored with no visible sign why. Make it loud.
    console.error(
      '\n[config] ══════════════════════════════════════════════════════════\n' +
        '[config] config/credentials.json has INVALID JSON — the entire file is\n' +
        '[config] being IGNORED (falling back to defaults: no cookie, mock-free\n' +
        '[config] tiktok scraping, 300 max videos, etc).\n' +
        '[config]\n' +
        `[config] Parse error: ${reason}\n` +
        '[config]\n' +
        '[config] The usual cause: pasting a raw browser cookie string that contains\n' +
        '[config] " or \\ characters (e.g. TikTok\'s g_state cookie) directly into the\n' +
        '[config] "cookie" field without escaping them for JSON.\n' +
        '[config]\n' +
        '[config] Easiest fix: skip the JSON file for the cookie entirely and set it\n' +
        '[config] via an environment variable instead (no escaping needed) — add to\n' +
        '[config] .env.local:\n' +
        '[config]   TIKTOK_COOKIE=<paste the raw cookie header value here>\n' +
        '[config] ══════════════════════════════════════════════════════════\n'
    );
    return {};
  }
}

export function getConfig(): AppConfig {
  if (cached) return cached;

  const fileConfig = readJsonConfig();

  const merged: AppConfig = {
    dataProvider: (process.env.DATA_PROVIDER as DataProviderName) || fileConfig.dataProvider || DEFAULTS.dataProvider,
    rapidApi: {
      key: process.env.RAPIDAPI_KEY || fileConfig.rapidApi?.key || DEFAULTS.rapidApi.key,
      host: process.env.RAPIDAPI_HOST || fileConfig.rapidApi?.host || DEFAULTS.rapidApi.host
    },
    tiktokAccount: {
      username: fileConfig.tiktokAccount?.username || DEFAULTS.tiktokAccount.username,
      password: fileConfig.tiktokAccount?.password || DEFAULTS.tiktokAccount.password,
      // TIKTOK_COOKIE env var wins if set — it sidesteps JSON-escaping
      // entirely, which is the #1 source of "my cookie isn't being used".
      cookie: process.env.TIKTOK_COOKIE || fileConfig.tiktokAccount?.cookie || DEFAULTS.tiktokAccount.cookie
    },
    maxVideosToFetch: Number(process.env.MAX_VIDEOS_TO_FETCH) || fileConfig.maxVideosToFetch || DEFAULTS.maxVideosToFetch,
    nicheMaxVideos: Number(process.env.NICHE_MAX_VIDEOS) || fileConfig.nicheMaxVideos || DEFAULTS.nicheMaxVideos,
    scrapeHeadless: process.env.TIKTOK_SCRAPE_HEADLESS === 'false' ? false : fileConfig.scrapeHeadless ?? DEFAULTS.scrapeHeadless,
    scrapeDebug: process.env.TIKTOK_SCRAPE_DEBUG === '1' || fileConfig.scrapeDebug === true || DEFAULTS.scrapeDebug,
    persistSession: process.env.PERSIST_SESSION === 'false' ? false : fileConfig.persistSession ?? DEFAULTS.persistSession,
    translateApiUrl: process.env.TRANSLATE_API_URL || fileConfig.translateApiUrl || DEFAULTS.translateApiUrl,
    translateApiKey: process.env.TRANSLATE_API_KEY || fileConfig.translateApiKey || DEFAULTS.translateApiKey,
    usdToEurRate: Number(process.env.USD_TO_EUR_RATE) || fileConfig.usdToEurRate || DEFAULTS.usdToEurRate,
    defaultRpmByNiche: { ...DEFAULTS.defaultRpmByNiche, ...(fileConfig.defaultRpmByNiche || {}) }
  };

  // If rapidapi was requested but no key is configured, fall back to the free
  // scraping provider instead of hard-failing every request.
  if (merged.dataProvider === 'rapidapi' && !merged.rapidApi.key) {
    console.warn('[config] dataProvider=rapidapi but no RAPIDAPI_KEY configured — falling back to the built-in TikTok scraper.');
    merged.dataProvider = 'tiktok';
  }

  console.log(
    `[config] provider=${merged.dataProvider} maxVideosToFetch=${merged.maxVideosToFetch} nicheMaxVideos=${merged.nicheMaxVideos} ` +
      `cookie=${merged.tiktokAccount.cookie ? `set (${merged.tiktokAccount.cookie.length} chars)` : 'NOT SET'} ` +
      `scrapeHeadless=${merged.scrapeHeadless} scrapeDebug=${merged.scrapeDebug}`
  );

  cached = merged;
  return merged;
}
