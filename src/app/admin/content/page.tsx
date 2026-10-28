import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ContentList from '@/components/admin/ContentList';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/app');

  return (
    <div className="mx-auto max-w-5xl py-10">
      <h1 className="text-2xl font-bold">Guides &amp; blog</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Write, preview, publish and unpublish editorial content. Nothing here is public until you publish it.
      </p>
      <div className="mt-6">
        <ContentList />
      </div>
    </div>
  );
}
