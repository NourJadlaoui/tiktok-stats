import { formatMoney, formatEur, usdToEur } from '@/lib/money';

/** Renders a USD revenue figure as whole dollars with thousands separators
 * (e.g. "$28,700"), with the approximate EUR equivalent shown as a native
 * tooltip on hover — no client JS needed, so this works in server
 * components too. `eurRate` is the configurable USD->EUR rate from
 * Settings (see src/lib/settings.ts getUsdToEurRate). */
export default function Money({ usd, eurRate, className }: { usd: number; eurRate: number; className?: string }) {
  const eur = usdToEur(usd, eurRate);
  return (
    <span className={className} title={`≈ ${formatEur(eur)} (rate: 1 USD ≈ ${eurRate.toFixed(2)} EUR)`}>
      {formatMoney(usd)}
    </span>
  );
}
