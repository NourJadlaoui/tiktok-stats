import clsx from 'clsx';

function scoreClasses(value: number): string {
  if (value >= 75) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (value >= 55) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300';
  if (value >= 35) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300';
}

export default function ScoreBadge({ overall, label = 'Score' }: { overall: number; label?: string }) {
  return (
    <span
      title={`${label}: ${overall}/100`}
      className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums', scoreClasses(overall))}
    >
      {overall}
    </span>
  );
}
