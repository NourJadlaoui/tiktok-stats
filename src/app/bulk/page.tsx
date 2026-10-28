'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ListPlus, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import type { BulkScanJob } from '@/lib/bulkScan';
import ProfileGallery, { GalleryProfileRow } from '@/components/ProfileGallery';
import UpgradeModal from '@/components/UpgradeModal';
import ModeTabs from '@/components/ModeTabs';

export default function BulkSearchPage() {
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<BulkScanJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReason, setLimitReason] = useState<string | null>(null);
  const [galleryRows, setGalleryRows] = useState<GalleryProfileRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/bulk-scan/${jobId}`);
      if (res.ok) {
        const j: BulkScanJob = await res.json();
        setJob(j);
        if (j.status === 'done') {
          clearInterval(id);
          const galleryRes = await fetch(`/api/bulk-scan/${jobId}/gallery`);
          if (galleryRes.ok) setGalleryRows((await galleryRes.json()).rows);
        }
      }
    }, 1500);
    return () => clearInterval(id);
  }, [jobId]);

  function parseUsernames(raw: string): string[] {
    return raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }

  async function handleFile(file: File) {
    const content = await file.text();
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : parsed.usernames ?? [];
        setText((t) => [t, ...list].filter(Boolean).join('\n'));
        return;
      } catch {
        setError('Could not parse that JSON file — expected an array of usernames, or {"usernames": [...]}.');
        return;
      }
    }
    setText((t) => [t, ...parseUsernames(content)].filter(Boolean).join('\n'));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  async function startScan() {
    const usernames = parseUsernames(text);
    if (!usernames.length) return;
    setStarting(true);
    setError(null);
    setJob(null);
    try {
      const res = await fetch('/api/bulk-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setLimitReason(body.error || "You've reached your plan's limit.");
          return;
        }
        throw new Error(body.error || 'Could not start the scan.');
      }
      const json = await res.json();
      setJobId(json.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  const usernames = parseUsernames(text);
  const isRunning = job?.status === 'pending' || job?.status === 'running';

  return (
    <div className="flex flex-col items-center py-10">
      <UpgradeModal open={limitReason !== null} reason={limitReason ?? ''} onClose={() => setLimitReason(null)} />
      <ModeTabs />
      <ListPlus size={40} className="mt-6 text-tiktok-pink" />
      <h1 className="mt-4 max-w-xl text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
        Bulk <span className="gradient-text">profile search</span>
      </h1>
      <p className="mt-4 max-w-xl text-center text-neutral-500 dark:text-neutral-400">
        Paste a list of usernames (comma or newline separated), or drop a .txt/.json file. Every profile
        scans in this one background job — if TikTok challenges the first one with a CAPTCHA, solve it
        once and the rest of the batch continues on its own.
      </p>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'user1, user2, user3\n…or one per line'}
          rows={10}
          className="rounded-xl border border-neutral-300 bg-white p-3 text-sm outline-none ring-brand-600 focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition',
            dragging ? 'border-tiktok-pink bg-tiktok-pink/5' : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700'
          )}
        >
          <Upload size={24} className="text-neutral-400" />
          <p className="text-sm font-medium">Drag & drop a .txt or .json file</p>
          <p className="text-xs text-neutral-400">or click to browse — one username per line, comma-separated, or a JSON array</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-neutral-400">{usernames.length} usernames ready</span>
        <button
          onClick={startScan}
          disabled={starting || isRunning || usernames.length === 0}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {starting ? 'Starting…' : isRunning ? `Scanning… (${job?.currentIndex ?? 0}/${usernames.length})` : 'Run scan'}
        </button>
      </div>

      {error && <p className="mt-4 max-w-md text-center text-sm text-red-600 dark:text-red-400">{error}</p>}

      {job && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="mb-3 text-lg font-bold">
            {job.status === 'done' ? 'Scan complete' : 'Scanning…'} ({job.results.filter((r) => r.status !== 'pending').length}/{job.results.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {job.results.map((r) => (
              <div key={r.username} className="card flex items-center gap-2.5 p-2.5 text-sm">
                {r.status === 'pending' && <Loader2 size={15} className="animate-spin text-neutral-400" />}
                {r.status === 'done' && <CheckCircle2 size={15} className="text-emerald-500" />}
                {r.status === 'error' && <XCircle size={15} className="text-red-600 dark:text-red-400" />}
                <span className="font-medium">@{r.username}</span>
                {r.status === 'done' && (
                  <Link href={`/dashboard/${r.username}/overview`} className="ml-auto text-xs font-medium text-tiktok-pink hover:underline">
                    View dashboard
                  </Link>
                )}
                {r.status === 'error' && <span className="ml-auto text-xs text-red-600 dark:text-red-400">{r.error}</span>}
              </div>
            ))}
          </div>
          {job.status === 'done' && (
            <Link href="/accounts" className="mt-4 inline-block rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">
              View all scanned profiles on Accounts →
            </Link>
          )}
        </div>
      )}

      {galleryRows && galleryRows.length > 0 && (
        <div className="mt-10 w-full max-w-6xl">
          <h2 className="mb-3 text-lg font-bold">Scanned profiles</h2>
          <ProfileGallery rows={galleryRows} />
        </div>
      )}
    </div>
  );
}
