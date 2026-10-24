'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChannelSettings } from '@/lib/types';
import { NICHES } from '@/lib/dataProviders/mock';
import { LANGUAGE_NAMES } from '@/lib/languages';
import { Check } from 'lucide-react';

const LANGUAGES = ['Unknown', ...LANGUAGE_NAMES];

export default function ChannelSettingsForm({ settings }: { settings: ChannelSettings }) {
  const router = useRouter();
  const [niche, setNiche] = useState(settings.niche);
  const [language, setLanguage] = useState(settings.language);
  const [rpm, setRpm] = useState(settings.rpm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/channel/${settings.username}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, language, rpm })
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold">Monetization settings</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          Niche
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {NICHES.map((n) => (
              <option key={n.key} value={n.key}>{n.label}</option>
            ))}
            <option value="default">Other / General</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          RPM ($ per 1,000 views)
          <input
            type="number"
            step="0.01"
            min={0}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {saved ? <Check size={15} /> : null}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
        </button>
        <p className="text-xs text-neutral-400">
          RPM is fully manual — set it to whatever rate you actually earn. It drives every revenue estimate on this dashboard.
        </p>
      </div>
    </div>
  );
}
