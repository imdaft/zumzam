'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, ClipboardList, Calendar, Eye, MessageSquare, Pencil, MapPin, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/contexts/auth-context'

type RequestStatus = 'active' | 'in_progress' | 'closed' | 'cancelled'

type MyRequest = {
  id: string
  title: string
  status: RequestStatus
  created_at: string
  event_date: string
  event_time: string | null
  city: string
  district: string | null
  responses_count: number | null
  views_count: number | null
  is_urgent: boolean | null
}

const statusUi: Record<RequestStatus, { label: string; className: string }> = {
  active: { label: 'Активно', className: 'bg-green-100 text-green-700' },
  in_progress: { label: 'В работе', className: 'bg-yellow-100 text-yellow-700' },
  closed: { label: 'Закрыто', className: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Отменено', className: 'bg-red-100 text-red-700' },
}

export default function MyRequestsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [requests, setRequests] = useState<MyRequest[]>([])

  const loadMyRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set('my', 'true')
      params.set('limit', '50')

      const resp = await fetch(`/api/requests?${params.toString()}`)
      if (!resp.ok) throw new Error('Failed to fetch my requests')

      const data = await resp.json()
      setRequests((data.requests || []) as MyRequest[])
    } catch (e) {
      console.error('[MyRequests] Load error:', e)
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login?redirect=/my-requests')
      return
    }
    loadMyRequests()
  }, [authLoading, user, router, loadMyRequests])

  const totalResponses = useMemo(() => {
    return requests.reduce((sum, r) => sum + (r.responses_count || 0), 0)
  }, [requests])

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2 pb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Мои объявления</h1>
            <p className="text-gray-600 text-[15px]">
              {requests.length}{' '}
              {requests.length === 1 ? 'объявление' : requests.length < 5 ? 'объявления' : 'объявлений'}
              {totalResponses > 0 ? ` • ${totalResponses} откликов` : ''}
            </p>
          </div>

          <Link href="/create-request">
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 px-4 text-sm font-medium shrink-0">
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Разместить</span>
              <span className="sm:hidden">Создать</span>
            </Button>
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-[24px] p-10 text-center border border-gray-100 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-sm">
            <ClipboardList className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">У вас пока нет объявлений</h2>
          <p className="text-sm text-gray-600 mt-1 mb-6">Создайте объявление, чтобы исполнители могли откликаться.</p>
          <Link href="/create-request">
            <Button className="bg-orange-500 hover:bg-orange-600 rounded-full">
              <Plus className="w-4 h-4 mr-1.5" />
              Создать объявление
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const status = statusUi[req.status] || statusUi.active
            const eventDate = new Date(req.event_date)
            const eventDay = eventDate.getDate()
            const eventMonth = eventDate.toLocaleDateString('ru-RU', { month: 'short' })
            const isActive = req.status === 'active'
            
            return (
              <Link 
                key={req.id} 
                href={`/my-requests/${req.id}`}
                className="block group"
              >
                <div className="bg-white rounded-[20px] border border-gray-100 hover:border-gray-200 transition-all overflow-hidden">
                  <div className="p-5 flex items-start gap-4">
                    {/* Дата - большой блок слева */}
                    <div className="flex-shrink-0 w-14 sm:w-16 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{eventDay}</div>
                      <div className="text-xs sm:text-sm text-gray-500 uppercase mt-0.5">{eventMonth}</div>
                      {req.event_time && (
                        <div className="text-xs text-gray-400 mt-1 font-medium">{req.event_time.slice(0, 5)}</div>
                      )}
                    </div>

                    {/* Основной контент */}
                    <div className="flex-1 min-w-0">
                      {/* Заголовок */}
                      <h3 className="text-[17px] sm:text-lg font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors">
                        {req.title}
                      </h3>

                      {/* Метаинформация */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-600">
                        <span className="font-medium">{req.city}</span>
                        {req.district && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{req.district}</span>
                          </>
                        )}
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-gray-500">
                            <Eye className="w-3.5 h-3.5" />
                            {req.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {req.responses_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Статус и действия справа */}
                    <div className="flex-shrink-0 flex flex-col items-end justify-between self-stretch gap-2">
                      {/* Верхняя часть - Статус и Срочность */}
                      <div className="flex items-center gap-2">
                        {/* Срочность - десктоп: текст, мобайл: иконка */}
                        {req.is_urgent && (
                          <>
                            <span className="hidden lg:inline-block px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                              Срочно
                            </span>
                            <Zap className="w-4 h-4 text-red-500 lg:hidden" strokeWidth={2.5} />
                          </>
                        )}
                        
                        {/* Статус - десктоп: текст, мобайл: точка */}
                        <span className={`hidden lg:inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                        <div className={`lg:hidden w-2 h-2 rounded-full ${
                          isActive ? 'bg-green-500' : 
                          req.status === 'in_progress' ? 'bg-yellow-500' :
                          req.status === 'closed' ? 'bg-gray-400' : 'bg-red-500'
                        }`} />
                      </div>

                      {/* Кнопка редактирования - всегда видна, внизу справа */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(`/my-requests/${req.id}/edit`)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="h-20 lg:h-0" />
    </div>
  )
}





