import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import type { CropData, CoverPhotoCrop } from '@/lib/types/crop'

interface RouteParams {
  params: { id: string }
}

/**
 * API endpoint для сохранения координат кропа обложки
 * PATCH /api/profiles/[id]/cover-crop
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем профиль и проверяем права доступа
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { user_id: true, cover_photo_crop: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь - владелец профиля
    if (profile.user_id !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для изменения этого профиля' },
        { status: 403 }
      )
    }

    // Получаем данные из запроса
    const body = await request.json()
    const { templateId, crop, coverPhotoUrl } = body as { 
      templateId: string; 
      crop: CropData;
      coverPhotoUrl?: string;
    }

    logger.info('Данные запроса:', { templateId, crop, coverPhotoUrl, profileId })

    if (!templateId || !crop) {
      logger.error('Отсутствуют обязательные поля:', { templateId, crop })
      return NextResponse.json(
        { error: 'Необходимо указать templateId и crop' },
        { status: 400 }
      )
    }

    // Валидация данных кропа
    if (
      typeof crop.x !== 'number' ||
      typeof crop.y !== 'number' ||
      typeof crop.zoom !== 'number' ||
      typeof crop.aspect !== 'number'
    ) {
      logger.error('Некорректные типы данных кропа:', { crop })
      return NextResponse.json(
        { error: 'Некорректные данные кропа' },
        { status: 400 }
      )
    }

    // Проверка на NaN
    if (
      isNaN(crop.x) ||
      isNaN(crop.y) ||
      isNaN(crop.zoom) ||
      isNaN(crop.aspect)
    ) {
      logger.error('Данные кропа содержат NaN:', crop)
      return NextResponse.json(
        { error: 'Некорректные числовые значения кропа' },
        { status: 400 }
      )
    }

    // Получаем текущие кропы
    const currentCrops: CoverPhotoCrop = (profile.cover_photo_crop as CoverPhotoCrop) || {}

    // Обновляем кроп для шаблона
    const updatedCrops: CoverPhotoCrop = {
      ...currentCrops,
      [templateId]: crop,
    }

    // Подготавливаем данные для обновления
    const updateData: any = {
      cover_photo_crop: updatedCrops,
      updated_at: new Date(),
    }

    // Если передан URL расширенного изображения - обновляем cover_photo
    if (coverPhotoUrl) {
      updateData.cover_photo = coverPhotoUrl
      logger.info(`Обновляем cover_photo на расширенное изображение: ${coverPhotoUrl}`)
    }

    // Сохраняем в БД через Prisma
    await prisma.profiles.update({
      where: { id: profileId },
      data: updateData,
    })

    logger.info(`Кроп обложки обновлен для шаблона ${templateId} профиля ${profileId}`)

    return NextResponse.json({
      success: true,
      cover_photo_crop: updatedCrops,
    })

  } catch (error: any) {
    logger.error('Ошибка в PATCH /api/profiles/[id]/cover-crop:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Получить текущие кропы обложки
 * GET /api/profiles/[id]/cover-crop
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params

    // Получаем кропы профиля
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { cover_photo_crop: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cover_photo_crop: (profile.cover_photo_crop as CoverPhotoCrop) || {
        classic: { x: 0, y: 0, zoom: 1, aspect: 1.78 },
        modern: { x: 0, y: 0, zoom: 1, aspect: 0.75 },
        minimal: { x: 0, y: 0, zoom: 1, aspect: 1.78 },
      },
    })

  } catch (error: any) {
    logger.error('Ошибка в GET /api/profiles/[id]/cover-crop:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
