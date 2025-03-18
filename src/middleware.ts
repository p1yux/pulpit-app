import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated as isAuthenticatedFn, isAuthRoute, isPublicRoute } from './lib/auth'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuthenticated = await isAuthenticatedFn()

  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  if (isAuthRoute(path) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isAuthRoute(path) && !isAuthenticated) {
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
