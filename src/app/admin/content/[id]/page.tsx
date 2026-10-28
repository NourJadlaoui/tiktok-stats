import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getContentByIdForAdmin } from '@/lib/content';
import ContentEditor from '@/components/admin/ContentEditor';

export const dynamic = 'force-dynamic';

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/app');

  const { id } = await params;
  const item = await getContentByIdForAdmin(id);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="flex items-center justify-between">
        <Link href="/admin/content" className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          <ArrowLeft size={13} /> Back to guides &amp; blog
        </Link>
        {item.status === 'published' && (
          <Link
            href={`/guides/${item.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-xs font-medium text-tiktok-pink hover:underline"
          >
            View live <ExternalLink size={12} />
          </Link>
        )}
      </div>
      <h1 className="mt-2 text-2xl font-bold">Edit guide</h1>
      <div className="mt-6">
        <ContentEditor
          initial={{
            id: item.id,
            type: item.type === 'faq' ? 'guide' : item.type,
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            body: item.body,
            status: item.status,
            seoTitle: item.seoTitle ?? '',
            seoDescription: item.seoDescription ?? '',
            coverImageUrl: item.coverImageUrl ?? '',
            coverImageAlt: item.coverImageAlt ?? '',
            tags: item.tags.join(', ')
          }}
        />
      </div>
    </div>
  );
}
