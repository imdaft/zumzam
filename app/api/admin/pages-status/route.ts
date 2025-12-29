import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/pages-status - получить статус страниц
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

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const section = searchParams.get('section')

    const where: any = {}
    if (section) {
      where.section = section
    }

    const pages = await prisma.pages_status.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { section: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ pages })
  } catch (error: any) {
    console.error('Error fetching pages status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/pages-status - обновить статус страницы
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

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { page_id, desktop_ready, mobile_ready, tablet_ready, notes } = body

    if (!page_id) {
      return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
    }

    const page = await prisma.pages_status.update({
      where: { id: page_id },
      data: {
        desktop_ready,
        mobile_ready,
        tablet_ready,
        notes,
        updated_at: new Date(),
        updated_by: payload.sub
      }
    })

    return NextResponse.json(page)
  } catch (error: any) {
    console.error('Error updating page status:', error)
    return NextResponse.json(
      { error: 'Failed to update page', details: error.message },
      { status: 500 }
    )
  }
}



