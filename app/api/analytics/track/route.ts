import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics/track
 * Batch endpoint для отправки событий аналитики
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем userId из JWT (может быть null для неавторизованных)
    const userId = await getUserIdFromRequest(request) // Может вернуть null

    const { events } = await request.json()
    const sessionId = request.headers.get('x-session-id')

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null

    // Подготавливаем события для вставки
    const eventsToInsert = events.map(event => ({
      user_id: userId || null,
      session_id: sessionId,
      action_type: event.event_type,
      action_data: {
        ...(event.action_data || {}),
        __context: {
          device_type: event.deviceType,
          browser: event.browser,
          os: event.os,
          user_agent: event.userAgent,
          context: event.context || null,
        },
      },
      page_url: event.event_url,
      referrer_url: event.referrer_url,
      device_type: event.deviceType,
      ip_address: ipAddress,
      user_agent: event.userAgent,
    }))

    // Вставляем события через Prisma
    await prisma.user_activity.createMany({
      data: eventsToInsert,
    })

    logger.info('[Analytics Track] Tracked events:', { count: events.length, userId })

    return NextResponse.json({ 
      success: true, 
      tracked: events.length 
    }, { status: 200 })
  } catch (error: any) {
    logger.error('[Analytics Track] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to track events', 
      details: error.message 
    }, { status: 500 })
  }
}
