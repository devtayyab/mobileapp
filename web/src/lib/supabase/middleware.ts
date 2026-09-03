import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Routes a signed-out visitor may reach. Mirrors mobile's "Browse as Guest":
 * the storefront is public; cart/checkout/account/dashboard require auth.
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/welcome',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/shop',
  '/categories',
  '/product',
  '/search',
  '/terms',
  '/privacy',
];

const AUTH_PAGES = ['/login', '/register', '/welcome'];

function isPublic(pathname: string) {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Return the visitor where they were headed after signing in.
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on the sign-in/registration pages.
  if (user && AUTH_PAGES.some((p) => pathname === p)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
