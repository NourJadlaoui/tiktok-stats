'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatCompactNumber } from '@/lib/stats';

export default function CumulativeVideosChart({
  data
}: {
  data: { key: string; label: string; videos: number; views: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="videosGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FE2C55" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FE2C55" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={30} />
        <YAxis
          yAxisId="videos"
          tick={{ fontSize: 11 }}
          width={40}
          label={{ value: 'Videos', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#a3a3a3' }}
        />
        <YAxis
          yAxisId="views"
          orientation="right"
          tick={{ fontSize: 11 }}
          width={48}
          tickFormatter={(v) => formatCompactNumber(v)}
          label={{ value: 'Views', angle: 90, position: 'insideRight', fontSize: 11, fill: '#a3a3a3' }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === 'views' ? formatCompactNumber(value) : value,
            name === 'views' ? 'Total views' : 'Total videos'
          ]}
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
        />
        <Legend
          formatter={(value) => (value === 'views' ? 'Cumulative views' : 'Cumulative videos')}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          yAxisId="videos"
          type="monotone"
          dataKey="videos"
          stroke="#FE2C55"
          strokeWidth={2.5}
          fill="url(#videosGradient)"
        />
        <Line yAxisId="views" type="monotone" dataKey="views" stroke="#25F4EE" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
