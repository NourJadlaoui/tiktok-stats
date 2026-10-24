const ITEMS = [
  'Growth Analytics',
  'Content Calendar',
  'Revenue Estimator',
  'SEO Insights',
  'Niche Stats',
  'Niche Finder',
  'Bulk Search',
  'Creator Score',
  'Tracking & History'
];

/** Infinite-scrolling word ticker — the list is duplicated once so the CSS
 * animation can translate exactly -50% and loop seamlessly forever. */
export default function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="w-full overflow-hidden border-y border-white/10 bg-white/5 py-3">
      <div className="animate-marquee flex w-max items-center gap-8">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wide text-white/70">
            {item}
            <span className="text-tiktok-pink">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
