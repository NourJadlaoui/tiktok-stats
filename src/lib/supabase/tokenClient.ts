import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** A Supabase client authenticated via an explicit bearer token instead of
 * request cookies — PostgREST validates the JWT and RLS applies exactly as
 * it would for that user's normal cookie-based session. This is what makes
 * it safe to hand off to a background task that outlives its triggering
 * request (see context.ts). */
export function createTokenClient(accessToken: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
