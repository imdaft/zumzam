import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY не найден' 
      }, { status: 500 })
    }

    // Запрашиваем список доступных моделей напрямую через REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ 
        error: 'Ошибка запроса моделей',
        details: error
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Фильтруем только модели, поддерживающие generateContent
    const contentModels = data.models?.filter((model: any) => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []

    return NextResponse.json({ 
      success: true,
      total: contentModels.length,
      models: contentModels.map((model: any) => ({
        name: model.name.replace('models/', ''),
        displayName: model.displayName,
        description: model.description,
        methods: model.supportedGenerationMethods,
        maxTokens: model.outputTokenLimit
      }))
    })

  } catch (error: any) {
    console.error('List models error:', error)
    return NextResponse.json({ 
      error: error.message || 'Неизвестная ошибка'
    }, { status: 500 })
  }
}




