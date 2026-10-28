import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold">
          <span className="gradient-text">NicheTok</span>
          <span>.io</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/free-tools" className="hover:text-white">Free Tools</Link>
          <Link href="/#pricing" className="hover:text-white">Pricing</Link>
          <Link href="/#faq" className="hover:text-white">FAQ</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
        </nav>
        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} NicheTok.io. Not affiliated with TikTok Inc.
        </p>
      </div>
    </footer>
  );
}
