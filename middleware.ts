import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { logger } from '@/lib/logger'

// Защищённые пути, требующие авторизации
const PROTECTED_PATHS = ['/dashboard', '/bookings', '/orders', '/favorites', '/settings', '/cart', '/checkout', '/crm', '/advertising', '/kanban', '/pipelines']
// Пути, требующие роль admin
const ADMIN_PATHS = ['/admin']
// Публичные пути для неавторизованных
const AUTH_PATHS = ['/login', '/register']
// Пути которые не требуют никакой проверки сессии
const BYPASS_PATHS = ['/api/auth/signout', '/auth/callback']

// Статические файлы, которые не должны трогать middleware
const STATIC_PATHS = new Set([
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-index.xml',
  '/favicon.ico',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/opengraph-image',
  '/sw.js',
])

async function verifyAuthToken(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-me'
    )
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Быстрый возврат для API routes - не проверяем auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Пропускаем signout и callback без проверки сессии
  const isBypassPath = BYPASS_PATHS.some(path => pathname.startsWith(path))
  if (isBypassPath) {
    return NextResponse.next()
  }

  // Пропускаем статические файлы
  if (STATIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Проверяем JWT токен из cookies
  const authToken = request.cookies.get('auth-token')?.value
  let user: any = null

  if (authToken) {
    const payload = await verifyAuthToken(authToken)
    if (payload && payload.type === 'access') {
      user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      }
    }
  }

  // Проверка защищённых путей
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some(path => pathname.startsWith(path))
  
  // Если пользователь не авторизован и пытается зайти на защищённую страницу
  if (!user && (isProtectedPath || isAdminPath)) {
    logger.debug('[Middleware] Redirecting unauthenticated user to login', { path: pathname })
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Если авторизованный пользователь пытается зайти на страницы логина/регистрации
  const signedOut = request.nextUrl.searchParams.get('signedout')
  if (user && isAuthPath && !signedOut) {
    logger.debug('[Middleware] Redirecting authenticated user from auth page', { path: pathname })
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Для admin путей проверяем роль
  if (user && isAdminPath && user.role !== 'admin') {
    logger.warn('[Middleware] Non-admin user trying to access admin area', { 
      email: user.email, 
      role: user.role,
      path: pathname 
    })
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.webmanifest (PWA manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.webmanifest$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

