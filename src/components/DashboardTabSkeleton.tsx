/** Shown in place of a dashboard tab's content while it loads — the parent
 * layout.tsx (profile header + tab bar) is NOT re-rendered on tab-to-tab
 * navigation (Next.js preserves shared layouts across sibling routes), so
 * this only ever replaces the content area below the fixed tab bar,
 * matching the "tabs stay put, only the content area shows it's loading"
 * requirement. Every shape below traces the real content it stands in for
 * (score ring + bars, stat-card icon/number/label, chart axis) rather than
 * generic gray rectangles, the way Google/most polished apps skeleton their
 * loading states. */
export default function DashboardTabSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      {/* Score card shape: ring + weighted bars */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="skeleton h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2.5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="skeleton h-2.5 w-20 rounded-full" />
                  <div className="skeleton h-1.5 flex-1 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stat card grid: icon + big number + label */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card flex flex-col gap-2 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="skeleton h-2.5 w-14 rounded-full" />
              <div className="skeleton h-4 w-4 rounded" />
            </div>
            <div className="skeleton h-5 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Chart shapes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card flex flex-col gap-3 p-4">
            <div className="skeleton h-3 w-40 rounded-full" />
            <div className="flex h-48 items-end gap-2">
              {[40, 65, 50, 80, 55, 90, 60, 70, 45, 85].map((h, j) => (
                <div key={j} className="skeleton flex-1 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
