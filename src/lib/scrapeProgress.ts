// In-memory scrape progress, shared across requests within this Node
// process. Fine for a single-instance deployment — the point is just to let
// the browser poll "how far along is this scrape" while the main fetch
// request is still in flight.
//
// Keyed by (ownerId, subject) rather than subject alone: two different
// accounts scanning the same TikTok username (or the same Niche Stats
// term) at the same time must never see or overwrite each other's
// progress. `ownerId` is always the caller's effectiveUserId (see
// auth.ts's requireEffectiveUser()) — the same identity every other
// per-user data access in this app is scoped by.

export interface ScrapeProgress {
  status: 'starting' | 'profile' | 'scraping' | 'done' | 'error';
  fetched: number;
  total: number;
  message?: string;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __tiktokScrapeProgress: Map<string, ScrapeProgress> | undefined;
}

function store(): Map<string, ScrapeProgress> {
  if (!globalThis.__tiktokScrapeProgress) globalThis.__tiktokScrapeProgress = new Map();
  return globalThis.__tiktokScrapeProgress;
}

function key(ownerId: string, subject: string): string {
  return `${ownerId}:${subject}`;
}

export function setProgress(ownerId: string, subject: string, update: Partial<Omit<ScrapeProgress, 'updatedAt'>>): void {
  const k = key(ownerId, subject);
  const current = store().get(k);
  store().set(k, {
    status: 'starting',
    fetched: 0,
    total: 0,
    ...current,
    ...update,
    updatedAt: Date.now()
  });
}

export function getProgress(ownerId: string, subject: string): ScrapeProgress | undefined {
  return store().get(key(ownerId, subject));
}
