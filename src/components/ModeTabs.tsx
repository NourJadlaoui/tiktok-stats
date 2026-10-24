'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { UserSearch, Sparkles, Compass, ListPlus } from 'lucide-react';

export default function ModeTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: '/app', label: 'Profile Stats', icon: UserSearch, description: 'Look up one TikTok page' },
    { href: '/niche', label: 'Niche Stats', icon: Sparkles, description: 'Discover top profiles for a topic' },
    { href: '/niche-finder', label: 'Niche Finder', icon: Compass, description: 'Auto-scan many niches at once' },
    { href: '/bulk', label: 'Bulk Search', icon: ListPlus, description: 'Scan many usernames at once' }
  ];

  return (
    <div className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
