'use client';

import { useEffect, useState } from 'react';
import { Globe2, Plus, Pencil, Trash2, Check, X, Languages as LanguagesIcon, Loader2 } from 'lucide-react';
import { LANGUAGE_NAMES } from '@/lib/languages';

export default function NicheTermsManager() {
  const [language, setLanguage] = useState('English');
  const [terms, setTerms] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function load(lang: string) {
    setTerms(null);
    setError(null);
    fetch(`/api/settings/niche-terms?language=${encodeURIComponent(lang)}`)
      .then((r) => r.json())
      .then((data) => setTerms(data.terms))
      .catch(() => setError('Could not load terms.'));
  }

  useEffect(() => load(language), [language]);

  async function handleAdd() {
    const term = newTerm.trim();
    if (!term) return;
    const res = await fetch('/api/settings/niche-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, term })
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'Could not add term.');
    setTerms(body.terms);
    setNewTerm('');
  }

  async function handleDelete(term: string) {
    const res = await fetch(`/api/settings/niche-terms?language=${encodeURIComponent(language)}&term=${encodeURIComponent(term)}`, {
      method: 'DELETE'
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'Could not delete term.');
    setTerms(body.terms);
  }

  function startEdit(term: string) {
    setEditing(term);
    setEditValue(term);
  }

  async function commitEdit(oldTerm: string) {
    const newValue = editValue.trim();
    setEditing(null);
    if (!newValue || newValue === oldTerm) return;
    const res = await fetch('/api/settings/niche-terms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, oldTerm, newTerm: newValue })
    });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'Could not edit term.');
    setTerms(body.terms);
  }

  async function handleTranslate() {
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/niche-terms/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: language })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Translation failed.');
      setTerms(body.terms);
    } catch (err: any) {
      setError(err.message || 'Translation failed.');
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Globe2 size={16} /> Niche Finder search terms
      </h2>
      <p className="mb-3 text-xs text-neutral-400">
        The candidate niche topics Niche Finder scans through for each language. Starts from a curated English list —
        add, edit, or delete terms for any language, or auto-translate the English list into a new one as a starting
        point using an open-source translation API.
      </p>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          {LANGUAGE_NAMES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {language !== 'English' && (
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium transition hover:border-tiktok-pink hover:text-tiktok-pink disabled:opacity-50 dark:border-neutral-700"
          >
            {translating ? <Loader2 size={13} className="animate-spin" /> : <LanguagesIcon size={13} />}
            {translating ? 'Translating…' : 'Translate from English'}
          </button>
        )}
        <span className="text-xs text-neutral-400">{terms ? `${terms.length} terms` : ''}</span>
      </div>

      {!terms ? (
        <p className="text-xs text-neutral-400">Loading…</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
          {terms.map((term) => (
            <div key={term} className="flex items-center justify-between gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm dark:bg-neutral-800">
              {editing === term ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit(term)}
                    className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-0.5 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  />
                  <button onClick={() => commitEdit(term)} className="text-emerald-500 hover:text-emerald-600">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-neutral-600">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="truncate">{term}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => startEdit(term)} className="text-neutral-400 hover:text-tiktok-pink" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(term)} className="text-neutral-400 hover:text-red-500" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {terms.length === 0 && <p className="py-2 text-center text-xs text-neutral-400">No terms yet — add one below.</p>}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`Add a term for ${language}…`}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={handleAdd}
          disabled={!newTerm.trim()}
          className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}
