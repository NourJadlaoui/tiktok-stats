import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listContentForAdmin, createContent, ContentType, ContentStatus } from '@/lib/content';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const type = req.nextUrl.searchParams.get('type') as ContentType | null;
  const status = req.nextUrl.searchParams.get('status') as ContentStatus | null;
  try {
    const items = await listContentForAdmin({ type: type ?? undefined, status: status ?? undefined });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not list content.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.type) {
    return NextResponse.json({ error: 'title and type are required.' }, { status: 400 });
  }
  try {
    const item = await createContent({
      type: body.type,
      title: body.title,
      slug: body.slug || body.title,
      locale: body.locale,
      excerpt: body.excerpt,
      body: body.body,
      coverImageUrl: body.coverImageUrl,
      coverImageAlt: body.coverImageAlt,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      tags: body.tags
    });
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not create content.' }, { status: 400 });
  }
}
