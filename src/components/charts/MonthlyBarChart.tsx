'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MonthlyBarChart({
  data,
  dataKey = 'count',
  color = '#25F4EE',
  valueLabel = 'Videos'
}: {
  data: { label: string; [key: string]: any }[];
  dataKey?: string;
  color?: string;
  valueLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip formatter={(value: number) => [value, valueLabel]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
