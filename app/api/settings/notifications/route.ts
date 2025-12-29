import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/settings/notifications - получить настройки уведомлений
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

    // Получить или создать настройки
    let settings = await prisma.notification_settings.findUnique({
      where: { user_id: payload.sub }
    })

    if (!settings) {
      // Создать дефолтные настройки
      settings = await prisma.notification_settings.create({
        data: {
          user_id: payload.sub
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/settings/notifications - обновить настройки уведомлений
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

    const body = await request.json()

    // Обновить настройки
    const settings = await prisma.notification_settings.upsert({
      where: { user_id: payload.sub },
      update: {
        ...body,
        updated_at: new Date()
      },
      create: {
        user_id: payload.sub,
        ...body
      }
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    )
  }
}



