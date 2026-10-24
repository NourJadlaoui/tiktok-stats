'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog } from 'lucide-react';

export default function ActingAsBanner({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function exit() {
    setLoading(true);
    await fetch('/api/admin/act-as', { method: 'DELETE' });
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-medium text-amber-950 dark:bg-amber-500">
      <UserCog size={14} className="shrink-0" />
      <span>
        Acting as <strong>{email}</strong> — viewing their full dashboard.
      </span>
      <button
        onClick={exit}
        disabled={loading}
        className="ml-2 rounded bg-amber-950/10 px-2 py-0.5 font-semibold hover:bg-amber-950/20 disabled:opacity-60"
      >
        {loading ? 'Exiting…' : 'Exit'}
      </button>
    </div>
  );
}
