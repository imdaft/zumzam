import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/errors - получить список ошибок
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const error_type = searchParams.get('error_type')
    const is_critical = searchParams.get('is_critical')
    const is_resolved = searchParams.get('is_resolved')

    const skip = (page - 1) * limit

    // Построение фильтров
    const where: any = {}

    if (error_type) {
      where.error_type = error_type
    }

    if (is_critical !== null && is_critical !== undefined) {
      where.is_critical = is_critical === 'true'
    }

    if (is_resolved !== null && is_resolved !== undefined) {
      where.is_resolved = is_resolved === 'true'
    }

    const [errors, total] = await Promise.all([
      prisma.errors.findMany({
        where,
        select: {
          id: true,
          message: true,
          stack: true,
          source: true,
          url: true,
          error_type: true,
          is_critical: true,
          is_resolved: true,
          resolved_at: true,
          created_at: true,
          user_id: true,
          user_email: true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.errors.count({ where })
    ])

    return NextResponse.json({
      errors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching errors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch errors', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/errors/:id - отметить ошибку как решенную
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

    // Проверка прав администратора
    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { error_ids, is_resolved } = body

    if (!error_ids || !Array.isArray(error_ids)) {
      return NextResponse.json({ error: 'error_ids array required' }, { status: 400 })
    }

    await prisma.errors.updateMany({
      where: { id: { in: error_ids } },
      data: {
        is_resolved: is_resolved !== undefined ? is_resolved : true,
        resolved_at: is_resolved !== false ? new Date() : null,
        resolved_by: payload.sub
      }
    })

    return NextResponse.json({ success: true, updated: error_ids.length })
  } catch (error: any) {
    console.error('Error updating errors:', error)
    return NextResponse.json(
      { error: 'Failed to update errors', details: error.message },
      { status: 500 }
    )
  }
}



