import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/advertising/campaigns - Получить список рекламных кампаний пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем профили пользователя
    const userProfiles = await prisma.profiles.findMany({
      where: { user_id: userId },
      select: { id: true }
    })

    const profileIds = userProfiles.map(p => p.id)

    if (profileIds.length === 0) {
      return NextResponse.json({ campaigns: [] })
    }

    // Получаем кампании
    const campaigns = await prisma.ad_campaigns.findMany({
      where: {
        profile_id: { in: profileIds }
      },
      include: {
        profiles: {
          select: {
            id: true,
            display_name: true,
            slug: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Конвертируем Decimal поля в number
    const campaignsFormatted = campaigns.map(camp => ({
      ...camp,
      budget: camp.budget ? Number(camp.budget) : null,
      spent: camp.spent ? Number(camp.spent) : 0,
      stats: {
        spent: camp.spent ? Number(camp.spent) : 0,
        impressions: camp.impressions || 0,
        clicks: camp.clicks || 0,
      }
    }))

    return NextResponse.json({
      campaigns: campaignsFormatted
    })
  } catch (error: any) {
    logger.error('[Campaigns API] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advertising/campaigns - Создать новую рекламную кампанию
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub
    const body = await request.json()

    const {
      profile_id,
      title,
      description,
      image_url,
      link_url,
      budget,
    } = body

    // Валидация
    if (!profile_id || !title) {
      return NextResponse.json(
        { error: 'profile_id and title are required' },
        { status: 400 }
      )
    }

    // Проверяем что профиль принадлежит пользователю
    const profile = await prisma.profiles.findFirst({
      where: {
        id: profile_id,
        user_id: userId
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found or access denied' },
        { status: 404 }
      )
    }

    // Создаем кампанию
    const campaign = await prisma.ad_campaigns.create({
      data: {
        profile_id,
        title,
        description,
        image_url,
        link_url,
        budget: budget ? parseFloat(budget) : null,
        status: 'draft',
        moderation_status: 'pending',
      },
      include: {
        profiles: {
          select: {
            id: true,
            display_name: true,
            slug: true,
          }
        }
      }
    })

    // Конвертируем Decimal поля
    const campaignFormatted = {
      ...campaign,
      budget: campaign.budget ? Number(campaign.budget) : null,
      spent: campaign.spent ? Number(campaign.spent) : 0,
    }

    return NextResponse.json({
      campaign: campaignFormatted,
      message: 'Campaign created successfully'
    }, { status: 201 })
  } catch (error: any) {
    logger.error('[Campaigns API] POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}



