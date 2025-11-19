import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Route
 * Обрабатывает колбэк от Supabase Auth после логина/регистрации
 * Обменивает код на сессию и редиректит пользователя
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // Локальная разработка
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // Production с прокси (Vercel)
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Ошибка авторизации - редирект на логин с сообщением об ошибке
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}


