import { generateJSON } from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

/**
 * POST /api/ai/generate-scenario - Генерация персонализированного сценария праздника
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      theme, 
      age, 
      duration, 
      guestCount,
      interests = [],
      budget,
      location = 'помещение',
    } = body

    // Валидация
    if (!theme || !age || !duration) {
      return NextResponse.json(
        { error: 'Theme, age, and duration are required' },
        { status: 400 }
      )
    }

    // Формируем промпт для генерации сценария
    const prompt = `Ты - профессиональный организатор детских праздников с 10-летним опытом.

Создай ДЕТАЛЬНЫЙ и ТВОРЧЕСКИЙ сценарий детского праздника со следующими параметрами:

Тема: ${theme}
Возраст: ${age} ${age === 1 ? 'год' : age < 5 ? 'года' : 'лет'}
Длительность: ${duration} минут
Количество гостей: ${guestCount || 'не указано'}
Интересы ребёнка: ${interests.length > 0 ? interests.join(', ') : 'не указаны'}
Бюджет: ${budget ? `${budget}₽` : 'не указан'}
Локация: ${location}

Создай структурированный сценарий, который включает:

1. Название праздника (креативное, цепляющее)
2. Краткое описание концепции (2-3 предложения)
3. Подготовка к празднику:
   - Список необходимого реквизита
   - Украшения
   - Костюмы (если нужны)
4. Пошаговый сценарий по временным блокам:
   - Встреча гостей (5-10 мин)
   - Основная программа (разбить по активностям)
   - Торт и угощение
   - Завершение
5. Для каждой активности укажи:
   - Название
   - Длительность
   - Описание (что и как делать)
   - Необходимый реквизит
6. Советы ведущему
7. Запасные игры на случай, если что-то пойдёт не так

Учитывай возраст детей - активности должны быть безопасными и интересными для этого возраста.
Будь креативным! Добавь неожиданные элементы, которые сделают праздник незабываемым.

Верни результат в формате JSON.`

    const scenario = await generateJSON(prompt, {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Название праздника',
        },
        description: {
          type: 'string',
          description: 'Краткое описание концепции',
        },
        preparation: {
          type: 'object',
          properties: {
            props: {
              type: 'array',
              items: { type: 'string' },
              description: 'Список реквизита',
            },
            decorations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Украшения',
            },
            costumes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Костюмы',
            },
          },
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'number' },
              description: { type: 'string' },
              props: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          description: 'Временная шкала активностей',
        },
        hostTips: {
          type: 'array',
          items: { type: 'string' },
          description: 'Советы ведущему',
        },
        backupGames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'number' },
            },
          },
          description: 'Запасные игры',
        },
      },
      required: ['title', 'description', 'preparation', 'timeline', 'hostTips', 'backupGames'],
    })

    return NextResponse.json({
      scenario,
      parameters: {
        theme,
        age,
        duration,
        guestCount,
        interests,
        budget,
        location,
      },
    })
  } catch (error: any) {
    console.error('Scenario generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Scenario generation failed' },
      { status: 500 }
    )
  }
}


