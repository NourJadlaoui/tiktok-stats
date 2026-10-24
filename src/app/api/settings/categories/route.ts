import { NextRequest, NextResponse } from 'next/server';
import { getCategories, addCategory, deleteCategory } from '@/lib/settings';

export async function GET() {
  return NextResponse.json(await getCategories());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name : '';
  try {
    const categories = await addCategory(name);
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not add category.' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') || '';
  const categories = await deleteCategory(name);
  return NextResponse.json(categories);
}
