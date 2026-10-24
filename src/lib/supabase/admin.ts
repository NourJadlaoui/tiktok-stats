import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Service-role client — bypasses RLS entirely. Server-only, and only ever
 * used for operations RLS structurally can't cover: listing every signed-up
 * user (Supabase Auth's user list isn't a regular table, so there's no RLS
 * policy to write for it) for the Admin page. Never import this from a
 * client component or expose SUPABASE_SERVICE_ROLE_KEY to the browser. */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — required for admin user listing.');
  }
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
