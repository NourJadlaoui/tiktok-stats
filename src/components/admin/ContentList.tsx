'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Plus, Loader2, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface ContentRow {
  id: string;
  type: 'guide' | 'blog' | 'faq';
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  updatedAt: string;
  publishedAt: string | null;
}

const STATUS_STYLE: Record<ContentRow['status'], string> = {
  draft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
};

export default function ContentList() {
  const [items, setItems] = useState<ContentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch('/api/admin/content', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Could not load content (HTTP ${res.status}).`);
      setItems(body.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load content.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: 'published' | 'draft') {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not update status.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not delete.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Guides and blog posts publish at <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">/guides/&lt;slug&gt;</code>.
          Drafts are never public or in the sitemap.
        </p>
        <Link
          href="/admin/content/new"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          <Plus size={14} /> New
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!items ? (
        <p className="py-8 text-center text-sm text-neutral-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-400">No content yet — create your first guide.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/content/${item.id}`} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                    <div className="text-xs text-neutral-400">/guides/{item.slug}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-neutral-500 dark:text-neutral-400">{item.type}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[item.status])}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'published' ? (
                        <button
                          onClick={() => setStatus(item.id, 'draft')}
                          disabled={busyId === item.id}
                          title="Unpublish"
                          className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          {busyId === item.id ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />} Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatus(item.id, 'published')}
                          disabled={busyId === item.id}
                          title="Publish"
                          className="flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          {busyId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Publish
                        </button>
                      )}
                      <button
                        onClick={() => remove(item.id, item.title)}
                        disabled={busyId === item.id}
                        title="Delete"
                        className="rounded-lg border border-neutral-300 p-1.5 text-neutral-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-red-900/60 dark:hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
