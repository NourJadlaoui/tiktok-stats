import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error('forbidden');
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = await createClient();
  const { data } = await supabase.from('admin_emails').select('email').order('email');
  return NextResponse.json({ emails: (data ?? []).map((r) => r.email) });
}

export async function POST(request: Request) {
  await requireAdmin();
  const { email } = await request.json();
  const supabase = await createClient();
  await supabase.from('admin_emails').insert({ email: String(email).toLowerCase() });
  const { data } = await supabase.from('admin_emails').select('email').order('email');
  return NextResponse.json({ emails: (data ?? []).map((r) => r.email) });
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const supabase = await createClient();
  await supabase.from('admin_emails').delete().eq('email', email);
  const { data } = await supabase.from('admin_emails').select('email').order('email');
  return NextResponse.json({ emails: (data ?? []).map((r) => r.email) });
}
