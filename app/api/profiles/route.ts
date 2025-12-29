import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/profiles - Получить профили
 * - ?mine=true - получить профили текущего пользователя (требуется авторизация)
 * - ?city=... - публичный поиск по городу
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine') === 'true'
  const city = searchParams.get('city')
  const verified = searchParams.get('verified')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Если запрашиваются "мои" профили
    if (mine) {
      const userId = await getUserIdFromRequest(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const [profiles, total] = await Promise.all([
        prisma.profiles.findMany({
          where: {
            user_id: userId,
          },
          include: {
            profile_locations: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        prisma.profiles.count({
          where: {
            user_id: userId,
          },
        }),
      ])

      return NextResponse.json({
        profiles: profiles || [],
        total: total || 0,
      })
    }

    // Иначе - публичный поиск
    const where: any = {
      is_published: true, // Показываем только опубликованные
    }

    if (city) {
      where.city = city
    }
    if (verified === 'true') {
      where.verified = true
    }

    const [profiles, total] = await Promise.all([
      prisma.profiles.findMany({
        where,
        include: {
          profile_locations: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.profiles.count({ where }),
    ])

    return NextResponse.json({
      profiles: profiles || [],
      total: total || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    logger.error('Get profiles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/profiles - Создать новый профиль
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Получаем данные из тела запроса
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
      photos,
      videos,
      cover_photo,
      logo,
      locations, // Массив локаций (адресов филиалов)
      category,
      secondary_categories,
      details,
      main_photo,
      faq, // FAQ - хранится в JSON поле
      is_published,
    } = body

    // Проверяем уникальность slug
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

    // Генерируем embedding для семантического поиска
    const textForEmbedding = `${display_name}. ${bio || ''}. ${description}. Теги: ${tags?.join(', ') || ''}`
    let embedding: string | null = null
    
    try {
      const embeddingArray = await generateEmbedding(textForEmbedding)
      if (embeddingArray) {
        embedding = `[${embeddingArray.join(',')}]`
      }
    } catch (embeddingError) {
      logger.error('Embedding generation error:', embeddingError)
    }

    // Создаём профиль
    const profile = await prisma.profiles.create({
      data: {
        user_id: userId,
        slug,
        display_name,
        bio: bio || null,
        description,
        city,
        address: address || null,
        tags: tags || [],
        price_range: price_range || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        social_links: social_links || {},
        portfolio_url: portfolio_url || null,
        photos: photos || [],
        videos: videos || [],
        cover_photo: cover_photo || null,
        logo: logo || null,
        embedding: embedding,
        rating: 0,
        reviews_count: 0,
        bookings_completed: 0,
        verified: false,
        category: category || 'venue',
        secondary_categories: secondary_categories || [],
        details: details || {},
        main_photo: main_photo || null,
        faq: faq || [], // FAQ хранится в JSON поле
        is_published: is_published !== undefined ? is_published : true,
      },
    })

    const allowLocations = category === 'venue'

    // Создаём локации (адреса филиалов) только для площадок
    if (allowLocations && locations && Array.isArray(locations) && locations.length > 0) {
      const locationsToCreate = locations.map((loc: any, index: number) => ({
        profile_id: profile.id,
        city: loc.city || city,
        address: loc.address || null,
        name: loc.name || null,
        phone: loc.phone || null,
        email: loc.email || null,
        working_hours: loc.working_hours || null,
        is_main: index === 0,
        active: loc.active !== undefined ? loc.active : true,
        details: loc.details || {},
        yandex_url: loc.yandex_url || null,
        yandex_rating: loc.yandex_rating || null,
        yandex_review_count: loc.yandex_review_count || 0,
        photos: loc.photos || [],
        video_url: loc.video_url || null,
      }))

      const insertedLocations = await prisma.profile_locations.createMany({
        data: locationsToCreate,
      })

      // Обновляем geo_location через raw SQL (PostGIS)
      if (insertedLocations.count > 0) {
        const allLocations = await prisma.profile_locations.findMany({
          where: { profile_id: profile.id },
          select: { id: true },
        })

        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i]
          const locationRecord = allLocations[i]
          
          if (!locationRecord) continue

          let geoLocation: string | null = null
          if (loc.geo_location && Array.isArray(loc.geo_location) && loc.geo_location.length === 2) {
            const [lat, lon] = loc.geo_location
            geoLocation = `POINT(${lon} ${lat})`
          } else if (loc.geo_location && typeof loc.geo_location === 'object' && loc.geo_location.coordinates) {
            const [lon, lat] = loc.geo_location.coordinates
            geoLocation = `POINT(${lon} ${lat})`
          }

          if (geoLocation) {
            try {
              await prisma.$executeRaw`
                UPDATE profile_locations 
                SET geo_location = ST_GeomFromText(${geoLocation}, 4326)::geography
                WHERE id = ${locationRecord.id}
              `
            } catch (geoError: any) {
              logger.error('Error updating geo_location for location:', locationRecord.id, geoError)
            }
          }
        }
      }
    } else if (allowLocations && (address || city)) {
      // Обратная совместимость: если локаций нет, создаем одну дефолтную (только для площадок)
      try {
        await prisma.profile_locations.create({
          data: {
            profile_id: profile.id,
            city: city,
            address: address || null,
            is_main: true,
            active: true,
          },
        })
      } catch (locationError: any) {
        logger.error('Error creating default location:', locationError)
      }
    }

    // Загружаем профиль с локациями для возврата
    const profileWithLocations = await prisma.profiles.findUnique({
      where: { id: profile.id },
      include: {
        profile_locations: true,
      },
    })

    return NextResponse.json(
      { profile: profileWithLocations, message: 'Profile created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error('Create profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profiles?id=... - Обновить профиль
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем ID профиля из query параметров
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('id')
    
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    // Проверяем права доступа
    const existingProfile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { id: true, user_id: true },
    })
    
    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    if (existingProfile.user_id !== userId) {
      // Проверяем, может ли пользователь быть админом
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Получаем данные для обновления
    const body = await request.json()
    
    // Обновляем профиль
    const updatedProfile = await prisma.profiles.update({
      where: { id: profileId },
      data: body,
    })
    
    return NextResponse.json({
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    logger.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
