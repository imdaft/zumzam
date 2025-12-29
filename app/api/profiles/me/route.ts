import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/profiles/me - Получить основной профиль текущего пользователя
 * @deprecated Используйте /api/profiles (список) или /api/profiles/[id]
 * Сейчас возвращает первый найденный профиль пользователя.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profiles.findFirst({
      where: {
        user_id: userId,
      },
      include: {
        profile_locations: true,
      },
    })

    // Если профиля нет, возвращаем null (как раньше при 406)
    return NextResponse.json({ profile: profile || null }, { status: 200 })
  } catch (error: any) {
    logger.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profiles/me - Обновить основной профиль текущего пользователя
 */
export async function PATCH(request: NextRequest) {
  logger.info('[PATCH /api/profiles/me] ========== REQUEST START ==========')
  
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем что профиль существует и загружаем его данные
    const existingProfile = await prisma.profiles.findFirst({
      where: {
        user_id: userId,
      },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Use POST to create.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    const {
      display_name,
      slug,
      bio,
      description,
      city,
      address,
      tags,
      price_range,
      email,
      phone,
      website,
      social_links,
      portfolio_url,
      cover_photo,
      photos,
      videos,
      locations, // Массив локаций
      main_photo,
      is_published,
      category,
      details
    } = body

    // Если slug изменился, проверяем уникальность
    if (slug && slug !== existingProfile.slug) {
      const existingSlug = await prisma.profiles.findUnique({
        where: { slug },
        select: { id: true },
      })

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        )
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    if (display_name !== undefined) updateData.display_name = display_name
    if (slug !== undefined) updateData.slug = slug
    if (bio !== undefined) updateData.bio = bio
    if (description !== undefined) updateData.description = description
    if (city !== undefined) updateData.city = city
    if (address !== undefined) updateData.address = address
    if (tags !== undefined) updateData.tags = tags
    if (price_range !== undefined) updateData.price_range = price_range
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (website !== undefined) updateData.website = website
    if (social_links !== undefined) updateData.social_links = social_links
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url
    if (cover_photo !== undefined) updateData.cover_photo = cover_photo
    if (photos !== undefined) updateData.photos = photos
    if (videos !== undefined) updateData.videos = videos
    if (main_photo !== undefined) updateData.main_photo = main_photo
    if (is_published !== undefined) updateData.is_published = is_published
    if (category !== undefined) updateData.category = category
    if (details !== undefined) updateData.details = details

    // Обновляем профиль
    let updatedProfile = existingProfile
    
    if (Object.keys(updateData).length > 0) {
      updatedProfile = await prisma.profiles.update({
        where: { id: existingProfile.id },
        data: updateData,
      })
    }

    // Обновляем локации
    if (locations !== undefined && Array.isArray(locations)) {
      logger.info('[PATCH /api/profiles/me] 📍 Received locations:', locations.map((loc: any, i: number) => ({
        index: i,
        id: loc.id,
        photos: loc.photos,
        video_url: loc.video_url
      })))
      
      // Удаляем старые локации этого профиля
      await prisma.profile_locations.deleteMany({
        where: {
          profile_id: existingProfile.id,
        },
      })

      // Создаём новые
      if (locations.length > 0) {
        const locationsData = locations.map((loc: any, index: number) => ({
          profile_id: existingProfile.id,
          city: loc.city || city || existingProfile.city,
          address: loc.address || null,
          name: loc.name || null,
          phone: loc.phone || null,
          email: loc.email || null,
          working_hours: loc.working_hours || null,
          is_main: loc.is_main !== undefined ? loc.is_main : (index === 0),
          active: loc.active !== undefined ? loc.active : true,
          details: loc.details || {},
          yandex_url: loc.yandex_url || null,
          yandex_rating: loc.yandex_rating || null,
          yandex_review_count: loc.yandex_review_count || 0,
          photos: loc.photos || [],
          video_url: loc.video_url || null,
        }))

        logger.info('[PATCH /api/profiles/me] 💾 Inserting locations:', locationsData.map((loc: any, i: number) => ({
          index: i,
          photos: loc.photos,
          video_url: loc.video_url
        })))

        const insertedLocations = await prisma.profile_locations.createMany({
          data: locationsData,
        })

        // Обновляем geo_location через raw SQL (PostGIS)
        if (insertedLocations.count > 0) {
          const allLocations = await prisma.profile_locations.findMany({
            where: { profile_id: existingProfile.id },
            select: { id: true },
          })

          const geoUpdates = locations.map((loc: any, index: number) => {
            let geoLocation: string | null = null
            if (loc.geo_location && Array.isArray(loc.geo_location) && loc.geo_location.length === 2) {
              const [lat, lon] = loc.geo_location
              geoLocation = `POINT(${lon} ${lat})`
            }
            return { index, geoLocation }
          }).filter((u: any) => u.geoLocation !== null)

          await Promise.all(geoUpdates.map(async (update: any) => {
            if (update.index < allLocations.length) {
              try {
                await prisma.$executeRaw`
                  UPDATE profile_locations 
                  SET geo_location = ST_GeomFromText(${update.geoLocation}, 4326)::geography
                  WHERE id = ${allLocations[update.index].id}
                `
              } catch (geoError: any) {
                logger.error('Error updating geo_location:', allLocations[update.index].id, geoError)
              }
            }
          }))
        }
      }
    }

    // Загружаем итоговый профиль с локациями
    const finalProfile = await prisma.profiles.findUnique({
      where: { id: existingProfile.id },
      include: {
        profile_locations: true,
      },
    })

    return NextResponse.json(
      { profile: finalProfile, message: 'Profile updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error('[PATCH /api/profiles/me] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
