import Link from 'next/link';

/** Shared header for every public (unauthenticated) page — the landing
 * page and the Free Tools section. The #anchor links work both on the
 * landing page itself (smooth scroll) and from any other public page
 * (Next.js navigates to / first, then scrolls to the anchor). */
export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-neutral-950/80 px-4 py-3 text-white backdrop-blur sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <span className="gradient-text">NicheTok</span>
        <span>.io</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/#features" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
          Features
        </Link>
        <Link href="/free-tools" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
          Free Tools
        </Link>
        <Link href="/guides" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
          Guides
        </Link>
        <Link href="/#pricing" className="hidden text-sm font-medium text-neutral-300 hover:text-white sm:block">
          Pricing
        </Link>
        <Link href="/faq" className="hidden text-sm font-medium text-neutral-300 hover:text-white md:block">
          FAQ
        </Link>
        <Link
          href="/login"
          className="btn-sheen rounded-lg bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:px-4"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
