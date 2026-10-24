import { AsyncLocalStorage } from 'async_hooks';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Lets a fire-and-forget background task (Niche Finder's batch scan, the
 * Bulk Search scan job) "carry" an explicit, already-authenticated Supabase
 * client through every lib function it calls — those functions all just
 * call createClient() from ./server.ts as normal, which checks here first.
 * Needed because next/headers' cookies() (the normal per-request session
 * source) is only valid while the triggering HTTP request is still being
 * handled, and these tasks keep running long after that request returns. */
export const supabaseContext = new AsyncLocalStorage<SupabaseClient>();

export function runWithSupabaseClient<T>(client: SupabaseClient, fn: () => Promise<T>): Promise<T> {
  return supabaseContext.run(client, fn);
}
