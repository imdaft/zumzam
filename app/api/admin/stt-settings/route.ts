import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/stt-settings - получить настройки STT
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

    const settings = await prisma.stt_settings.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Error fetching STT settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/stt-settings - создать настройку STT
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
    const { name, provider, is_active, settings } = body

    if (!name || !provider) {
      return NextResponse.json(
        { error: 'name and provider are required' },
        { status: 400 }
      )
    }

    // Если is_active=true, деактивировать остальные
    if (is_active) {
      await prisma.stt_settings.updateMany({
        data: { is_active: false }
      })
    }

    const sttSetting = await prisma.stt_settings.create({
      data: {
        name,
        provider,
        is_active: is_active || false,
        settings: settings || {}
      }
    })

    return NextResponse.json(sttSetting)
  } catch (error: any) {
    console.error('Error creating STT setting:', error)
    return NextResponse.json(
      { error: 'Failed to create setting', details: error.message },
      { status: 500 }
    )
  }
}



