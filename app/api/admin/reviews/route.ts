import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/reviews - список всех отзывов для модерации
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const profileId = searchParams.get('profile_id')
    const userId = searchParams.get('user_id')

    const skip = (page - 1) * limit

    const where: any = {}

    if (profileId) {
      where.profile_id = profileId
    }

    if (userId) {
      where.user_id = userId
    }

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          created_at: true,
          profile_id: true,
          user_id: true,
          profiles: {
            select: {
              slug: true,
              display_name: true,
              category: true
            }
          },
          users: {
            select: {
              full_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.reviews.count({ where })
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    )
  }
}

