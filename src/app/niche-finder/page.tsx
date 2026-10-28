'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Compass, Loader2 } from 'lucide-react';
import ModeTabs from '@/components/ModeTabs';
import NicheFinderResultsTable from '@/components/NicheFinderResultsTable';
import { LANGUAGE_NAMES } from '@/lib/languages';
import { NicheFinderRun } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type Coverage = 'quick' | 'standard' | 'full';

const COVERAGE_HINTS: Record<Coverage, string> = {
  quick: '~12 niches per language — fastest, good for a first look',
  standard: '~25 niches per language — solid default',
  full: 'every curated niche per language — most thorough, slowest'
};

interface HistoryEntry {
  id: string;
  languages: string[];
  status: NicheFinderRun['status'];
  startedAt: string;
  finishedAt?: string;
  termsTotal: number;
  termsCompleted: number;
  topResult: NicheFinderRun['results'][number] | null;
}

export default function NicheFinderPage() {
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [coverage, setCoverage] = useState<Coverage>('standard');
  const [maxVideosPerNiche, setMaxVideosPerNiche] = useState(60);
  const [run, setRun] = useState<NicheFinderRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadHistory() {
    fetch('/api/niche-finder/history')
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
  }

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => {
      if (prev.includes(lang)) return prev.filter((l) => l !== lang);
      if (prev.length >= 3) return prev;
      return [...prev, lang];
    });
  }

  function pollStatus(runId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/niche-finder/status?runId=${runId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: NicheFinderRun = await res.json();
        setRun(data);
        if (data.status !== 'running') {
          if (pollRef.current) clearInterval(pollRef.current);
          loadHistory();
        }
      } catch {
        // ignore transient poll failures
      }
    }, 1800);
  }

  async function handleRun() {
    if (languages.length === 0) return;
    setError(null);
    setRun(null);
    try {
      const res = await fetch('/api/niche-finder/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages, coverage, maxVideosPerNiche })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not start Niche Finder.');
      }
      const { runId } = await res.json();
      pollStatus(runId);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
  }

  async function viewPastRun(id: string) {
    setError(null);
    setRun(null);
    try {
      const res = await fetch(`/api/niche-finder/status?runId=${id}`);
      if (!res.ok) throw new Error('Could not load that run.');
      setRun(await res.json());
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
  }

  const running = run?.status === 'running';

  return (
    <div className="flex flex-col items-center pt-10 sm:pt-16">
      <ModeTabs />

      <h1 className="mt-6 max-w-2xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
        Discover the best <span className="gradient-text">niches</span> right now
      </h1>
      <p className="mt-4 max-w-xl text-center text-neutral-500 dark:text-neutral-400">
        Pick up to 3 languages and Niche Finder automatically scans dozens of niche topics with real
        TikTok data, scoring each one for demand, momentum and competition — so you can see where the
        opportunity is at a glance.
      </p>

      <div className="card mt-8 flex w-full max-w-2xl flex-col gap-5 p-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Languages (pick up to 3)
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_NAMES.map((lang) => {
              const active = languages.includes(lang);
              const disabled = !active && languages.length >= 3;
              return (
                <button
                  key={lang}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleLanguage(lang)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-tiktok-pink bg-tiktok-pink text-white'
                      : disabled
                        ? 'cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700'
                        : 'border-neutral-300 text-neutral-600 hover:border-tiktok-pink hover:text-tiktok-pink dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Coverage
            <select
              value={coverage}
              onChange={(e) => setCoverage(e.target.value as Coverage)}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="full">Full</option>
            </select>
            <span className="font-normal normal-case text-neutral-400">{COVERAGE_HINTS[coverage]}</span>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Videos scanned per niche
            <select
              value={maxVideosPerNiche}
              onChange={(e) => setMaxVideosPerNiche(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {[40, 60, 100, 150].map((n) => (
                <option key={n} value={n}>
                  {n} videos
                </option>
              ))}
            </select>
            <span className="font-normal normal-case text-neutral-400">Lower = faster per niche, less precise</span>
          </label>
        </div>

        <button
          onClick={handleRun}
          disabled={running || languages.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {running ? <Loader2 size={18} className="animate-spin" /> : <Compass size={18} />}
          {running ? 'Scanning…' : 'Run Niche Finder'}
        </button>
        <p className="text-center text-xs text-neutral-400">
          This can take a while — feel free to leave this tab and check back later; results are saved as
          they come in, and past runs stay in the history below.
        </p>
      </div>

      {error && <p className="mt-4 max-w-md text-center text-sm text-red-600 dark:text-red-400">{error}</p>}

      {run && (
        <div className="mt-10 flex w-full max-w-6xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">
                {run.status === 'running' ? 'Scanning…' : run.status === 'error' ? 'Run failed' : 'Results'}
              </h2>
              <p className="text-sm text-neutral-400">
                {run.termsCompleted} of {run.termsTotal} niches scanned
                {run.currentTerm && ` — currently scanning "${run.currentTerm}"`}
                {run.error && ` — ${run.error}`}
              </p>
            </div>
            {run.status === 'running' && (
              <div className="h-2 w-48 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-tiktok-cyan to-tiktok-pink transition-all duration-500"
                  style={{ width: `${run.termsTotal ? (run.termsCompleted / run.termsTotal) * 100 : 0}%` }}
                />
              </div>
            )}
          </div>

          {run.results.length > 0 ? (
            <NicheFinderResultsTable results={run.results} />
          ) : (
            <p className="py-6 text-center text-sm text-neutral-400">No results yet…</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-12 w-full max-w-6xl">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Past runs</h2>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                  <th className="px-4 py-2.5">Languages</th>
                  <th className="px-4 py-2.5">Progress</th>
                  <th className="px-4 py-2.5">Top niche found</th>
                  <th className="px-4 py-2.5">Started</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60">
                    <td className="px-4 py-2.5">{h.languages.join(', ')}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {h.termsCompleted}/{h.termsTotal} {h.status === 'running' && '(running…)'}
                    </td>
                    <td className="px-4 py-2.5">
                      {h.topResult ? (
                        <Link href={`/niche?q=${encodeURIComponent(h.topResult.term)}`} className="text-tiktok-pink hover:underline">
                          {h.topResult.term} ({h.topResult.score.overall})
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-400">
                      {formatDistanceToNow(new Date(h.startedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => viewPastRun(h.id)} className="text-xs font-medium text-tiktok-pink hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
