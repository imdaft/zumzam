/**
 * API для получения профиля по ID
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const profile = await prisma.profiles.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        slug: true,
        display_name: true,
        city: true,
        logo: true,
        category: true,
        custom_fields_config: true,
        profile_locations: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Преобразуем profile_locations в locations для совместимости
    return NextResponse.json({
      ...profile,
      locations: profile.profile_locations,
    })
  } catch (error: any) {
    logger.error('Profile API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
