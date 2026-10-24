'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ChannelData } from '@/lib/types';
import type { ScoringThresholds } from '@/lib/settings';
import type { ProfileHistoryPoint } from '@/lib/history';
import type { ChannelTracking } from '@/lib/channel';

export interface ChannelDataBundle {
  data: ChannelData;
  eurRate: number;
  thresholds: ScoringThresholds;
  history: ProfileHistoryPoint[];
  tracking: ChannelTracking;
  categories: string[];
  isAdmin: boolean;
}

interface ChannelDataContextValue extends ChannelDataBundle {
  /** Applies a just-saved per-video RPM override to the cached video list,
   * so Monetization/SEO/etc. reflect it immediately without an extra fetch,
   * and it survives leaving and returning to the Videos tab within this
   * session (the tab page remounts on each visit and reads from this
   * cache, not from the server, until the profile is re-synced). */
  updateVideoRpmOverride: (videoId: string, rpm: number | null) => void;
  /** Same idea for the "My tracking" card's tracked/categories/score/notes. */
  updateTracking: (updates: Partial<ChannelTracking>) => void;
  /** Same idea for the global category list after adding a new one. */
  updateCategories: (categories: string[]) => void;
}

const ChannelDataContext = createContext<ChannelDataContextValue | null>(null);

/** Lives inside dashboard/[username]/layout.tsx, wrapping the tab pages.
 * Next.js does not re-render a layout when navigating between the sibling
 * routes it wraps (Overview <-> Calendar <-> Videos <-> ...), so the
 * `bundle` prop the layout passes down stays exactly as it was for every
 * tab switch within one profile — no extra fetch needed for that case.
 *
 * The layout *does* re-render (producing a new `bundle`) for a real reason:
 * navigating to a different profile, or an explicit refresh (Sync now, or
 * saving channel settings — both call router.refresh()). The effect below
 * adopts that new bundle wholesale. Between those moments, small local
 * mutations (an RPM override, a tracking edit) are applied directly to this
 * component's own state via the update* functions, so they're visible
 * immediately and survive a tab switch, without needing a round trip back
 * to the server just to read back what was just written. */
export function ChannelDataProvider({ bundle, children }: { bundle: ChannelDataBundle; children: ReactNode }) {
  const [state, setState] = useState(bundle);

  useEffect(() => {
    setState(bundle);
  }, [bundle]);

  const value: ChannelDataContextValue = {
    ...state,
    updateVideoRpmOverride: (videoId, rpm) =>
      setState((s) => ({
        ...s,
        data: { ...s.data, videos: s.data.videos.map((v) => (v.id === videoId ? { ...v, rpmOverride: rpm } : v)) }
      })),
    updateTracking: (updates) => setState((s) => ({ ...s, tracking: { ...s.tracking, ...updates } })),
    updateCategories: (categories) => setState((s) => ({ ...s, categories }))
  };

  return <ChannelDataContext.Provider value={value}>{children}</ChannelDataContext.Provider>;
}

export function useChannelData(): ChannelDataContextValue {
  const ctx = useContext(ChannelDataContext);
  if (!ctx) throw new Error('useChannelData must be used within a ChannelDataProvider');
  return ctx;
}
