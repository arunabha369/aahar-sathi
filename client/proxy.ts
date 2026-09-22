import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const APP_ROUTES = ['/dashboard', '/diary', '/onboarding', '/grocery', '/plans', '/progress', '/recipes', '/settings'];
const AUTH_ROUTES = ['/login', '/register'];

/**
 * An optimistic guard only: it keeps signed-out visitors away from app screens
 * and signed-in users away from the auth forms. Express still verifies the JWT
 * on every request, and the (app) layout re-checks with /api/auth/me.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get('token')?.value);

  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAppRoute && !hasToken) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
