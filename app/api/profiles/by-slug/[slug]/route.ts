import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET - Загрузить профиль по slug (для AI контекста)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    logger.info('[Profile By Slug API] Loading profile for slug:', { slug })

    // Загружаем профиль через Prisma
    const profile = await prisma.profiles.findFirst({
      where: {
        slug: slug,
        is_published: true,
      },
      select: {
        id: true,
        display_name: true,
        slug: true,
        category: true,
        description: true,
        bio: true,
        city: true,
        rating: true,
        cover_photo: true,
      },
    })

    if (!profile) {
      logger.info('[Profile By Slug API] Profile not found:', { slug })
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    logger.info('[Profile By Slug API] Profile found:', { name: profile.display_name })
    return NextResponse.json({ profile })
  } catch (error: any) {
    logger.error('[Profile By Slug API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

