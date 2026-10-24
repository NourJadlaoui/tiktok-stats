'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function AccountSearchBox() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;
    router.push(`/dashboard/${clean}/overview`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">@</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="add a username to track"
          className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <button
        type="submit"
        disabled={!username.trim()}
        className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        <Search size={14} />
        Add
      </button>
    </form>
  );
}
