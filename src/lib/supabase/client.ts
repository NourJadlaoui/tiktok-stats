'use client';

import { createBrowserClient } from '@supabase/ssr';

/** Browser-side Supabase client — used from client components (e.g. the login
 * button's signInWithOAuth call). Reads the public URL/anon key, safe to
 * expose since RLS is what actually protects the data, not this key. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
