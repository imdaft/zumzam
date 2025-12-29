import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// GET /api/admin/moderation/stats - статистика модерации
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Статистика профилей
    const [
      totalProfiles,
      pendingVerification,
      approvedProfiles,
      rejectedProfiles,
      unclaimedProfiles,
      pendingClaims
    ] = await Promise.all([
      prisma.profiles.count(),
      prisma.profiles.count({ where: { verification_status: 'pending' } }),
      prisma.profiles.count({ where: { verification_status: 'approved' } }),
      prisma.profiles.count({ where: { verification_status: 'rejected' } }),
      prisma.profiles.count({ where: { claim_status: 'unclaimed' } }),
      prisma.profile_claim_requests.count({ where: { status: 'pending' } })
    ])

    // Статистика отзывов
    const [
      totalReviews,
      unmoderastedReviews,
      visibleReviews,
      hiddenReviews
    ] = await Promise.all([
      prisma.reviews.count(),
      prisma.reviews.count({ where: { moderated: false } }),
      prisma.reviews.count({ where: { visible: true } }),
      prisma.reviews.count({ where: { visible: false } })
    ])

    // Статистика рекламы
    const [
      totalAdCampaigns,
      pendingAdApproval,
      activeAdCampaigns,
      rejectedAdCampaigns
    ] = await Promise.all([
      prisma.ad_campaigns.count(),
      prisma.ad_campaigns.count({ where: { moderation_status: 'pending' } }),
      prisma.ad_campaigns.count({ where: { status: 'active' } }),
      prisma.ad_campaigns.count({ where: { moderation_status: 'rejected' } })
    ])

    return NextResponse.json({
      profiles: {
        total: totalProfiles,
        pending_verification: pendingVerification,
        approved: approvedProfiles,
        rejected: rejectedProfiles,
        unclaimed: unclaimedProfiles
      },
      claims: {
        pending: pendingClaims
      },
      reviews: {
        total: totalReviews,
        unmoderated: unmoderastedReviews,
        visible: visibleReviews,
        hidden: hiddenReviews
      },
      advertising: {
        total: totalAdCampaigns,
        pending_approval: pendingAdApproval,
        active: activeAdCampaigns,
        rejected: rejectedAdCampaigns
      }
    })
  } catch (error: any) {
    console.error('Error fetching moderation stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}



