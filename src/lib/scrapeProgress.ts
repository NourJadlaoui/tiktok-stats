// In-memory scrape progress, shared across requests within this Node
// process. Fine for a single-instance local app — the point is just to let
// the browser poll "how far along is this scrape" while the main fetch
// request is still in flight.

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

export function setProgress(username: string, update: Partial<Omit<ScrapeProgress, 'updatedAt'>>): void {
  const current = store().get(username);
  store().set(username, {
    status: 'starting',
    fetched: 0,
    total: 0,
    ...current,
    ...update,
    updatedAt: Date.now()
  });
}

export function getProgress(username: string): ScrapeProgress | undefined {
  return store().get(username);
}
