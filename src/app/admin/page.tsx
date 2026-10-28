import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import AdminUsersList from '@/components/AdminUsersList';
import AdminStatsOverview from '@/components/AdminStatsOverview';
import PlansManager from '@/components/PlansManager';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/app');

  const { providerFallback } = getConfig();

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Platform-wide analytics, per-user usage, plan pricing and the payment gateway toggle.
        Enforced by the database's RLS admin-bypass policy (see supabase/schema.sql), not just
        this page.
      </p>

      {providerFallback && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Data provider downgraded to the built-in TikTok scraper — {providerFallback.reason}. Every
            profile/niche scan is currently running on Playwright instead of {providerFallback.requested}.
            Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">RAPIDAPI_KEY</code> and
            restart to fix.
          </span>
        </div>
      )}

      <div className="mt-6">
        <AdminStatsOverview />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <AdminUsersList />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Plans &amp; billing</h2>
        <PlansManager />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Content</h2>
        <Link
          href="/admin/content"
          className="card flex items-center gap-3 p-4 transition hover:border-tiktok-pink"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-tiktok-cyan/15 to-tiktok-pink/15">
            <FileText size={18} className="text-tiktok-pink" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Guides &amp; blog</p>
            <p className="text-xs text-neutral-400">Write, preview and publish editorial content at /guides/&lt;slug&gt;</p>
          </div>
          <ArrowRight size={16} className="text-neutral-400" />
        </Link>
      </div>
    </div>
  );
}
