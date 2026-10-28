import type { Metadata } from 'next';

// Private, authenticated-only area — never worth ranking. Auth is the real
// access control (enforced server-side in each admin route); this noindex
// is the SEO-side complement to that, not a substitute for it.
export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
