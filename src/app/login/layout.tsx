import type { Metadata } from 'next';

// login/page.tsx is a client component ('use client'), which can't export
// its own `metadata` — this layout exists purely to attach it. Login isn't
// a content page worth ranking (see docs/TECHNICAL_AUDIT.md §8 / the
// NicheTok.io brief §6.2), so it's noindex, not listed in sitemap.ts, but
// still crawlable (no robots.txt disallow) since noindex alone already
// keeps it out of search results without hiding it from crawlers.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
