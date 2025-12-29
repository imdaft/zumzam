'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Copy, CheckCircle2, XCircle, Filter, Search, RefreshCw, Loader2, AlertCircle, BarChart3, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Error {
  id: string
  message: string
  stack?: string
  url: string
  user_agent?: string
  user_email?: string
  error_type: string
  component_stack?: string
  additional_data?: any
  is_critical: boolean
  is_resolved: boolean
  created_at: string
  count?: number
  first_occurrence?: string
  last_occurrence?: string
  errors?: Error[]
}

interface Stats {
  total: number
  critical: number
  unresolved: number
  resolved: number
  byType: Record<string, number>
  topErrors: Array<{
    message: string
    count: number
    error_type: string
    is_critical: boolean
  }>
  avgPerHour: number
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<Error[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedError, setSelectedError] = useState<Error | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({
    errorType: '_all',
    isCritical: '_all',
    isResolved: '_all',
    groupBy: 'message',
    search: '',
    timeRange: '24h',
  })

  const limit = 20

  const loadErrors = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', limit.toString())
      params.append('offset', (page * limit).toString())
      if (filters.errorType && filters.errorType !== '_all') params.append('errorType', filters.errorType)
      if (filters.isCritical && filters.isCritical !== '_all') params.append('isCritical', filters.isCritical)
      if (filters.isResolved && filters.isResolved !== '_all') params.append('isResolved', filters.isResolved)
      if (filters.groupBy) params.append('groupBy', filters.groupBy)
      if (filters.search) params.append('search', filters.search)
      if (filters.timeRange) params.append('timeRange', filters.timeRange)

      const response = await fetch(`/api/admin/errors?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setErrors(data.errors || [])
        setTotalCount(data.total || 0)
      } else {
        toast.error('Ошибка загрузки ошибок')
      }
    } catch (error) {
      console.error('Load errors error:', error)
      toast.error('Ошибка загрузки ошибок')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch(`/api/admin/errors/stats?timeRange=${filters.timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Load stats error:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    loadErrors()
    loadStats()
  }, [filters, page])

  const handleResolve = async (errorId: string, isResolved: boolean) => {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId, isResolved }),
      })

      if (response.ok) {
        toast.success(isResolved ? 'Ошибка отмечена как решенная' : 'Ошибка отмечена как нерешенная')
        loadErrors()
      } else {
        toast.error('Ошибка обновления статуса')
      }
    } catch (error) {
      console.error('Resolve error:', error)
      toast.error('Ошибка обновления статуса')
    }
  }

  const copyErrorToClipboard = (error: Error) => {
    const errorText = `Ошибка: ${error.message}

Тип: ${error.error_type}
URL: ${error.url}
Время: ${format(new Date(error.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
${error.user_email ? `Пользователь: ${error.user_email}` : ''}
${error.is_critical ? 'КРИТИЧЕСКАЯ ОШИБКА' : ''}

${error.stack ? `Stack trace:\n${error.stack}` : ''}
${error.component_stack ? `Component stack:\n${error.component_stack}` : ''}
${error.additional_data ? `Дополнительные данные:\n${JSON.stringify(error.additional_data, null, 2)}` : ''}
${error.user_agent ? `User Agent: ${error.user_agent}` : ''}
`

    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Ошибка скопирована в буфер обмена')
    }).catch(() => {
      toast.error('Не удалось скопировать')
    })
  }

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'react': return 'bg-purple-100 text-purple-800'
      case 'javascript': return 'bg-blue-100 text-blue-800'
      case 'unhandledrejection': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  const handleExport = (format: 'json' | 'csv') => {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters.errorType) params.append('errorType', filters.errorType)
    if (filters.isCritical) params.append('isCritical', filters.isCritical)
    if (filters.isResolved) params.append('isResolved', filters.isResolved)
    if (filters.timeRange) params.append('timeRange', filters.timeRange)

    window.open(`/api/admin/errors/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мониторинг ошибок</h1>
          <p className="text-gray-500 mt-2">
            Всего ошибок: <strong>{totalCount}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline" className="rounded-[12px]">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={() => handleExport('json')} variant="outline" className="rounded-[12px]">
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button onClick={() => { loadErrors(); loadStats(); }} variant="outline" className="rounded-[12px]">
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      {stats && !isLoadingStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 rounded-[24px] border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Критические</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
              </div>
            </Card>
            <Card className="p-4 rounded-[24px] border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Нерешенные</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unresolved}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
            </Card>
            <Card className="p-4 rounded-[24px] border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Решенные</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </Card>
            <Card className="p-4 rounded-[24px] border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">В час (сред.)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgPerHour}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </Card>
          </div>

          {/* Топ-5 ошибок */}
          {stats.topErrors && stats.topErrors.length > 0 && (
            <Card className="p-6 rounded-[24px] border-0 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Топ-5 самых частых ошибок</h3>
              <div className="space-y-3">
                {stats.topErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-[12px]">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{err.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getErrorTypeColor(err.error_type)}>
                          {err.error_type}
                        </Badge>
                        {err.is_critical && (
                          <Badge className="bg-red-100 text-red-800 border-0 text-xs">
                            Критическая
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{err.count}</p>
                        <p className="text-xs text-gray-500">повторений</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Фильтры */}
      <Card className="p-4 rounded-[24px] border-0 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(0); }}
              className="pl-10 rounded-[12px]"
            />
          </div>
          <Select value={filters.timeRange} onValueChange={(value) => { setFilters({ ...filters, timeRange: value }); setPage(0); }}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Последний час</SelectItem>
              <SelectItem value="24h">24 часа</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="all">Все время</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.errorType} onValueChange={(value) => { setFilters({ ...filters, errorType: value }); setPage(0); }}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue placeholder="Тип ошибки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все типы</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="unhandledrejection">Promise</SelectItem>
              <SelectItem value="other">Другие</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.isCritical} onValueChange={(value) => { setFilters({ ...filters, isCritical: value }); setPage(0); }}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue placeholder="Критичность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все</SelectItem>
              <SelectItem value="true">Критические</SelectItem>
              <SelectItem value="false">Обычные</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.isResolved} onValueChange={(value) => { setFilters({ ...filters, isResolved: value }); setPage(0); }}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все</SelectItem>
              <SelectItem value="false">Нерешенные</SelectItem>
              <SelectItem value="true">Решенные</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.groupBy} onValueChange={(value) => { setFilters({ ...filters, groupBy: value }); setPage(0); }}>
            <SelectTrigger className="rounded-[12px]">
              <SelectValue placeholder="Группировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">По сообщению</SelectItem>
              <SelectItem value="none">Без группировки</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Список ошибок */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : errors.length === 0 ? (
        <Card className="p-12 rounded-[24px] text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Нет ошибок
          </h3>
          <p className="text-gray-500">
            Все ошибки обработаны или отсутствуют
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {errors.map((error) => (
            <Card key={error.id || error.message} className="p-6 rounded-[24px] border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Иконка */}
                <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${
                  error.is_critical ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  {error.is_critical ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 break-words">
                        {error.message}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={`${getErrorTypeColor(error.error_type)} border-0`}>
                          {error.error_type}
                        </Badge>
                        {error.is_critical && (
                          <Badge className="bg-red-100 text-red-800 border-0">
                            Критическая
                          </Badge>
                        )}
                        {error.is_resolved ? (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            Решена
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-0">
                            Нерешена
                          </Badge>
                        )}
                        {error.count && error.count > 1 && (
                          <Badge className="bg-blue-100 text-blue-800 border-0">
                            Повторений: {error.count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Дополнительная информация */}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                    <div>
                      <span className="font-medium">URL:</span>{' '}
                      <span className="break-all">{error.url}</span>
                    </div>
                    <div>
                      <span className="font-medium">Время:</span>{' '}
                      {error.last_occurrence 
                        ? format(new Date(error.last_occurrence), 'dd.MM.yyyy HH:mm', { locale: ru })
                        : format(new Date(error.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })
                      }
                    </div>
                    {error.user_email && (
                      <div>
                        <span className="font-medium">Пользователь:</span> {error.user_email}
                      </div>
                    )}
                    {error.count && error.count > 1 && (
                      <div>
                        <span className="font-medium">Первое появление:</span>{' '}
                        {format(new Date(error.first_occurrence!), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      onClick={() => {
                        setSelectedError(error)
                        setShowDetails(true)
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-[12px]"
                    >
                      Подробности
                    </Button>
                    <Button
                      onClick={() => copyErrorToClipboard(error)}
                      variant="outline"
                      size="sm"
                      className="rounded-[12px]"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Копировать
                    </Button>
                    {!error.is_resolved ? (
                      <Button
                        onClick={() => handleResolve(error.id, true)}
                        size="sm"
                        className="rounded-[12px] bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Отметить решенной
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleResolve(error.id, false)}
                        variant="outline"
                        size="sm"
                        className="rounded-[12px]"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Отметить нерешенной
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {!isLoading && errors.length > 0 && totalPages > 1 && (
        <Card className="p-4 rounded-[24px] border-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Показано {page * limit + 1}-{Math.min((page + 1) * limit, totalCount)} из {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                variant="outline"
                size="sm"
                className="rounded-[12px]"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Страница {page + 1} из {totalPages}
              </span>
              <Button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                variant="outline"
                size="sm"
                className="rounded-[12px]"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Диалог с деталями ошибки */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Детали ошибки</DialogTitle>
            <DialogDescription>
              Полная информация об ошибке для исправления
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Сообщение</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-[12px] text-sm break-words">
                  {selectedError.message}
                </p>
              </div>
              {selectedError.stack && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Stack Trace</label>
                  <Textarea
                    value={selectedError.stack}
                    readOnly
                    className="mt-1 font-mono text-xs rounded-[12px]"
                    rows={10}
                  />
                </div>
              )}
              {selectedError.component_stack && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Component Stack</label>
                  <Textarea
                    value={selectedError.component_stack}
                    readOnly
                    className="mt-1 font-mono text-xs rounded-[12px]"
                    rows={5}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">URL</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-[12px] text-sm break-all">
                    {selectedError.url}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Тип</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-[12px] text-sm">
                    {selectedError.error_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Время</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-[12px] text-sm">
                    {format(new Date(selectedError.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                  </p>
                </div>
                {selectedError.user_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Пользователь</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-[12px] text-sm">
                      {selectedError.user_email}
                    </p>
                  </div>
                )}
              </div>
              {selectedError.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-[12px] text-sm break-all">
                    {selectedError.user_agent}
                  </p>
                </div>
              )}
              {selectedError.additional_data && Object.keys(selectedError.additional_data).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Дополнительные данные</label>
                  <Textarea
                    value={JSON.stringify(selectedError.additional_data, null, 2)}
                    readOnly
                    className="mt-1 font-mono text-xs rounded-[12px]"
                    rows={5}
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => copyErrorToClipboard(selectedError)}
                  className="rounded-[12px]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать все
                </Button>
                {!selectedError.is_resolved && (
                  <Button
                    onClick={() => {
                      handleResolve(selectedError.id, true)
                      setShowDetails(false)
                    }}
                    className="rounded-[12px] bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Отметить решенной
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
















