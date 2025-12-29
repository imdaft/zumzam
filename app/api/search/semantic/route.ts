import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { withApiProtection } from '@/lib/security/api-protection'
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/search/semantic - Семантический поиск с использованием Gemini embeddings
 */
export async function POST(request: NextRequest) {
  const protection = await withApiProtection(request, {
    rateLimit: false,
    botDetection: true,
  })
  if (protection) return protection

  const identifier = getClientIdentifier(request)
  const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.search)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Слишком много поисковых запросов. Попробуйте через минуту.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMITS.search.maxRequests),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
        }
      }
    )
  }

  try {
    const body = await request.json()
    const {
      query,
      city,
      priceMin,
      priceMax,
      ageFrom,
      ageTo,
      tags,
      limit = 20,
      threshold = 0.7,
    } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 1. Генерируем embedding для запроса пользователя
    logger.debug('[Search] Generating embedding', { query })
    const queryEmbedding = await generateEmbedding(query)

    // TODO: Векторный поиск через Prisma/pgvector
    // Пока используем простой текстовый поиск
    logger.warn('[Search] Vector search not yet implemented, using text search fallback')

    const where: any = {}
    if (city) {
      where.city = city
    }
    if (priceMin || priceMax) {
      where.services = {
        some: {
          price: {
            ...(priceMin ? { gte: parseFloat(priceMin) } : {}),
            ...(priceMax ? { lte: parseFloat(priceMax) } : {}),
          }
        }
      }
    }

    // Простой текстовый поиск
    const profiles = await prisma.profiles.findMany({
      where: {
        ...where,
        is_published: true,
        OR: [
          { display_name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      include: {
        services: true
      },
      take: limit,
    })

    return NextResponse.json({
      services: profiles.map(p => ({
        id: p.id,
        title: p.display_name,
        profile: p
      })),
      count: profiles.length,
      query,
    })
  } catch (error: any) {
    logger.error('[Search] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
