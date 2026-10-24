// Split out from settings.ts (which imports the server-only Supabase
// client) so client components can import this plain constant without
// pulling next/headers into the browser bundle.
export const SYNC_INTERVAL_OPTIONS = [4, 12, 24, 48] as const;
