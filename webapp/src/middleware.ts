import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define public paths
    const isPublicPath = path === '/login' || path.startsWith('/api/auth');

    // Exclude static files, internals, and /_next
    if (path.startsWith('/_next') || path.includes('.')) {
        return NextResponse.next();
    }

    // Get the auth cookie
    const authSession = request.cookies.get('auth_session')?.value || '';

    // Redirect Logic
    // If user is trying to access a public path (like login) but is already authenticated,
    // redirect them to the dashboard
    if (isPublicPath && authSession) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // If user is trying to access a protected path (like the dashboard / or /api/sheet-data)
    // and is NOT authenticated, redirect to login
    if (!isPublicPath && !authSession) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
};
