import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/catalogs?name=activity_catalog|animator_services_catalog|...
 * Возвращает элементы каталога (публичный доступ, read-only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const catalogName = searchParams.get('name')

    if (!catalogName) {
      return NextResponse.json({ error: 'name parameter is required' }, { status: 400 })
    }

    // Маппинг имени каталога на модель Prisma
    const catalogMap: Record<string, keyof typeof prisma> = {
      activity_catalog: 'activity_catalog',
      animator_services_catalog: 'animator_services_catalog',
      show_types_catalog: 'show_types_catalog',
      photographer_styles_catalog: 'photographer_styles_catalog',
      masterclass_types_catalog: 'masterclass_types_catalog',
      quest_types_catalog: 'quest_types_catalog',
      agency_services_catalog: 'agency_services_catalog',
      additional_services_catalog: 'additional_services_catalog',
      service_catalog: 'service_catalog',
    }

    const modelName = catalogMap[catalogName]
    if (!modelName) {
      return NextResponse.json({ error: `Unknown catalog: ${catalogName}` }, { status: 400 })
    }

    const model = prisma[modelName] as any
    if (!model || typeof model.findMany !== 'function') {
      logger.error(`[Catalogs API] Model ${modelName} not found or invalid`)
      return NextResponse.json({ error: `Catalog ${catalogName} not available` }, { status: 404 })
    }

    // Загружаем данные из каталога
    // Для некоторых каталогов нет sort_order, используем только name_ru
    const catalogsWithoutSortOrder = [
      'agency_services_catalog',
      'animator_services_catalog',
      'show_types_catalog',
      'quest_types_catalog',
      'masterclass_types_catalog',
      'photographer_styles_catalog',
      'additional_services_catalog',
    ]
    
    let items
    if (catalogsWithoutSortOrder.includes(catalogName)) {
      items = await model.findMany({
        orderBy: { name_ru: 'asc' },
      })
    } else {
      try {
        items = await model.findMany({
          orderBy: [
            { sort_order: 'asc' },
            { name_ru: 'asc' },
          ],
        })
      } catch (err: any) {
        // Если sort_order отсутствует, сортируем только по name_ru
        items = await model.findMany({
          orderBy: { name_ru: 'asc' },
        })
      }
    }

    return NextResponse.json({ items: items || [] })
  } catch (error: any) {
    logger.error('[Catalogs API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load catalog' },
      { status: 500 }
    )
  }
}

