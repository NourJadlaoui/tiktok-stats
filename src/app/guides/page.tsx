import type { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { listPublishedContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Guides on TikTok growth metrics, niche research and creator analytics.',
  alternates: { canonical: '/guides' }
};

export default async function GuidesIndexPage() {
  const guides = await listPublishedContent();

  return (
    <div className="flex flex-col gap-8 text-white">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Guides</h1>
        <p className="mt-3 max-w-xl text-neutral-300">
          Practical guides on TikTok growth metrics, niche research and creator analytics.
        </p>
      </div>

      {guides.length === 0 ? (
        <p className="text-sm text-neutral-400">No guides published yet — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {guides.map((g) => (
            <Link
              key={g.id}
              href={`/guides/${g.slug}`}
              className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/20 hover:bg-white/10"
            >
              <span className="text-xs font-medium text-neutral-400">
                {g.publishedAt ? format(new Date(g.publishedAt), 'MMM d, yyyy') : null}
              </span>
              <h2 className="text-lg font-semibold">{g.title}</h2>
              {g.excerpt && <p className="text-sm text-neutral-400">{g.excerpt}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
