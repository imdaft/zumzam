import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    // @ts-ignore - Prisma schema doesn't match DB yet
    const [character]: any = await prisma.$queryRawUnsafe(`
      SELECT id, profile_id, name, description, photos, video_url, 
             age_range, age_ranges, program_types, work_format, is_active,
             created_at, updated_at
      FROM animator_characters
      WHERE id = $1::uuid
    `, id)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json({ character })
  } catch (error: any) {
    logger.error('[Animator Characters API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа через профиль
    const [character]: any = await prisma.$queryRawUnsafe(`
      SELECT ac.id, ac.profile_id, p.user_id
      FROM animator_characters ac
      JOIN profiles p ON ac.profile_id = p.id
      WHERE ac.id = $1::uuid
    `, id)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && character.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Build UPDATE query dynamically
    const updates: string[] = []
    const values: any[] = [id]
    let paramIndex = 2
    
    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(body.name)
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(body.description)
    }
    if (body.photos !== undefined) {
      updates.push(`photos = $${paramIndex++}::text[]`)
      values.push(body.photos || [])
    }
    if (body.video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`)
      values.push(body.video_url)
    }
    if (body.age_ranges !== undefined) {
      updates.push(`age_ranges = $${paramIndex++}::text[]`)
      values.push(body.age_ranges || [])
    }
    if (body.program_types !== undefined) {
      updates.push(`program_types = $${paramIndex++}::text[]`)
      values.push(body.program_types || [])
    }
    if (body.work_format !== undefined) {
      updates.push(`work_format = $${paramIndex++}`)
      values.push(body.work_format)
    }
    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(body.is_active)
    }
    
    updates.push('updated_at = NOW()')
    
    // @ts-ignore - Prisma schema doesn't match DB yet
    const [updatedCharacter]: any = await prisma.$queryRawUnsafe(`
      UPDATE animator_characters 
      SET ${updates.join(', ')}
      WHERE id = $1::uuid
      RETURNING id, profile_id, name, description, photos, video_url, 
                age_range, age_ranges, program_types, work_format, is_active,
                created_at, updated_at
    `, ...values)

    return NextResponse.json({ character: updatedCharacter })
  } catch (error: any) {
    logger.error('[Animator Characters API] PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа
    const [character]: any = await prisma.$queryRawUnsafe(`
      SELECT ac.id, ac.profile_id, p.user_id
      FROM animator_characters ac
      JOIN profiles p ON ac.profile_id = p.id
      WHERE ac.id = $1::uuid
    `, id)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && character.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // @ts-ignore - Prisma schema doesn't match DB yet
    await prisma.$queryRawUnsafe(`
      DELETE FROM animator_characters
      WHERE id = $1::uuid
    `, id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Animator Characters API] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
