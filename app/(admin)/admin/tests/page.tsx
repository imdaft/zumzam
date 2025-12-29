'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Zap, Table } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  status: 'ok' | 'warning' | 'error'
  message?: string
  duration?: number
  counts?: Record<string, number>
}

interface TestResults {
  timestamp: string
  overall_status: 'ok' | 'error'
  tests: {
    database?: TestResult
    tables?: TestResult
    performance?: TestResult
  }
}

export default function TestsPage() {
  const [results, setResults] = useState<TestResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/tests')
      if (!response.ok) throw new Error('Failed to run tests')

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error running tests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-green-50 text-green-700 border-green-200">OK</Badge>
      case 'warning':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Running...</Badge>
    }
  }

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:px-6 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Системные тесты</h1>
          <p className="text-sm text-slate-600 mt-1">
            Проверка компонентов системы и производительности
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Тестирование...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Запустить тесты
            </>
          )}
        </Button>
      </div>

      {/* Общий статус */}
      {results && (
        <Card className="p-6 rounded-[24px] border-none shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(results.overall_status)}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Общий статус
                </h2>
                <p className="text-sm text-slate-600">
                  Последний запуск: {new Date(results.timestamp).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            {getStatusBadge(results.overall_status)}
          </div>
        </Card>
      )}

      {/* Результаты тестов */}
      <div className="space-y-4">
        {/* Тест БД */}
        <Card className="p-6 rounded-[24px] border-none shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Database className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Подключение к базе данных
                </h3>
                {results?.tests.database ? (
                  <>
                    <p className="text-sm text-slate-600">
                      {results.tests.database.message}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Ожидание...</p>
                )}
              </div>
            </div>
            {getStatusBadge(results?.tests.database?.status)}
          </div>
        </Card>

        {/* Тест таблиц */}
        <Card className="p-6 rounded-[24px] border-none shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Table className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Основные таблицы
                </h3>
                {results?.tests.tables?.counts ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="p-3 bg-slate-50 rounded-[18px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Пользователи
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {results.tests.tables.counts.users}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-[18px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Профили
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {results.tests.tables.counts.profiles}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-[18px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Заказы
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {results.tests.tables.counts.orders}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-[18px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Отзывы
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {results.tests.tables.counts.reviews}
                      </p>
                    </div>
                  </div>
                ) : results?.tests.tables?.message ? (
                  <p className="text-sm text-red-600">{results.tests.tables.message}</p>
                ) : (
                  <p className="text-sm text-slate-400">Ожидание...</p>
                )}
              </div>
            </div>
            {getStatusBadge(results?.tests.tables?.status)}
          </div>
        </Card>

        {/* Тест производительности */}
        <Card className="p-6 rounded-[24px] border-none shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Zap className="w-5 h-5 text-slate-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">
                  Производительность запросов
                </h3>
                {results?.tests.performance ? (
                  <div className="mt-2">
                    <p className="text-sm text-slate-600 mb-2">
                      {results.tests.performance.message}
                    </p>
                    {results.tests.performance.duration && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              results.tests.performance.duration < 200
                                ? 'bg-green-500'
                                : results.tests.performance.duration < 500
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                (results.tests.performance.duration / 1000) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {results.tests.performance.duration}ms
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Ожидание...</p>
                )}
              </div>
            </div>
            {getStatusBadge(results?.tests.performance?.status)}
          </div>
        </Card>
      </div>
    </div>
  )
}



