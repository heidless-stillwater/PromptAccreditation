import { NextRequest, NextResponse } from 'next/server';

const SESSION_NAME = '__session';

export default function middleware(request: NextRequest) {
  try {
    const allCookies = request.cookies.getAll().map(c => c.name);
    const session = request.cookies.get(SESSION_NAME)?.value;
    const { pathname } = request.nextUrl;

    console.log(`[Sovereign_Shield][${pathname}] Found cookies:`, allCookies);
    
    // Public paths
    if (
      pathname === '/login' || 
      pathname === '/api/debug' ||
      pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/webhooks') ||
      pathname === '/favicon.ico' ||
      pathname.includes('_next') ||
      pathname.includes('.') // Assets with extensions
    ) {
      return NextResponse.next();
    }
    
    // Protected paths
    if (!session) {
      console.log(`[Sovereign_Shield] No session found for ${pathname}. Redirecting to /login.`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log(`[Sovereign_Shield] Session active for ${pathname}. Access granted.`);
    return NextResponse.next();
  } catch (error) {
    console.error('[Sovereign_Shield] Middleware Error:', error);
    return NextResponse.next(); // Fail open to prevent 500 breakages
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (Stripe webhooks)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
