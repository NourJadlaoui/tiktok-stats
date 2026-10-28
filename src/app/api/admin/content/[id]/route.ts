import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getContentByIdForAdmin, updateContent, deleteContent } from '@/lib/content';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const item = await getContentByIdForAdmin(id);
  if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  for (const key of [
    'type',
    'title',
    'slug',
    'locale',
    'excerpt',
    'body',
    'status',
    'coverImageUrl',
    'coverImageAlt',
    'seoTitle',
    'seoDescription',
    'tags'
  ]) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const item = await updateContent(id, updates);
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not update content.' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    await deleteContent(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not delete content.' }, { status: 400 });
  }
}
