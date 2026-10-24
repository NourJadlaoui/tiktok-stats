import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser, ACTING_AS_COOKIE } from '@/lib/auth';

/** Starts impersonation — every data-access call in the app reads
 * requireEffectiveUser()'s effectiveUserId, so setting this cookie is the
 * entire mechanism (see auth.ts's getEffectiveUser for why). Re-verifies
 * admin status server-side on every call rather than trusting the client. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  }
  const { userId } = await req.json().catch(() => ({}));
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(ACTING_AS_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTING_AS_COOKIE);
  return NextResponse.json({ ok: true });
}
