import type { MetadataRoute } from 'next';
import { listPublishedContent } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  // /login is intentionally not listed here — it's not a content page
  // worth ranking (see docs/TECHNICAL_AUDIT.md §8), and now carries its
  // own noindex via login/layout.tsx instead.
  const guides = await listPublishedContent();

  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/free-tools`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/free-tools/engagement-rate-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/free-tools/money-calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/guides`, changeFrequency: 'weekly', priority: 0.7 },
    ...guides.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      // lastmod only reflects a real content change — see docs/TECHNICAL_AUDIT.md §6.3
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  ];
}
