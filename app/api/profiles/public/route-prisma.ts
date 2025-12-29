/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { CITY_COORDS } from '@/lib/utils/geo'

// Простой in-memory кеш для профилей (5 минут)
let profilesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

const isCacheFresh = () => {
  const nowTs = Date.now()
  return Boolean(profilesCache.data && (nowTs - profilesCache.timestamp) < CACHE_TTL)
}

async function fetchProfilesFromPrisma() {
  const startTime = Date.now()
  
  try {
    logger.info('[Public Profiles API] Cache MISS - fetching from Prisma...')

    const profiles = await prisma.profiles.findMany({
      where: {
        is_published: true,
      },
      select: {
        id: true,
        slug: true,
        display_name: true,
        bio: true,
        city: true,
        rating: true,
        reviews_count: true,
        price_range: true,
        cover_photo: true,
        main_photo: true,
        category: true,
        verified: true,
        user_id: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const durationMs = Date.now() - startTime
    logger.info(`[profiles/public/route.ts:getPublicProfiles] Profiles fetched`, {
      durationMs,
      profiles: profiles.length,
    })

    // Кешируем результат
    profilesCache = {
      data: profiles,
      timestamp: Date.now(),
    }

    return profiles
  } catch (error: any) {
    logger.error('[Public Profiles API] Error fetching profiles:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем кеш
    if (isCacheFresh()) {
      logger.info('[Public Profiles API] Cache HIT - returning cached profiles')
      return NextResponse.json(profilesCache.data)
    }

    // Фетчим из БД
    const profiles = await fetchProfilesFromPrisma()

    return NextResponse.json(profiles)
  } catch (error: any) {
    logger.error('[Public Profiles API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { CITY_COORDS } from '@/lib/utils/geo'

// Простой in-memory кеш для профилей (5 минут)
let profilesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

const isCacheFresh = () => {
  const nowTs = Date.now()
  return Boolean(profilesCache.data && (nowTs - profilesCache.timestamp) < CACHE_TTL)
}

async function fetchProfilesFromPrisma() {
  const startTime = Date.now()
  
  try {
    logger.info('[Public Profiles API] Cache MISS - fetching from Prisma...')

    const profiles = await prisma.profiles.findMany({
      where: {
        is_published: true,
      },
      select: {
        id: true,
        slug: true,
        display_name: true,
        bio: true,
        city: true,
        rating: true,
        reviews_count: true,
        price_range: true,
        cover_photo: true,
        main_photo: true,
        category: true,
        verified: true,
        user_id: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const durationMs = Date.now() - startTime
    logger.info(`[profiles/public/route.ts:getPublicProfiles] Profiles fetched`, {
      durationMs,
      profiles: profiles.length,
    })

    // Кешируем результат
    profilesCache = {
      data: profiles,
      timestamp: Date.now(),
    }

    return profiles
  } catch (error: any) {
    logger.error('[Public Profiles API] Error fetching profiles:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем кеш
    if (isCacheFresh()) {
      logger.info('[Public Profiles API] Cache HIT - returning cached profiles')
      return NextResponse.json(profilesCache.data)
    }

    // Фетчим из БД
    const profiles = await fetchProfilesFromPrisma()

    return NextResponse.json(profiles)
  } catch (error: any) {
    logger.error('[Public Profiles API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error.message },
      { status: 500 }
    )
  }
}




