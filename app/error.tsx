'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Глобальная страница ошибки для Next.js App Router
 * Перехватывает ошибки в route segments
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Логируем ошибку
    logger.error('[ErrorPage] Unhandled error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Иконка */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        {/* Заголовок */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">
            Упс! Что-то сломалось
          </h1>
          <p className="text-slate-600">
            Произошла ошибка при загрузке страницы. 
            Мы уже работаем над её исправлением.
          </p>
        </div>

        {/* Детали ошибки (только в dev) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-white rounded-xl border p-4 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700 mb-2">
              🔧 Информация для разработчика
            </summary>
            <div className="space-y-2">
              <p className="text-slate-600">
                <strong>Message:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="text-slate-600">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="overflow-auto text-xs text-red-600 bg-red-50 p-2 rounded mt-2 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={reset}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Попробовать снова
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            На главную
          </Button>
        </div>

        {/* Код ошибки */}
        {error.digest && (
          <p className="text-xs text-slate-400 pt-4">
            Код ошибки: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}

