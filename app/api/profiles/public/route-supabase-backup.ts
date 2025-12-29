/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'
import { CITY_COORDS } from '@/lib/utils/geo'

// Безопасная обертка над performance.now для любых сред выполнения
const perfNow = () => {
  if (typeof globalThis !== 'undefined' && globalThis.performance?.now) {
    return globalThis.performance.now()
  }
  return Date.now()
}

// Унифицированный дебаг-лог для метрик кеша/запросов
const sendDebugLog = (payload: { location: string; message: string; data?: Record<string, unknown> }) => {
  logger.debug(`[${payload.location}] ${payload.message}`, payload.data)
}

// Хелпер, который пытается определить, не перепутаны ли lat/lng
const normalizeCoords = (lat: number, lng: number, cityName?: string): { lat: number; lng: number } => {
  if (!cityName) return { lat, lng }

  const normalizedCity = cityName.trim().toLowerCase()
  const cityEntry = Object.entries(CITY_COORDS).find(([name]) =>
    normalizedCity.includes(name.toLowerCase())
  )

  if (!cityEntry) return { lat, lng }

  const [, target] = cityEntry

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const distance = (aLat: number, aLng: number) => {
    const R = 6371 // Радиус Земли, км
    const dLat = toRad(target.lat - aLat)
    const dLng = toRad(target.lng - aLng)
    const aa =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(aLat)) * Math.cos(toRad(target.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
    return R * c
  }

  const direct = distance(lat, lng)
  const swapped = distance(lng, lat)

  // Если переворот координат сильно ближе к целевому городу — меняем местами
  if (swapped + 5 < direct) {
    return { lat: lng, lng: lat }
  }

  return { lat, lng }
}

// Функция для декодирования EWKB (PostGIS binary format)
function parseEWKB(hexString: string): { lat: number; lng: number } | null {
  try {
    const coordsStart = 18
    const lngHex = hexString.substring(coordsStart, coordsStart + 16)
    const latHex = hexString.substring(coordsStart + 16, coordsStart + 32)
    
    const lngBytes = new Uint8Array(lngHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const latBytes = new Uint8Array(latHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    
    const lng = new DataView(lngBytes.buffer).getFloat64(0, true)
    const lat = new DataView(latBytes.buffer).getFloat64(0, true)
    
    return { lat, lng }
  } catch {
    return null
  }
}

// Создаём клиент без cookies - для публичных данных авторизация не нужна
function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

// Простой in-memory кеш для профилей (5 минут) + дедупликация конкурентных запросов
let profilesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
let profilesCachePromise: Promise<any[]> | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 минут — профили редко меняются

const isCacheFresh = () => {
  const nowTs = Date.now()
  return Boolean(profilesCache.data && (nowTs - profilesCache.timestamp) < CACHE_TTL)
}

async function fetchProfilesFromSupabase() {
  const supabase = createPublicClient()

  // 1. Загружаем профили с локациями
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      slug,
      category,
      price_range,
      rating,
      reviews_count,
      cover_photo,
      main_photo,
      city,
      is_published,
      details,
      description,
      bio,
      profile_locations (
        id,
        city,
        address,
        geo_location,
        is_main,
        active,
        details
      )
    `)
    .eq('is_published', true)

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileIds = profilesData?.map(p => p.id) || []
  if (profileIds.length === 0) {
    return []
  }

  const locationIds = profilesData
    ?.flatMap(p => (p.profile_locations || []).map((loc: any) => loc.id))
    .filter(Boolean) || []

  // 2. ПАРАЛЛЕЛЬНЫЕ запросы вместо последовательных - экономим время!
  const [servicesResult, reviewsResult, yandexResult] = await Promise.all([
    supabase
      .from('services')
      .select('profile_id, price, is_additional, photos')
      .in('profile_id', profileIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('profile_id, rating')
      .in('profile_id', profileIds)
      .eq('moderated', true)
      .eq('visible', true),
    locationIds.length > 0
      ? supabase
          .from('yandex_reviews_cache')
          .select('profile_location_id, rating, review_count')
          .in('profile_location_id', locationIds)
      : Promise.resolve({ data: [] }),
  ])

  // Обрабатываем услуги
  const servicesMap = new Map<string, number | null>()
  const servicePhotosMap = new Map<string, string[]>()

  if (servicesResult.data) {
    servicesResult.data.forEach((service: any) => {
      if (!service.is_additional && service.price) {
        const existing = servicesMap.get(service.profile_id)
        if (existing === undefined || existing === null || service.price < existing) {
          servicesMap.set(service.profile_id, service.price)
        }
      }

      if (service.photos && service.photos.length > 0) {
        const existingPhotos = servicePhotosMap.get(service.profile_id) || []
        if (existingPhotos.length < 5) {
          existingPhotos.push(service.photos[0])
          servicePhotosMap.set(service.profile_id, existingPhotos)
        }
      }
    })
  }

  // Обрабатываем внутренние отзывы
  const internalReviewsMap = new Map<string, { rating: number | null; count: number }>()
  if (reviewsResult.data) {
    const profileReviewsMap = new Map<string, { sum: number; count: number }>()

    reviewsResult.data.forEach((review: any) => {
      const existing = profileReviewsMap.get(review.profile_id) || { sum: 0, count: 0 }
      existing.sum += review.rating
      existing.count += 1
      profileReviewsMap.set(review.profile_id, existing)
    })

    profileReviewsMap.forEach((data, profileId) => {
      const avgRating = data.count > 0 ? data.sum / data.count : null
      internalReviewsMap.set(profileId, {
        rating: avgRating ? Number(avgRating.toFixed(1)) : null,
        count: data.count,
      })
    })
  }

  // Обрабатываем Яндекс отзывы
  const yandexReviewsMap = new Map<string, { rating: number | null; count: number }>()
  if (yandexResult.data && yandexResult.data.length > 0) {
    const profileYandexMap = new Map<string, { totalRating: number; totalCount: number; count: number }>()

    yandexResult.data.forEach((cache: any) => {
      const profile = profilesData?.find(p =>
        (p.profile_locations || []).some((loc: any) => loc.id === cache.profile_location_id)
      )

      if (profile) {
        const existing = profileYandexMap.get(profile.id) || { totalRating: 0, totalCount: 0, count: 0 }
        if (cache.rating && cache.review_count) {
          existing.totalRating += cache.rating * cache.review_count
          existing.totalCount += cache.review_count
          existing.count += 1
        }
        profileYandexMap.set(profile.id, existing)
      }
    })

    profileYandexMap.forEach((data, profileId) => {
      const avgRating = data.totalCount > 0 ? data.totalRating / data.totalCount : null
      yandexReviewsMap.set(profileId, {
        rating: avgRating ? Number(avgRating.toFixed(1)) : null,
        count: data.totalCount,
      })
    })
  }

  // Форматируем профили
  const formatted = profilesData?.map((p: any) => {
    const reviewsSource = p.details?.reviews_source || 'internal'
    const internalData = internalReviewsMap.get(p.id)
    const yandexData = yandexReviewsMap.get(p.id)

    let displayRating = p.rating || 0
    let displayReviewsCount = p.reviews_count || 0

    if (reviewsSource === 'yandex') {
      if (yandexData && yandexData.rating !== null) {
        displayRating = yandexData.rating
        displayReviewsCount = yandexData.count
      } else if (internalData && internalData.rating !== null) {
        displayRating = internalData.rating
        displayReviewsCount = internalData.count
      }
    } else {
      if (internalData && internalData.rating !== null) {
        displayRating = internalData.rating
        displayReviewsCount = internalData.count
      }
    }

    const isVenue = (p.category || 'venue') === 'venue'
    const mainLoc = isVenue
      ? p.profile_locations?.find((l: any) => l.is_main && l.active) ||
        p.profile_locations?.find((l: any) => l.active) ||
        p.profile_locations?.[0]
      : null

    // Для не-venue профилей координаты не возвращаем вообще
    let lat = isVenue ? 59.9343 : null
    let lng = isVenue ? 30.3351 : null
    let fullCity = p.city || ''

    if (mainLoc) {
      if (mainLoc.city) {
        fullCity = mainLoc.address
          ? `${mainLoc.city}, ${mainLoc.address}`
          : mainLoc.city
      }

      if (mainLoc.geo_location) {
        if (typeof mainLoc.geo_location === 'string') {
          const matches = mainLoc.geo_location.match(/POINT\(([\d\.\-]+)\s+([\d\.\-]+)\)/)
          if (matches) {
            lng = parseFloat(matches[1])
            lat = parseFloat(matches[2])
          } else if (mainLoc.geo_location.startsWith('0101000020')) {
            const coords = parseEWKB(mainLoc.geo_location)
            if (coords) {
              lat = coords.lat
              lng = coords.lng
            }
          }
        } else if (mainLoc.geo_location?.coordinates) {
          lng = mainLoc.geo_location.coordinates[0]
          lat = mainLoc.geo_location.coordinates[1]
        }
      }

      const normalized = normalizeCoords(lat, lng, mainLoc.city || p.city)
      lat = normalized.lat
      lng = normalized.lng
    }

    const venueType = mainLoc?.details?.venue_type || p.details?.venue_type || null

    const allLocations = isVenue
      ? (p.profile_locations || [])
          .filter((loc: any) => loc.active)
          .map((loc: any) => {
            let locLat = 59.9343
            let locLng = 30.3351

            if (loc.geo_location) {
              if (typeof loc.geo_location === 'string') {
                const matches = loc.geo_location.match(/POINT\(([\d\.\-]+)\s+([\d\.\-]+)\)/)
                if (matches) {
                  locLng = parseFloat(matches[1])
                  locLat = parseFloat(matches[2])
                } else if (loc.geo_location.startsWith('0101000020')) {
                  const coords = parseEWKB(loc.geo_location)
                  if (coords) {
                    locLat = coords.lat
                    locLng = coords.lng
                  }
                }
              } else if (loc.geo_location?.coordinates) {
                locLng = loc.geo_location.coordinates[0]
                locLat = loc.geo_location.coordinates[1]
              }
            }

            const normalized = normalizeCoords(locLat, locLng, loc.city || p.city)

            return {
              id: loc.id,
              address: loc.address,
              city: loc.city,
              lat: normalized.lat,
              lng: normalized.lng,
            is_main: loc.is_main,
          }
        })
      : []

    return {
      id: p.id,
      name: p.display_name || 'Без названия',
      slug: p.slug,
      category: p.category || 'venue',
      image: p.main_photo || p.cover_photo || null,
      rating: displayRating,
      reviews: displayReviewsCount,
      priceRange: p.price_range || 'По запросу',
      price_from: servicesMap.get(p.id) || null,
      tags: p.details?.tags || [],
      is_verified: p.details?.is_verified || false,
      is_featured: p.details?.is_featured || false,
      venue_type: venueType,
      service_photos: servicePhotosMap.get(p.id) || [],
      locations: allLocations,
      lat,
      lng,
      city: fullCity,
      description: p.bio || p.description || '',
    }
  }) || []

  console.log('[Public Profiles API] Returning', formatted.length, 'profiles')

  return formatted
}

async function getPublicProfiles(forceRefresh: boolean) {
  const startedAt = perfNow()

  if (!forceRefresh && isCacheFresh()) {
    console.log('[Public Profiles API] Cache HIT')
    sendDebugLog({
      location: 'profiles/public/route.ts:getPublicProfiles',
      message: 'Cache hit',
      data: { durationMs: Math.round(perfNow() - startedAt), cachedCount: profilesCache.data?.length || 0 },
    })
    return profilesCache.data || []
  }

  if (!forceRefresh && profilesCachePromise) {
    console.log('[Public Profiles API] Reusing in-flight promise')
    const data = await profilesCachePromise
    sendDebugLog({
      location: 'profiles/public/route.ts:getPublicProfiles',
      message: 'In-flight reused',
      data: { durationMs: Math.round(perfNow() - startedAt), cachedCount: data.length },
    })
    return data
  }

  console.log('[Public Profiles API] Cache MISS - fetching from Supabase...')
  profilesCachePromise = fetchProfilesFromSupabase()

  try {
    const data = await profilesCachePromise
    profilesCache = { data, timestamp: Date.now() }

    sendDebugLog({
      location: 'profiles/public/route.ts:getPublicProfiles',
      message: 'Profiles fetched',
      data: {
        durationMs: Math.round(perfNow() - startedAt),
        profiles: data.length,
      },
    })

    return data
  } finally {
    profilesCachePromise = null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === '1'
    const profiles = await getPublicProfiles(forceRefresh)
    
    // HTTP кеширование: браузер и CDN кешируют на 5 минут
    const response = NextResponse.json({ profiles })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error: unknown) {
    console.error('[Public Profiles API] Exception:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

