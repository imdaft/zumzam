/**
 * Карточка заказа (order) для клиента в стиле Яндекса
 * Принципы: компактность, два столбца (детали слева, чат справа), минимализм
 */

'use client'

import { useState } from 'react'
import { ru } from 'date-fns/locale'
import { safeFormatDate } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MessageSquare, 
  Phone,
  ChevronDown,
  ChevronUp,
  Package,
  AlertCircle,
  Store,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompactOrderChat } from '@/components/features/chat/compact-order-chat'
import { OrderAttachments } from '@/components/features/orders/order-attachments'

interface OrderCardClientProps {
  order: any
  onStatusChange?: () => void
}

const statusConfig = {
  pending: { 
    label: 'Ожидает ответа', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  confirmed: { 
    label: 'Подтверждено', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  in_progress: { 
    label: 'В работе', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  completed: { 
    label: 'Завершено', 
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: { 
    label: 'Отменено', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  rejected: { 
    label: 'Отклонено', 
    color: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function OrderCardClient({ order, onStatusChange }: OrderCardClientProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const status = statusConfig[order.status as keyof typeof statusConfig]
  
  // Срочность
  const isUrgent = order.status === 'pending' && order.event_date
  const daysUntilEvent = isUrgent 
    ? Math.ceil((new Date(order.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Проверка, можно ли удалить заказ
  const canDelete = ['pending', 'cancelled', 'rejected'].includes(order.status)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Не открываем карточку при клике на удаление
    
    if (!canDelete) {
      toast.error('Невозможно удалить заказ', {
        description: 'Заказ должен быть завершён, отменён или отклонён'
      })
      return
    }

    const confirm = window.confirm(
      `Вы уверены, что хотите удалить заказ?\n\nЭто действие нельзя отменить.`
    )
    
    if (!confirm) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления заказа')
      }

      toast.success('Заказ удалён')
      if (onStatusChange) onStatusChange()
    } catch (error: any) {
      toast.error('Не удалось удалить заказ', {
        description: error.message
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* КОМПАКТНЫЙ HEADER (стиль Яндекса) */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Левая часть: Провайдер + Статус + Дата */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900 truncate">
                {order.profile?.display_name || 'Загрузка...'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${status.color} text-xs border`} variant="outline">
                {status.label}
              </Badge>
              
              {/* Срочность */}
              {daysUntilEvent !== null && daysUntilEvent <= 3 && (
                <Badge variant="outline" className="text-xs border-orange-300 bg-orange-50 text-orange-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {daysUntilEvent === 0 ? 'Сегодня' : `Через ${daysUntilEvent}д`}
                </Badge>
              )}
            </div>
            
            {/* ДАТА И ВРЕМЯ СОБЫТИЯ - КРУПНО */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{safeFormatDate(order.event_date, 'dd MMMM yyyy', { locale: ru })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{order.event_time}</span>
              </div>
            </div>
          </div>

          {/* Правая часть: Сумма + Действия */}
          <div className="flex items-center gap-2">
            {/* Сумма */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {order.total_amount.toLocaleString()} ₽
              </div>
            </div>

            {/* Кнопка удаления (только для pending/cancelled/rejected) */}
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Удалить заказ"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {/* Индикатор раскрытия */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* РАЗВЕРНУТОЕ СОДЕРЖИМОЕ - ДВА СТОЛБЦА */}
      {isExpanded && (
        <>
          <Separator />
          
          {/* Двухколоночный layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50">
            {/* ЛЕВАЯ КОЛОНКА - Детали заявки */}
            <div className="space-y-5">
              {/* Услуги */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Услуги
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{item.service_title}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-sm text-gray-900">
                            {(item.price * item.quantity).toLocaleString()} ₽
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Детали мероприятия */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  Детали мероприятия
                </h4>
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">
                      {safeFormatDate(order.event_date, 'dd MMMM yyyy', { locale: ru })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{order.event_time}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-900">{order.event_address}</span>
                  </div>
                  {(order.child_age || order.children_count) && (
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">
                        {order.children_count && `${order.children_count} ${order.children_count === 1 ? 'ребенок' : 'детей'}`}
                        {order.child_age && `, возраст ${order.child_age} лет`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ваше сообщение */}
              {order.client_message && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Ваше сообщение
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{order.client_message}</p>
                  </div>
                </div>
              )}

              {/* Ответ от провайдера */}
              {order.provider_response && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Ответ от провайдера
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{order.provider_response}</p>
                  </div>
                </div>
              )}

              {/* Вложения */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Материалы
                </h4>
                <OrderAttachments
                  orderId={order.id}
                  currentUserRole="client"
                />
              </div>

              {/* Причина отклонения */}
              {order.status === 'rejected' && order.rejection_reason && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Причина отклонения
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-900 text-sm leading-relaxed">{order.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Контакты провайдера */}
              {order.status === 'confirmed' && order.profile?.phone && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    Контакты провайдера
                  </h4>
                  <a
                    href={`tel:${order.profile.phone}`}
                    className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm text-gray-900">{order.profile.phone}</span>
                  </a>
                </div>
              )}
            </div>

            {/* ПРАВАЯ КОЛОНКА - Чат */}
            <div className="lg:sticky lg:top-6 h-fit">
              <CompactOrderChat
                orderId={order.id}
                conversationId={order.conversation_id}
                currentUserRole="client"
                clientName={order.client_name}
                providerName={order.profile?.display_name}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

