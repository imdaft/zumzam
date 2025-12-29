import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * PATCH /api/admin/ai-settings/[id]
 * Обновить настройку AI или активировать её
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { provider, model_name, api_key, settings, description, is_active } = body

    // Если активируем эту настройку, деактивируем остальные
    if (is_active) {
      await prisma.ai_settings.updateMany({
        where: { 
          id: { not: id },
          is_active: true 
        },
        data: { is_active: false }
      })
    }

    // Обновляем настройку
    const updateData: any = {}
    if (provider !== undefined) updateData.provider = provider
    if (model_name !== undefined) updateData.model_name = model_name
    if (api_key !== undefined) updateData.api_key = api_key
    if (settings !== undefined) updateData.settings = settings
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date()

    const updatedSetting = await prisma.ai_settings.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ setting: updatedSetting }, { status: 200 })
  } catch (error: any) {
    console.error('[AI Settings PATCH] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update AI setting' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/ai-settings/[id]
 * Удалить настройку AI
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем роль админа
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Проверяем, не является ли эта настройка активной
    const setting = await prisma.ai_settings.findUnique({
      where: { id },
      select: { is_active: true }
    })

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    if (setting.is_active) {
      return NextResponse.json(
        { error: 'Cannot delete active AI setting. Activate another one first.' },
        { status: 400 }
      )
    }

    // Удаляем настройку
    await prisma.ai_settings.delete({
      where: { id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('[AI Settings DELETE] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete AI setting' }, { status: 500 })
  }
}
