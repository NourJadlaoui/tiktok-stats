'use client';

import { PostingTimeCell } from '@/lib/seo';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PostingHeatmap({ cells }: { cells: PostingTimeCell[] }) {
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-1 grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 text-[9px] text-neutral-400">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center">{h % 3 === 0 ? h : ''}</div>
          ))}
        </div>
        {WEEKDAYS.map((day, wd) => (
          <div key={day} className="mb-0.5 grid grid-cols-[40px_repeat(24,1fr)] items-center gap-0.5">
            <div className="text-[10px] font-medium text-neutral-400">{day}</div>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = cells.find((c) => c.weekdayIndex === wd && c.hour === h);
              const count = cell?.count ?? 0;
              const intensity = count === 0 ? 0 : Math.max(0.15, count / maxCount);
              return (
                <div
                  key={h}
                  title={cell ? `${day} ${h}:00 — ${count} videos, avg ${cell.avgViews.toLocaleString()} views` : ''}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: count === 0 ? 'rgba(163,163,163,0.12)' : `rgba(37,244,238,${intensity})`
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
