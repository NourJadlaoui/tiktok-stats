'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, FileJson, Languages, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import RpmManager from '@/components/settings/RpmManager';
import NicheTermsManager from '@/components/settings/NicheTermsManager';
import ScoringSettings from '@/components/settings/ScoringSettings';
import SyncCurrencySettings from '@/components/settings/SyncCurrencySettings';
import CategoryManager from '@/components/settings/CategoryManager';
import AdminEmailsManager from '@/components/settings/AdminEmailsManager';

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  tiktok: 'Live data scraped directly from TikTok’s public web app — no API key needed.',
  rapidapi: 'Live data via a paid RapidAPI TikTok scraper — usually more reliable, needs an API key.',
  mock: 'Deterministic demo data, no network calls.'
};

interface Config {
  isAdmin: boolean;
  translateApiUrl: string;
  dataProvider?: string;
  rapidApiConfigured?: boolean;
  maxVideosToFetch?: number;
  nicheMaxVideos?: number;
  scrapeHeadless?: boolean;
  scrapeDebug?: boolean;
  persistSession?: boolean;
  sessionSaved?: boolean;
  cookieConfigured?: boolean;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [clearing, setClearing] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);

  function load() {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c: Config) => {
        setConfig(c);
        if (c.isAdmin) {
          fetch('/api/settings/admin-emails')
            .then((r) => r.json())
            .then((j) => setAdminEmails(j.emails ?? []))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }

  useEffect(load, []);

  async function clearSession() {
    setClearing(true);
    try {
      await fetch('/api/settings/session', { method: 'DELETE' });
      load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-400">Data source configuration, monetization rates, and Niche Finder terms.</p>
      </div>

      {config?.isAdmin && (
      <>
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FileJson size={16} /> Data source <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Admin only</span>
        </h2>
        {!config ? (
          <p className="text-xs text-neutral-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              {config.dataProvider !== 'mock' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-amber-500" />
              )}
              <span>
                Currently using <strong className="capitalize">{config.dataProvider}</strong>
                {' — '}
                {PROVIDER_DESCRIPTIONS[config.dataProvider ?? 'tiktok']}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {config.rapidApiConfigured ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
              )}
              <span>RapidAPI key {config.rapidApiConfigured ? 'configured' : 'not configured'} (optional fallback)</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {config.cookieConfigured ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
              )}
              <span>Session cookie {config.cookieConfigured ? 'configured' : 'not configured'} (recommended, reduces blocks)</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>
                Fetching up to <strong className="tabular-nums">{config.maxVideosToFetch}</strong> videos per channel,{' '}
                <strong className="tabular-nums">{config.nicheMaxVideos}</strong> per Niche Stats search
              </span>
            </div>
          </>
        )}

        <div className="mt-4 rounded-lg bg-neutral-100 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <p className="mb-1 font-semibold">How live data works</p>
          <p>
            By default this app fetches real TikTok data with a real headless browser reading the same public page
            data TikTok itself renders — no account, password, or API key is required for public profiles. TikTok
            can still rate-limit or temporarily block automated traffic, and without logging in it can only paginate
            through so much history, so very large/old channels may show a &quot;partial data&quot; notice with
            their most recent videos rather than the full archive.
          </p>
          <p className="mt-2">
            For higher reliability you can switch to a paid RapidAPI TikTok scraper instead: copy{' '}
            <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">config/credentials.example.json</code>{' '}
            to <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">config/credentials.json</code>{' '}
            (gitignored), set <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">rapidApi.key</code>{' '}
            and <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">"dataProvider": "rapidapi"</code>,
            then restart the app.
          </p>
          <p className="mt-2">
            Direct TikTok username/password login is never used to authenticate anywhere — TikTok blocks scripted
            logins with captcha/2FA. The optional <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">tiktokAccount.cookie</code>{' '}
            field lets you paste a logged-in browser session cookie to reduce rate-limiting if scraping gets blocked.
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={16} /> Session & scraping behavior <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Admin only</span>
        </h2>
        {!config ? (
          <p className="text-xs text-neutral-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              {config.persistSession ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
              )}
              <span>
                Session reuse {config.persistSession ? 'enabled' : 'disabled'}
                {config.persistSession && (config.sessionSaved ? ' — a saved session exists' : ' — no saved session yet')}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {config.scrapeHeadless ? (
                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500" />
              )}
              <span>Visible browser (scrapeHeadless=false) {config.scrapeHeadless ? 'off' : 'on'} — for watching/solving a CAPTCHA by hand</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {config.scrapeDebug ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-neutral-300 dark:text-neutral-600" />
              )}
              <span>Scrape debug logging {config.scrapeDebug ? 'on' : 'off'}</span>
            </div>

            {config.sessionSaved && (
              <button
                onClick={clearSession}
                disabled={clearing}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-red-400 hover:text-red-500 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300"
              >
                {clearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Clear saved session
              </button>
            )}

            <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              These are set in <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">config/credentials.json</code> or
              env vars (restart required to change) — see README &quot;About TikTok&apos;s CAPTCHA&quot; for what each one is for.
            </p>
          </>
        )}
      </div>
      </>
      )}

      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Languages size={16} /> Language detection
        </h2>
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Each channel&apos;s language is auto-detected from its bio and recent video captions using{' '}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">franc</code>, an open-source, offline
          language-detection library — no external API or network call involved. You can always correct it manually
          from that channel&apos;s Monetization tab.
        </p>
      </div>

      <SyncCurrencySettings />
      <ScoringSettings />
      <CategoryManager />
      <RpmManager />
      <NicheTermsManager />

      {config?.isAdmin && <AdminEmailsManager initial={adminEmails} />}
    </div>
  );
}
