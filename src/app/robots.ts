import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app', '/dashboard', '/admin', '/billing', '/settings', '/api', '/accounts', '/tracked', '/bulk', '/niche', '/niche-finder'] }
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'}/sitemap.xml`
  };
}
