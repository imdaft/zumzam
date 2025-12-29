import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/search/suggestions - подсказки для поиска
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Поиск по профилям
    const profiles = await prisma.profiles.findMany({
      where: {
        is_published: true,
        OR: [
          { display_name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        slug: true,
        display_name: true,
        category: true,
        city: true,
        logo: true
      },
      take: limit
    })

    // Поиск популярных запросов
    const popularSearches = await prisma.search_queries.groupBy({
      by: ['query'],
      where: {
        query: {
          contains: query,
          mode: 'insensitive'
        }
      },
      _count: true,
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: 5
    })

    const suggestions = {
      profiles: profiles.map(p => ({
        type: 'profile',
        id: p.id,
        slug: p.slug,
        title: p.display_name,
        subtitle: `${getCategoryName(p.category)} • ${p.city}`,
        logo: p.logo
      })),
      popular_queries: popularSearches.map(s => ({
        type: 'query',
        text: s.query,
        count: s._count
      }))
    }

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions', details: error.message },
      { status: 500 }
    )
  }
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    animator: 'Аниматор',
    show: 'Шоу',
    quest: 'Квест',
    masterclass: 'Мастер-класс',
    host: 'Ведущий',
    photo_video: 'Фото/видео',
    santa: 'Дед Мороз',
    face_painting: 'Аквагрим',
    venue: 'Площадка'
  }
  return names[category] || category
}



