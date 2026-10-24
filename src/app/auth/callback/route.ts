import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Exchanges the OAuth code Google/Supabase redirects back with for a real
 * session, then sends the user on to wherever they were headed (or /). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
