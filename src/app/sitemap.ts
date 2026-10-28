import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  // /login is intentionally not listed here — it's not a content page
  // worth ranking (see docs/TECHNICAL_AUDIT.md §8), and now carries its
  // own noindex via login/layout.tsx instead.
  return [{ url: `${base}/`, changeFrequency: 'weekly', priority: 1 }];
}
