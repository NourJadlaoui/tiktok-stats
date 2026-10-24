'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';

/** Forces an instant re-scan regardless of the configured auto-sync
 * interval (see Settings > Sync & currency) — the interval only governs
 * whether a page load triggers a scan automatically; this button always
 * does one on demand. */
export default function RefreshButton({ username }: { username: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/profile/${encodeURIComponent(username)}?refresh=1`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Sync now — forces an instant re-scan from TikTok"
      className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <RefreshCw size={13} className={clsx(loading && 'animate-spin')} />
      {loading ? 'Syncing…' : 'Sync now'}
    </button>
  );
}
