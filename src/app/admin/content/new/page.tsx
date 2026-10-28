import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import ContentEditor from '@/components/admin/ContentEditor';

export const dynamic = 'force-dynamic';

export default async function NewContentPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/app');

  return (
    <div className="mx-auto max-w-3xl py-10">
      <Link href="/admin/content" className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        <ArrowLeft size={13} /> Back to guides &amp; blog
      </Link>
      <h1 className="mt-2 text-2xl font-bold">New guide</h1>
      <div className="mt-6">
        <ContentEditor />
      </div>
    </div>
  );
}
