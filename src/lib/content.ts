import { createClient } from './supabase/server';
import { requireEffectiveUser } from './auth';

export type ContentType = 'guide' | 'blog' | 'faq';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  locale: string;
  excerpt: string;
  body: string;
  status: ContentStatus;
  authorId: string | null;
  authorName: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentInput {
  type: ContentType;
  title: string;
  slug: string;
  locale?: string;
  excerpt?: string;
  body?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags?: string[];
}

function mapContent(row: any): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    locale: row.locale,
    excerpt: row.excerpt ?? '',
    body: row.body ?? '',
    status: row.status,
    authorId: row.author_id,
    authorName: row.author_name ?? '',
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    tags: row.tags ?? [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireAdmin(): Promise<{ id: string; name: string }> {
  const { realUser } = await requireEffectiveUser();
  if (!realUser.isAdmin) throw new Error('Admin access required.');
  return { id: realUser.id, name: realUser.name };
}

export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

/** Admin-only — lists every status (draft/published/archived) so the admin
 * list page can show everything. RLS also allows this for an admin
 * session, but the app-level check here gives a clean 401/403 instead of
 * a confusing empty result for anyone else who somehow calls it. */
export async function listContentForAdmin(filters?: { type?: ContentType; status?: ContentStatus }): Promise<ContentItem[]> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase.from('content').select('*').order('updated_at', { ascending: false });
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapContent);
}

export async function getContentByIdForAdmin(id: string): Promise<ContentItem | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  return data ? mapContent(data) : null;
}

/** Public — only ever returns a published row (RLS would block a draft
 * for a non-admin anyway, but the explicit .eq keeps the intent obvious
 * and means an admin previewing drafts has to go through the admin
 * functions above, not this one, to see one). */
export async function getPublishedContentBySlug(slug: string, locale = 'en'): Promise<ContentItem | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('locale', locale)
    .eq('status', 'published')
    .maybeSingle();
  return data ? mapContent(data) : null;
}

export async function listPublishedContent(locale = 'en'): Promise<ContentItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('locale', locale)
    .eq('status', 'published')
    .in('type', ['guide', 'blog'])
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapContent);
}

/** Checked by the public /guides/[slug] page when a slug isn't live
 * content — returns the slug it now lives at, if this one was renamed
 * after being published, so an old indexed/shared link 301s forward
 * instead of 404ing. */
export async function getRedirectTarget(fromSlug: string, locale = 'en'): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_redirects')
    .select('to_slug')
    .eq('from_slug', fromSlug)
    .eq('locale', locale)
    .maybeSingle();
  return data?.to_slug ?? null;
}

async function slugTaken(slug: string, locale: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from('content').select('id').eq('slug', slug).eq('locale', locale);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function createContent(input: ContentInput): Promise<ContentItem> {
  const admin = await requireAdmin();
  const locale = input.locale ?? 'en';
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error('A title or slug is required.');
  if (await slugTaken(slug, locale)) {
    throw new Error(`The slug "${slug}" is already used by another ${locale} page.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content')
    .insert({
      type: input.type,
      title: input.title,
      slug,
      locale,
      excerpt: input.excerpt ?? '',
      body: input.body ?? '',
      status: 'draft',
      author_id: admin.id,
      author_name: admin.name,
      cover_image_url: input.coverImageUrl ?? null,
      cover_image_alt: input.coverImageAlt ?? null,
      seo_title: input.seoTitle ?? null,
      seo_description: input.seoDescription ?? null,
      tags: input.tags ?? []
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapContent(data);
}

export interface ContentUpdate extends Partial<ContentInput> {
  status?: ContentStatus;
}

export async function updateContent(id: string, updates: ContentUpdate): Promise<ContentItem> {
  await requireAdmin();
  const existing = await getContentByIdForAdmin(id);
  if (!existing) throw new Error('Content not found.');

  const locale = updates.locale ?? existing.locale;
  const patch: Record<string, unknown> = {};

  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.excerpt !== undefined) patch.excerpt = updates.excerpt;
  if (updates.body !== undefined) patch.body = updates.body;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.coverImageUrl !== undefined) patch.cover_image_url = updates.coverImageUrl;
  if (updates.coverImageAlt !== undefined) patch.cover_image_alt = updates.coverImageAlt;
  if (updates.seoTitle !== undefined) patch.seo_title = updates.seoTitle;
  if (updates.seoDescription !== undefined) patch.seo_description = updates.seoDescription;
  if (updates.tags !== undefined) patch.tags = updates.tags;

  let nextSlug = existing.slug;
  if (updates.slug !== undefined) {
    nextSlug = slugify(updates.slug);
    if (!nextSlug) throw new Error('Slug cannot be empty.');
    if (nextSlug !== existing.slug) {
      if (await slugTaken(nextSlug, locale, id)) {
        throw new Error(`The slug "${nextSlug}" is already used by another ${locale} page.`);
      }
      patch.slug = nextSlug;
    }
  }

  let nextStatus = existing.status;
  if (updates.status !== undefined && updates.status !== existing.status) {
    nextStatus = updates.status;
    patch.status = nextStatus;
    if (nextStatus === 'published' && existing.status !== 'published') {
      patch.published_at = new Date().toISOString();
    }
  }

  const supabase = await createClient();

  // The slug changed on a page that was (or still is) published — record a
  // redirect from the old slug so an already-indexed/shared URL keeps
  // working instead of 404ing. Only matters once it's actually been live;
  // renaming a draft before its first publish needs no redirect.
  if (patch.slug && existing.status === 'published') {
    const { error: redirectError } = await supabase
      .from('content_redirects')
      .upsert({ from_slug: existing.slug, locale, to_slug: nextSlug }, { onConflict: 'from_slug,locale' });
    if (redirectError) throw redirectError;
  }

  const { data, error } = await supabase.from('content').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return mapContent(data);
}

export async function deleteContent(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (error) throw error;
}
