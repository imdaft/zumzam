import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/analytics/source
 * Сохранить источник трафика пользователя
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request) // Может быть null для неавторизованных
    
    const body = await request.json()
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null

    const {
      session_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer,
      landing_page,
      device_type,
      browser,
      os,
      user_agent,
    } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Определяем source и medium если нет UTM
    let source = utm_source
    let medium = utm_medium

    if (!source && referrer) {
      try {
        const referrerUrl = new URL(referrer)
        const referrerHostname = referrerUrl.hostname

        if (referrerHostname.includes('google')) {
          source = 'google'
          medium = medium || 'organic'
        } else if (referrerHostname.includes('yandex')) {
          source = 'yandex'
          medium = medium || 'organic'
        } else if (referrerHostname.includes('vk.com')) {
          source = 'vk'
          medium = medium || 'social'
        } else if (referrerHostname.includes('facebook') || referrerHostname.includes('fb.')) {
          source = 'facebook'
          medium = medium || 'social'
        } else if (referrerHostname.includes('instagram')) {
          source = 'instagram'
          medium = medium || 'social'
        } else if (referrerHostname.includes('t.me')) {
          source = 'telegram'
          medium = medium || 'social'
        } else {
          source = referrerHostname
          medium = medium || 'referral'
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }

    if (!source && !referrer) {
      source = 'direct'
      medium = 'none'
    }

    // Сохраняем источник
    // Проверяем существование записи для этой сессии
    const existing = await prisma.user_sources.findFirst({
      where: { session_id }
    })

    if (existing) {
      // Обновляем существующую запись
      await prisma.user_sources.update({
        where: { id: existing.id },
        data: {
          user_id: userId,
          utm_source: source || null,
          utm_medium: medium || null,
          utm_campaign: utm_campaign || null,
          utm_term: utm_term || null,
          utm_content: utm_content || null,
          referrer: referrer || null,
          landing_page: landing_page || null,
          device_type: device_type || null,
          browser: browser || null,
          os: os || null,
          user_agent: user_agent || null,
          ip_address: ipAddress,
        },
      })
    } else {
      // Создаем новую запись
      await prisma.user_sources.create({
        data: {
          session_id,
          user_id: userId,
          utm_source: source || null,
          utm_medium: medium || null,
          utm_campaign: utm_campaign || null,
          utm_term: utm_term || null,
          utm_content: utm_content || null,
          referrer: referrer || null,
          landing_page: landing_page || null,
          device_type: device_type || null,
          browser: browser || null,
          os: os || null,
          user_agent: user_agent || null,
          ip_address: ipAddress,
        },
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    logger.error('[Analytics Source] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to track source', 
      details: error.message 
    }, { status: 500 })
  }
}

