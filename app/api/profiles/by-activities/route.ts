import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/profiles/by-activities?activity_ids=face_painting,water_park
 * Получение ID профилей, у которых есть указанные активности
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityIdsParam = searchParams.get('activity_ids')

    if (!activityIdsParam) {
      return NextResponse.json({ profileIds: [] })
    }

    const activityIds = activityIdsParam.split(',').filter(Boolean)

    if (activityIds.length === 0) {
      return NextResponse.json({ profileIds: [] })
    }

    // Получаем профили с указанными активностями
    const profileActivities = await prisma.profile_activities.findMany({
      where: {
        activity_id: {
          in: activityIds
        }
      },
      select: {
        profile_id: true
      },
      distinct: ['profile_id']
    })

    const profileIds = profileActivities.map(pa => pa.profile_id)

    return NextResponse.json({ profileIds })
  } catch (error: any) {
    console.error('[Profiles by Activities API] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}



