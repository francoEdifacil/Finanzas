import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // We need to ensure that the Supabase client is available (and cookies are set)
    // so we create a client but we don't need the instance itself, just the side effect
    // of cookie management.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* run getUser to protect the route
    // and causing the token to be refreshed if needed.
    // This will NOT work if you only call getUser in your components.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/api/auth') &&
        request.nextUrl.pathname !== '/'
    ) {
        // If not logged in and trying to access protected route (anything not auth or root),
        // redirect to login.
        // However, the requirement says separate protected layout but middleware is faster.
        // I will enforce basic protection here for /dashboard, /subscriptions, /settings.
        const protectedPaths = ['/dashboard', '/subscriptions', '/settings']
        if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
    }

    // If logged in and trying to access auth pages, redirect to dashboard
    if (user && (request.nextUrl.pathname.startsWith('/auth') || request.nextUrl.pathname === '/')) {
        // Maybe redirect / to dashboard if logged in?
        // Requirement says "/" -> landing simple.
        // But /auth/login should redirect to dashboard if logged in.
        if (request.nextUrl.pathname.startsWith('/auth')) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
