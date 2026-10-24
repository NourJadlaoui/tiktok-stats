const USD_WHOLE = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/** Whole-dollar formatting for revenue totals/estimates (e.g. "$28,700") —
 * not for rates like RPM, where sub-dollar precision is the whole point. */
export function formatMoney(usd: number): string {
  return `$${USD_WHOLE.format(Math.round(usd))}`;
}

export function formatEur(eur: number): string {
  return `€${USD_WHOLE.format(Math.round(eur))}`;
}

export function usdToEur(usd: number, rate: number): number {
  return usd * rate;
}
