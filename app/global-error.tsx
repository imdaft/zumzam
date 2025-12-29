'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Глобальный обработчик ошибок для ошибок в root layout
 * Заменяет весь layout при критической ошибке
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Логируем критическую ошибку
    console.error('[GlobalError] Critical error in layout:', {
      message: error.message,
      digest: error.digest,
    })

    // Отправляем критическую ошибку на сервер
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            errorType: 'other',
            additionalData: {
              digest: error.digest,
              isGlobalError: true,
            },
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => {
          console.warn('[GlobalError] Failed to send error report:', err)
        })
      } catch (err) {
        console.warn('[GlobalError] Failed to create error report:', err)
      }
    }
  }, [error])

  return (
    <html lang="ru">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
          }}>
            {/* Эмодзи вместо иконки (без зависимостей) */}
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
              😵
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '0.75rem',
            }}>
              Критическая ошибка
            </h1>

            <p style={{
              color: '#64748b',
              marginBottom: '2rem',
            }}>
              Приложение не может загрузиться. Пожалуйста, обновите страницу.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                На главную
              </button>
            </div>

            {error.digest && (
              <p style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginTop: '2rem',
              }}>
                Код: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}

