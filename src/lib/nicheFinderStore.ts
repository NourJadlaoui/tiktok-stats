import { NicheFinderRun } from './types';
import { createClient } from './supabase/server';
import { requireEffectiveUser } from './auth';

// Niche Finder runs live in their own table (niche_finder_runs) rather than
// mixed into the kv_* tables in db.ts — a full run (dozens of scanned
// niches, each with a profile list and SEO-style aggregates) is a lot
// bigger than the rest of the app's cached data, and grows with every run
// rather than staying roughly constant size like the profile/niche-search
// caches. Reads/writes go straight through Supabase per-call, always
// filtered/set to the effective user's id explicitly (never left to RLS to
// infer) — an admin's own session would otherwise see every user's runs
// mixed together, the same class of bug explained in sql/engine.ts.

export async function saveNicheFinderRun(run: NicheFinderRun): Promise<void> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { error } = await supabase.from('niche_finder_runs').upsert({
    id: run.id,
    user_id: effectiveUserId,
    started_at: run.startedAt,
    data: run as unknown as object
  });
  if (error) throw error;
}

export async function getNicheFinderRun(id: string): Promise<NicheFinderRun | undefined> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('niche_finder_runs')
    .select('data')
    .eq('user_id', effectiveUserId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? (data.data as unknown as NicheFinderRun) : undefined;
}

export async function listNicheFinderRuns(): Promise<NicheFinderRun[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('niche_finder_runs')
    .select('data')
    .eq('user_id', effectiveUserId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => row.data as unknown as NicheFinderRun);
}
