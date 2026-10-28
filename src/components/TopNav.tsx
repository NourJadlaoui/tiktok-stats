'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserSearch,
  Sparkles,
  Compass,
  Users,
  Bookmark,
  ListPlus,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import UserMenu from './UserMenu';

interface NavLink {
  href: string;
  label: string;
  icon: typeof UserSearch;
}

const DISCOVER_LINKS: NavLink[] = [
  { href: '/app', label: 'Profile Stats', icon: UserSearch },
  { href: '/niche', label: 'Niche Stats', icon: Sparkles },
  { href: '/niche-finder', label: 'Niche Finder', icon: Compass },
  { href: '/bulk', label: 'Bulk Search', icon: ListPlus }
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function NavLinkItem({ href, label, icon: Icon, pathname }: NavLink & { pathname: string }) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
      )}
    >
      <Icon size={16} />
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

function NavGroup({ label, icon: GroupIcon, links, pathname }: { label: string; icon: typeof UserSearch; links: NavLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = links.some((l) => isActive(pathname, l.href));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          active
            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
        )}
      >
        <GroupIcon size={16} />
        <span className="hidden lg:inline">{label}</span>
        <ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {links.map(({ href, label: linkLabel, icon: Icon }) => {
            const itemActive = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-2 text-sm',
                  itemActive
                    ? 'font-semibold text-neutral-900 dark:text-white'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                )}
              >
                <Icon size={15} /> {linkLabel}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface TopNavProps {
  name: string;
  email: string;
  avatarUrl: string;
  isAdmin: boolean;
  planName?: string;
  usagePercent?: number | null;
  usageLabel?: string;
}

export default function TopNav({ name, email, avatarUrl, isAdmin, planName, usagePercent, usageLabel }: TopNavProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/app" className="flex items-center gap-2 text-lg font-bold">
          <span className="gradient-text">NicheTok</span>
          <span>.io</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1 px-2">
          <NavGroup label="Discover" icon={Compass} links={DISCOVER_LINKS} pathname={pathname} />
          <NavLinkItem href="/accounts" label="History" icon={Users} pathname={pathname} />
          <NavLinkItem href="/tracked" label="Tracked" icon={Bookmark} pathname={pathname} />
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <UserMenu
            name={name}
            email={email}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
            planName={planName}
            usagePercent={usagePercent}
            usageLabel={usageLabel}
          />
        </div>
      </div>
    </header>
  );
}
