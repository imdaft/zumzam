'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, Clock, MapPin, Users, Baby, MessageSquare, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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

interface BookingCardProps {
  booking: any
  userRole: 'client' | 'profile' // Роль текущего пользователя
  onStatusChange?: () => void
}

const statusConfig = {
  pending: { label: 'Ожидает', color: 'bg-yellow-500' },
  confirmed: { label: 'Подтверждено', color: 'bg-green-500' },
  cancelled: { label: 'Отменено', color: 'bg-gray-500' },
  completed: { label: 'Завершено', color: 'bg-blue-500' },
  rejected: { label: 'Отклонено', color: 'bg-red-500' },
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
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: reason,
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
  const status = statusConfig[booking.status as keyof typeof statusConfig]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={status.color}>
                {status.label}
              </Badge>
              {booking.created_at && (
                <span className="text-xs text-muted-foreground">
                  Создано: {format(new Date(booking.created_at), 'dd MMM yyyy', { locale: ru })}
                </span>
              )}
            </div>
            
            {service && (
              <h3 className="font-semibold text-lg">
                <Link 
                  href={`/services/${service.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {service.title}
                </Link>
              </h3>
            )}
            
            {profile && userRole === 'client' && (
              <Link
                href={`/profiles/${profile.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {profile.display_name}
              </Link>
            )}
            
            {client && userRole === 'profile' && (
              <p className="text-sm text-muted-foreground">
                Клиент: {client.full_name || client.email}
              </p>
            )}
          </div>

          {service?.price && (
            <div className="text-right">
              <div className="text-xl font-bold text-primary">
                {service.price.toLocaleString()}₽
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Дата и время */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(booking.event_date), 'dd MMMM yyyy', { locale: ru })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{booking.event_time}</span>
          </div>
        </div>

        {/* Детали */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Baby className="h-4 w-4 text-muted-foreground" />
            <span>Возраст: {booking.child_age} лет</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Детей: {booking.children_count}</span>
          </div>
        </div>

        {/* Адрес */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground">{booking.event_address}</span>
        </div>

        {/* Сообщение клиента */}
        {booking.client_message && (
          <div className="flex items-start gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-muted-foreground">{booking.client_message}</p>
          </div>
        )}

        {/* Контакты (для студии) */}
        {userRole === 'profile' && profile && (
          <div className="pt-3 border-t space-y-2">
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${profile.phone}`} className="hover:text-primary">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${profile.email}`} className="hover:text-primary">
                  {profile.email}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Причина отказа */}
        {booking.status === 'rejected' && booking.rejection_reason && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-200">
              <strong>Причина отказа:</strong> {booking.rejection_reason}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 border-t pt-4">
        {/* Действия для клиента */}
        {userRole === 'client' && booking.status === 'pending' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isUpdating}>
                Отменить
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Отменить бронирование?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены что хотите отменить это бронирование?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Нет</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateStatus('cancelled')}>
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
              variant="default" 
              size="sm"
              disabled={isUpdating}
              onClick={() => updateStatus('confirmed')}
            >
              Подтвердить
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isUpdating}>
                  Отклонить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => updateStatus('rejected', rejectionReason)}
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
            variant="default" 
            size="sm"
            disabled={isUpdating}
            onClick={() => updateStatus('completed')}
          >
            Завершить
          </Button>
        )}

        {/* Ссылка на детали */}
        {service && (
          <Button variant="outline" size="sm" asChild className="ml-auto">
            <Link href={`/services/${service.id}`}>
              Подробнее
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}


