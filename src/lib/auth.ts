import { cookies } from 'next/headers'
import { CSRF_TOKEN, SESSION_ID } from './constants'

export async function isAuthenticated() {
  const cookieStores = await cookies()
  const csrfToken = cookieStores.get(CSRF_TOKEN)
  const sessionId = cookieStores.get(SESSION_ID)

  if (csrfToken?.value && sessionId?.value) {
    return true
  }

  return false
}

const PUBLIC_ROUTES = ['/', '/resume/shared', /^\/resume\/shared\/.+/]
const AUTH_ROUTES = ['/login', '/signup']

export function isPublicRoute(route: string) {
  return PUBLIC_ROUTES.includes(route) || PUBLIC_ROUTES.some((publicRoute) => publicRoute instanceof RegExp && publicRoute.test(route))
}

export function isAuthRoute(route: string) {
  return AUTH_ROUTES.includes(route)
}
