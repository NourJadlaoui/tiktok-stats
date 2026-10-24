import { getStore, saveStore, StoreShape } from './db';
import { getConfig } from './config';
import { getBuiltInTermsForLanguage } from './nicheFinderTerms';
import { requireEffectiveUser } from './auth';

/** Seeds settings.rpmByNiche from config defaults the first time it's read,
 * so the Settings page has something to show/edit even before any user
 * changes — after that, the store (not config/credentials.json) is the
 * source of truth. */
export async function getRpmByNiche(): Promise<Record<string, number>> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (Object.keys(store.settings.rpmByNiche).length === 0) {
    store.settings.rpmByNiche = { ...getConfig().defaultRpmByNiche };
    await saveStore(store, effectiveUserId);
  }
  return store.settings.rpmByNiche;
}

export async function setRpmByNiche(niche: string, rpm: number): Promise<Record<string, number>> {
  const key = niche.trim().toLowerCase();
  if (!key) throw new Error('Niche name is required.');
  if (!Number.isFinite(rpm) || rpm < 0) throw new Error('RPM must be a non-negative number.');

  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (Object.keys(store.settings.rpmByNiche).length === 0) {
    store.settings.rpmByNiche = { ...getConfig().defaultRpmByNiche };
  }
  store.settings.rpmByNiche[key] = rpm;
  await saveStore(store, effectiveUserId);
  return store.settings.rpmByNiche;
}

export async function deleteRpmByNiche(niche: string): Promise<Record<string, number>> {
  const key = niche.trim().toLowerCase();
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (key === 'default') throw new Error('The "default" niche RPM can be edited but not deleted.');
  delete store.settings.rpmByNiche[key];
  await saveStore(store, effectiveUserId);
  return store.settings.rpmByNiche;
}

/** Full term list for a language — the user's custom/translated list if
 * they've edited that language before, otherwise the built-in curated list
 * (so the Settings page always has something to show, even for languages
 * nobody's touched yet). */
export async function getNicheTerms(language: string): Promise<string[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const custom = store.settings.nicheTermsByLanguage[language];
  return custom && custom.length > 0 ? custom : getBuiltInTermsForLanguage(language);
}

export async function getAllNicheTermOverrides(): Promise<Record<string, string[]>> {
  const { effectiveUserId } = await requireEffectiveUser();
  return (await getStore(effectiveUserId)).settings.nicheTermsByLanguage;
}

function ensureCustomList(store: StoreShape, language: string): string[] {
  if (!store.settings.nicheTermsByLanguage[language] || store.settings.nicheTermsByLanguage[language].length === 0) {
    store.settings.nicheTermsByLanguage[language] = [...getBuiltInTermsForLanguage(language)];
  }
  return store.settings.nicheTermsByLanguage[language];
}

export async function addNicheTerm(language: string, term: string): Promise<string[]> {
  const clean = term.trim();
  if (!clean) throw new Error('Term is required.');
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const list = ensureCustomList(store, language);
  if (!list.some((t) => t.toLowerCase() === clean.toLowerCase())) list.push(clean);
  await saveStore(store, effectiveUserId);
  return store.settings.nicheTermsByLanguage[language];
}

export async function editNicheTerm(language: string, oldTerm: string, newTerm: string): Promise<string[]> {
  const clean = newTerm.trim();
  if (!clean) throw new Error('Term is required.');
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const list = ensureCustomList(store, language);
  const idx = list.findIndex((t) => t.toLowerCase() === oldTerm.trim().toLowerCase());
  if (idx === -1) throw new Error(`"${oldTerm}" not found in ${language}.`);
  list[idx] = clean;
  await saveStore(store, effectiveUserId);
  return store.settings.nicheTermsByLanguage[language];
}

export async function deleteNicheTerm(language: string, term: string): Promise<string[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const list = ensureCustomList(store, language);
  const idx = list.findIndex((t) => t.toLowerCase() === term.trim().toLowerCase());
  if (idx !== -1) list.splice(idx, 1);
  await saveStore(store, effectiveUserId);
  return store.settings.nicheTermsByLanguage[language];
}

/** Replaces a language's whole term list at once — used after translating
 * the English list into a new target language. */
export async function setNicheTerms(language: string, terms: string[]): Promise<string[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const deduped = [...new Set(terms.map((t) => t.trim()).filter(Boolean))];
  store.settings.nicheTermsByLanguage[language] = deduped;
  await saveStore(store, effectiveUserId);
  return deduped;
}

/** Approximate USD->EUR rate for the money-figure hover tooltip. Seeded
 * from config.usdToEurRate the first time it's read, same pattern as RPM
 * defaults above — after that, the store is the source of truth. */
export async function getUsdToEurRate(): Promise<number> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (!store.settings.usdToEurRate) {
    store.settings.usdToEurRate = getConfig().usdToEurRate;
    await saveStore(store, effectiveUserId);
  }
  return store.settings.usdToEurRate;
}

export async function setUsdToEurRate(rate: number): Promise<number> {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Rate must be a positive number.');
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  store.settings.usdToEurRate = rate;
  await saveStore(store, effectiveUserId);
  return rate;
}

export const SYNC_INTERVAL_OPTIONS = [4, 12, 24, 48] as const;
export type SyncIntervalHours = (typeof SYNC_INTERVAL_OPTIONS)[number];

export async function getSyncIntervalHours(): Promise<number> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  return store.settings.syncIntervalHours || 24;
}

export async function setSyncIntervalHours(hours: number): Promise<number> {
  if (!SYNC_INTERVAL_OPTIONS.includes(hours as SyncIntervalHours)) {
    throw new Error(`Sync interval must be one of ${SYNC_INTERVAL_OPTIONS.join(', ')} hours.`);
  }
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  store.settings.syncIntervalHours = hours;
  await saveStore(store, effectiveUserId);
  return hours;
}

export interface ScoringThresholds {
  monthlyRevenueGoal: number;
  lifetimeRevenueGoal: number;
  activeWindowDays: number;
}

const DEFAULT_SCORING_THRESHOLDS: ScoringThresholds = {
  monthlyRevenueGoal: 1000,
  lifetimeRevenueGoal: 10000,
  activeWindowDays: 90
};

export async function getScoringThresholds(): Promise<ScoringThresholds> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  return store.settings.scoringThresholds || DEFAULT_SCORING_THRESHOLDS;
}

export async function setScoringThresholds(updates: Partial<ScoringThresholds>): Promise<ScoringThresholds> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  const current = store.settings.scoringThresholds || DEFAULT_SCORING_THRESHOLDS;
  const next = { ...current, ...updates };
  for (const [k, v] of Object.entries(next)) {
    if (!Number.isFinite(v) || (v as number) < 0) throw new Error(`${k} must be a non-negative number.`);
  }
  store.settings.scoringThresholds = next;
  await saveStore(store, effectiveUserId);
  return next;
}

/** Global list of creator category labels (e.g. "Competitor", "Client",
 * "Inspiration") the user has created — shared across every channel so
 * assigning/filtering by category stays consistent instead of being
 * arbitrary free text per profile. Starts empty; the user builds their own
 * list from the Overview tab's tracking card or Settings. */
export async function getCategories(): Promise<string[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  return store.settings.categories || [];
}

export async function addCategory(name: string): Promise<string[]> {
  const clean = name.trim();
  if (!clean) throw new Error('Category name is required.');
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (!store.settings.categories) store.settings.categories = [];
  if (!store.settings.categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
    store.settings.categories.push(clean);
    await saveStore(store, effectiveUserId);
  }
  return store.settings.categories;
}

export async function deleteCategory(name: string): Promise<string[]> {
  const { effectiveUserId } = await requireEffectiveUser();
  const store = await getStore(effectiveUserId);
  if (!store.settings.categories) store.settings.categories = [];
  store.settings.categories = store.settings.categories.filter((c) => c.toLowerCase() !== name.trim().toLowerCase());
  // Also remove it from any channel that had it assigned, so filters don't
  // reference a category that no longer exists anywhere in the picker.
  for (const channel of Object.values(store.channels)) {
    if (channel.categories?.length) {
      channel.categories = channel.categories.filter((c) => c.toLowerCase() !== name.trim().toLowerCase());
    }
  }
  await saveStore(store, effectiveUserId);
  return store.settings.categories;
}

// ISO 639-1 codes for the languages this app already offers elsewhere
// (see src/lib/languages.ts) — needed to call a LibreTranslate-compatible
// translation API, which addresses languages by short code, not display name.
export const LANGUAGE_ISO_CODES: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Portuguese: 'pt',
  Arabic: 'ar',
  Indonesian: 'id',
  German: 'de',
  Italian: 'it',
  Hindi: 'hi',
  Japanese: 'ja',
  Korean: 'ko',
  Turkish: 'tr',
  Vietnamese: 'vi',
  Thai: 'th',
  Russian: 'ru',
  Chinese: 'zh',
  Dutch: 'nl',
  Polish: 'pl',
  Ukrainian: 'uk',
  Romanian: 'ro',
  Greek: 'el',
  Swedish: 'sv',
  Filipino: 'tl',
  Urdu: 'ur',
  Bengali: 'bn',
  Persian: 'fa',
  Hebrew: 'he',
  Malay: 'ms'
};

export class TranslationError extends Error {}

/** Translates a batch of short niche-topic phrases from English into
 * `targetLanguage` using a configurable LibreTranslate-compatible API (see
 * translateApiUrl/translateApiKey in config). LibreTranslate is open-source
 * (https://github.com/LibreTranslate/LibreTranslate) and self-hostable —
 * the public instance this defaults to is free but can be slow/rate-limited,
 * so a self-hosted URL is recommended for heavy use (see README).
 *
 * Calls are made with limited concurrency (not all-at-once) to be a
 * reasonable citizen toward whichever instance is configured. Terms that
 * fail to translate individually are skipped rather than failing the whole
 * batch — a partial result the user can still review/edit is more useful
 * than nothing. */
export async function translateTerms(terms: string[], targetLanguage: string): Promise<string[]> {
  const targetCode = LANGUAGE_ISO_CODES[targetLanguage];
  if (!targetCode) throw new TranslationError(`No language code known for "${targetLanguage}".`);

  const { translateApiUrl, translateApiKey } = getConfig();
  const results: string[] = new Array(terms.length);
  const CONCURRENCY = 5;
  let cursor = 0;
  let sawSuccess = false;

  async function worker() {
    while (cursor < terms.length) {
      const i = cursor++;
      const term = terms[i];
      try {
        const res = await fetch(translateApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: term,
            source: 'en',
            target: targetCode,
            format: 'text',
            ...(translateApiKey ? { api_key: translateApiKey } : {})
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const translated = typeof json.translatedText === 'string' ? json.translatedText.trim() : '';
        if (translated) {
          results[i] = translated;
          sawSuccess = true;
        }
      } catch {
        // leave this one out of the result rather than failing the whole batch
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, terms.length) }, worker));

  if (!sawSuccess) {
    throw new TranslationError(
      `Could not reach the translation API at ${translateApiUrl}. It may be down, rate-limiting, or unreachable from this server — try again later, or set translateApiUrl in config/credentials.json to your own self-hosted LibreTranslate instance.`
    );
  }

  return results.filter(Boolean);
}
