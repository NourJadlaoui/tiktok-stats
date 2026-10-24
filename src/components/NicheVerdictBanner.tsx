import { NicheVerdict } from '@/lib/scoring';
import { Rocket, FlaskConical, ShieldAlert, Ban } from 'lucide-react';
import clsx from 'clsx';

const STYLES: Record<NicheVerdict['recommendation'], { icon: typeof Rocket; className: string }> = {
  'Start now': { icon: Rocket, className: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300' },
  'Worth testing': { icon: FlaskConical, className: 'border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300' },
  'Proceed with caution': { icon: ShieldAlert, className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300' },
  'Avoid for now': { icon: Ban, className: 'border-neutral-300 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300' }
};

export default function NicheVerdictBanner({ verdict }: { verdict: NicheVerdict }) {
  const style = STYLES[verdict.recommendation];
  const Icon = style.icon;
  return (
    <div className={clsx('flex items-start gap-3 rounded-xl border p-4', style.className)}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div>
        <h3 className="text-sm font-bold">{verdict.recommendation}</h3>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{verdict.summary}</p>
      </div>
    </div>
  );
}
