import fs from 'fs';
import path from 'path';
import type { Browser, BrowserContext } from 'playwright';
import { getConfig } from '@/lib/config';

const DATA_DIR = path.join(process.cwd(), 'data');
const SESSION_STATE_PATH = path.join(DATA_DIR, 'session-state.json');

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Masks the most common headless-browser tells TikTok's anti-bot checks for.
const STEALTH_INIT_SCRIPT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  window.chrome = window.chrome || { runtime: {} };
`;

let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const { chromium } = await import('playwright');
    const { scrapeHeadless } = getConfig();
    browserPromise = chromium.launch({
      headless: scrapeHeadless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  }
  return browserPromise;
}

export function parseCookieHeader(header: string, domain: string) {
  // Dedupe by name (last occurrence wins) — a raw browser Cookie header can
  // contain the same name twice (e.g. TikTok's msToken), which some cookie
  // jars reject or mishandle as two separate cookies.
  const byName = new Map<string, string>();
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!name) continue;
    byName.set(name, value);
  }
  return [...byName.entries()].map(([name, value]) => ({ name, value, domain, path: '/' }));
}

/** A new browser context pre-configured with a realistic UA/locale, stealth
 * tweaks, and the configured session cookie (if any) — shared setup for
 * every TikTok page we scrape (profiles, search results, ...).
 *
 * If a previously-saved session (see saveSessionState below) exists on disk,
 * it's loaded first so a browser that already got past TikTok's bot/CAPTCHA
 * check once (e.g. during a manual scrapeHeadless:false run) can reuse that
 * verified session instead of risking a fresh check on every request. The
 * configured cookie, if any, is still applied on top/instead — it always
 * wins for the specific TikTok cookie names it sets, since it's the more
 * intentionally-provided value. */
export async function newStealthContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  const { tiktokAccount, persistSession } = getConfig();

  const storageState = persistSession && fs.existsSync(SESSION_STATE_PATH) ? SESSION_STATE_PATH : undefined;

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    storageState
  });
  await context.addInitScript(STEALTH_INIT_SCRIPT);

  if (tiktokAccount.cookie) {
    const cookies = parseCookieHeader(tiktokAccount.cookie, '.tiktok.com');
    if (cookies.length) await context.addCookies(cookies);
  }

  return context;
}

/** Persists the context's cookies/localStorage to disk so future scrapes can
 * reuse an already-verified TikTok session (see newStealthContext above).
 * This is just session reuse — the same thing a normal browser does by
 * keeping you logged in/verified between tabs — not an attempt to defeat
 * any bot-check itself. Call after a scrape that got real data back (a
 * blocked/errored run's state isn't worth keeping). Failures are logged and
 * swallowed — this is a best-effort optimization, never something a scrape
 * should fail over. */
export async function saveSessionState(context: BrowserContext): Promise<void> {
  const { persistSession } = getConfig();
  if (!persistSession) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    await context.storageState({ path: SESSION_STATE_PATH });
  } catch (err) {
    console.warn('[browserUtils] could not save session state:', err instanceof Error ? err.message : err);
  }
}

/** Whether a saved session currently exists on disk (for Settings to show
 * status / offer a "clear it" action). */
export function sessionStateExists(): boolean {
  return fs.existsSync(SESSION_STATE_PATH);
}

/** Deletes the saved session, forcing the next scrape to start a brand-new
 * browser session — useful if a saved session has gone stale/expired or
 * you just want a clean slate. */
export function clearSessionState(): void {
  if (fs.existsSync(SESSION_STATE_PATH)) fs.unlinkSync(SESSION_STATE_PATH);
}

/** Dismiss TikTok's cookie-consent banner if it's showing, so it doesn't
 * intercept clicks/scroll on the page underneath. */
export async function dismissCookieBanner(page: import('playwright').Page): Promise<boolean> {
  const acceptCookies = page.getByRole('button', { name: /accept all|allow all|agree/i }).first();
  if (await acceptCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptCookies.click().catch(() => {});
    return true;
  }
  return false;
}

async function getScrollHeight(page: import('playwright').Page): Promise<number> {
  return page.evaluate(() => document.body.scrollHeight).catch(() => 0);
}

/** True once TikTok's search results page renders its own "No more results"
 * end-of-list marker. Matched by a substring of the class name
 * (`...DivNoMoreResultsContainer...`) rather than the exact hashed class or
 * the visible text, since TikTok's CSS-module hash prefix changes across
 * deploys but this suffix has stayed stable, and matching by class (not
 * text) also works regardless of the page's display language. Requires the
 * element to actually have layout (not just be present-but-hidden in the
 * DOM ahead of the true end) to avoid stopping early. */
export async function hasNoMoreResultsBanner(page: import('playwright').Page): Promise<boolean> {
  return page
    .evaluate(() => {
      const el = document.querySelector('[class*="DivNoMoreResultsContainer"]');
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    })
    .catch(() => false);
}

/** Scrolls the document (not a simulated mouse wheel at a fixed cursor
 * position, which can land over a fixed sidebar and never reach the
 * content underneath) to trigger TikTok's infinite-scroll pagination.
 *
 * Dynamic by design: every round jumps straight to the current bottom of
 * the page (the way most infinite-scroll implementations — including
 * TikTok's — detect "user reached the end" via an intersection observer,
 * so this triggers loading reliably regardless of how tall the page has
 * grown) rather than a fixed per-step distance, and tracks BOTH the
 * caller's item count and the page's own scrollHeight as independent "is
 * there more" signals. It only concludes the page has truly ended once
 * neither signal has moved for several consecutive rounds — a scan that
 * happens to plateau in item count for a moment (e.g. items rendering
 * slightly behind the network response) won't get cut short while the
 * page itself is still visibly growing. If the caller passes `isEnd` (the
 * search page's own "No more results" marker — see hasNoMoreResultsBanner),
 * it's only consulted once a stall is already suspected (2+ consecutive
 * rounds with no count/height growth) — never on the very first round(s) —
 * so it acts as a fast confirmation of an already-suspected stall rather
 * than an independent trigger. That matters because this marker's element
 * can plausibly already exist somewhere in the page's DOM before real
 * scrolling/loading has happened (e.g. a different search tab/section's own
 * end-of-list state, or a sentinel with non-zero layout ahead of being
 * "active") — trusting it unconditionally on round 0 risked stopping before
 * a single real load had a chance to happen. */
export async function scrollToCollect(
  page: import('playwright').Page,
  opts: {
    getCount: () => number;
    maxCount: number;
    hasMore: () => boolean;
    onProgress?: (count: number) => void;
    onStall?: (stableRounds: number) => void;
    isEnd?: () => Promise<boolean>;
    maxIterations?: number;
    maxStableRounds?: number;
  }
): Promise<void> {
  const maxIterations = opts.maxIterations ?? 600;
  const maxStableRounds = opts.maxStableRounds ?? 20;
  const MIN_STABLE_ROUNDS_BEFORE_END_CHECK = 2;

  let stableRounds = 0;
  let lastCount = opts.getCount();
  let lastHeight = await getScrollHeight(page);

  for (let i = 0; i < maxIterations && opts.getCount() < opts.maxCount && opts.hasMore(); i++) {
    // Jump straight to the bottom every round — reliable regardless of how
    // tall the page has already grown, unlike a fixed scroll-by distance.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(650 + Math.random() * 550);

    const count = opts.getCount();
    const height = await getScrollHeight(page);
    const countGrew = count > lastCount;
    const heightGrew = height > lastHeight + 10; // small tolerance for layout jitter

    if (!countGrew && !heightGrew) {
      stableRounds++;
      opts.onStall?.(stableRounds);

      if (opts.isEnd && stableRounds >= MIN_STABLE_ROUNDS_BEFORE_END_CHECK && (await opts.isEnd())) break;

      // Nothing new after a few plain scrolls — try a handful of different
      // nudges (small up/down bump, then jump back to bottom) before
      // concluding there's really nothing more.
      if (stableRounds % 4 === 0 && stableRounds < maxStableRounds) {
        await page.evaluate(() => window.scrollBy(0, -600));
        await page.waitForTimeout(400);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200 + Math.random() * 500);
      }
      if (stableRounds >= maxStableRounds) break;
    } else {
      stableRounds = 0;
      if (countGrew) opts.onProgress?.(count);
    }
    lastCount = count;
    lastHeight = Math.max(lastHeight, height);
  }
}
