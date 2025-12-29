import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/advertising/campaigns/[id]
 * Получение информации о конкретной кампании
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Получаем кампанию с проверкой владельца
    const campaign = await prisma.ad_campaigns.findFirst({
      where: {
        id: id,
        user_id: userId
      },
      include: {
        profiles: {
          select: {
            id: true,
            display_name: true,
            slug: true
          }
        },
        ad_bookings: {
          include: {
            ad_slots: {
              select: {
                id: true,
                name: true,
                description: true,
                placement: true,
                dimensions: true
              }
            }
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Кампания не найдена' },
        { status: 404 }
      )
    }

    // Конвертируем Decimal в number
    const campaignWithNumbers = {
      ...campaign,
      budget: campaign.budget ? Number(campaign.budget) : null,
      spent: campaign.spent ? Number(campaign.spent) : 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      stats: {
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: 0,
        spent: campaign.spent ? Number(campaign.spent) : 0
      },
      ad_bookings: campaign.ad_bookings.map(booking => ({
        ...booking,
        price: booking.price ? Number(booking.price) : null
      }))
    }

    return NextResponse.json({ campaign: campaignWithNumbers })
  } catch (error: any) {
    logger.error('[Advertising API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advertising/campaigns/[id]
 * Обновление кампании
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Проверяем, что кампания принадлежит пользователю
    const existingCampaign = await prisma.ad_campaigns.findFirst({
      where: {
        id: id,
        user_id: userId
      }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Кампания не найдена' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, description, image_url, link_url, start_date, end_date, status } = body

    // Обновляем кампанию
    const updatedCampaign = await prisma.ad_campaigns.update({
      where: { id: id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(image_url && { image_url }),
        ...(link_url && { link_url }),
        ...(start_date && { start_date: new Date(start_date) }),
        ...(end_date && { end_date: new Date(end_date) }),
        ...(status && { status }),
        updated_at: new Date()
      }
    })

    // Конвертируем Decimal в number
    const campaignWithNumbers = {
      ...updatedCampaign,
      budget: updatedCampaign.budget ? Number(updatedCampaign.budget) : null,
      spent: updatedCampaign.spent ? Number(updatedCampaign.spent) : 0,
      impressions: updatedCampaign.impressions || 0,
      clicks: updatedCampaign.clicks || 0,
      stats: {
        impressions: updatedCampaign.impressions || 0,
        clicks: updatedCampaign.clicks || 0,
        conversions: 0,
        spent: updatedCampaign.spent ? Number(updatedCampaign.spent) : 0
      }
    }

    return NextResponse.json({ campaign: campaignWithNumbers })
  } catch (error: any) {
    logger.error('[Advertising API] Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления кампании', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/advertising/campaigns/[id]
 * Удаление кампании
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // Проверяем авторизацию
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Проверяем, что кампания принадлежит пользователю
    const existingCampaign = await prisma.ad_campaigns.findFirst({
      where: {
        id: id,
        user_id: userId
      }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Кампания не найдена' },
        { status: 404 }
      )
    }

    // Удаляем кампанию (каскадно удалятся и bookings благодаря onDelete: Cascade)
    await prisma.ad_campaigns.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Advertising API] Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления кампании', details: error.message },
      { status: 500 }
    )
  }
}
