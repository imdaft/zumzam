import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/geography - получить географию работы профиля
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const profile_id = searchParams.get('profile_id')

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const geography = await prisma.work_geography.findMany({
      where: { profile_id },
      orderBy: { area_name: 'asc' }
    })

    return NextResponse.json({ geography })
  } catch (error: any) {
    console.error('Error fetching geography:', error)
    return NextResponse.json(
      { error: 'Failed to fetch geography', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/geography - добавить район работы
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

    const body = await request.json()
    const { profile_id, area_name, price_modifier, travel_time } = body

    if (!profile_id || !area_name) {
      return NextResponse.json(
        { error: 'profile_id and area_name are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Создание географии
    const geography = await prisma.work_geography.create({
      data: {
        profile_id,
        area_name,
        price_modifier: price_modifier || 0,
        travel_time
      }
    })

    return NextResponse.json(geography)
  } catch (error: any) {
    console.error('Error creating geography:', error)
    return NextResponse.json(
      { error: 'Failed to create geography', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/geography - обновить несколько районов сразу
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id, areas } = body

    if (!profile_id || !areas || !Array.isArray(areas)) {
      return NextResponse.json(
        { error: 'profile_id and areas array are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем старые и создаем новые
    await prisma.work_geography.deleteMany({
      where: { profile_id }
    })

    const newGeography = await prisma.work_geography.createMany({
      data: areas.map((area: any) => ({
        profile_id,
        area_name: area.area_name,
        price_modifier: area.price_modifier || 0,
        travel_time: area.travel_time
      }))
    })

    return NextResponse.json({
      success: true,
      count: newGeography.count
    })
  } catch (error: any) {
    console.error('Error updating geography:', error)
    return NextResponse.json(
      { error: 'Failed to update geography', details: error.message },
      { status: 500 }
    )
  }
}



