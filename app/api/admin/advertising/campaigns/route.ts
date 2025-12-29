import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/advertising/campaigns
 * Получение всех рекламных кампаний (только для админов)
 */
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

    // Проверяем права администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // Получаем все кампании
    const campaigns = await prisma.ad_campaigns.findMany({
      include: {
        profiles: {
          select: {
            id: true,
            display_name: true,
            slug: true
          }
        },
        ad_bookings: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
            price: true,
            ad_slots: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Конвертируем Decimal в number и формируем объект stats
    const campaignsWithNumbers = campaigns.map(campaign => ({
      ...campaign,
      budget: campaign.budget ? Number(campaign.budget) : null,
      spent: campaign.spent ? Number(campaign.spent) : 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      stats: {
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        conversions: 0, // TODO: добавить если будет поле
        spent: campaign.spent ? Number(campaign.spent) : 0
      },
      ad_bookings: campaign.ad_bookings.map(booking => ({
        ...booking,
        price: booking.price ? Number(booking.price) : null
      }))
    }))

    return NextResponse.json({ campaigns: campaignsWithNumbers })
  } catch (error: any) {
    logger.error('[Admin Advertising API] GET error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/advertising/campaigns
 * Создание новой рекламной кампании администратором
 */
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

    // Проверяем права администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      image_url, 
      link_url, 
      start_date, 
      end_date, 
      profile_id, 
      budget 
    } = body

    if (!title || !image_url || !link_url || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      )
    }

    // Создаем кампанию
    const campaign = await prisma.ad_campaigns.create({
      data: {
        profile_id: profile_id || null,
        title,
        description: description || null,
        image_url,
        link_url,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: 'active',
        budget: budget || null,
        moderation_status: 'approved', // Админские кампании автоматически одобрены
        moderated_by: payload.sub,
        moderated_at: new Date()
      }
    })

    logger.info('[Admin Advertising API] Campaign created:', campaign.id)
    return NextResponse.json({ 
      campaign: {
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
        }
      }
    })
  } catch (error: any) {
    logger.error('[Admin Advertising API] POST error:', error)
    return NextResponse.json(
      { error: 'Ошибка создания кампании', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/advertising/campaigns
 * Обновление кампании
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем права администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const { campaignId, ...updates } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Отсутствует ID кампании' },
        { status: 400 }
      )
    }

    // Подготавливаем обновления
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url
    if (updates.link_url !== undefined) updateData.link_url = updates.link_url
    if (updates.start_date !== undefined) updateData.start_date = new Date(updates.start_date)
    if (updates.end_date !== undefined) updateData.end_date = new Date(updates.end_date)
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.budget !== undefined) updateData.budget = updates.budget
    if (updates.profile_id !== undefined) updateData.profile_id = updates.profile_id
    
    // Модерация
    if (updates.moderationStatus !== undefined) {
      updateData.moderation_status = updates.moderationStatus
      updateData.moderation_notes = updates.moderationNotes || null
      updateData.moderated_at = new Date()
      updateData.moderated_by = payload.sub
    }

    updateData.updated_at = new Date()

    // Обновляем кампанию
    const campaign = await prisma.ad_campaigns.update({
      where: { id: campaignId },
      data: updateData
    })

    logger.info('[Admin Advertising API] Campaign updated:', campaign.id)
    return NextResponse.json({ 
      campaign: {
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
        }
      }
    })
  } catch (error: any) {
    logger.error('[Admin Advertising API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления кампании', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/advertising/campaigns
 * Удаление кампании
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем права администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Отсутствует ID кампании' },
        { status: 400 }
      )
    }

    await prisma.ad_campaigns.delete({
      where: { id: campaignId }
    })

    logger.info('[Admin Advertising API] Campaign deleted:', campaignId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Admin Advertising API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления кампании', details: error.message },
      { status: 500 }
    )
  }
}
