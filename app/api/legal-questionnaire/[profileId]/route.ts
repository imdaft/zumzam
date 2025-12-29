import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

/**
 * GET /api/legal-questionnaire/[profileId]
 * Получение ответов юридической анкеты
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const params = await context.params

    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    logger.info('[Legal Questionnaire GET] User:', userId, 'Profile:', params.profileId)

    // Проверяем права доступа к профилю
    const profile = await prisma.profiles.findUnique({
      where: { id: params.profileId },
      select: { user_id: true }
    })

    logger.info('[Legal Questionnaire GET] Profile check:', {
      profileUserId: profile?.user_id,
      currentUserId: userId,
      match: profile?.user_id === userId
    })

    if (!profile || profile.user_id !== userId) {
      logger.error('[Legal Questionnaire GET] Access denied')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем ответы анкеты
    const questionnaire = await prisma.legal_questionnaire_answers.findUnique({
      where: { profile_id: params.profileId }
    })

    if (!questionnaire) {
      // Анкета ещё не заполнена - возвращаем пустую
      return NextResponse.json({ answers: {} }, { status: 200 })
    }

    return NextResponse.json({ 
      id: questionnaire.id,
      profile_id: questionnaire.profile_id,
      answers: questionnaire.answers || {},
      created_at: questionnaire.created_at,
      updated_at: questionnaire.updated_at
    })
  } catch (error: any) {
    logger.error('[Legal Questionnaire GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/legal-questionnaire/[profileId]
 * Сохранение ответов юридической анкеты
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const params = await context.params

    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    logger.info('[Legal Questionnaire POST] User:', userId, 'Profile:', params.profileId)

    // Проверяем права доступа к профилю
    const profile = await prisma.profiles.findUnique({
      where: { id: params.profileId },
      select: { user_id: true }
    })

    if (!profile || profile.user_id !== userId) {
      logger.error('[Legal Questionnaire POST] Access denied')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { answers } = body

    if (!answers) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    // Upsert ответов анкеты
    const questionnaire = await prisma.legal_questionnaire_answers.upsert({
      where: { profile_id: params.profileId },
      create: {
        profile_id: params.profileId,
        answers: answers
      },
      update: {
        answers: answers,
        updated_at: new Date()
      }
    })

    logger.info('[Legal Questionnaire POST] Saved successfully')

    return NextResponse.json({ 
      success: true,
      id: questionnaire.id,
      profile_id: questionnaire.profile_id
    })
  } catch (error: any) {
    logger.error('[Legal Questionnaire POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save questionnaire', details: error.message },
      { status: 500 }
    )
  }
}
