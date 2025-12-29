'use client'

import Link from 'next/link'
import { ru } from 'date-fns/locale'
import { safeFormatDate } from '@/lib/utils'
import { Calendar, Clock, MapPin, Users, Baby, MessageSquare, Phone, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BookingCardProps {
  booking: any
  userRole: 'client' | 'profile' // Роль текущего пользователя
  onStatusChange?: () => void
}

const statusConfig: Record<
  string,
  { label: string; badgeClass: string }
> = {
  pending: { label: 'Ожидает', badgeClass: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Подтверждено', badgeClass: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменено', badgeClass: 'bg-red-100 text-red-700' },
  completed: { label: 'Завершено', badgeClass: 'bg-green-100 text-green-700' },
  rejected: { label: 'Отклонено', badgeClass: 'bg-red-100 text-red-700' },
}

/**
 * Карточка бронирования
 */
export function BookingCard({ booking, userRole, onStatusChange }: BookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const updateStatus = async (newStatus: string, reason?: string) => {
    setIsUpdating(true)

    try {
      // Определяем правильный endpoint: orders или bookings
      const endpoint = booking.isNewOrder ? 'orders' : 'bookings'
      
      const response = await fetch(`/api/${endpoint}/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: reason,
          provider_response: reason, // Для orders используется provider_response
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка обновления')
      }

      toast.success('Статус обновлён! 🎉')
      
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error: any) {
      console.error('Update status error:', error)
      toast.error('Ошибка', {
        description: error.message,
      })
    } finally {
      setIsUpdating(false)
      setRejectionReason('')
    }
  }

  const service = booking.services
  const profile = booking.profiles
  const client = booking.clients
  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending
  
  // Для новых orders данные клиента хранятся непосредственно в заказе
  const clientInfo = booking.isNewOrder ? {
    name: booking.client_name,
    phone: booking.client_phone,
    email: booking.client_email,
  } : {
    name: client?.full_name || client?.email,
    phone: profile?.phone, // Для старых bookings контакты из profile
    email: profile?.email || client?.email,
  }

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className={cn('rounded-full px-3 py-1 text-xs font-semibold', status.badgeClass)}>
                {status.label}
              </Badge>
              {booking.created_at ? (
                <span className="text-[11px] text-gray-400">
                  {safeFormatDate(booking.created_at, 'dd MMM yyyy', { locale: ru })}
                </span>
              ) : null}
            </div>

            <div className="mt-2">
              {booking.isNewOrder ? (
                <>
                  <h3 className="text-[17px] font-bold text-gray-900 truncate">
                    {booking.profile?.display_name || 'Заказ'}
                  </h3>
                  {booking.items && booking.items.length > 0 ? (
                    <p className="text-sm text-gray-600 mt-0.5">
                      Услуг: <span className="font-semibold text-gray-900">{booking.items.length}</span>
                    </p>
                  ) : null}
                </>
              ) : service ? (
                <h3 className="text-[17px] font-bold text-gray-900 truncate">
                  <Link href={`/services/${service.id}`} className="hover:text-orange-600 transition-colors">
                    {service.title}
                  </Link>
                </h3>
              ) : (
                <h3 className="text-[17px] font-bold text-gray-900">Бронирование</h3>
              )}

              {profile && userRole === 'client' ? (
                <Link
                  href={`/profiles/${profile.slug}`}
                  className="inline-block text-sm text-gray-500 hover:text-orange-600 transition-colors mt-0.5"
                >
                  {profile.display_name}
                </Link>
              ) : null}

              {userRole === 'profile' && clientInfo.name ? (
                <p className="text-sm text-gray-600 mt-0.5">
                  Клиент: <span className="font-medium text-gray-900">{clientInfo.name}</span>
                </p>
              ) : null}
            </div>
          </div>

          {(booking.total_amount || service?.price) ? (
            <div className="text-right shrink-0">
              <div className="text-[18px] font-bold text-gray-900">
                {booking.isNewOrder ? `${booking.total_amount?.toLocaleString()} ₽` : service?.price ? `${service.price.toLocaleString()} ₽` : ''}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Details (lavka-list) */}
      <div className="px-5 pb-5">
        <div className="rounded-[18px] border border-gray-100 overflow-hidden divide-y divide-gray-100">
          <div className="flex items-start gap-3 p-4 bg-white">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Когда</div>
              <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                {safeFormatDate(booking.event_date, 'dd MMMM yyyy', { locale: ru })}
                {booking.event_time ? <span className="text-gray-600 font-medium">, {booking.event_time}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Где</div>
              <div className="text-[15px] font-semibold text-gray-900 mt-0.5">{booking.event_address}</div>
            </div>
          </div>

          {(booking.child_age || booking.children_count) ? (
            <div className="flex items-start gap-3 p-4 bg-white">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Дети</div>
                <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                  {booking.children_count ? `${booking.children_count} детей` : null}
                  {booking.children_count && booking.child_age ? <span className="text-gray-600 font-medium">, </span> : null}
                  {booking.child_age ? <span className="text-gray-600 font-medium">{booking.child_age} лет</span> : null}
                </div>
              </div>
            </div>
          ) : null}

          {booking.client_message ? (
            <div className="flex items-start gap-3 p-4 bg-white">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Сообщение</div>
                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                  {booking.client_message}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Контакты клиента (для студии) */}
        {userRole === 'profile' && (clientInfo.phone || clientInfo.email) ? (
          <div className="mt-4 rounded-[18px] border border-gray-100 bg-white p-4">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Контакты клиента</div>
            <div className="mt-2 space-y-2">
              {clientInfo.phone ? (
                <a
                  href={`tel:${clientInfo.phone}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                >
                  <Phone className="h-4 w-4 text-gray-400" />
                  {clientInfo.phone}
                </a>
              ) : null}
              {clientInfo.email ? (
                <a
                  href={`mailto:${clientInfo.email}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                >
                  <Mail className="h-4 w-4 text-gray-400" />
                  {clientInfo.email}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Причина отказа */}
        {booking.status === 'rejected' && booking.rejection_reason ? (
          <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-900">
              <span className="font-semibold">Причина отказа:</span> {booking.rejection_reason}
            </p>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2">
        {/* Действия для клиента */}
        {userRole === 'client' && booking.status === 'pending' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isUpdating} className="rounded-full h-10 px-4 text-sm font-semibold">
                Отменить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[24px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Отменить бронирование?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены что хотите отменить это бронирование?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Нет</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateStatus('cancelled')} className="rounded-full">
                  Да, отменить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Действия для студии */}
        {userRole === 'profile' && booking.status === 'pending' && (
          <>
            <Button 
              size="sm"
              disabled={isUpdating}
              onClick={() => updateStatus('confirmed')}
              className="rounded-full h-10 px-4 text-sm font-semibold bg-orange-500 hover:bg-orange-600"
            >
              Подтвердить
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isUpdating} className="rounded-full h-10 px-4 text-sm font-semibold">
                  Отклонить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[24px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Отклонить бронирование</AlertDialogTitle>
                  <AlertDialogDescription>
                    Укажите причину отклонения (необязательно)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="rejection-reason">Причина</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Например: К сожалению, на эту дату уже есть бронирование..."
                    className="mt-2 rounded-[18px]"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => updateStatus('rejected', rejectionReason)}
                    className="rounded-full"
                  >
                    Отклонить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {userRole === 'profile' && booking.status === 'confirmed' && (
          <Button 
            size="sm"
            disabled={isUpdating}
            onClick={() => updateStatus('completed')}
            className="rounded-full h-10 px-4 text-sm font-semibold bg-green-500 hover:bg-green-600"
          >
            Завершить
          </Button>
        )}

        {/* Ссылка на детали */}
        {service && (
          <Button variant="outline" size="sm" asChild className="ml-auto rounded-full h-10 px-4 text-sm font-semibold">
            <Link href={`/services/${service.id}`}>
              Подробнее
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}


