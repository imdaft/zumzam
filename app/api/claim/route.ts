import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/claim - создать заявку на владение профилем
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
    const {
      profile_id,
      contact_name,
      contact_phone,
      contact_email,
      position,
      proof_description,
      proof_links
    } = body

    if (!profile_id || !contact_name) {
      return NextResponse.json(
        { error: 'profile_id and contact_name are required' },
        { status: 400 }
      )
    }

    // Проверка существования профиля
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: {
        id: true,
        claim_status: true,
        display_name: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверка статуса профиля
    if (profile.claim_status === 'claimed') {
      return NextResponse.json(
        { error: 'Profile already claimed' },
        { status: 400 }
      )
    }

    // Создание заявки
    const claimRequest = await prisma.profile_claim_requests.create({
      data: {
        profile_id,
        user_id: payload.sub,
        contact_name,
        contact_phone,
        contact_email,
        position,
        proof_description,
        proof_links,
        status: 'pending'
      }
    })

    // Обновление статуса профиля
    await prisma.profiles.update({
      where: { id: profile_id },
      data: { claim_status: 'pending' }
    })

    return NextResponse.json({
      claim_request: claimRequest,
      message: 'Claim request submitted successfully'
    })
  } catch (error: any) {
    console.error('Error creating claim request:', error)
    return NextResponse.json(
      { error: 'Failed to create claim request', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/claim - получить свои заявки на профили
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

    const claimRequests = await prisma.profile_claim_requests.findMany({
      where: { user_id: payload.sub },
      include: {
        profiles: {
          select: {
            slug: true,
            display_name: true,
            category: true,
            city: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ claim_requests: claimRequests })
  } catch (error: any) {
    console.error('Error fetching claim requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim requests', details: error.message },
      { status: 500 }
    )
  }
}



