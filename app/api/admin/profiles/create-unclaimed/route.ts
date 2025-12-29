import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

// POST /api/admin/profiles/create-unclaimed - создать непривязанный профиль
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

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      display_name,
      slug,
      category,
      city,
      description,
      phone,
      email,
      website,
      address
    } = body

    if (!display_name || !slug || !category || !city) {
      return NextResponse.json(
        { error: 'display_name, slug, category, city are required' },
        { status: 400 }
      )
    }

    // Проверка уникальности slug
    const existingProfile = await prisma.profiles.findUnique({
      where: { slug }
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Создание профиля
    const profile = await prisma.profiles.create({
      data: {
        display_name,
        slug,
        category,
        city,
        description,
        phone,
        email,
        website,
        address,
        claim_status: 'unclaimed',
        claim_token: randomUUID(), // Генерация токена для claim
        verification_status: 'draft',
        created_by: payload.sub,
        is_published: false
      }
    })

    // Генерация ссылки для claim
    const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/token/${profile.claim_token}`

    return NextResponse.json({
      profile,
      claim_url: claimUrl,
      message: 'Unclaimed profile created successfully'
    })
  } catch (error: any) {
    console.error('Error creating unclaimed profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile', details: error.message },
      { status: 500 }
    )
  }
}



