import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { listChannelsForUser } from '@/lib/channel';
import { getCategories } from '@/lib/settings';
import { buildGalleryRows } from '@/lib/galleryRows';
import { createAdminClient } from '@/lib/supabase/admin';
import AccountsTable from '@/components/AccountsTable';

export const dynamic = 'force-dynamic';

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) redirect('/app');

  const { userId } = await params;
  const adminClient = createAdminClient();
  const { data: target } = await adminClient.auth.admin.getUserById(userId);

  const [accounts, categories] = await Promise.all([listChannelsForUser(userId), getCategories()]);
  const rows = await buildGalleryRows(accounts, userId);

  return (
    <div className="mx-auto max-w-6xl py-10">
      <Link href="/admin" className="text-xs font-medium text-tiktok-pink hover:underline">
        ← All users
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <ShieldCheck size={20} className="text-neutral-400" />
        <h1 className="text-2xl font-bold">{target?.user?.email ?? userId}</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Viewing this user&apos;s data as admin — read-only, exactly what they see on their own Accounts page.
      </p>
      <div className="mt-6">
        <AccountsTable accounts={rows} categories={categories} />
      </div>
    </div>
  );
}
