'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ITEMS = [
  {
    q: 'Is this real TikTok data, or estimates?',
    a: "Profile stats, video counts, likes, and posting history are pulled live from real TikTok pages — not synthetic data. Revenue is the one estimated figure, computed from an editable RPM (revenue per thousand views) since TikTok doesn't publish real earnings publicly."
  },
  {
    q: 'What do I get on the free trial?',
    a: 'Two full profile scans and access to every tool — growth analytics, calendar, monetization estimator, SEO insights, Niche Stats, and Niche Finder — so you can see exactly what a paid plan gets you before committing.'
  },
  {
    q: 'How is the Creator Score calculated?',
    a: 'A weighted 0-100 score across audience size, engagement rate, recent growth, posting consistency, and monetization potential — fully transparent, with the exact formula shown on every score card.'
  },
  {
    q: 'Can I track multiple creators at once?',
    a: "Yes — Bulk Search scans up to your plan's limit of usernames in one background job, and every profile you've looked up stays on your Accounts page with growth history over time."
  },
  {
    q: 'Do I need a TikTok account to use this?',
    a: 'No — everything works from public profile pages, no TikTok login required. You only need a Google account to sign in to TikTok Stats itself.'
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes, plans are month-to-month with no lock-in — manage or cancel your subscription anytime from the Billing page."
  }
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="card overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold">{item.q}</span>
              <ChevronDown size={16} className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <p className="animate-expand-down px-5 pb-4 text-sm text-neutral-500 dark:text-neutral-400">{item.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
