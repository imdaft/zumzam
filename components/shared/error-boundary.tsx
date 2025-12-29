'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * Error Boundary для перехвата ошибок в React компонентах
 * 
 * Использование:
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * С кастомным fallback:
 * <ErrorBoundary fallback={<MyFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем ошибку
    logger.error('[ErrorBoundary] React error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    // Отправляем ошибку на сервер
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
            errorType: 'react',
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => {
          console.warn('[ErrorBoundary] Failed to send error report:', err)
        })
      } catch (err) {
        console.warn('[ErrorBoundary] Failed to create error report:', err)
      }
    }

    // Сохраняем для отображения
    this.setState({ errorInfo })

    // Вызываем колбэк если передан
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Кастомный fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Дефолтный UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Иконка */}
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Заголовок */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Что-то пошло не так
              </h2>
              <p className="text-slate-600">
                Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
              </p>
            </div>

            {/* Детали ошибки (только в dev) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-slate-100 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer font-medium text-slate-700 mb-2">
                  Подробности ошибки
                </summary>
                <pre className="overflow-auto text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Попробовать снова
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                На главную
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC для оборачивания компонентов в Error Boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

export default ErrorBoundary

