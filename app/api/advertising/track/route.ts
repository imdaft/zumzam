import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/advertising/track
 * Отслеживание показов и кликов по рекламе
 * 
 * Body: { campaignId: string, slotId: string, action: 'impression' | 'click' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, slotId, action } = body

    logger.info('[Track API] Tracking:', { campaignId, slotId, action })

    if (!campaignId || !slotId || !action) {
      logger.error('[Track API] Missing parameters')
      return NextResponse.json(
        { error: 'Не все параметры указаны' },
        { status: 400 }
      )
    }

    // Получаем данные о запросе
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    logger.info('[Track API] Recording impression/click')

    // Записываем событие в ad_impressions через Prisma
    try {
      // Проверяем существование кампании перед созданием impression
      const campaign = await prisma.ad_campaigns.findUnique({
        where: { id: campaignId }
      })

      if (!campaign) {
        logger.warn('[Track API] Campaign not found:', campaignId)
        // Успешно возвращаем, но не записываем (кампания может быть удалена)
        return NextResponse.json({ success: true, recorded: false }, { status: 200 })
      }

      await prisma.ad_impressions.create({
        data: {
          campaign_id: campaignId,
          ad_slot_id: slotId,
          user_id: null, // Пока без авторизации
          ip_address: ip,
          user_agent: userAgent,
          clicked: action === 'click',
        }
      })

      logger.info('[Track API] Event recorded successfully')

      // Обновляем счетчики в кампании
      if (action === 'click') {
        await prisma.ad_campaigns.update({
          where: { id: campaignId },
          data: {
            clicks: { increment: 1 }
          }
        })
      } else if (action === 'impression') {
        await prisma.ad_campaigns.update({
          where: { id: campaignId },
          data: {
            impressions: { increment: 1 }
          }
        })
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      logger.error('[Track API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('[Advertising API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' }, 
      { status: 500 }
    )
  }
}
