import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/webhooks/'];
/** Only the exact root path is public (the marketing landing page) — every
 * other route needs a startsWith prefix match above, since `/` itself would
 * match everything via startsWith. */
const PUBLIC_EXACT_PATHS = ['/'];

/** Gates the actual product behind Google sign-in — everything under /app
 * and the other tool routes require auth, while `/` (the marketing landing
 * page) and a handful of others stay public so the platform has something
 * to show off before someone signs in. This runs before every page/route
 * (see `matcher` below). It also refreshes the Supabase session cookie on
 * every request, which @supabase/ssr requires in Next.js middleware to keep
 * server components' auth state in sync. */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  // Fail closed: if Supabase itself is unreachable, treat the request as
  // unauthenticated (redirected to /login below) rather than 500ing or,
  // worse, letting it through.
  let user = null;
  try {
    const {
      data: { user: fetchedUser }
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_EXACT_PATHS.includes(pathname) || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in visitors don't need the marketing page or the login screen —
  // send them straight into the app.
  if (user && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
