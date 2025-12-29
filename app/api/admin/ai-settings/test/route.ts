import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'

// POST /api/admin/ai-settings/test - тест AI провайдера
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { providerId } = await request.json()

    const provider = await prisma.ai_settings.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const startTime = Date.now()

    try {
      if (provider.provider === 'ollama') {
        const response = await fetch(`${provider.base_url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: provider.model_name,
            prompt: 'Say OK',
            stream: false
          }),
          signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: `Ollama error: ${response.status}`
          })
        }

        const data = await response.json()
        const responseTime = Date.now() - startTime

        return NextResponse.json({
          success: true,
          responseTime,
          response: data.response || data
        })
      } else {
        // TODO: Тесты для других провайдеров (OpenAI, Google Gemini и т.д.)
        return NextResponse.json({
          success: false,
          error: 'Testing is only supported for Ollama currently'
        })
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      return NextResponse.json({
        success: false,
        error: error.message || 'Connection failed',
        responseTime
      })
    }
  } catch (error: any) {
    console.error('[AI Settings Test] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
