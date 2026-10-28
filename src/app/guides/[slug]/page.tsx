import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { getPublishedContentBySlug, getRedirectTarget } from '@/lib/content';
import MarkdownContent from '@/components/MarkdownContent';

async function resolveContent(slug: string) {
  const item = await getPublishedContentBySlug(slug);
  if (item) return item;
  const redirectTo = await getRedirectTarget(slug);
  if (redirectTo) redirect(`/guides/${redirectTo}`);
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await resolveContent(slug);
  if (!item) return {};
  const title = item.seoTitle || item.title;
  const description = item.seoDescription || item.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/guides/${item.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: item.publishedAt ?? undefined,
      modifiedTime: item.updatedAt,
      images: item.coverImageUrl ? [{ url: item.coverImageUrl }] : undefined
    }
  };
}

function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await resolveContent(slug);
  if (!item) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': item.type === 'blog' ? 'BlogPosting' : 'Article',
    headline: item.title,
    ...(item.publishedAt ? { datePublished: item.publishedAt } : {}),
    dateModified: item.updatedAt,
    ...(item.authorName ? { author: { '@type': 'Person', name: item.authorName } } : {}),
    ...(item.coverImageUrl ? { image: [item.coverImageUrl] } : {})
  };

  return (
    <article className="flex flex-col gap-6 text-white">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center gap-1 text-xs text-neutral-400">
        <Link href="/guides" className="flex items-center gap-1 hover:text-white">
          <ArrowLeft size={12} /> Guides
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          {item.authorName && <span>{item.authorName}</span>}
          {item.publishedAt && (
            <>
              <span>·</span>
              <time dateTime={item.publishedAt}>{format(new Date(item.publishedAt), 'MMMM d, yyyy')}</time>
            </>
          )}
          <span>·</span>
          <span>{readingTime(item.body)} min read</span>
        </div>
      </header>

      {item.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverImageUrl} alt={item.coverImageAlt ?? ''} className="w-full rounded-2xl object-cover" />
      )}

      <MarkdownContent markdown={item.body} />

      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-6">
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-neutral-300">
            {tag}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
        <p className="text-sm text-neutral-300">See it applied on a real TikTok profile, free to try.</p>
        <Link
          href="/login"
          className="btn-sheen mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Try the full dashboard free
        </Link>
      </div>
    </article>
  );
}
