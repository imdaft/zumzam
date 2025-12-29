import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

// Проверка прав админа
async function assertAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return { ok: false as const, response: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) }
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.sub },
    select: { role: true }
  })

  if (!user || user.role !== 'admin') {
    return { ok: false as const, response: NextResponse.json({ message: 'Access denied' }, { status: 403 }) }
  }

  return { ok: true as const }
}

// DELETE /api/admin/ai-settings/providers/[id] - удалить провайдера
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await assertAdmin(request)
    if (!admin.ok) return admin.response

    await prisma.ai_settings.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Provider deleted' })
  } catch (error: any) {
    console.error('[AI Settings] Error deleting provider:', error)
    return NextResponse.json({ message: 'Failed to delete provider' }, { status: 500 })
  }
}

// PATCH /api/admin/ai-settings/providers/[id] - обновить провайдера
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await assertAdmin(request)
    if (!admin.ok) return admin.response

    const body = await request.json()

    const updatedProvider = await prisma.ai_settings.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ provider: updatedProvider })
  } catch (error: any) {
    console.error('[AI Settings] Error updating provider:', error)
    return NextResponse.json({ message: 'Failed to update provider' }, { status: 500 })
  }
}
