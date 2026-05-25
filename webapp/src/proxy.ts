import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const adminOnlyPaths = ['/activity-logs', '/notification-ops'];

    // Define public paths
    const isPublicPath =
        path === '/login' ||
        path.startsWith('/api/auth') ||
        path === '/api/incidents/webhook' ||
        path === '/api/incidents/health';

    // Exclude static files, internals, and /_next
    if (path.startsWith('/_next') || path.includes('.')) {
        return NextResponse.next();
    }

    // Get the auth tokens
    const authSession = request.cookies.get('auth_session')?.value || '';
    const nextAuthToken = request.cookies.get('authjs.session-token')?.value || 
                          request.cookies.get('__Secure-authjs.session-token')?.value || '';

    const isAuthenticated = authSession || nextAuthToken;

    let authSessionRole: string | null = null;
    if (authSession) {
        try {
            const parsed = JSON.parse(authSession) as { role?: unknown };
            authSessionRole = parsed.role === 'admin' || parsed.role === 'user' ? parsed.role : null;
        } catch {
            authSessionRole = null;
        }
    }

    // Redirect Logic
    if (isPublicPath && isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    if (!isPublicPath && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    if (adminOnlyPaths.some((adminPath) => path.startsWith(adminPath)) && authSession && authSessionRole !== 'admin') {
        return NextResponse.redirect(new URL('/mission-control', request.nextUrl));
    }

    // Redirect legacy /incidents route to /mission-control, preserving any search query parameters
    if (path === '/incidents') {
        const url = request.nextUrl.clone();
        url.pathname = '/mission-control';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - api/incidents/webhook and health (external integrations)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|api/incidents/webhook|api/incidents/health|_next/static|_next/image|favicon.ico).*)',
    ],
};
