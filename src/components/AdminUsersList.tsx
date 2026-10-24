'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, Users, UserCog, RefreshCw } from 'lucide-react';

interface AdminUserRow {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  channels: number;
  tracked: number;
  requestsThisMonth: number;
  planName: string;
  isSelf: boolean;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Could not load users (HTTP ${res.status}).`);
      setUsers(body.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users — make sure SUPABASE_SERVICE_ROLE_KEY is set.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function actAs(userId: string) {
    setActingId(userId);
    try {
      const res = await fetch('/api/admin/act-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error();
      router.push('/app');
      router.refresh();
    } catch {
      setError('Could not start impersonation.');
      setActingId(null);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
        <span>{error}</span>
        <button onClick={load} className="flex shrink-0 items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-xs font-medium hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }
  if (!users) return <p className="text-sm text-neutral-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{users.length} user{users.length === 1 ? '' : 's'}</span>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
      {users.map((u) => (
        <div key={u.id} className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <ShieldCheck size={15} className="text-neutral-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{u.email}</div>
            <div className="text-xs text-neutral-400">
              Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
              {u.lastSignInAt && ` · last seen ${formatDistanceToNow(new Date(u.lastSignInAt), { addSuffix: true })}`}
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {u.planName}
          </div>
          <div className="shrink-0 text-right text-xs text-neutral-400">
            <div>{u.channels} channels · {u.tracked} tracked</div>
            <div>{u.requestsThisMonth} requests this month</div>
          </div>
          <Link
            href={`/admin/${u.id}`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            <Users size={13} />
            View data
          </Link>
          {!u.isSelf && (
            <button
              onClick={() => actAs(u.id)}
              disabled={actingId === u.id}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-tiktok-pink/10 px-3 py-1.5 text-xs font-medium text-tiktok-pink hover:bg-tiktok-pink/20 disabled:opacity-60"
            >
              <UserCog size={13} />
              {actingId === u.id ? 'Starting…' : 'Act as'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
