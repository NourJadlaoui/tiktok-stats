'use client';

import { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { ProfileHistoryPoint } from '@/lib/history';
import { formatCompactNumber } from '@/lib/stats';
import { formatMoney } from '@/lib/money';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Metric = 'followers' | 'totalViews' | 'totalLikes' | 'totalShares' | 'totalRevenue';

const PRECISE = new Intl.NumberFormat('en-US');

const METRICS: { key: Metric; label: string; color: string; format: (n: number) => string; precise: (n: number) => string }[] = [
  { key: 'followers', label: 'Followers', color: '#FE2C55', format: formatCompactNumber, precise: (n) => PRECISE.format(Math.round(n)) },
  { key: 'totalViews', label: 'Total views', color: '#25F4EE', format: formatCompactNumber, precise: (n) => PRECISE.format(Math.round(n)) },
  { key: 'totalLikes', label: 'Total likes', color: '#f472b6', format: formatCompactNumber, precise: (n) => PRECISE.format(Math.round(n)) },
  { key: 'totalShares', label: 'Total shares', color: '#a78bfa', format: formatCompactNumber, precise: (n) => PRECISE.format(Math.round(n)) },
  { key: 'totalRevenue', label: 'Est. revenue', color: '#10b981', format: (n) => formatMoney(n), precise: (n) => formatMoney(n) }
];

export default function ProfileHistoryCard({ history }: { history: ProfileHistoryPoint[] }) {
  const [metric, setMetric] = useState<Metric>('followers');

  // Hooks must run unconditionally on every render — history.length can
  // change between renders of the SAME mounted component (a manual "Sync
  // now" adds a new history point without unmounting this card), so an
  // early return before these would change the hook count render-to-render
  // and violate the Rules of Hooks (React's own "order of Hooks" warning).
  const chartData = useMemo(
    () =>
      history.map((h) => ({
        ...h,
        label: format(new Date(h.capturedAt), history.length > 20 ? 'MMM d' : 'MMM d, HH:mm')
      })),
    [history]
  );

  // Adaptive Y-domain instead of the default 0-anchored auto-range: real
  // sync-to-sync changes are often a small fraction of the absolute value
  // (e.g. 14,173 -> 14,210 followers), and a domain that always starts at 0
  // squashes that entire line into what looks like a flat stripe near the
  // top of the chart. Padding tightly around the actual min/max — with a
  // floor at 0, since none of these metrics can legitimately go negative —
  // makes real movement visible instead of imperceptible.
  const [yMin, yMax] = useMemo(() => {
    if (history.length < 2) return [0, 0];
    const values = history.map((h) => h[metric] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const pad = range === 0 ? Math.max(1, Math.abs(max) * 0.08) : range * 0.18;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [history, metric]);

  if (history.length < 2) {
    return (
      <div className="card p-4">
        <h2 className="mb-1 text-sm font-semibold">History since first synced</h2>
        <p className="py-6 text-center text-xs text-neutral-400">
          Not enough sync history yet — every time this channel is synced (automatically or via &quot;Sync now&quot;),
          a snapshot is saved here. Come back after a few syncs to see growth over time.
        </p>
      </div>
    );
  }

  const active = METRICS.find((m) => m.key === metric)!;
  const first = history[0];
  const last = history[history.length - 1];
  const delta = (last[metric] as number) - (first[metric] as number);
  const deltaPct = (first[metric] as number) > 0 ? (delta / (first[metric] as number)) * 100 : null;

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">History since first synced</h2>
          <p className="text-xs text-neutral-400">
            First tracked {format(new Date(first.capturedAt), 'MMM d, yyyy')} — {history.length} sync{history.length === 1 ? '' : 's'} recorded
          </p>
        </div>
        <select
          aria-label="Metric to display"
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2 flex items-center gap-1.5 text-sm">
        {delta >= 0 ? (
          <TrendingUp size={15} className="text-emerald-500" />
        ) : (
          <TrendingDown size={15} className="text-red-600 dark:text-red-400" />
        )}
        <span className="font-semibold">
          {delta >= 0 ? '+' : ''}
          {active.precise(delta)}
        </span>
        {deltaPct !== null && (
          <span className="text-xs text-neutral-400">
            ({deltaPct >= 0 ? '+' : ''}
            {deltaPct.toFixed(1)}%) since first sync
          </span>
        )}
        <span className="ml-auto text-xs text-neutral-400">Latest: {active.precise(last[metric] as number)}</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={active.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11 }}
            width={52}
            allowDecimals={false}
            tickFormatter={(v) => active.format(v)}
          />
          <Tooltip
            formatter={(value: number) => [active.precise(value), active.label]}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload as (ProfileHistoryPoint & { label: string }) | undefined;
              return point ? format(new Date(point.capturedAt), 'MMM d, yyyy \'at\' HH:mm') : label;
            }}
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={active.color}
            strokeWidth={2.5}
            fill="url(#historyGradient)"
            dot={{ r: 3, strokeWidth: 0, fill: active.color }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
