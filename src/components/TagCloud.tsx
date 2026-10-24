import Link from 'next/link';

export default function TagCloud({
  items,
  labelKey = 'word',
  prefix = '',
  hrefFor
}: {
  items: { count: number; [key: string]: any }[];
  labelKey?: string;
  prefix?: string;
  /** When provided, each tag becomes a link built from this function (e.g. filter the Videos tab). */
  hrefFor?: (value: string) => string;
}) {
  if (items.length === 0) return <p className="text-sm text-neutral-400">Not enough data yet.</p>;
  const max = Math.max(...items.map((i) => i.count));
  const min = Math.min(...items.map((i) => i.count));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const t = max === min ? 1 : (item.count - min) / (max - min);
        const size = 0.75 + t * 1.1; // rem-ish scale factor via font-size below
        const label = item[labelKey];
        const className =
          'rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-700 transition hover:bg-tiktok-pink hover:text-white dark:bg-neutral-800 dark:text-neutral-200';
        const content = (
          <>
            {prefix}
            {label}
            <span className="ml-1 text-neutral-400 group-hover:text-white/70">{item.count}</span>
          </>
        );

        if (hrefFor) {
          return (
            <Link
              key={label}
              href={hrefFor(label)}
              title={`${item.count} uses — click to see these videos`}
              className={`group ${className}`}
              style={{ fontSize: `${size * 0.85}rem` }}
            >
              {content}
            </Link>
          );
        }

        return (
          <span key={label} title={`${item.count} uses`} className={className} style={{ fontSize: `${size * 0.85}rem` }}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
