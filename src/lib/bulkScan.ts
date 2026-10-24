import { createClient } from './supabase/server';
import { runWithSupabaseClient } from './supabase/context';
import { createTokenClient } from './supabase/tokenClient';
import { loadChannelData } from './channel';
import { ChannelNotFoundError, ScrapeBlockedError } from './dataProviders';
import { requireEffectiveUser } from './auth';
import { enforceBulkScanLimit } from './plans';

export interface BulkScanResultItem {
  username: string;
  status: 'pending' | 'done' | 'error';
  error?: string;
}

export interface BulkScanJob {
  id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  usernames: string[];
  results: BulkScanResultItem[];
  currentIndex: number;
  error?: string;
}

function normalizeUsernames(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of raw) {
    const clean = u.trim().toLowerCase().replace(/^@/, '');
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

export async function startBulkScan(usernamesRaw: string[], accessToken: string): Promise<string> {
  const usernames = normalizeUsernames(usernamesRaw);
  if (!usernames.length) throw new Error('No valid usernames provided.');

  const { effectiveUserId } = await requireEffectiveUser();
  await enforceBulkScanLimit(effectiveUserId, usernames.length);

  const supabase = await createClient();
  const results: BulkScanResultItem[] = usernames.map((username) => ({ username, status: 'pending' }));
  const { data, error } = await supabase
    .from('bulk_scan_jobs')
    .insert({ status: 'pending', usernames, results })
    .select('id')
    .single();
  if (error) throw error;

  const tokenClient = createTokenClient(accessToken);
  void runWithSupabaseClient(tokenClient, () => processBulkScan(data.id, usernames));
  return data.id;
}

/** Scans every username in the batch sequentially, one after another, in
 * this one background job — not one browser launch per username. The
 * underlying scraper (dataProviders/tiktokWeb.ts) already reuses a single
 * Playwright browser process for the app's whole lifetime (see
 * browserUtils.ts's getBrowser()) and persists a verified session to
 * data/session-state.json after every successful scrape, reloading it into
 * every new scrape's browser context. Scanning sequentially (never two
 * usernames at once) is what makes that actually work as "solve a CAPTCHA
 * once for this batch": if TikTok challenges the very first profile (only
 * reachable with scrapeHeadless:false, since a headless run can't show you
 * anything to solve), solving it saves that session to disk before the
 * second username's scrape even starts, so it loads the already-verified
 * session instead of hitting a fresh challenge. Running scans in parallel
 * would break this — several unverified contexts could all get challenged
 * before any of them had a chance to save a solved session. */
async function processBulkScan(jobId: string, usernames: string[]): Promise<void> {
  const supabase = await createClient();
  await supabase.from('bulk_scan_jobs').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', jobId);

  const results: BulkScanResultItem[] = usernames.map((username) => ({ username, status: 'pending' }));

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    try {
      await loadChannelData(username, true);
      results[i] = { username, status: 'done' };
    } catch (err) {
      const message =
        err instanceof ChannelNotFoundError || err instanceof ScrapeBlockedError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Scan failed';
      results[i] = { username, status: 'error', error: message };
    }
    await supabase
      .from('bulk_scan_jobs')
      .update({ results, current_index: i + 1, updated_at: new Date().toISOString() })
      .eq('id', jobId);
  }

  await supabase.from('bulk_scan_jobs').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', jobId);
}

export async function getBulkScanJob(id: string): Promise<BulkScanJob | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('bulk_scan_jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    usernames: data.usernames,
    results: data.results,
    currentIndex: data.current_index,
    error: data.error ?? undefined
  };
}
