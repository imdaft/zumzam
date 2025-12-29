import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  // Удаляем auth cookies
  response.cookies.set('auth-token', '', {
    expires: new Date(0),
    path: '/',
  })

  response.cookies.set('user-info', '', {
    expires: new Date(0),
    path: '/',
  })

  return response
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?signedout=1', request.url))

  // Удаляем auth cookies
  response.cookies.set('auth-token', '', {
    expires: new Date(0),
    path: '/',
  })

  response.cookies.set('user-info', '', {
    expires: new Date(0),
    path: '/',
  })

  return response
}

