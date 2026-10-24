import { CreatorVerdictResult } from '@/lib/scoring';
import { ScoringThresholds } from '@/lib/settings';
import Money from './Money';
import { Trophy, TrendingUp, Minus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

const VERDICT_STYLES: Record<CreatorVerdictResult['verdict'], { icon: typeof Trophy; className: string; label: string }> = {
  Winning: { icon: Trophy, className: 'border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-900/20', label: 'Winning' },
  Promising: { icon: TrendingUp, className: 'border-cyan-300 bg-cyan-50 dark:border-cyan-900/60 dark:bg-cyan-900/20', label: 'Promising' },
  'Not there yet': { icon: Minus, className: 'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900', label: 'Not there yet' },
  Inactive: { icon: AlertTriangle, className: 'border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-900/20', label: 'Inactive' }
};

export default function CreatorVerdictCard({
  verdict,
  thresholds,
  eurRate
}: {
  verdict: CreatorVerdictResult;
  thresholds: ScoringThresholds;
  eurRate: number;
}) {
  const style = VERDICT_STYLES[verdict.verdict];
  const Icon = style.icon;

  return (
    <div className={clsx('card flex flex-col gap-3 border p-4', style.className)}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <h2 className="text-sm font-bold">{style.label}</h2>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{verdict.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/60 px-3 py-2 text-xs dark:bg-black/20">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span>This month</span>
            {verdict.meetsMonthlyGoal ? (
              <CheckCircle2 size={13} className="text-emerald-500" />
            ) : (
              <XCircle size={13} className="text-neutral-300 dark:text-neutral-600" />
            )}
          </div>
          <div className="font-bold">
            <Money usd={verdict.monthlyRevenue} eurRate={eurRate} /> <span className="font-normal text-neutral-400">/ <Money usd={thresholds.monthlyRevenueGoal} eurRate={eurRate} /> goal</span>
          </div>
        </div>
        <div className="rounded-lg bg-white/60 px-3 py-2 text-xs dark:bg-black/20">
          <div className="mb-1 flex items-center justify-between text-neutral-400">
            <span>Lifetime</span>
            {verdict.meetsLifetimeGoal ? (
              <CheckCircle2 size={13} className="text-emerald-500" />
            ) : (
              <XCircle size={13} className="text-neutral-300 dark:text-neutral-600" />
            )}
          </div>
          <div className="font-bold">
            <Money usd={verdict.lifetimeRevenue} eurRate={eurRate} /> <span className="font-normal text-neutral-400">/ <Money usd={thresholds.lifetimeRevenueGoal} eurRate={eurRate} /> goal</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-neutral-400">
        Goals are editable in Settings — this reflects the channel default RPM, not exact TikTok payouts.
      </p>
    </div>
  );
}
