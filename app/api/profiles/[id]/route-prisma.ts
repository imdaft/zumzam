import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/profiles/[id] - Получить профиль по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем профиль с связями
    const profile = await prisma.profiles.findUnique({
      where: { id },
      include: {
        profile_locations: true,
        profile_activities: {
          select: { activity_id: true }
        },
        profile_services: {
          select: { service_id: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    // Проверяем права доступа
    if (profile.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Преобразуем связи в массивы ID для клиента
    const profileWithArrays = {
      ...profile,
      activities: profile.profile_activities.map(pa => pa.activity_id),
      services: profile.profile_services.map(ps => ps.service_id)
    }

    return NextResponse.json(profileWithArrays)
  } catch (error: any) {
    console.error('Get profile error:', error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем существование профиля и права доступа
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { id: true, user_id: true, category: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    if (existingProfile.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получаем данные для обновления
    const body = await request.json()

    // Извлекаем связанные сущности отдельно
    const { locations, activities, services, primary_services, additional_services, ...profileData } = body

    // Добавляем primary_services и additional_services в profileData
    if (primary_services !== undefined) {
      profileData.primary_services = primary_services
    }
    if (additional_services !== undefined) {
      profileData.additional_services = additional_services
    }

    console.log('📥 [PATCH /api/profiles/[id]] Received body:', {
      profileId: id,
      hasActivities: !!activities,
      activitiesCount: Array.isArray(activities) ? activities.length : 0,
      hasServices: !!services,
      servicesCount: Array.isArray(services) ? services.length : 0,
      hasPrimaryServices: !!primary_services,
      hasAdditionalServices: !!additional_services,
    })

    // Обновляем профиль
    const updatedProfile = await prisma.profiles.update({
      where: { id },
      data: profileData
    })

    // Обновляем связи с каталогом activities
    if (Array.isArray(activities)) {
      // Удаляем старые связи
      await prisma.profile_activities.deleteMany({
        where: { profile_id: id }
      })

      // Добавляем новые
      if (activities.length > 0) {
        await prisma.profile_activities.createMany({
          data: activities.map(activity_id => ({
            profile_id: id,
            activity_id,
            is_primary: false
          }))
        })
        console.log('✅ Activities saved:', activities.length)
      }
    }

    // Обновляем связи с каталогом services
    if (Array.isArray(services)) {
      // Удаляем старые связи
      await prisma.profile_services.deleteMany({
        where: { profile_id: id }
      })

      // Добавляем новые
      if (services.length > 0) {
        await prisma.profile_services.createMany({
          data: services.map(service_id => ({
            profile_id: id,
            service_id,
            is_included: true
          }))
        })
        console.log('✅ Services saved:', services.length)
      }
    }

    // Обновляем локации
    if (locations && Array.isArray(locations)) {
      const venueTypeFromProfile = (profileData.details as any)?.venue_type || (profileData.details as any)?.subtype

      // Получаем существующие локации
      const existingLocations = await prisma.profile_locations.findMany({
        where: { profile_id: id },
        select: { id: true }
      })

      const existingLocationIds = new Set(existingLocations.map(l => l.id))
      const updatedLocationIds = new Set<string>()

      for (const loc of locations) {
        // Синхронизируем venue_type для площадок
        if (venueTypeFromProfile && updatedProfile.category === 'venue') {
          if (!loc.details) {
            loc.details = {}
          }
          loc.details.venue_type = venueTypeFromProfile
        }

        if (loc.id && existingLocationIds.has(loc.id)) {
          // Обновляем существующую локацию
          updatedLocationIds.add(loc.id)
          await prisma.profile_locations.update({
            where: { id: loc.id },
            data: {
              city: loc.city,
              address: loc.address || null,
              name: loc.name || null,
              phone: loc.phone || null,
              email: loc.email || null,
              is_main: loc.is_main || false,
              active: loc.active !== undefined ? loc.active : true,
              details: loc.details || {},
              yandex_url: loc.yandex_url || null,
              yandex_rating: loc.yandex_rating || null,
              yandex_review_count: loc.yandex_review_count || 0,
              photos: loc.photos || [],
              video_url: loc.video_url || null,
            }
          })
        } else {
          // Создаём новую локацию
          const newLocation = await prisma.profile_locations.create({
            data: {
              profile_id: id,
              city: loc.city,
              address: loc.address || null,
              name: loc.name || null,
              phone: loc.phone || null,
              email: loc.email || null,
              is_main: loc.is_main || false,
              active: loc.active !== undefined ? loc.active : true,
              details: loc.details || {},
              yandex_url: loc.yandex_url || null,
              yandex_rating: loc.yandex_rating || null,
              yandex_review_count: loc.yandex_review_count || 0,
              photos: loc.photos || [],
              video_url: loc.video_url || null,
            }
          })
          updatedLocationIds.add(newLocation.id)
        }
      }

      // Удаляем локации, которые не были переданы
      const locationIdsToDelete = Array.from(existingLocationIds).filter(
        id => !updatedLocationIds.has(id)
      )

      if (locationIdsToDelete.length > 0) {
        await prisma.profile_locations.deleteMany({
          where: {
            id: { in: locationIdsToDelete }
          }
        })
      }
    }

    // Дополнительно: синхронизируем venue_type во всех локациях площадки
    if (updatedProfile.category === 'venue') {
      const venueTypeFromProfile = (profileData.details as any)?.venue_type || (profileData.details as any)?.subtype
      if (venueTypeFromProfile) {
        const allLocations = await prisma.profile_locations.findMany({
          where: { profile_id: id },
          select: { id: true, details: true }
        })

        for (const location of allLocations) {
          const updatedDetails = {
            ...(location.details as any || {}),
            venue_type: venueTypeFromProfile
          }

          await prisma.profile_locations.update({
            where: { id: location.id },
            data: { details: updatedDetails }
          })
        }
        console.log(`Synced venue_type to ${allLocations.length} locations`)
      }
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем существование профиля и права доступа
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { id: true, user_id: true, display_name: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (existingProfile.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем профиль (каскадное удаление настроено в БД)
    await prisma.profiles.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Profile deleted successfully',
      deleted_profile: existingProfile.display_name
    })
  } catch (error: any) {
    console.error('Delete profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete profile' },
      { status: 500 }
    )
  }
}

import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/profiles/[id] - Получить профиль по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Получаем профиль с связями
    const profile = await prisma.profiles.findUnique({
      where: { id },
      include: {
        profile_locations: true,
        profile_activities: {
          select: { activity_id: true }
        },
        profile_services: {
          select: { service_id: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    // Проверяем права доступа
    if (profile.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Преобразуем связи в массивы ID для клиента
    const profileWithArrays = {
      ...profile,
      activities: profile.profile_activities.map(pa => pa.activity_id),
      services: profile.profile_services.map(ps => ps.service_id)
    }

    return NextResponse.json(profileWithArrays)
  } catch (error: any) {
    console.error('Get profile error:', error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем существование профиля и права доступа
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { id: true, user_id: true, category: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Проверяем роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const isAdmin = user?.role === 'admin'

    if (existingProfile.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Получаем данные для обновления
    const body = await request.json()

    // Извлекаем связанные сущности отдельно
    const { locations, activities, services, primary_services, additional_services, ...profileData } = body

    // Добавляем primary_services и additional_services в profileData
    if (primary_services !== undefined) {
      profileData.primary_services = primary_services
    }
    if (additional_services !== undefined) {
      profileData.additional_services = additional_services
    }

    console.log('📥 [PATCH /api/profiles/[id]] Received body:', {
      profileId: id,
      hasActivities: !!activities,
      activitiesCount: Array.isArray(activities) ? activities.length : 0,
      hasServices: !!services,
      servicesCount: Array.isArray(services) ? services.length : 0,
      hasPrimaryServices: !!primary_services,
      hasAdditionalServices: !!additional_services,
    })

    // Обновляем профиль
    const updatedProfile = await prisma.profiles.update({
      where: { id },
      data: profileData
    })

    // Обновляем связи с каталогом activities
    if (Array.isArray(activities)) {
      // Удаляем старые связи
      await prisma.profile_activities.deleteMany({
        where: { profile_id: id }
      })

      // Добавляем новые
      if (activities.length > 0) {
        await prisma.profile_activities.createMany({
          data: activities.map(activity_id => ({
            profile_id: id,
            activity_id,
            is_primary: false
          }))
        })
        console.log('✅ Activities saved:', activities.length)
      }
    }

    // Обновляем связи с каталогом services
    if (Array.isArray(services)) {
      // Удаляем старые связи
      await prisma.profile_services.deleteMany({
        where: { profile_id: id }
      })

      // Добавляем новые
      if (services.length > 0) {
        await prisma.profile_services.createMany({
          data: services.map(service_id => ({
            profile_id: id,
            service_id,
            is_included: true
          }))
        })
        console.log('✅ Services saved:', services.length)
      }
    }

    // Обновляем локации
    if (locations && Array.isArray(locations)) {
      const venueTypeFromProfile = (profileData.details as any)?.venue_type || (profileData.details as any)?.subtype

      // Получаем существующие локации
      const existingLocations = await prisma.profile_locations.findMany({
        where: { profile_id: id },
        select: { id: true }
      })

      const existingLocationIds = new Set(existingLocations.map(l => l.id))
      const updatedLocationIds = new Set<string>()

      for (const loc of locations) {
        // Синхронизируем venue_type для площадок
        if (venueTypeFromProfile && updatedProfile.category === 'venue') {
          if (!loc.details) {
            loc.details = {}
          }
          loc.details.venue_type = venueTypeFromProfile
        }

        if (loc.id && existingLocationIds.has(loc.id)) {
          // Обновляем существующую локацию
          updatedLocationIds.add(loc.id)
          await prisma.profile_locations.update({
            where: { id: loc.id },
            data: {
              city: loc.city,
              address: loc.address || null,
              name: loc.name || null,
              phone: loc.phone || null,
              email: loc.email || null,
              is_main: loc.is_main || false,
              active: loc.active !== undefined ? loc.active : true,
              details: loc.details || {},
              yandex_url: loc.yandex_url || null,
              yandex_rating: loc.yandex_rating || null,
              yandex_review_count: loc.yandex_review_count || 0,
              photos: loc.photos || [],
              video_url: loc.video_url || null,
            }
          })
        } else {
          // Создаём новую локацию
          const newLocation = await prisma.profile_locations.create({
            data: {
              profile_id: id,
              city: loc.city,
              address: loc.address || null,
              name: loc.name || null,
              phone: loc.phone || null,
              email: loc.email || null,
              is_main: loc.is_main || false,
              active: loc.active !== undefined ? loc.active : true,
              details: loc.details || {},
              yandex_url: loc.yandex_url || null,
              yandex_rating: loc.yandex_rating || null,
              yandex_review_count: loc.yandex_review_count || 0,
              photos: loc.photos || [],
              video_url: loc.video_url || null,
            }
          })
          updatedLocationIds.add(newLocation.id)
        }
      }

      // Удаляем локации, которые не были переданы
      const locationIdsToDelete = Array.from(existingLocationIds).filter(
        id => !updatedLocationIds.has(id)
      )

      if (locationIdsToDelete.length > 0) {
        await prisma.profile_locations.deleteMany({
          where: {
            id: { in: locationIdsToDelete }
          }
        })
      }
    }

    // Дополнительно: синхронизируем venue_type во всех локациях площадки
    if (updatedProfile.category === 'venue') {
      const venueTypeFromProfile = (profileData.details as any)?.venue_type || (profileData.details as any)?.subtype
      if (venueTypeFromProfile) {
        const allLocations = await prisma.profile_locations.findMany({
          where: { profile_id: id },
          select: { id: true, details: true }
        })

        for (const location of allLocations) {
          const updatedDetails = {
            ...(location.details as any || {}),
            venue_type: venueTypeFromProfile
          }

          await prisma.profile_locations.update({
            where: { id: location.id },
            data: { details: updatedDetails }
          })
        }
        console.log(`Synced venue_type to ${allLocations.length} locations`)
      }
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Проверяем авторизацию через JWT
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub

    // Проверяем существование профиля и права доступа
    const existingProfile = await prisma.profiles.findUnique({
      where: { id },
      select: { id: true, user_id: true, display_name: true }
    })

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (existingProfile.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Удаляем профиль (каскадное удаление настроено в БД)
    await prisma.profiles.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Profile deleted successfully',
      deleted_profile: existingProfile.display_name
    })
  } catch (error: any) {
    console.error('Delete profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete profile' },
      { status: 500 }
    )
  }
}




