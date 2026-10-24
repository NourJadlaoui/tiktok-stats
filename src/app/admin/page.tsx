import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminUsersList from '@/components/AdminUsersList';
import AdminStatsOverview from '@/components/AdminStatsOverview';
import PlansManager from '@/components/PlansManager';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/app');

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Platform-wide analytics, per-user usage, plan pricing and the payment gateway toggle.
        Enforced by the database's RLS admin-bypass policy (see supabase/schema.sql), not just
        this page.
      </p>

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
    </div>
  );
}
