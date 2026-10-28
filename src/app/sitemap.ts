import type { MetadataRoute } from 'next';
import { listPublishedContent } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  // /login is intentionally not listed here — it's not a content page
  // worth ranking (see docs/TECHNICAL_AUDIT.md §8), and now carries its
  // own noindex via login/layout.tsx instead.
  // A Supabase hiccup here must not take the ENTIRE sitemap down with it —
  // that would stop the static pages below from being (re)indexed too, for
  // a reason that has nothing to do with them. Degrade to "no guides listed
  // this time" instead of a 500; the next crawl picks them up once the
  // database is reachable again.
  let guides: Awaited<ReturnType<typeof listPublishedContent>> = [];
  try {
    guides = await listPublishedContent();
  } catch (err) {
    console.error('[sitemap] could not list published guides — omitting them from this build', err);
  }

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/free-tools`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/free-tools/engagement-rate-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/free-tools/money-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    ...guides.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      // lastmod only reflects a real content change — see docs/TECHNICAL_AUDIT.md §6.3
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  ];
}
