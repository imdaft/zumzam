import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/profiles - список всех профилей (только для админов)
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
    const category = searchParams.get('category')
    const verification_status = searchParams.get('verification_status')
    const claim_status = searchParams.get('claim_status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Построение фильтров
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (verification_status) {
      where.verification_status = verification_status
    }

    if (claim_status) {
      where.claim_status = claim_status
    }

    if (search) {
      where.OR = [
        { display_name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [profiles, total] = await Promise.all([
      prisma.profiles.findMany({
        where,
        select: {
          id: true,
          slug: true,
          display_name: true,
          category: true,
          city: true,
          rating: true,
          reviews_count: true,
          verified: true,
          verification_status: true,
          claim_status: true,
          is_published: true,
          created_at: true,
          updated_at: true,
          cover_photo: true,
          logo: true,
          user_id: true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.profiles.count({ where })
    ])

    // Конвертируем Decimal rating в number
    const profilesWithNumberRating = profiles.map(p => ({
      ...p,
      rating: p.rating ? Number(p.rating) : 0
    }))

    return NextResponse.json({
      profiles: profilesWithNumberRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error.message },
      { status: 500 }
    )
  }
}

