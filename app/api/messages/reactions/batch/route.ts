import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

/**
 * GET /api/messages/reactions/batch?messageIds=id1,id2,id3
 * Получить реакции для нескольких сообщений одним запросом
 */
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

    const { searchParams } = new URL(request.url)
    const messageIdsParam = searchParams.get('messageIds')
    
    if (!messageIdsParam) {
      return NextResponse.json(
        { error: 'messageIds parameter is required' },
        { status: 400 }
      )
    }

    const messageIds = messageIdsParam.split(',').filter(id => id.trim())
    
    if (messageIds.length === 0) {
      return NextResponse.json({ reactions: {} })
    }

    // Проверяем, существует ли модель message_reactions в prisma
    if (!(prisma as any).message_reactions) {
      console.warn('[Messages Reactions API] message_reactions model not found in Prisma schema, returning empty result.')
      return NextResponse.json({ reactions: {} })
    }

    // Проверяем, существует ли таблица message_reactions
    try {
      // Получаем все реакции для указанных сообщений
      const reactions = await (prisma as any).message_reactions.findMany({
        where: {
          message_id: {
            in: messageIds
          }
        },
        select: {
          message_id: true,
          emoji: true,
          user_id: true,
          created_at: true
        }
      })

      // Группируем реакции по message_id
      const grouped: Record<string, Array<{ emoji: string; user_id: string }>> = {}
      
      for (const reaction of reactions) {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = []
        }
        grouped[reaction.message_id].push({
          emoji: reaction.emoji,
          user_id: reaction.user_id
        })
      }

      return NextResponse.json({ reactions: grouped })
    } catch (dbError: any) {
      // Если таблица не существует, возвращаем пустой результат
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('Cannot read properties of undefined')) {
        console.warn('[Messages Reactions API] message_reactions table not migrated yet, returning empty result.')
        return NextResponse.json({ reactions: {} })
      }
      throw dbError // Пробрасываем другие ошибки БД
    }
  } catch (error: any) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reactions', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/reactions/batch - массовые реакции на сообщения
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { reactions } = body // [{ message_id, emoji, action: 'add' | 'remove' }]

    if (!reactions || !Array.isArray(reactions)) {
      return NextResponse.json(
        { error: 'reactions array is required' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли модель message_reactions в prisma
    if (!(prisma as any).message_reactions) {
      console.warn('[Messages Reactions API] message_reactions model not found in Prisma schema.')
      return NextResponse.json({
        success: true,
        results: { added: 0, removed: 0, errors: 0 }
      })
    }

    const results = {
      added: 0,
      removed: 0,
      errors: 0
    }

    for (const reaction of reactions) {
      try {
        if (reaction.action === 'add') {
          // Проверить, нет ли уже реакции
          const existing = await (prisma as any).message_reactions.findFirst({
            where: {
              message_id: reaction.message_id,
              user_id: payload.sub,
              emoji: reaction.emoji
            }
          })

          if (!existing) {
            await (prisma as any).message_reactions.create({
              data: {
                message_id: reaction.message_id,
                user_id: payload.sub,
                emoji: reaction.emoji
              }
            })
            results.added++
          }
        } else if (reaction.action === 'remove') {
          await (prisma as any).message_reactions.deleteMany({
            where: {
              message_id: reaction.message_id,
              user_id: payload.sub,
              emoji: reaction.emoji
            }
          })
          results.removed++
        }
      } catch (error) {
        console.error('Error processing reaction:', error)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('Error processing batch reactions:', error)
    return NextResponse.json(
      { error: 'Failed to process reactions', details: error.message },
      { status: 500 }
    )
  }
}



