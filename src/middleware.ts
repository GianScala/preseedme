// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply to all /ideas routes
  if (request.nextUrl.pathname.startsWith('/ideas')) {
    // Prevent all caching
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    // Add timestamp header for debugging
    response.headers.set('X-Page-Generated-At', new Date().toISOString());
  }
  
  return response;
}

export const config = {
  matcher: '/ideas/:path*',
};