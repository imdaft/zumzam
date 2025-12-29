import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/claim-requests
 * Получение списка заявок на claim (только для админов)
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию и права админа
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем, что пользователь — админ
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Получаем заявки с информацией о профиле
    const where: any = {}
    if (status !== 'all') {
      where.status = status
    }

    const [requests, count] = await Promise.all([
      prisma.profile_claim_requests.findMany({
        where,
        include: {
          profiles: {
            select: {
              id: true,
              slug: true,
              display_name: true,
              city: true,
              category: true,
              main_photo: true,
              logo: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.profile_claim_requests.count({ where })
    ])

    return NextResponse.json({
      requests: requests || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    logger.error('Admin claim requests API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/claim-requests
 * Одобрение или отклонение заявки (только для админов)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Проверяем авторизацию и права админа
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем, что пользователь — админ
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    const body = await request.json()
    const { request_id, action, rejection_reason } = body

    if (!request_id) {
      return NextResponse.json(
        { error: 'ID заявки обязателен' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Укажите действие: approve или reject' },
        { status: 400 }
      )
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Укажите причину отклонения' },
        { status: 400 }
      )
    }

    // Получаем заявку
    const claimRequest = await prisma.profile_claim_requests.findUnique({
      where: { id: request_id },
      include: {
        profiles: {
          select: { id: true, display_name: true }
        }
      }
    })

    if (!claimRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    if (claimRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Эта заявка уже обработана' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Одобряем заявку через транзакцию
      await prisma.$transaction(async (tx) => {
        // Обновляем статус заявки
        await tx.profile_claim_requests.update({
          where: { id: request_id },
          data: {
            status: 'approved',
            admin_id: userId,
            processed_at: new Date()
          }
        })

        // Передаём профиль пользователю
        await tx.profiles.update({
          where: { id: claimRequest.profile_id },
          data: {
            user_id: claimRequest.user_id,
            claim_status: 'claimed'
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Заявка одобрена. Профиль передан пользователю.',
      })
    } else {
      // Отклоняем заявку
      await prisma.profile_claim_requests.update({
        where: { id: request_id },
        data: {
          status: 'rejected',
          admin_id: userId,
          rejection_reason: rejection_reason,
          processed_at: new Date()
        }
      })

      // Проверяем, есть ли другие pending заявки
      const otherPendingRequests = await prisma.profile_claim_requests.count({
        where: {
          profile_id: claimRequest.profile_id,
          status: 'pending',
          id: { not: request_id }
        }
      })

      // Если нет других pending заявок, возвращаем статус в unclaimed
      if (otherPendingRequests === 0) {
        await prisma.profiles.update({
          where: { id: claimRequest.profile_id },
          data: { claim_status: 'unclaimed' }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Заявка отклонена.',
      })
    }
  } catch (error: any) {
    logger.error('Admin claim PATCH API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
