/**
 * Мониторинг системы - Dashboard
 * 
 * Отображает:
 * - Health status системы
 * - Статистика Prisma запросов
 * - Статистика API запросов
 * - Медленные запросы
 * - Ошибки
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Database, Globe, RefreshCw, Trash2, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  duration: number
  version: string
  environment: string
  checks: {
    database: { status: 'ok' | 'error'; message?: string; duration?: number }
    data: { status: 'ok' | 'error'; message?: string }
  }
  memory?: {
    heapUsed: string
    heapTotal: string
    rss: string
  }
}

interface Stats {
  timestamp: string
  prisma?: any
  api?: any
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealth(data)
    } catch (error) {
      console.error('Failed to load health:', error)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/monitoring/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const clearStats = async (type: 'all' | 'prisma' | 'api') => {
    if (!confirm(`Очистить статистику (${type})?`)) return

    try {
      await fetch(`/api/monitoring/stats?type=${type}`, { method: 'DELETE' })
      await loadStats()
    } catch (error) {
      console.error('Failed to clear stats:', error)
    }
  }

  const refresh = async () => {
    setLoading(true)
    await Promise.all([loadHealth(), loadStats()])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      refresh()
    }, 5000) // Обновление каждые 5 секунд

    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:px-6 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Мониторинг системы</h1>
          <p className="text-sm text-slate-600 mt-1">
            Отслеживание производительности и здоровья приложения
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="rounded-[18px]"
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse text-green-500' : 'text-slate-400'}`} />
            <span className="ml-2">{autoRefresh ? 'Авто' : 'Выкл'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="rounded-[18px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {health && (
        <Card className="rounded-[28px] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {health.status === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Health Status
              <span className={`ml-2 text-sm font-normal ${
                health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {health.status === 'healthy' ? 'Всё работает' : 'Есть проблемы'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-[18px]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Версия</div>
                <div className="text-lg font-semibold text-slate-900">{health.version}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-[18px]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Окружение</div>
                <div className="text-lg font-semibold text-slate-900">{health.environment}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-[18px]">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Проверка за</div>
                <div className="text-lg font-semibold text-slate-900">{health.duration}ms</div>
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Проверки:</h4>
              {Object.entries(health.checks).map(([key, check]) => (
                <div key={key} className="flex items-center gap-2 p-3 bg-slate-50 rounded-[18px]">
                  {check.status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{key}</div>
                    <div className="text-xs text-slate-600">{check.message}</div>
                  </div>
                  {check.duration && (
                    <div className="text-xs text-slate-500">{check.duration}ms</div>
                  )}
                </div>
              ))}
            </div>

            {/* Memory */}
            {health.memory && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Память:</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-slate-50 rounded-[18px]">
                    <div className="text-xs text-slate-500">Heap Used</div>
                    <div className="text-sm font-semibold text-slate-900">{health.memory.heapUsed}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-[18px]">
                    <div className="text-xs text-slate-500">Heap Total</div>
                    <div className="text-sm font-semibold text-slate-900">{health.memory.heapTotal}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-[18px]">
                    <div className="text-xs text-slate-500">RSS</div>
                    <div className="text-sm font-semibold text-slate-900">{health.memory.rss}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prisma Stats */}
      {stats?.prisma && (
        <Card className="rounded-[28px] border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                Prisma (База данных)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearStats('prisma')}
                className="rounded-[18px]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {stats.prisma.analysis?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Всего</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.prisma.analysis.summary.totalQueries}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Медленные</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.prisma.analysis.summary.slowQueries}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ошибки</div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.prisma.analysis.summary.errorQueries}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Успешность</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.prisma.analysis.summary.successRate}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Средн. время</div>
                  <div className="text-xl font-bold text-slate-900">
                    {stats.prisma.analysis.summary.avgDuration}ms
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Макс. время</div>
                  <div className="text-xl font-bold text-slate-900">
                    {stats.prisma.analysis.summary.maxDuration}ms
                  </div>
                </div>
              </div>
            )}

            {/* Slowest Models */}
            {stats.prisma.analysis?.slowestModels?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Самые медленные модели:
                </h4>
                <div className="space-y-2">
                  {stats.prisma.analysis.slowestModels.map((model: any) => (
                    <div key={model.model} className="flex items-center justify-between p-3 bg-slate-50 rounded-[18px]">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{model.model}</div>
                        <div className="text-xs text-slate-500">{model.count} запросов</div>
                      </div>
                      <div className="text-sm font-semibold text-orange-600">
                        {Math.round(model.avgDuration)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Errors */}
            {stats.prisma.analysis?.recentErrors?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Последние ошибки:
                </h4>
                <div className="space-y-2">
                  {stats.prisma.analysis.recentErrors.map((error: any, i: number) => (
                    <div key={i} className="p-3 bg-red-50 rounded-[18px]">
                      <div className="text-sm font-medium text-red-900">
                        {error.model}.{error.action}
                      </div>
                      <div className="text-xs text-red-700 mt-1">{error.error}</div>
                      <div className="text-xs text-red-600 mt-1">{new Date(error.timestamp).toLocaleString('ru-RU')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Stats */}
      {stats?.api && (
        <Card className="rounded-[28px] border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                API Endpoints
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearStats('api')}
                className="rounded-[18px]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {stats.api.analysis?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Всего</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.api.analysis.summary.totalRequests}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Медленные</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.api.analysis.summary.slowRequests}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ошибки</div>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.api.analysis.summary.errorRequests}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-[18px]">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Успешность</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.api.analysis.summary.successRate}
                  </div>
                </div>
              </div>
            )}

            {/* Slowest Endpoints */}
            {stats.api.analysis?.slowestEndpoints?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Самые медленные endpoints:
                </h4>
                <div className="space-y-2">
                  {stats.api.analysis.slowestEndpoints.slice(0, 5).map((endpoint: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-[18px]">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{endpoint.endpoint}</div>
                        <div className="text-xs text-slate-500">{endpoint.count} запросов</div>
                      </div>
                      <div className="text-sm font-semibold text-orange-600 ml-2">
                        {Math.round(endpoint.avgDuration)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Used Endpoints */}
            {stats.api.analysis?.mostUsedEndpoints?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Самые частые endpoints:
                </h4>
                <div className="space-y-2">
                  {stats.api.analysis.mostUsedEndpoints.slice(0, 5).map((endpoint: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-[18px]">
                      <div className="text-sm font-medium text-slate-900 truncate flex-1">
                        {endpoint.endpoint}
                      </div>
                      <div className="text-sm font-semibold text-blue-600 ml-2">
                        {endpoint.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

