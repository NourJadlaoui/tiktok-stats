'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: string;
}

/** Same accordion as the landing page's Faq, parameterized so each Free
 * Tool / guide can show questions specific to it. Kept in the visible DOM
 * (not hidden behind JS-only rendering) so it's also real, crawlable page
 * content — see docs/TECHNICAL_AUDIT.md and the NicheTok.io brief §8 on
 * why this is NOT paired with FAQPage JSON-LD: Google currently limits
 * that rich result to government/health sites, so adding the markup here
 * would be a promise this app can't keep, not an SEO win. */
export default function ToolFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, i) => {
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
