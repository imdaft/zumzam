import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

type CatalogPayload = {
  activities?: string[]
  services?: string[]
}

async function assertCanEditProfile(profileId: string, userId: string) {
  const profile = await prisma.profiles.findUnique({
    where: { id: profileId },
    select: { id: true, user_id: true },
  })

  if (!profile) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }), isAdmin: false }
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const isAdmin = user?.role === 'admin'

  if (profile.user_id !== userId && !isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), isAdmin: false }
  }

  return { error: null, isAdmin }
}

/**
 * GET /api/profiles/[id]/catalog
 * Возвращает связи профиля с каталогом (activities/services).
 * Публичный endpoint - не требует проверки прав доступа.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Проверяем, что профиль существует
    const profile = await prisma.profiles.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const [activitiesRows, servicesRows] = await Promise.all([
      prisma.profile_activities.findMany({
        where: { profile_id: id },
        select: { activity_id: true },
      }),
      prisma.profile_services.findMany({
        where: { profile_id: id },
        select: { service_id: true },
      }),
    ])

    return NextResponse.json({
      activities: activitiesRows.map((r) => r.activity_id),
      services: servicesRows.map((r) => r.service_id),
    })
  } catch (error: any) {
    logger.error('[Profile Catalog API] Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load catalog relations' }, { status: 500 })
  }
}

/**
 * PUT /api/profiles/[id]/catalog
 * Полностью перезаписывает связи профиля с каталогом (activities/services).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gate = await assertCanEditProfile(id, userId)
    if (gate.error) return gate.error

    const body = (await request.json().catch(() => ({}))) as CatalogPayload

    const activities = Array.isArray(body.activities) ? body.activities : []
    const services = Array.isArray(body.services) ? body.services : []

    // 1) activities
    await prisma.profile_activities.deleteMany({
      where: { profile_id: id },
    })
    
    if (activities.length > 0) {
      await prisma.profile_activities.createMany({
        data: activities.map((activityId) => ({
          profile_id: id,
          activity_id: activityId,
          is_primary: false,
        })),
      })
    }

    // 2) services
    await prisma.profile_services.deleteMany({
      where: { profile_id: id },
    })
    
    if (services.length > 0) {
      await prisma.profile_services.createMany({
        data: services.map((serviceId) => ({
          profile_id: id,
          service_id: serviceId,
          is_included: true,
        })),
      })
    }

    logger.info('[Profile Catalog API] Updated catalog:', { profileId: id, activitiesCount: activities.length, servicesCount: services.length })

    return NextResponse.json({ ok: true, activitiesCount: activities.length, servicesCount: services.length })
  } catch (error: any) {
    logger.error('[Profile Catalog API] Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to save catalog relations' }, { status: 500 })
  }
}
