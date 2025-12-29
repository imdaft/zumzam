import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/profiles/[id] - Получить профиль по ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profiles.findUnique({
      where: { id },
      include: {
        profile_locations: true,
        profile_activities: {
          select: { activity_id: true }
        },
        profile_services: {
          select: { service_id: true }
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    const isAdmin = user?.role === 'admin'

    // Проверяем права доступа
    if (profile.user_id !== userId && !isAdmin) {
      logger.warn('[Profile API] Forbidden access attempt', {
        profileId: id,
        ownerId: profile.user_id,
        userId,
        isAdmin,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Преобразуем связи в массивы ID для клиента
    const result = {
      ...profile,
      activities: profile.profile_activities?.map((pa) => pa.activity_id) || [],
      services: profile.profile_services?.map((ps) => ps.service_id) || [],
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('[Profile API] Get error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profiles/[id] - Обновить профиль
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, что профиль существует и принадлежит пользователю
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (existingProfile.user_id !== userId && !isAdmin) {
      logger.warn('[Profile API] Forbidden update attempt', {
        profileId: id,
        ownerId: existingProfile.user_id,
        userId,
        isAdmin,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Разделяем данные профиля и связи
    const {
      activities,
      services,
      locations,
      profile_activities,
      profile_services,
      profile_locations,
      ...profileData
    } = body

    // Обновляем основные данные профиля
    const updatedProfile = await prisma.profiles.update({
      where: { id },
      data: {
        ...profileData,
        updated_at: new Date(),
      },
    })

    // Обновляем activities если переданы
    if (activities && Array.isArray(activities)) {
      // Удаляем старые связи
      await prisma.profile_activities.deleteMany({
        where: { profile_id: id },
      })
      // Создаём новые
      if (activities.length > 0) {
        await prisma.profile_activities.createMany({
          data: activities.map((activity_id: string) => ({
            profile_id: id,
            activity_id,
          })),
        })
      }
    }

    // Обновляем services если переданы
    if (services && Array.isArray(services)) {
      // Удаляем старые связи
      await prisma.profile_services.deleteMany({
        where: { profile_id: id },
      })
      // Создаём новые
      if (services.length > 0) {
        await prisma.profile_services.createMany({
          data: services.map((service_id: string) => ({
            profile_id: id,
            service_id,
          })),
        })
      }
    }

    logger.info('[Profile API] Profile updated successfully:', id)

    return NextResponse.json(updatedProfile)
  } catch (error: any) {
    logger.error('[Profile API] Update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profiles/[id] - Удалить профиль
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем, что профиль существует и принадлежит пользователю
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { user_id: true },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (existingProfile.user_id !== userId && !isAdmin) {
      logger.warn('[Profile API] Forbidden delete attempt', {
        profileId: id,
        ownerId: existingProfile.user_id,
        userId,
        isAdmin,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем профиль (CASCADE удалит связанные записи)
    await prisma.profiles.delete({
      where: { id },
    })

    logger.info('[Profile API] Profile deleted successfully:', id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Profile API] Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete profile' },
      { status: 500 }
    )
  }
}
