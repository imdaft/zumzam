import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/claim/by-token?token=xxx - получить профиль по claim токену
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const claimToken = searchParams.get('token')

    if (!claimToken) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Поиск профиля по токену
    const profile = await prisma.profiles.findFirst({
      where: {
        claim_token: claimToken,
        claim_status: 'unclaimed'
      },
      select: {
        id: true,
        slug: true,
        display_name: true,
        category: true,
        city: true,
        description: true,
        cover_photo: true,
        logo: true,
        phone: true,
        email: true,
        website: true,
        created_at: true
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Error fetching profile by token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/claim/by-token - забрать профиль по токену
export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(authToken)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { claim_token } = body

    if (!claim_token) {
      return NextResponse.json({ error: 'claim_token is required' }, { status: 400 })
    }

    // Поиск профиля
    const profile = await prisma.profiles.findFirst({
      where: {
        claim_token,
        claim_status: 'unclaimed'
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Invalid or already claimed token' },
        { status: 404 }
      )
    }

    // Обновление профиля - привязка к пользователю
    const updatedProfile = await prisma.profiles.update({
      where: { id: profile.id },
      data: {
        user_id: payload.sub,
        claim_status: 'claimed',
        claimed_at: new Date(),
        claim_token: null // Удаляем токен после использования
      }
    })

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Profile claimed successfully'
    })
  } catch (error: any) {
    console.error('Error claiming profile:', error)
    return NextResponse.json(
      { error: 'Failed to claim profile', details: error.message },
      { status: 500 }
    )
  }
}

