import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    // Only redirect to dashboard if user is logged in and trying to access the signin page
    if (req.nextUrl.pathname === "/auth/signin" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public paths
        const publicPaths = [
          '/',
          '/about',
          '/terms',
          '/privacy',
          '/auth/signin',
          '/auth/error'
        ]
        if (publicPaths.includes(req.nextUrl.pathname) || 
            req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        // Require auth for dashboard
        return !!token
      },
    },
    pages: {
      signIn: "/auth/signin",
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/',
    '/terms',
    '/privacy',
    '/about'
  ]
} 