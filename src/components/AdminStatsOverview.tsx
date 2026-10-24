'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, Activity, Database, CreditCard, DollarSign } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers30d: number;
  scansThisMonth: number;
  totalProfilesScanned: number;
  payingSubscribers: number;
  mrrCents: number;
}

export default function AdminStatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total users', value: stats?.totalUsers ?? '—', icon: Users },
    { label: 'Active (30d)', value: stats?.activeUsers30d ?? '—', icon: UserCheck },
    { label: 'Scans this month', value: stats?.scansThisMonth ?? '—', icon: Activity },
    { label: 'Profiles on file', value: stats?.totalProfilesScanned ?? '—', icon: Database },
    { label: 'Paying subscribers', value: stats?.payingSubscribers ?? '—', icon: CreditCard },
    {
      label: 'MRR',
      value: stats ? `$${(stats.mrrCents / 100).toFixed(2)}` : '—',
      icon: DollarSign
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card flex flex-col gap-1.5 p-4">
          <Icon size={16} className="text-tiktok-pink" />
          <span className="text-lg font-bold tabular-nums">{value}</span>
          <span className="text-xs text-neutral-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
