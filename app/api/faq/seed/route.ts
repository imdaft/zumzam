import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/faq/seed - заполнить FAQ данными
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
    const { faq_items } = body

    if (!faq_items || !Array.isArray(faq_items)) {
      return NextResponse.json(
        { error: 'faq_items array is required' },
        { status: 400 }
      )
    }

    // Создание FAQ записей
    const created = await prisma.faq_items.createMany({
      data: faq_items.map((item: any, index: number) => ({
        category: item.category || 'general',
        question: item.question,
        answer: item.answer,
        sort_order: item.sort_order !== undefined ? item.sort_order : index,
        is_active: item.is_active !== undefined ? item.is_active : true
      })),
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      created: created.count,
      message: `Created ${created.count} FAQ items`
    })
  } catch (error: any) {
    console.error('Error seeding FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to seed FAQ', details: error.message },
      { status: 500 }
    )
  }
}



