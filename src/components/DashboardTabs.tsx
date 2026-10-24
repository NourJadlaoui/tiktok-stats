'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutGrid, CalendarDays, PlaySquare, DollarSign, Hash } from 'lucide-react';

export default function DashboardTabs({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${username}`;

  const tabs = [
    { href: `${base}/overview`, label: 'Overview', icon: LayoutGrid },
    { href: `${base}/calendar`, label: 'Calendar', icon: CalendarDays },
    { href: `${base}/videos`, label: 'Videos', icon: PlaySquare },
    { href: `${base}/monetization`, label: 'Monetization', icon: DollarSign },
    { href: `${base}/seo`, label: 'SEO', icon: Hash }
  ];

  return (
    <div className="-mx-4 mb-6 overflow-x-auto border-b border-neutral-200 px-4 sm:mx-0 sm:px-0 dark:border-neutral-800">
      <nav className="flex min-w-max gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-tiktok-pink text-neutral-900 dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
