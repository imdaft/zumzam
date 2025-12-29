import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * GET /api/messages/[id]/reactions
 * Получить реакции на сообщение
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params

    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Получаем реакции на сообщение
    const reactions = await prisma.message_reactions.findMany({
      where: { message_id: messageId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true
          }
        }
      }
    })

    return NextResponse.json({ reactions })
  } catch (error: any) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json(
      { error: 'Ошибка получения реакций', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/[id]/reactions
 * Добавить/обновить реакцию
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params

    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    const body = await request.json()
    const { reaction } = body

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction is required' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже реакция от этого пользователя
    const existingReaction = await prisma.message_reactions.findFirst({
      where: {
        message_id: messageId,
        user_id: userId
      }
    })

    let result

    if (existingReaction) {
      // Обновляем реакцию
      result = await prisma.message_reactions.update({
        where: { id: existingReaction.id },
        data: { reaction }
      })
    } else {
      // Создаём новую реакцию
      result = await prisma.message_reactions.create({
        data: {
          message_id: messageId,
          user_id: userId,
          reaction
        }
      })
    }

    return NextResponse.json({ reaction: result })
  } catch (error: any) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { error: 'Ошибка добавления реакции', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/messages/[id]/reactions
 * Удалить свою реакцию
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params

    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    // Находим и удаляем реакцию
    const reaction = await prisma.message_reactions.findFirst({
      where: {
        message_id: messageId,
        user_id: userId
      }
    })

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      )
    }

    await prisma.message_reactions.delete({
      where: { id: reaction.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления реакции', details: error.message },
      { status: 500 }
    )
  }
}
