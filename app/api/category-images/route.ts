import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

// GET - получить все изображения категорий
export async function GET() {
  try {
    const data = await prisma.category_images.findMany()
    
    if (!data) {
      logger.error('[Category Images API] No data returned')
      return NextResponse.json({ error: 'No data' }, { status: 500 })
    }
    
    // Преобразуем в объект для удобного доступа
    const imagesMap: Record<string, string> = {}
    const desktopImagesMap: Record<string, string> = {}
    const mobileImagesMap: Record<string, string> = {}
    const originalImagesMap: Record<string, string> = {}
    const cropsMap: Record<string, { desktop?: any, mobile?: any }> = {}
    
    data?.forEach((item) => {
      const key = item.category_id
      imagesMap[key] = item.desktop_image_url || ''
      desktopImagesMap[key] = item.desktop_image_url || ''
      mobileImagesMap[key] = item.mobile_image_url || ''
      originalImagesMap[key] = item.original_image_url || ''
      cropsMap[key] = {
        desktop: item.desktop_crop,
        mobile: item.mobile_crop
      }
    })
    
    logger.info('[Category Images API] Loaded images:', { count: data.length })
    
    return NextResponse.json({ 
      images: imagesMap, 
      desktopImages: desktopImagesMap,
      mobileImages: mobileImagesMap,
      originalImages: originalImagesMap,
      crops: cropsMap 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    logger.error('[Category Images API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - добавить/обновить изображение категории
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Проверка прав администратора
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { categoryId, imageUrl, originalImageUrl, desktopImageUrl, mobileImageUrl, desktopCrop, mobileCrop } = body
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 })
    }
    
    // Формируем данные для обновления
    const updateData: any = {
      category_id: categoryId,
      updated_at: new Date(),
    }
    
    // Legacy: если передан просто imageUrl, считаем его и desktop и mobile и original
    if (imageUrl !== undefined) {
      updateData.desktop_image_url = imageUrl
      updateData.mobile_image_url = imageUrl
      updateData.original_image_url = imageUrl
    }

    // New way: индивидуальные URL
    if (originalImageUrl !== undefined) updateData.original_image_url = originalImageUrl
    if (desktopImageUrl !== undefined) updateData.desktop_image_url = desktopImageUrl
    if (mobileImageUrl !== undefined) updateData.mobile_image_url = mobileImageUrl
    
    // Добавляем crop-данные если переданы
    if (desktopCrop !== undefined) {
      updateData.desktop_crop = desktopCrop
    }
    
    if (mobileCrop !== undefined) {
      updateData.mobile_crop = mobileCrop
    }
    
    // Upsert через Prisma
    const data = await prisma.category_images.upsert({
      where: { category_id: categoryId },
      update: updateData,
      create: updateData,
    })
    
    logger.info('[Category Images API] Upserted:', { categoryId })
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    logger.error('[Category Images API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - удалить изображение категории
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Проверка прав администратора
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 })
    }
    
    await prisma.category_images.delete({
      where: { category_id: categoryId },
    })
    
    logger.info('[Category Images API] Deleted:', { categoryId })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('[Category Images API] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
