import { NextRequest, NextResponse } from 'next/server';

const SESSION_NAME = '__session';

export function middleware(request: NextRequest) {
  try {
    const session = request.cookies.get(SESSION_NAME)?.value;
    const { pathname } = request.nextUrl;

    // Public paths
    if (
      pathname === '/login' || 
      pathname === '/api/debug' ||
      pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/webhooks') ||
      pathname === '/favicon.ico' ||
      pathname.includes('_next') ||
      pathname.includes('.') 
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
  } catch (error) {
    return NextResponse.next(); 
  }
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
