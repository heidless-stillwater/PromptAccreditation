import { NextRequest, NextResponse } from 'next/server';

const SESSION_NAME = 'prompt_session';

export default function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_NAME)?.value;
  const { pathname } = request.nextUrl;
  
  // Public paths
  if (
    pathname === '/login' || 
    pathname.startsWith('/api/auth') || 
    pathname.startsWith('/api/webhooks') ||
    pathname === '/favicon.ico' ||
    pathname.includes('_next')
  ) {
    return NextResponse.next();
  }
  
  // Protected paths
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
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
