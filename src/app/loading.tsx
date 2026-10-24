/** Next.js shows this automatically (via an implicit Suspense boundary)
 * while any top-level route segment is loading — the root layout (header)
 * above it stays mounted and visible the whole time, so navigating to a new
 * section never leaves the app looking frozen. Tab switches inside a
 * profile dashboard use their own more specific loading.tsx files instead
 * (see dashboard/[username]/*\/loading.tsx), which take precedence here. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex flex-col items-center gap-2 px-4 py-5">
            <div className="skeleton h-6 w-6 rounded" />
            <div className="skeleton h-2.5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
