import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
    
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 })
    }

    const data = await prisma.agency_cases.findMany({
      where: {
        profile_id: profileId,
        is_active: true,
      },
      orderBy: {
        display_order: 'asc',
      },
    })

    return NextResponse.json(data || [])
  } catch (error: any) {
    logger.error('[Agency Cases API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
