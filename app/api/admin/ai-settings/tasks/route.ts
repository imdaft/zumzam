import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

// GET /api/admin/ai-settings/tasks - получить все задачи
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

    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const tasks = await prisma.ai_task_models.findMany({
      orderBy: { task_name: 'asc' }
    })

    return NextResponse.json({ tasks })
  } catch (error: any) {
    console.error('[AI Settings] Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
