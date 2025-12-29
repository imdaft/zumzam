'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Zap,
  ChevronLeft,
  MessageCircle,
  Star,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CATEGORIES, VENUE_TYPES } from '@/lib/types/order-request'

type RequestStatus = 'active' | 'in_progress' | 'closed' | 'cancelled'

interface RequestDetailClientProps {
  request: any
  responses: any[]
  isNewlyCreated: boolean
}

export function RequestDetailClient({ request, responses, isNewlyCreated }: RequestDetailClientProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isNewlyCreated) return
    toast.success('Заявка опубликована!', {
      description: 'Исполнители уже видят вашу заявку и скоро начнут откликаться',
      duration: 5000,
    })
    router.replace(`/my-requests/${request.id}`)
  }, [isNewlyCreated, request.id, router])

  const category = CATEGORIES.find((c) => c.id === request.category)
  const venue = VENUE_TYPES.find((v) => v.id === request.venue_type)

  const eventDate = new Date(request.event_date)
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const statusConfig: Record<RequestStatus, { label: string; color: string }> = {
    active: { label: 'Активна', color: 'bg-green-100 text-green-700' },
    in_progress: { label: 'В работе', color: 'bg-yellow-100 text-yellow-700' },
    closed: { label: 'Закрыта', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Отменена', color: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[(request.status as RequestStatus) || 'active'] || statusConfig.active

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Верхняя панель — с округлениями по дизайн-коду */}
      <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2">
        <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] px-3 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
            type="button"
            aria-label="Назад"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-gray-900 truncate">Моё объявление</h1>
          </div>
          <Badge className={cn('rounded-full px-3 py-1', status.color)}>{status.label}</Badge>
        </div>
      </div>

      {/* ВАЖНО: без внутреннего px-2 — layout уже даёт px-2 на мобиле */}
      <div className="w-full py-4 pb-24">
        {/* Двухколоночный макет на десктопе */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* ЛЕВАЯ КОЛОНКА - Информация об объявлении */}
          <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{request.title}</h2>

                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-gray-500">{category?.label}</p>
                    {request.is_urgent && (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50"
                        title="Срочно"
                      >
                        <Zap className="w-4 h-4 text-red-600" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {request.description && (
                <>
                  <div className="mt-5 h-px bg-gray-100" />
                  <p className="mt-5 text-gray-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
                </>
              )}

              {/* Инфо (лавка-стиль): зонирование линиями */}
              <div className="mt-5 rounded-[24px] border border-gray-100 overflow-hidden divide-y divide-gray-100">
                <div className="flex items-start gap-3 p-4 bg-white">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Когда</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {formattedDate}
                      {request.event_time ? (
                        <span className="text-gray-600 font-medium">, {request.event_time}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Где</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {request.city}
                      {request.district ? <span className="text-gray-600 font-medium">, {request.district}</span> : null}
                    </div>
                    {venue ? <div className="text-sm text-gray-500 mt-1">{venue.label}</div> : null}
                  </div>
                </div>

                {request.children_count ? (
                  <div className="flex items-start gap-3 p-4 bg-white">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Дети</div>
                      <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                        {request.children_count} чел.
                        {request.children_age_from && request.children_age_to ? (
                          <span className="text-gray-600 font-medium"> ({request.children_age_from}–{request.children_age_to} лет)</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {(request.budget || request.budget_negotiable) ? (
                  <div className="flex items-start gap-3 p-4 bg-white">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <span className="text-xl">💰</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Бюджет</div>
                      <div className="text-[18px] font-bold text-gray-900 mt-0.5">
                        {request.budget_negotiable ? 'Договорной' : `до ${request.budget?.toLocaleString()} ₽`}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Кнопка редактирования */}
            <div className="lg:block">
              <Link href={`/my-requests/${request.id}/edit`} className="block">
                <Button className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-base font-semibold">
                  Редактировать
                </Button>
              </Link>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА - Отклики (sticky на десктопе) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Отклики
                  {responses.length > 0 && <span className="ml-2 text-orange-500">({responses.length})</span>}
                </h3>
              </div>

              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-2">Пока нет откликов</p>
                  <p className="text-sm text-gray-400">Исполнители увидят вашу заявку и скоро начнут откликаться</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {responses.map((response) => (
                    <ResponseCard key={response.id} response={response} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResponseCard({ response }: { response: any }) {
  const profile = response.profile

  return (
    <div className="p-4 border border-gray-100 rounded-[18px] hover:border-orange-200 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
          {profile?.logo ? (
            <Image
              src={profile.logo}
              alt={profile.title}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
              {profile?.title?.[0] || '?'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profiles/${profile?.slug}`}
              className="font-semibold text-gray-900 hover:text-orange-600 transition-colors"
            >
              {profile?.title || 'Исполнитель'}
            </Link>
            {profile?.rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">{profile.rating}</span>
              </div>
            )}
          </div>

          {response.message && <p className="text-gray-600 text-sm mt-1 line-clamp-2">{response.message}</p>}

          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-bold text-orange-600">{response.price.toLocaleString()} ₽</span>
            <span className="text-xs text-gray-400">{new Date(response.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" variant="outline" className="rounded-full h-9 w-9 p-0 sm:h-9 sm:w-9" title="Позвонить">
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-orange-500 hover:bg-orange-600 h-9 w-9 p-0 sm:w-auto sm:px-3"
            title="Написать"
          >
            <MessageCircle className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Написать</span>
          </Button>
        </div>
      </div>
    </div>
  )
}





