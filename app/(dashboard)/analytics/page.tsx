'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth-context'
import { 
  BarChart3,
  TrendingUp,
  Eye,
  FileText,
  Star,
  Home,
  RefreshCcw,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  Area,
} from 'recharts'

type Period = 'week' | 'month' | 'year'
type ChartType = 'combo' | 'line' | 'bar' | 'area'

type MetricKey = 'views' | 'orders' | 'revenue'

type MetricToggles = Record<MetricKey, boolean>

type ProviderAnalyticsResponse = {
  period: { from: string; to: string; key: Period }
  profiles: Array<{ id: string; name: string }>
  selectedProfileIds: string[]
  kpis: {
    views: number
    orders: number
    revenue: number
    conversion: number
    avgOrderValue: number
    rating: number
  }
  series: Array<{ date: string; views: number; orders: number; revenue: number }>
  topProfiles: Array<{
    profile_id: string
    name: string
    views: number
    orders: number
    revenue: number
    rating?: number
  }>
  compare?: {
    period: { from: string; to: string }
    kpis: {
      views: number
      orders: number
      revenue: number
      conversion: number
      avgOrderValue: number
      rating: number
    }
    series: Array<{ date: string; views: number; orders: number; revenue: number }>
    deltas: {
      views: { abs: number; pct: number }
      orders: { abs: number; pct: number }
      revenue: { abs: number; pct: number }
      conversion: { abs: number; pct: number }
    }
  }
}

type ProviderBreakdownsResponse = {
  period: { from: string; to: string; key: Period }
  selectedProfileIds: string[]
  devices: { mobile: number; desktop: number; tablet: number; unknown: number }
  sources: Array<{ source: string; medium: string; count: number }>
  funnel: { profile_view: number; service_click: number; cart_add: number; checkout_start: number; order_create: number }
  engagement: { time_on_page_avg_sec: number; scroll_depth_avg: number; samples: number }
}

const SETTINGS_KEY = 'zumzam_analytics_settings_v1'

export default function AnalyticsPage() {
  const { isClient, isLoading: authLoading } = useAuth()
  const [period, setPeriod] = useState<Period>('week')
  const [profileId, setProfileId] = useState<string>('all')
  const [compareEnabled, setCompareEnabled] = useState<boolean>(false)
  const [chartType, setChartType] = useState<ChartType>('combo')
  const [metrics, setMetrics] = useState<MetricToggles>({ views: true, orders: true, revenue: true })
  const [data, setData] = useState<ProviderAnalyticsResponse | null>(null)
  const [breakdowns, setBreakdowns] = useState<ProviderBreakdownsResponse | null>(null)
  const [isBreakdownsLoading, setIsBreakdownsLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatNumber = (num: number) => num.toLocaleString('ru-RU')
  const formatCurrency = (num: number) => num.toLocaleString('ru-RU') + ' ₽'
  const formatPercent = (value: number) => `${Math.round(value * 100)}%`
  const formatDelta = (value: { abs: number; pct: number }) => {
    const pct = Math.round(value.pct * 100)
    const up = value.abs >= 0
    return { pct, up }
  }

  const downloadCsv = (filename: string, csvText: string) => {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const toCsv = (rows: Array<Array<string | number | null | undefined>>) => {
    const escape = (v: string) => `"${v.replaceAll('"', '""')}"`
    return rows
      .map((r) =>
        r
          .map((cell) => {
            if (cell === null || cell === undefined) return ''
            if (typeof cell === 'number') return String(cell)
            return escape(String(cell))
          })
          .join(',')
      )
      .join('\n')
  }

  const handleExport = () => {
    if (!data) return
    const periodKey = data.period?.key || period
    const profilePart = profileId === 'all' ? 'all' : profileId.slice(0, 8)
    const baseName = `zumzam-analytics-${periodKey}-${profilePart}`

    // 1) Динамика
    const seriesRows: Array<Array<string | number | null | undefined>> = [
      ['date', 'views', 'orders', 'revenue', 'prev_views', 'prev_orders', 'prev_revenue'],
      ...combinedChartData.map((r) => [
        r.date,
        r.views,
        r.orders,
        r.revenue,
        (r as any).prev_views ?? null,
        (r as any).prev_orders ?? null,
        (r as any).prev_revenue ?? null,
      ]),
    ]
    downloadCsv(`${baseName}-series.csv`, toCsv(seriesRows))

    // 2) Топ профилей
    const topRows: Array<Array<string | number | null | undefined>> = [
      ['profile_id', 'name', 'views', 'orders', 'revenue', 'rating'],
      ...(data.topProfiles || []).map((p) => [p.profile_id, p.name, p.views, p.orders, p.revenue, p.rating ?? null]),
    ]
    downloadCsv(`${baseName}-top-profiles.csv`, toCsv(topRows))
  }

  const chartData = useMemo(() => {
    const rows = data?.series || []
    return rows.map((r) => ({
      ...r,
      label: new Date(`${r.date}T00:00:00Z`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
    }))
  }, [data?.series])

  const prevChartData = useMemo(() => {
    const rows = data?.compare?.series || []
    return rows.map((r) => ({
      ...r,
      label: new Date(`${r.date}T00:00:00Z`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
    }))
  }, [data?.compare?.series])

  const combinedChartData = useMemo(() => {
    // Сшиваем текущий и предыдущий период в один dataset,
    // чтобы не прокидывать data={...} на отдельные линии (и убрать any).
    return chartData.map((row, idx) => {
      const prev = prevChartData[idx]
      return {
        ...row,
        prev_views: prev?.views ?? null,
        prev_orders: prev?.orders ?? null,
        prev_revenue: prev?.revenue ?? null,
      }
    })
  }, [chartData, prevChartData])

  const canShowData = Boolean(data && !isLoading && !error)

  const loadAnalytics = async (nextPeriod: Period, nextProfileId: string, nextCompareEnabled: boolean) => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({
        period: nextPeriod,
        profileId: nextProfileId,
        compare: nextCompareEnabled ? '1' : '0',
      })
      const res = await fetch(`/api/analytics/provider?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Не удалось загрузить статистику')
      }
      setData(json)
    } catch (e: unknown) {
      setData(null)
      const message = e instanceof Error ? e.message : 'Не удалось загрузить статистику'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBreakdowns = async (nextPeriod: Period, nextProfileId: string) => {
    try {
      setIsBreakdownsLoading(true)
      const params = new URLSearchParams({
        period: nextPeriod,
        profileId: nextProfileId,
      })
      const res = await fetch(`/api/analytics/provider/breakdowns?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Не удалось загрузить разрезы')
      }
      setBreakdowns(json)
    } catch {
      setBreakdowns(null)
    } finally {
      setIsBreakdownsLoading(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([loadAnalytics(period, profileId, compareEnabled), loadBreakdowns(period, profileId)])
  }

  // Восстанавливаем настройки (как в больших продуктах — "помню как ты любишь")
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.period) setPeriod(parsed.period)
      if (typeof parsed?.compareEnabled === 'boolean') setCompareEnabled(parsed.compareEnabled)
      if (parsed?.profileId) setProfileId(parsed.profileId)
      if (parsed?.chartType) setChartType(parsed.chartType)
      if (parsed?.metrics && typeof parsed.metrics === 'object') {
        setMetrics({
          views: parsed.metrics.views !== false,
          orders: parsed.metrics.orders !== false,
          revenue: parsed.metrics.revenue !== false,
        })
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ period, profileId, compareEnabled, chartType, metrics })
      )
    } catch {
      // ignore
    }
  }, [period, profileId, compareEnabled, chartType, metrics])

  useEffect(() => {
    if (authLoading || isClient) return
    loadAnalytics(period, profileId, compareEnabled)
    loadBreakdowns(period, profileId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isClient, period, profileId, compareEnabled])

  // Страница только для провайдеров
  if (!authLoading && isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Статистика для исполнителей</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Раздел статистики доступен только для исполнителей услуг.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full">
            <Link href="/">
              Найти услугу
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="pt-2 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Статистика</h1>
            <p className="text-gray-600 text-[15px]">Аналитика ваших профилей</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex bg-slate-100 rounded-full p-1 w-full sm:w-auto">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-[260px]">
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger className="rounded-[18px] border-slate-200 bg-white">
                <SelectValue placeholder="Все профили" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все профили</SelectItem>
                {(data?.profiles || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={refreshAll}
            disabled={isLoading}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Обновить
          </Button>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
            disabled={!data || isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>
    </div>

      {/* Настройки графика */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:w-[220px]">
              <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                <SelectTrigger className="rounded-[18px] border-slate-200 bg-white">
                  <SelectValue placeholder="Тип графика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combo">Комбо</SelectItem>
                  <SelectItem value="line">Линии</SelectItem>
                  <SelectItem value="bar">Столбцы</SelectItem>
                  <SelectItem value="area">Площади</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 rounded-[18px] border border-slate-200 px-4 py-2">
              <div className="text-sm font-semibold text-slate-700">Сравнить с прошлым</div>
              <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm font-semibold text-slate-700">Метрики</div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox checked={metrics.views} onCheckedChange={(v) => setMetrics(m => ({ ...m, views: Boolean(v) }))} />
              Просмотры
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox checked={metrics.orders} onCheckedChange={(v) => setMetrics(m => ({ ...m, orders: Boolean(v) }))} />
              Заявки
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox checked={metrics.revenue} onCheckedChange={(v) => setMetrics(m => ({ ...m, revenue: Boolean(v) }))} />
              Выручка
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMetrics({ views: true, orders: true, revenue: true })}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors"
          >
            Все метрики
          </button>
          <button
            type="button"
            onClick={() => setMetrics({ views: true, orders: false, revenue: false })}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors"
          >
            Только просмотры
          </button>
          <button
            type="button"
            onClick={() => setMetrics({ views: false, orders: true, revenue: false })}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors"
          >
            Только заявки
          </button>
          <button
            type="button"
            onClick={() => setMetrics({ views: false, orders: false, revenue: true })}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors"
          >
            Только выручка
          </button>
        </div>
        <div className="text-xs text-slate-500 mt-3">
          Эти настройки сохраняются на устройстве и применяются автоматически.
        </div>
      </div>

      {/* KPI */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
              <Skeleton className="h-5 w-24 rounded-[18px]" />
              <Skeleton className="h-9 w-32 mt-3 rounded-[18px]" />
              <Skeleton className="h-4 w-20 mt-2 rounded-[18px]" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-slate-900">Не удалось загрузить статистику</div>
              <div className="text-sm text-slate-600 mt-1">{error}</div>
              <div className="mt-4 flex gap-3">
                <Button className="rounded-full bg-orange-500 hover:bg-orange-600" onClick={() => loadAnalytics(period, profileId, compareEnabled)}>
                  Повторить
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/profiles">Мои профили</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canShowData && (data?.profiles?.length || 0) === 0 && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-lg font-bold text-slate-900">Пока нет профилей</div>
              <div className="text-sm text-slate-600 mt-1">
                Создайте профиль — и здесь появятся просмотры, заявки и выручка.
              </div>
            </div>
            <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
              <Link href="/profiles/create">
                <Building2 className="w-4 h-4 mr-2" />
                Создать профиль
              </Link>
            </Button>
          </div>
        </div>
      )}

      {canShowData && (data?.profiles?.length || 0) > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[18px] bg-slate-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Просмотры</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(data!.kpis.views)}</div>
            {compareEnabled && data?.compare?.deltas?.views && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                {(() => {
                  const d = formatDelta(data.compare!.deltas.views)
                  return (
                    <>
                      {d.up ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
                      <span className={`${d.up ? 'text-green-700' : 'text-red-700'} font-semibold`}>{d.pct}%</span>
                      <span>к прошлому периоду</span>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[18px] bg-orange-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Заявки</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(data!.kpis.orders)}</div>
            {compareEnabled && data?.compare?.deltas?.orders && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                {(() => {
                  const d = formatDelta(data.compare!.deltas.orders)
                  return (
                    <>
                      {d.up ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
                      <span className={`${d.up ? 'text-green-700' : 'text-red-700'} font-semibold`}>{d.pct}%</span>
                      <span>к прошлому периоду</span>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[18px] bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Выручка</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(data!.kpis.revenue)}</div>
            <div className="text-xs text-slate-500 mt-1">по заявкам (confirmed/completed)</div>
            {compareEnabled && data?.compare?.deltas?.revenue && (
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                {(() => {
                  const d = formatDelta(data.compare!.deltas.revenue)
                  return (
                    <>
                      {d.up ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
                      <span className={`${d.up ? 'text-green-700' : 'text-red-700'} font-semibold`}>{d.pct}%</span>
                      <span>к прошлому периоду</span>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[18px] bg-yellow-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Рейтинг</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{data!.kpis.rating ? data!.kpis.rating.toFixed(1) : '—'}</div>
          </div>
        </div>
      )}

      {/* График */}
      {(isLoading || canShowData) && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Динамика</h2>
              <p className="text-xs text-slate-500 mt-1">Просмотры, заявки и выручка по дням</p>
            </div>
            {canShowData && (
              <div className="text-xs text-slate-500">
                Конверсия: <span className="font-semibold text-slate-900">{formatPercent(data!.kpis.conversion)}</span> ·
                Средний чек: <span className="font-semibold text-slate-900">{formatCurrency(Math.round(data!.kpis.avgOrderValue))}</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <Skeleton className="h-[240px] w-full rounded-[24px]" />
          ) : (
            <div className="h-[260px] -mx-2 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedChartData} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 18, borderColor: '#E2E8F0' }}
                    labelStyle={{ color: '#0F172A', fontWeight: 700 }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'revenue') return [formatCurrency(Number(value || 0)), 'Выручка']
                      if (name === 'views') return [formatNumber(Number(value || 0)), 'Просмотры']
                      if (name === 'orders') return [formatNumber(Number(value || 0)), 'Заявки']
                      if (name === 'prev_revenue') return [formatCurrency(Number(value || 0)), 'Выручка (прошлый период)']
                      if (name === 'prev_views') return [formatNumber(Number(value || 0)), 'Просмотры (прошлый период)']
                      if (name === 'prev_orders') return [formatNumber(Number(value || 0)), 'Заявки (прошлый период)']
                      return [String(value), String(name)]
                    }}
                  />

                  {/* Текущий период */}
                  {metrics.revenue && chartType === 'combo' && (
                    <Bar yAxisId="right" dataKey="revenue" fill="#FDBA74" radius={[18, 18, 0, 0]} />
                  )}
                  {metrics.revenue && chartType === 'bar' && (
                    <Bar yAxisId="right" dataKey="revenue" fill="#FDBA74" radius={[18, 18, 0, 0]} />
                  )}
                  {metrics.revenue && chartType === 'line' && (
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  )}
                  {metrics.revenue && chartType === 'area' && (
                    <Area yAxisId="right" type="monotone" dataKey="revenue" fill="#FDBA74" stroke="#F59E0B" fillOpacity={0.35} />
                  )}

                  {metrics.views && chartType !== 'bar' && (
                    <Line yAxisId="left" type="monotone" dataKey="views" stroke="#F97316" strokeWidth={2.5} dot={false} />
                  )}
                  {metrics.orders && chartType !== 'bar' && (
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                  )}

                  {metrics.views && chartType === 'bar' && (
                    <Bar yAxisId="left" dataKey="views" fill="#FB923C" radius={[18, 18, 0, 0]} />
                  )}
                  {metrics.orders && chartType === 'bar' && (
                    <Bar yAxisId="left" dataKey="orders" fill="#38BDF8" radius={[18, 18, 0, 0]} />
                  )}

                  {/* Прошлый период (как легкий reference) */}
                  {compareEnabled && (data?.compare?.series?.length || 0) > 0 && chartType !== 'bar' && (
                    <>
                      {metrics.views && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="prev_views"
                          stroke="#F97316"
                          strokeWidth={1.5}
                          strokeDasharray="6 6"
                          dot={false}
                          opacity={0.35}
                        />
                      )}
                      {metrics.orders && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="prev_orders"
                          stroke="#0EA5E9"
                          strokeWidth={1.5}
                          strokeDasharray="6 6"
                          dot={false}
                          opacity={0.35}
                        />
                      )}
                      {metrics.revenue && chartType === 'line' && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="prev_revenue"
                          stroke="#F59E0B"
                          strokeWidth={1.25}
                          strokeDasharray="6 6"
                          dot={false}
                          opacity={0.3}
                        />
                      )}
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Топ профилей */}
      {(isLoading || (canShowData && (data?.topProfiles?.length || 0) > 0)) && (
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Топ профилей</h2>
            <p className="text-xs text-slate-500 mt-1">Сортировка по просмотрам за выбранный период</p>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 rounded-[18px]" />
                    <Skeleton className="h-3 w-28 rounded-[18px] mt-2" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-[18px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {(data?.topProfiles || []).map((p, idx) => (
                <div key={p.profile_id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {formatNumber(p.views)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {formatNumber(p.orders)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {formatCurrency(p.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">Рейтинг</div>
                      <div className="font-bold text-slate-900">{p.rating ? Number(p.rating).toFixed(1) : '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Разрезы */}
      {(isBreakdownsLoading || canShowData) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Устройства */}
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="text-lg font-bold text-slate-900">Устройства</div>
            <div className="text-xs text-slate-500 mt-1">По просмотрам профиля</div>

            {isBreakdownsLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-40 rounded-[18px]" />
                <Skeleton className="h-4 w-52 rounded-[18px]" />
                <Skeleton className="h-4 w-44 rounded-[18px]" />
              </div>
            ) : (
              (() => {
                const d = breakdowns?.devices || { mobile: 0, desktop: 0, tablet: 0, unknown: 0 }
                const total = d.mobile + d.desktop + d.tablet + d.unknown
                const row = (label: string, value: number) => (
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(value)} {total > 0 ? <span className="text-slate-500 font-medium">({Math.round((value / total) * 100)}%)</span> : null}
                    </span>
                  </div>
                )
                return (
                  <div className="mt-4 space-y-2">
                    {row('Mobile', d.mobile)}
                    {row('Desktop', d.desktop)}
                    {row('Tablet', d.tablet)}
                    {row('Unknown', d.unknown)}
                    <div className="h-px bg-slate-100 my-3" />
                    <div className="text-xs text-slate-500">
                      Среднее время на профиле:{' '}
                      <span className="font-semibold text-slate-900">
                        {formatNumber(breakdowns?.engagement?.time_on_page_avg_sec || 0)} сек
                      </span>
                      {breakdowns?.engagement?.samples ? (
                        <span className="text-slate-400"> · {formatNumber(breakdowns.engagement.samples)} замеров</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      Средняя глубина скролла:{' '}
                      <span className="font-semibold text-slate-900">
                        {formatNumber(breakdowns?.engagement?.scroll_depth_avg || 0)}%
                      </span>
                    </div>
                  </div>
                )
              })()
            )}
          </div>

          {/* Источники */}
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="text-lg font-bold text-slate-900">Источники</div>
            <div className="text-xs text-slate-500 mt-1">По сессиям, где был просмотр профиля</div>

            {isBreakdownsLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-52 rounded-[18px]" />
                <Skeleton className="h-4 w-44 rounded-[18px]" />
                <Skeleton className="h-4 w-48 rounded-[18px]" />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {(breakdowns?.sources || []).length === 0 ? (
                  <div className="text-sm text-slate-600">
                    Пока нет данных. Источник фиксируется при заходе с UTM/реферера.
                  </div>
                ) : (
                  (breakdowns?.sources || []).map((s) => (
                    <div key={`${s.source}||${s.medium}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{s.source}</div>
                        <div className="text-xs text-slate-500 truncate">{s.medium}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{formatNumber(s.count)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Воронка */}
          <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6">
            <div className="text-lg font-bold text-slate-900">Воронка</div>
            <div className="text-xs text-slate-500 mt-1">Зависит от того, какие события реально трекаются</div>

            {isBreakdownsLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-56 rounded-[18px]" />
                <Skeleton className="h-4 w-48 rounded-[18px]" />
                <Skeleton className="h-4 w-52 rounded-[18px]" />
              </div>
            ) : (
              (() => {
                const f = breakdowns?.funnel || { profile_view: 0, service_click: 0, cart_add: 0, checkout_start: 0, order_create: 0 }
                const base = f.profile_view || 0
                const step = (label: string, value: number) => {
                  const pct = base > 0 ? Math.round((value / base) * 100) : 0
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900">
                          {formatNumber(value)} {base > 0 ? <span className="text-slate-500 font-medium">({pct}%)</span> : null}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="mt-4 space-y-3">
                    {step('Просмотр профиля', f.profile_view)}
                    {step('Клик по услуге', f.service_click)}
                    {step('Добавили в корзину', f.cart_add)}
                    {step('Начали оформление', f.checkout_start)}
                    {step('Создали заказ', f.order_create)}
                  </div>
                )
              })()
            )}
          </div>
        </div>
      )}
    </div>
  )
}
