'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useChannelData } from './dashboard/ChannelDataContext';

/** Downloads everything currently loaded for this profile as a single JSON
 * file — profile info, every fetched video, monetization settings, score
 * thresholds, sync history, and this user's own tracking notes/categories.
 * Meant to be handed to an AI for a full analysis, so it includes
 * everything already on the dashboard rather than a curated subset. Reads
 * straight from the same cached context the tabs use, so it costs no extra
 * API call and always matches what's currently on screen. */
export default function ExportDataButton() {
  const bundle = useChannelData();
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    try {
      const { data, eurRate, thresholds, history, tracking, categories } = bundle;
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: data.profile,
        settings: data.settings,
        provider: data.provider,
        videosComplete: data.videosComplete,
        lastSyncedAt: data.lastSyncedAt,
        firstSyncedAt: data.firstSyncedAt,
        videoCount: data.videos.length,
        videos: data.videos,
        usdToEurRate: eurRate,
        scoringThresholds: thresholds,
        history,
        myTracking: tracking,
        allCategories: categories
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tiktok-${data.profile.username}-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title="Download this profile's full data as JSON"
      className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <Download size={13} />
      Export data
    </button>
  );
}
