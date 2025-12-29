import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/ai/transcribe - транскрибация аудио
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

    // Получение файла
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    // Проверка размера файла (макс 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Max size is 25MB' },
        { status: 400 }
      )
    }

    // Получение активной STT модели
    const sttSettings = await prisma.stt_settings.findFirst({
      where: { is_active: true }
    })

    if (!sttSettings) {
      return NextResponse.json(
        { error: 'Speech-to-text is not configured' },
        { status: 500 }
      )
    }

    // TODO: Вызов STT API (Google Speech-to-Text, Whisper, Yandex SpeechKit и т.д.)
    // const audioBuffer = await audioFile.arrayBuffer()
    // const transcription = await transcribeAudio(audioBuffer, sttSettings)

    // Временная заглушка
    const transcription = {
      text: 'Это транскрибированный текст из аудио. STT функционал в разработке.',
      confidence: 0.95,
      duration: 10.5
    }

    return NextResponse.json(transcription)
  } catch (error: any) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    )
  }
}



