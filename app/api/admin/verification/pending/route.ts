import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/verification/pending - профили на верификацию
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверка прав администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получить профили со статусом "pending"
    const pendingProfiles = await prisma.profiles.findMany({
      where: {
        verification_status: 'pending'
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
        created_at: true,
        updated_at: true,
        user_id: true,
        legal_form: true
      },
      orderBy: { updated_at: 'desc' }
    })

    return NextResponse.json({ profiles: pendingProfiles })
  } catch (error: any) {
    console.error('Error fetching pending profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending profiles', details: error.message },
      { status: 500 }
    )
  }
}



