import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'
import type { 
  SectionTemplates, 
  LegacySectionTemplates,
  TemplateId, 
  TemplateVariant,
  SectionTemplateVariantConfig 
} from '@/lib/types/templates'

interface RouteParams {
  params: { id: string }
}

/**
 * API endpoint для обновления выбранных шаблонов секций профиля
 * PATCH /api/profiles/[id]/templates
 * v2.0: Поддержка раздельных вариантов для mobile/desktop
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
      select: { user_id: true, section_templates: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь - владелец профиля ИЛИ администратор
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (profile.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'Нет прав для изменения этого профиля' },
        { status: 403 }
      )
    }

    // Получаем данные из запроса
    const body = await request.json()
    const { sectionId, templateId, variant } = body as {
      sectionId: string
      templateId: TemplateId
      variant?: TemplateVariant
    }

    if (!sectionId || !templateId) {
      return NextResponse.json(
        { error: 'Необходимо указать sectionId и templateId' },
        { status: 400 }
      )
    }

    // Дефолтные шаблоны (новый формат)
    const defaultTemplates: SectionTemplates = {
      about: { mobile: 'classic', desktop: 'classic' },
      packages: { mobile: 'grid', desktop: 'grid' },
      services: { mobile: 'list', desktop: 'list' },
      portfolio: { mobile: 'variant1', desktop: 'variant1' },
      contacts: { mobile: 'standard', desktop: 'standard' },
      faq: { mobile: 'accordion', desktop: 'accordion' },
      locations: { mobile: 'standard', desktop: 'standard' },
      turnkey: { mobile: 'standard', desktop: 'standard' },
      characters: { mobile: 'standard', desktop: 'standard' },
    }

    // Получаем текущие шаблоны
    let currentTemplates: SectionTemplates = (profile.section_templates as SectionTemplates) || defaultTemplates

    // Проверяем, не legacy ли формат
    const isLegacyFormat = (templates: any): boolean => {
      if (!templates || typeof templates !== 'object') return false
      const firstKey = Object.keys(templates)[0]
      if (!firstKey) return false
      return typeof templates[firstKey] === 'string'
    }

    // Если legacy формат - конвертируем
    if (isLegacyFormat(currentTemplates)) {
      logger.info(`Converting legacy format for profile ${profileId}`)
      const legacyTemplates = currentTemplates as any as LegacySectionTemplates
      const converted: SectionTemplates = {}
      
      for (const [key, value] of Object.entries(legacyTemplates)) {
        if (typeof value === 'string') {
          converted[key] = {
            mobile: value as TemplateId,
            desktop: value as TemplateId
          }
        }
      }
      
      currentTemplates = { ...defaultTemplates, ...converted }
    }

    // Получаем текущую конфигурацию для секции
    const currentSectionConfig = currentTemplates[sectionId] || { 
      mobile: 'classic' as TemplateId, 
      desktop: 'classic' as TemplateId 
    }

    // Обновляем конфигурацию
    let updatedSectionConfig: SectionTemplateVariantConfig

    if (variant) {
      // Если указан variant - обновляем только его
      updatedSectionConfig = {
        ...(currentSectionConfig as SectionTemplateVariantConfig),
        [variant]: templateId
      }
    } else {
      // Если variant не указан (обратная совместимость) - обновляем оба
      updatedSectionConfig = {
        mobile: templateId,
        desktop: templateId
      }
    }

    // Обновляем шаблоны
    const updatedTemplates: SectionTemplates = {
      ...currentTemplates,
      [sectionId]: updatedSectionConfig,
    }

    // Сохраняем в БД через Prisma
    await prisma.profiles.update({
      where: { id: profileId },
      data: {
        section_templates: updatedTemplates,
        updated_at: new Date(),
      },
    })

    logger.info(`Шаблон секции ${sectionId} обновлен на ${templateId} (${variant || 'both'}) для профиля ${profileId}`)

    return NextResponse.json({
      success: true,
      section_templates: updatedTemplates,
    })

  } catch (error: any) {
    logger.error('Ошибка в PATCH /api/profiles/[id]/templates:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Получить текущие шаблоны профиля
 * GET /api/profiles/[id]/templates
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params

    // Получаем шаблоны профиля
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { section_templates: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Дефолтные шаблоны (новый формат)
    const defaultTemplates: SectionTemplates = {
      about: { mobile: 'classic', desktop: 'classic' },
      packages: { mobile: 'grid', desktop: 'grid' },
      services: { mobile: 'list', desktop: 'list' },
      portfolio: { mobile: 'variant1', desktop: 'variant1' },
      contacts: { mobile: 'standard', desktop: 'standard' },
      faq: { mobile: 'accordion', desktop: 'accordion' },
      locations: { mobile: 'standard', desktop: 'standard' },
      turnkey: { mobile: 'standard', desktop: 'standard' },
      characters: { mobile: 'standard', desktop: 'standard' },
    }

    return NextResponse.json({
      section_templates: (profile.section_templates as SectionTemplates) || defaultTemplates,
    })

  } catch (error: any) {
    logger.error('Ошибка в GET /api/profiles/[id]/templates:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
