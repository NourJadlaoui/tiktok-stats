import { randomUUID } from 'crypto';
import { getNicheSearchResult } from './nicheSearch';
import { computeOpportunityTag } from './scoring';
import { getNicheTermsForLanguages, applyCoverage, CoverageLevel } from './nicheFinderTerms';
import { getAllNicheTermOverrides } from './settings';
import { saveNicheFinderRun, getNicheFinderRun } from './nicheFinderStore';
import { NicheFinderRun, NicheFinderResult } from './types';
import { runWithSupabaseClient } from './supabase/context';
import { createTokenClient } from './supabase/tokenClient';

/** Kicks off a background scan across many niche terms for the given
 * languages and returns immediately with a run id — the scan itself
 * continues after the HTTP response, with progress/results persisted
 * incrementally (see nicheFinderStore.ts) so the UI can poll for updates
 * (see /api/niche-finder/status) even across a page reload. Only the quick
 * setup (building the term list, writing the initial run row) is awaited
 * here — processRun() below is deliberately NOT awaited, so the caller
 * doesn't block on the full multi-minute batch scan.
 *
 * `accessToken` is the caller's current session token, captured before
 * their request returns — processRun keeps running after that, when
 * next/headers' cookie-based auth is no longer readable (the request that
 * triggered it has already finished), so it needs its own explicit,
 * already-authenticated Supabase client (see supabase/context.ts). */
export async function startNicheFinderRun(
  languages: string[],
  maxVideosPerNiche: number,
  coverage: CoverageLevel,
  accessToken: string
): Promise<string> {
  const id = randomUUID();
  const overrides = await getAllNicheTermOverrides();
  const terms = applyCoverage(getNicheTermsForLanguages(languages, overrides), coverage);

  const run: NicheFinderRun = {
    id,
    languages,
    maxVideosPerNiche,
    status: 'running',
    startedAt: new Date().toISOString(),
    termsTotal: terms.length,
    termsCompleted: 0,
    results: []
  };
  await saveNicheFinderRun(run);

  const tokenClient = createTokenClient(accessToken);
  void runWithSupabaseClient(tokenClient, async () => {
    try {
      await processRun(id, terms, maxVideosPerNiche);
    } catch (err) {
      const current = await getNicheFinderRun(id);
      if (!current) return;
      current.status = 'error';
      current.error = err instanceof Error ? err.message : String(err);
      current.finishedAt = new Date().toISOString();
      await saveNicheFinderRun(current);
    }
  });

  return id;
}

async function processRun(id: string, terms: { term: string; language: string }[], maxVideosPerNiche: number) {
  for (const { term, language } of terms) {
    const before = await getNicheFinderRun(id);
    if (!before) return; // run was removed
    before.currentTerm = term;
    await saveNicheFinderRun(before);

    let entry: NicheFinderResult;
    try {
      const result = await getNicheSearchResult(term, maxVideosPerNiche, false, 'niche_finder_term');
      const top = result.profiles[0];
      entry = {
        term,
        language,
        score: result.score,
        profilesFound: result.profilesFound,
        videosScanned: result.videosScanned,
        topProfile: top
          ? { username: top.username, displayName: top.displayName, avatarUrl: top.avatarUrl, followers: top.followers }
          : null,
        opportunityTag: computeOpportunityTag(result.score),
        fetchedAt: result.fetchedAt
      };
    } catch (err) {
      entry = {
        term,
        language,
        score: { demand: 0, momentum: 0, competition: 0, engagement: 0, overall: 0, grade: 'Low demand' },
        profilesFound: 0,
        videosScanned: 0,
        topProfile: null,
        opportunityTag: null,
        fetchedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err)
      };
    }

    const after = await getNicheFinderRun(id);
    if (!after) return;
    after.results.push(entry);
    after.termsCompleted++;
    after.currentTerm = undefined;
    await saveNicheFinderRun(after);
  }

  const final = await getNicheFinderRun(id);
  if (!final) return;
  final.status = 'done';
  final.finishedAt = new Date().toISOString();
  final.results.sort((a, b) => b.score.overall - a.score.overall);
  await saveNicheFinderRun(final);
}
