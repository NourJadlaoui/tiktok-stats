'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import clsx from 'clsx';

function scoreColor(value: number): string {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 55) return 'bg-cyan-500';
  if (value >= 35) return 'bg-amber-500';
  return 'bg-red-400';
}

function scoreTextColor(value: number): string {
  if (value >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (value >= 55) return 'text-cyan-600 dark:text-cyan-400';
  if (value >= 35) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500';
}

export interface ScoreItem {
  label: string;
  value: number;
  weight: number;
  description: string;
}

export default function ScoreCard({
  title,
  overall,
  grade,
  items,
  methodology
}: {
  title: string;
  overall: number;
  grade: string;
  items: ScoreItem[];
  methodology: string;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          onClick={() => setShowInfo((s) => !s)}
          className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-tiktok-pink"
        >
          <Info size={13} /> How this works
        </button>
      </div>

      {showInfo && (
        <p className="mb-4 whitespace-pre-line rounded-lg bg-neutral-100 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {methodology}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-100 px-6 py-4 dark:bg-neutral-800 sm:w-40">
          <span className={clsx('text-4xl font-extrabold tabular-nums', scoreTextColor(overall))}>{overall}</span>
          <span className="text-xs text-neutral-400">/ 100</span>
          <span className={clsx('mt-1 text-center text-xs font-semibold', scoreTextColor(overall))}>{grade}</span>
        </div>

        <div className="flex-1 space-y-2.5">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-0.5 flex items-baseline justify-between text-xs">
                <span className="font-medium text-neutral-600 dark:text-neutral-300">
                  {item.label} <span className="text-neutral-400">({item.weight}%)</span>
                </span>
                <span className="tabular-nums text-neutral-400">{item.value}/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className={clsx('h-full rounded-full transition-all', scoreColor(item.value))}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
