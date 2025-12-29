import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 })
    }

    const partners = await prisma.agency_partners.findMany({
      where: {
        agency_profile_id: profileId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(partners || [])
  } catch (error: any) {
    logger.error('[API agency-partners] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
