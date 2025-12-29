import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const redirectTo = searchParams.get('redirectTo') || '/'

  // Получаем реальный host из заголовков (важно для dev режима!)
  const host = request.headers.get('host') || 'localhost:4000'
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const realOrigin = `${protocol}://${host}`

  // DEBUG: логируем для отладки
  console.log('[Yandex OAuth] Host header:', host)
  console.log('[Yandex OAuth] Real Origin:', realOrigin)

  const clientId = process.env.YANDEX_CLIENT_ID
  if (!clientId) {
    return NextResponse.json(
      { error: 'OAuth not configured' },
      { status: 500 }
    )
  }

  // Используем реальный origin из заголовков
  const callbackUrl = `${realOrigin}/api/auth/yandex/callback`
  console.log('[Yandex OAuth] Callback URL:', callbackUrl)
  
  const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64')

  const authUrl = new URL('https://oauth.yandex.ru/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}

