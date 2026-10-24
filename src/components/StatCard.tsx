import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'neutral'
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: LucideIcon;
  accent?: 'neutral' | 'cyan' | 'pink' | 'green' | 'amber';
}) {
  const accentClasses: Record<string, string> = {
    neutral: 'text-neutral-500',
    cyan: 'text-cyan-500',
    pink: 'text-pink-500',
    green: 'text-emerald-500',
    amber: 'text-amber-500'
  };

  return (
    <div className="card px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</span>
        {Icon && <Icon size={16} className={clsx(accentClasses[accent])} />}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-400">{sub}</div>}
    </div>
  );
}
