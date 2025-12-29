import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY не найден в .env' 
      }, { status: 500 })
    }

    // Проверяем формат ключа
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json({ 
        error: 'Неверный формат API ключа (должен начинаться с AIza)' 
      }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Пробуем самый простой запрос с самой актуальной моделью
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    const result = await model.generateContent('Скажи "Привет" на русском языке.')
    const response = result.response
    const text = response.text()

    return NextResponse.json({ 
      success: true,
      apiKey: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
      model: 'gemini-2.5-flash',
      response: text
    })

  } catch (error: any) {
    console.error('Gemini test error:', error)
    return NextResponse.json({ 
      error: error.message || 'Неизвестная ошибка',
      details: error.toString()
    }, { status: 500 })
  }
}

