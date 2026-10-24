'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Bookmark, LayoutGrid, LayoutList, TrendingUp, TrendingDown, Minus, StickyNote } from 'lucide-react';
import { formatCompactNumber } from '@/lib/stats';
import clsx from 'clsx';

export interface GalleryProfileRow {
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  niche: string;
  language: string;
  rpm: number;
  categories: string[];
  myScore: number | null;
  tracked: boolean;
  notes?: string;
  lastViewedAt: string;
  followers: number;
  creatorScore: number | null;
  scoreDeltaWeek: number | null;
  scoreDeltaYear: number | null;
}

type Layout = 'grid3' | 'grid4' | 'horizontal';

function Delta({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <span className="flex items-center gap-1 text-neutral-400">
        <Minus size={11} /> {label}: —
      </span>
    );
  }
  const positive = value >= 0;
  return (
    <span className={clsx('flex items-center gap-1', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {label}: {positive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

function ProfileCard({ row, horizontal }: { row: GalleryProfileRow; horizontal: boolean }) {
  return (
    <Link
      href={`/dashboard/${row.username}/overview`}
      className={clsx(
        'card animate-pop-in flex gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md',
        horizontal ? 'flex-row items-center' : 'flex-col'
      )}
    >
      <div className={clsx('flex items-center gap-3', horizontal && 'w-56 shrink-0')}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-semibold">
            {row.tracked && <Bookmark size={12} className="shrink-0 fill-tiktok-pink text-tiktok-pink" />}
            <span className="truncate">{row.displayName}</span>
            {row.verified && <BadgeCheck size={13} className="shrink-0 text-cyan-500" />}
            {row.notes && (
              <span title={row.notes}>
                <StickyNote size={11} className="shrink-0 text-neutral-400" />
              </span>
            )}
          </div>
          <p className="truncate text-xs text-neutral-400">@{row.username}</p>
        </div>
      </div>

      <div className={clsx('flex flex-wrap items-center gap-1.5', horizontal && 'w-40 shrink-0')}>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {row.niche}
        </span>
        {row.categories.slice(0, horizontal ? 1 : 3).map((c) => (
          <span key={c} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {c}
          </span>
        ))}
      </div>

      <div className={clsx('grid grid-cols-2 gap-x-4 gap-y-1 text-xs', horizontal ? 'ml-auto grid-cols-4 items-center' : 'mt-1')}>
        <div>
          <div className="text-neutral-400">Followers</div>
          <div className="font-semibold tabular-nums">{formatCompactNumber(row.followers)}</div>
        </div>
        <div>
          <div className="text-neutral-400">RPM</div>
          <div className="font-semibold tabular-nums">${row.rpm.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-neutral-400">Score</div>
          <div className="font-semibold tabular-nums">{row.creatorScore ?? '—'}{row.myScore !== null && <span className="ml-1 text-neutral-400">(mine: {row.myScore}/10)</span>}</div>
        </div>
        <div className="flex flex-col gap-0.5">
          <Delta label="Wk" value={row.scoreDeltaWeek} />
          <Delta label="Yr" value={row.scoreDeltaYear} />
        </div>
      </div>
    </Link>
  );
}

export default function ProfileGallery({ rows }: { rows: GalleryProfileRow[] }) {
  const [layout, setLayout] = useState<Layout>('grid3');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
        <button onClick={() => setLayout('grid3')} title="3 per row" className={clsx('rounded-full p-1.5', layout === 'grid3' ? 'bg-white shadow-sm dark:bg-neutral-800' : 'text-neutral-400')}>
          <LayoutGrid size={14} />
        </button>
        <button onClick={() => setLayout('grid4')} title="4 per row" className={clsx('flex items-center rounded-full px-2 py-1.5 text-xs font-medium', layout === 'grid4' ? 'bg-white shadow-sm dark:bg-neutral-800' : 'text-neutral-400')}>
          4-up
        </button>
        <button onClick={() => setLayout('horizontal')} title="Horizontal list" className={clsx('rounded-full p-1.5', layout === 'horizontal' ? 'bg-white shadow-sm dark:bg-neutral-800' : 'text-neutral-400')}>
          <LayoutList size={14} />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-400">No profiles match your filters.</div>
      ) : layout === 'horizontal' ? (
        <div className="flex flex-col gap-2">
          {rows.map((r) => <ProfileCard key={r.username} row={r} horizontal />)}
        </div>
      ) : (
        <div className={clsx('grid grid-cols-1 gap-3 sm:grid-cols-2', layout === 'grid3' ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>
          {rows.map((r) => <ProfileCard key={r.username} row={r} horizontal={false} />)}
        </div>
      )}
    </div>
  );
}
