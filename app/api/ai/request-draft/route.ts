import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/ai/request-draft - генерация черновика заявки AI
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
    const {
      category,
      event_type,
      children_count,
      children_age,
      date,
      budget,
      additional_info
    } = body

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Получение AI модели для генерации черновиков
    const aiTask = await prisma.ai_task_models.findFirst({
      where: {
        task_key: 'request_draft',
        is_enabled: true
      },
      include: {
        ai_settings_ai_task_models_ai_setting_idToai_settings: true
      }
    })

    if (!aiTask || !aiTask.ai_settings_ai_task_models_ai_setting_idToai_settings) {
      // Fallback: простая генерация без AI
      const draft = generateSimpleDraft({
        category,
        event_type,
        children_count,
        children_age,
        date,
        budget
      })

      return NextResponse.json({ draft })
    }

    // TODO: Вызов AI для генерации умного черновика
    // const aiSettings = aiTask.ai_settings_ai_task_models_ai_setting_idToai_settings
    // const draft = await generateAIDraft(aiSettings, body)

    // Временная заглушка
    const draft = {
      title: `${getCategoryName(category)} на ${event_type || 'мероприятие'}`,
      description: `Ищем ${getCategoryName(category).toLowerCase()} для празднования ${event_type || 'мероприятия'}.${children_count ? ` Количество детей: ${children_count}.` : ''}${children_age ? ` Возраст: ${children_age} лет.` : ''}${budget ? ` Бюджет: ${budget} руб.` : ''}${additional_info ? `\n\n${additional_info}` : ''}`,
      suggestions: [
        'Добавить требования к программе',
        'Указать предпочтения по стилю',
        'Уточнить место проведения'
      ]
    }

    return NextResponse.json({ draft })
  } catch (error: any) {
    console.error('Error generating draft:', error)
    return NextResponse.json(
      { error: 'Failed to generate draft', details: error.message },
      { status: 500 }
    )
  }
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    animator: 'Аниматора',
    show: 'Шоу-программу',
    quest: 'Квест',
    masterclass: 'Мастер-класс',
    host: 'Ведущего',
    photo_video: 'Фото/видеосъемку',
    santa: 'Деда Мороза',
    face_painting: 'Аквагрим',
    venue: 'Площадку'
  }
  return names[category] || 'Услугу'
}

function generateSimpleDraft(params: any) {
  return {
    title: `${getCategoryName(params.category)} на ${params.event_type || 'праздник'}`,
    description: `Требуется ${getCategoryName(params.category).toLowerCase()}.${params.children_count ? ` Детей: ${params.children_count}.` : ''}${params.children_age ? ` Возраст: ${params.children_age} лет.` : ''}`,
    suggestions: []
  }
}



