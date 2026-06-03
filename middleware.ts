import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If accessing /admin or any child routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const gateCookie = request.cookies.get('liberty_gate');
    
    // Check if cookie exists and equals '6492'
    if (!gateCookie || gateCookie.value !== '6492') {
      // Redirect to /gate
      const url = request.nextUrl.clone();
      url.pathname = '/gate';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
