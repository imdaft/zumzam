import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/profile-activities - получить активности профиля
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const activities = await prisma.profile_activities.findMany({
      where: { profile_id },
      orderBy: { created_at: 'desc' },
      take: 50
    })

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error('Error fetching profile activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/profile-activities - создать активность
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id, activity_type, activity_data } = body

    if (!profile_id || !activity_type) {
      return NextResponse.json(
        { error: 'profile_id and activity_type are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activity = await prisma.profile_activities.create({
      data: {
        profile_id,
        activity_type,
        activity_data: activity_data || {},
        user_id: payload.sub
      }
    })

    return NextResponse.json(activity)
  } catch (error: any) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity', details: error.message },
      { status: 500 }
    )
  }
}



