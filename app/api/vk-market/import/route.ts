import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/vk-market/import - импорт товаров/услуг из VK Market
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
    const { profile_id, vk_market_url } = body

    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // TODO: Получение товаров через VK API
    // const user = await prisma.users.findUnique({
    //   where: { id: payload.sub },
    //   select: { vk_access_token: true }
    // })
    //
    // if (!user?.vk_access_token) {
    //   return NextResponse.json({ error: 'VK not connected' }, { status: 400 })
    // }
    //
    // const vkProducts = await fetchVKMarketProducts(user.vk_access_token, vk_market_url)
    // const imported = await importVKProductsToServices(profile_id, vkProducts)

    return NextResponse.json({
      success: true,
      imported: 0,
      message: 'VK Market import is in development'
    })
  } catch (error: any) {
    console.error('Error importing from VK Market:', error)
    return NextResponse.json(
      { error: 'Failed to import', details: error.message },
      { status: 500 }
    )
  }
}



