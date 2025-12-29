import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { aiService } from '@/lib/services/ai-service'

/**
 * POST /api/ai/edit-text
 * AI редактирование текста договора
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase client removed
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.sub as string

    const body = await request.json()
    const { operation, text, customInstruction } = body

    if (!operation || !text) {
      return NextResponse.json(
        { error: 'operation and text are required' },
        { status: 400 }
      )
    }

    console.log('[AI Edit Text] Operation:', operation, 'Text length:', text.length)

    let result = ''

    switch (operation) {
      case 'rewrite':
        result = await aiService.rewriteText(text)
        break
      
      case 'simplify':
        result = await aiService.simplifyText(text)
        break
      
      case 'expand':
        result = await aiService.expandText(text)
        break
      
      case 'check':
        result = await aiService.checkLegalText(text)
        break
      
      case 'custom':
        if (!customInstruction) {
          return NextResponse.json(
            { error: 'customInstruction is required for custom operation' },
            { status: 400 }
          )
        }
        result = await aiService.customTextEdit(text, customInstruction)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'AI failed to generate result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result,
      operation
    }, { status: 200 })

  } catch (error: any) {
    console.error('[AI Edit Text] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

