'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, AlertTriangle, Eye, Code } from 'lucide-react';
import MarkdownContent from '@/components/MarkdownContent';

export interface ContentFormValue {
  id?: string;
  type: 'guide' | 'blog' | 'faq';
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  seoTitle: string;
  seoDescription: string;
  coverImageUrl: string;
  coverImageAlt: string;
  tags: string;
}

const EMPTY: ContentFormValue = {
  type: 'guide',
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  coverImageUrl: '',
  coverImageAlt: '',
  tags: ''
};

/** Used for both /admin/content/new (initial=null) and /admin/content/[id]
 * (initial=the loaded item). Slug is only auto-derived from the title
 * while the admin hasn't touched the slug field themselves — editing an
 * existing published page never silently changes its live URL. */
export default function ContentEditor({ initial }: { initial?: ContentFormValue }) {
  const router = useRouter();
  const isNew = !initial;
  const [value, setValue] = useState<ContentFormValue>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof ContentFormValue>(key: K, val: ContentFormValue[K]) {
    setValue((v) => ({ ...v, [key]: val }));
  }

  function handleTitleChange(title: string) {
    update('title', title);
    if (!slugTouched) {
      update(
        'slug',
        title
          .trim()
          .toLowerCase()
          .replace(/['’]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  }

  async function save(statusOverride?: ContentFormValue['status']) {
    setSaving(true);
    setError(null);
    setSaved(false);
    const payload = {
      type: value.type,
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt,
      body: value.body,
      seoTitle: value.seoTitle || null,
      seoDescription: value.seoDescription || null,
      coverImageUrl: value.coverImageUrl || null,
      coverImageAlt: value.coverImageAlt || null,
      tags: value.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      ...(statusOverride ? { status: statusOverride } : {})
    };

    try {
      if (isNew) {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Could not create.');
        router.push(`/admin/content/${body.item.id}`);
        return;
      }

      const res = await fetch(`/api/admin/content/${initial!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not save.');
      if (statusOverride) update('status', statusOverride);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 sm:col-span-2">
          Title
          <input value={value.title} onChange={(e) => handleTitleChange(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          Type
          <select
            aria-label="Content type"
            value={value.type}
            onChange={(e) => update('type', e.target.value as ContentFormValue['type'])}
            className={inputClass}
          >
            <option value="guide">Guide</option>
            <option value="blog">Blog</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        Slug — publishes at /guides/{value.slug || '…'}
        <input
          value={value.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update('slug', e.target.value);
          }}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
        Excerpt (shown on the guides index and as a fallback meta description)
        <textarea value={value.excerpt} onChange={(e) => update('excerpt', e.target.value)} rows={2} className={inputClass} />
      </label>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-500">Body (Markdown)</span>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {preview ? <Code size={12} /> : <Eye size={12} />} {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[300px] rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <MarkdownContent markdown={value.body || '*Nothing to preview yet.*'} />
          </div>
        ) : (
          <textarea
            value={value.body}
            onChange={(e) => update('body', e.target.value)}
            rows={16}
            className={`${inputClass} font-mono`}
            placeholder="## Heading&#10;&#10;Write in Markdown — headings, lists, links, bold/italic, tables."
          />
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="mb-3 text-sm font-semibold">SEO &amp; metadata</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            SEO title (falls back to Title if empty)
            <input value={value.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Tags (comma-separated)
            <input value={value.tags} onChange={(e) => update('tags', e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500 sm:col-span-2">
            SEO description (falls back to Excerpt if empty)
            <textarea value={value.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} rows={2} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Cover image URL
            <input value={value.coverImageUrl} onChange={(e) => update('coverImageUrl', e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
            Cover image alt text
            <input value={value.coverImageAlt} onChange={(e) => update('coverImageAlt', e.target.value)} className={inputClass} />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save()}
          disabled={saving || !value.title.trim() || !value.slug.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {isNew ? 'Create draft' : saved ? 'Saved' : 'Save draft'}
        </button>
        {!isNew && value.status !== 'published' && (
          <button
            onClick={() => save('published')}
            disabled={saving || !value.title.trim() || !value.slug.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-tiktok-cyan to-tiktok-pink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Publish
          </button>
        )}
        {!isNew && value.status === 'published' && (
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Unpublish
          </button>
        )}
        {!isNew && (
          <span className="text-xs text-neutral-400">
            Status: <strong className="capitalize">{value.status}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
