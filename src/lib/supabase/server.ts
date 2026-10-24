import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseContext } from './context';

/** Server-side Supabase client bound to the current request's auth cookies.
 * Every query made through this client runs as the signed-in user, so RLS
 * (see supabase/schema.sql) enforces per-user data access automatically —
 * this is the ONLY client the app's data-access layer (src/lib/*) uses.
 *
 * If a background task set an explicit client via runWithSupabaseClient()
 * (see context.ts) — because it's still running after its triggering
 * request already returned, so cookies() is no longer valid — that client
 * is returned instead. */
export async function createClient() {
  const override = supabaseContext.getStore();
  if (override) return override;

  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component that can't set cookies — fine, the
          // middleware refreshes the session on every request anyway.
        }
      }
    }
  });
}
