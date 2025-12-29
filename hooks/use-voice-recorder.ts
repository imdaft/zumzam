'use client'

import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void
  onError?: (error: string) => void
}

export function useVoiceRecorder({ onTranscriptionComplete, onError }: UseVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Начать запись
  const startRecording = useCallback(async () => {
    try {
      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })

      // Создаем MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Останавливаем все треки
        stream.getTracks().forEach(track => track.stop())

        // Создаем аудио blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        console.log('[Voice] Audio blob size:', audioBlob.size)

        // Отправляем на транскрипцию
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingDuration(0)

      // Таймер длительности
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

      console.log('[Voice] Recording started')
    } catch (error: any) {
      console.error('[Voice] Error starting recording:', error)
      onError?.('Не удалось получить доступ к микрофону')
    }
  }, [onError])

  // Остановить запись
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Останавливаем таймер
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      console.log('[Voice] Recording stopped')
    }
  }, [isRecording])

  // Транскрипция
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Ошибка транскрипции')
      }

      const data = await response.json()
      
      console.log('[Voice] Transcription:', data.text)

      if (data.text && data.text.trim()) {
        onTranscriptionComplete(data.text.trim())
      } else {
        onError?.('Не удалось распознать речь. Попробуйте еще раз.')
      }
    } catch (error: any) {
      console.error('[Voice] Transcription error:', error)
      onError?.('Ошибка при распознавании речи')
    } finally {
      setIsTranscribing(false)
      setRecordingDuration(0)
    }
  }

  // Отмена записи
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Останавливаем запись без транскрипции
      const mediaRecorder = mediaRecorderRef.current
      mediaRecorder.ondataavailable = null
      mediaRecorder.onstop = () => {
        // Останавливаем все треки
        const stream = mediaRecorder.stream
        stream.getTracks().forEach(track => track.stop())
      }
      mediaRecorder.stop()
      
      setIsRecording(false)
      audioChunksRef.current = []

      // Останавливаем таймер
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      console.log('[Voice] Recording canceled')
    }
  }, [isRecording])

  return {
    isRecording,
    isTranscribing,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}















