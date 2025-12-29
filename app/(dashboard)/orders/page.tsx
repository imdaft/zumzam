/**
 * Страница заявок клиента
 * Мобильная версия: список → клик → полноэкранная заявка
 * Десктоп: раскрывающиеся карточки
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Loader2, Calendar, MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Users, Phone, MessageSquare, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Order, OrderStatus } from '@/types'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { CompactOrderChat } from '@/components/features/chat/compact-order-chat'
import { mapToClientStatus, clientStatusConfig } from '@/lib/utils/order-status'
import { OrderCardProvider } from '@/components/features/booking/order-card-provider'
import { useFeatureAccess } from '@/components/shared/feature-gate'
import { cn } from '@/lib/utils'

/**
 * Безопасное форматирование даты
 */
function safeFormatDate(dateValue: any, formatStr: string, options?: any): string {
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '--'
    return format(date, formatStr, options)
  } catch {
    return '--'
  }
}

export default function OrdersPage() {
  const { user, isProvider, isAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [viewAsProvider, setViewAsProvider] = useState(false)
  const { hasAccess: hasCrmAccess } = useFeatureAccess('crm')
  
  // Мобильный режим: выбранный заказ для полноэкранного просмотра
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Проверяем URL параметр для открытия заказа
  useEffect(() => {
    const orderId = searchParams.get('id')
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId)
      if (order) {
        if (isMobile) {
          setSelectedOrder(order)
        } else {
          setExpandedOrderId(orderId)
        }
      }
    }
  }, [searchParams, orders, isMobile])

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const preferProviderView = isProvider || isAdmin

      if (preferProviderView) {
        setViewAsProvider(true)
        const providerParams = new URLSearchParams()
        providerParams.set('role', 'provider')
        const providerResp = await fetch(`/api/orders?${providerParams}`)
        if (!providerResp.ok) throw new Error('Failed to fetch provider orders')
        const providerData = await providerResp.json()
        setOrders(providerData.orders || [])
        return
      }

      // Если роль ещё не "provider", но у пользователя есть заявки как у исполнителя —
      // показываем провайдерский интерфейс (статусы/чат/материалы).
      const providerParams = new URLSearchParams()
      providerParams.set('role', 'provider')
      const providerResp = await fetch(`/api/orders?${providerParams}`)
      if (providerResp.ok) {
        const providerData = await providerResp.json()
        const providerOrders: Order[] = providerData.orders || []
        if (providerOrders.length > 0) {
          setViewAsProvider(true)
          setOrders(providerOrders)
          return
        }
      }

      setViewAsProvider(false)
      const clientParams = new URLSearchParams()
      clientParams.set('role', 'client')
      const clientResp = await fetch(`/api/orders?${clientParams}`)
      if (!clientResp.ok) throw new Error('Failed to fetch client orders')
      const clientData = await clientResp.json()
      setOrders(clientData.orders || [])
    } catch (error) {
      console.error('[Orders] Ошибка загрузки:', error)
      toast.error('Не удалось загрузить заявки')
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, isProvider])

  useEffect(() => {
    if (user) fetchOrders()
  }, [user, fetchOrders])

  const getStatusConfig = (status: OrderStatus) => {
    const clientStatus = mapToClientStatus(status as any)
    const config = clientStatusConfig[clientStatus]
    return { text: config.label, color: config.color }
  }

  // Открытие заказа
  const openOrder = (order: Order) => {
    if (isMobile) {
      setSelectedOrder(order)
      // Обновляем URL без перезагрузки
      window.history.pushState({}, '', `/orders?id=${order.id}`)
    } else {
      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
    }
  }

  // Закрытие заказа (мобильный)
  const closeOrder = () => {
    setSelectedOrder(null)
    window.history.pushState({}, '', '/orders')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // ==================== ВИД ДЛЯ ИСПОЛНИТЕЛЯ (БЕЗ CRM ИЛИ ВМЕСТО CRM) ====================
  if (viewAsProvider) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        {/* Header */}
        <div className="pt-2 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Заказы</h1>
              <p className="text-gray-600 text-[15px]">
                {orders.length > 0
                  ? `${orders.length} ${orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}`
                  : 'Пока нет заказов'}
              </p>
            </div>

            {hasCrmAccess === true ? (
              <Button
                  onClick={() => router.push('/crm')}
                  className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-[15px] font-medium bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                >
                  CRM
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/pricing')}
                  variant="outline"
                  className="rounded-full h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-[15px] font-medium shrink-0"
                >
                  CRM
                </Button>
              )}
          </div>
        </div>

        <div className="w-full py-4 pb-24 space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-sm">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Пока нет заказов</h2>
              <p className="text-sm text-gray-600 mt-1">Новые заказы от клиентов появятся здесь</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCardProvider key={order.id} order={order as any} onStatusChange={fetchOrders} />
              ))}
            </div>
          )}

          <div className="h-20 lg:h-0" />
        </div>
      </div>
    )
  }

  // ==================== МОБИЛЬНЫЙ ПОЛНОЭКРАННЫЙ ВИД ЗАКАЗА ====================
  if (isMobile && selectedOrder) {
    const statusConfig = getStatusConfig(selectedOrder.status)
    
    return (
      <div className="fixed inset-0 bg-[#F7F8FA] z-50 flex flex-col">
        {/* Шапка (sticky panel) */}
        <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2">
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] mx-2 px-3 py-3 flex items-center gap-3">
            <button
              onClick={closeOrder}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
              type="button"
              aria-label="Назад"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold text-gray-900 truncate">
                {selectedOrder.profile?.display_name || 'Заказ'}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                № {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
              </p>
            </div>
            <Badge className={cn('rounded-full px-3 py-1 text-xs font-bold border-0', statusConfig.color)}>
              {statusConfig.text}
            </Badge>
          </div>
        </div>

        {/* Контент с прокруткой */}
        <div className="flex-1 overflow-y-auto px-2 pb-20">
          {/* Основная информация */}
          <div className="py-4 space-y-4">
            {/* Сумма */}
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Сумма
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {selectedOrder.total_amount.toLocaleString()} ₽
              </div>
            </div>

            {/* Детали (лавка-стиль) */}
            <div className="rounded-[24px] border border-gray-100 overflow-hidden divide-y divide-gray-100 bg-white">
              <div className="flex items-start gap-3 p-4 bg-white">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Когда</div>
                  <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                    {safeFormatDate(selectedOrder.event_date, 'd MMMM yyyy', { locale: ru })}
                    {selectedOrder.event_time ? (
                      <span className="text-gray-600 font-medium">, {selectedOrder.event_time}</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {safeFormatDate(selectedOrder.event_date, 'EEEE', { locale: ru })}
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
                    {selectedOrder.event_address?.split(',')?.[0] || selectedOrder.event_address}
                  </div>
                  {selectedOrder.event_address?.includes(',') ? (
                    <div className="text-sm text-gray-500 mt-1">
                      {selectedOrder.event_address.split(',').slice(1).join(', ')}
                    </div>
                  ) : null}
                </div>
              </div>

              {(selectedOrder.child_age || selectedOrder.children_count) ? (
                <div className="flex items-start gap-3 p-4 bg-white">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Участники</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {selectedOrder.children_count ? `${selectedOrder.children_count} ${selectedOrder.children_count === 1 ? 'ребёнок' : 'детей'}` : null}
                      {selectedOrder.children_count && selectedOrder.child_age ? <span className="text-gray-600 font-medium">, </span> : null}
                      {selectedOrder.child_age ? <span className="text-gray-600 font-medium">{selectedOrder.child_age} лет</span> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Услуги */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Услуги</h3>
                <div className="rounded-[18px] border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white">
                      <span className="text-sm text-gray-900">{item.service_title}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(item.price * item.quantity).toLocaleString()} ₽
                        {item.quantity > 1 && <span className="text-gray-500 text-xs ml-1">x{item.quantity}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Сообщение клиента */}
            {selectedOrder.client_message && (
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Сообщение</div>
                <div className="mt-2 rounded-[18px] bg-orange-50 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedOrder.client_message}</p>
                </div>
              </div>
            )}

            {/* Ответ провайдера */}
            {selectedOrder.provider_response && (
              <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ответ</div>
                <div className="mt-2 rounded-[18px] bg-gray-50 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedOrder.provider_response}</p>
                </div>
              </div>
            )}

            {/* Контакты */}
            {selectedOrder.status === 'confirmed' && selectedOrder.profile?.phone && (
              <a 
                href={`tel:${selectedOrder.profile.phone}`}
                className="flex items-center justify-center gap-2 h-12 px-4 bg-green-50 rounded-full text-green-700 font-semibold"
              >
                <Phone className="w-5 h-5" />
                Позвонить: {selectedOrder.profile.phone}
              </a>
            )}
          </div>

          {/* Чат */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                Чат
              </h3>
            </div>
            <div className="h-[420px]">
              <CompactOrderChat
                conversationId={(selectedOrder as any).conversation?.id || selectedOrder.conversation_id}
                orderId={selectedOrder.id}
                currentUserRole={(selectedOrder.profile as any)?.user_id === user?.id ? 'provider' : 'client'}
                clientName={selectedOrder.client_name}
                providerName={selectedOrder.profile?.display_name}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== ОСНОВНОЙ ВИД (СПИСОК) ====================
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="pt-2 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Заказы</h1>
            <p className="text-gray-600 text-[15px]">
              {orders.length > 0
                ? `${orders.length} ${orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}`
                : 'Пока нет заказов'}
            </p>
          </div>
        </div>
      </div>

      {/* Пустое состояние */}
      {orders.length === 0 ? (
        <div className="w-full py-4 pb-24">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mb-4 shadow-sm">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Пока нет заказов</h2>
            <p className="text-sm text-gray-600 mt-1 mb-6">Найдите подходящий сервис</p>
            <Button
              onClick={() => router.push('/')}
              className="rounded-full h-11 px-6 text-sm font-semibold bg-orange-500 hover:bg-orange-600"
            >
              Найти сервис
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full py-4 pb-24 space-y-3">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status)
            const isExpanded = expandedOrderId === order.id
            const profilePhoto =
              order.profile?.main_photo || ((order.profile as any)?.logo as string | undefined)
            
            return (
              <div
                key={order.id}
                className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Компактная карточка */}
                <button
                  onClick={() => openOrder(order)}
                  className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Аватар/Лого */}
                    <div className="w-12 h-12 rounded-[18px] bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0 overflow-hidden">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{order.profile?.display_name?.[0] || 'S'}</span>
                      )}
                    </div>

                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {order.profile?.display_name || 'Заказ'}
                        </h3>
                        <Badge className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border-0 shrink-0', statusConfig.color)}>
                          {statusConfig.text}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {safeFormatDate(order.event_date, 'd MMM', { locale: ru })}
                        </span>
                        <span>{order.event_time}</span>
                        {/* Индикатор нового сообщения */}
                        {(order as any).conversation?.last_message_preview && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900">
                          {order.total_amount.toLocaleString()} ₽
                        </span>
                        
                        {/* Десктоп: стрелка разворачивания */}
                        <span className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
                          {isExpanded ? 'Свернуть' : 'Подробнее'}
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                        
                        {/* Мобильный: стрелка вправо */}
                        <ChevronRight className="w-5 h-5 text-gray-400 lg:hidden" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Развёрнутый вид — только десктоп */}
                {!isMobile && isExpanded && (
                  <div className="border-t border-gray-100 bg-[#F7F8FA] p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Левая колонка — детали */}
                      <div className="space-y-4">
                        {/* Услуги */}
                        {order.items && order.items.length > 0 ? (
                          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                            <h4 className="text-base font-semibold text-gray-900 mb-3">Услуги</h4>
                            <div className="rounded-[18px] border border-gray-100 overflow-hidden divide-y divide-gray-100">
                              {order.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white">
                                  <span className="text-sm text-gray-900">{item.service_title}</span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {(item.price * item.quantity).toLocaleString()} ₽
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* Детали (лавка-таблица) */}
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                          <div className="flex items-start gap-3 p-4 bg-white">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                              <Calendar className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Когда</div>
                              <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                                {safeFormatDate(order.event_date, 'd MMMM yyyy', { locale: ru })}
                                {order.event_time ? <span className="text-gray-600 font-medium">, {order.event_time}</span> : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-white">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Где</div>
                              <div className="text-[15px] font-semibold text-gray-900 mt-0.5">{order.event_address}</div>
                            </div>
                          </div>
                          {(order.child_age || order.children_count) ? (
                            <div className="flex items-start gap-3 p-4 bg-white">
                              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-orange-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Участники</div>
                                <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                                  {order.children_count ? `${order.children_count} детей` : null}
                                  {order.children_count && order.child_age ? <span className="text-gray-600 font-medium">, </span> : null}
                                  {order.child_age ? <span className="text-gray-600 font-medium">{order.child_age} лет</span> : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {order.client_message ? (
                          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Сообщение</div>
                            <div className="mt-2 rounded-[18px] bg-orange-50 p-4">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{order.client_message}</p>
                            </div>
                          </div>
                        ) : null}

                        {order.provider_response ? (
                          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Ответ</div>
                            <div className="mt-2 rounded-[18px] bg-gray-50 p-4">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{order.provider_response}</p>
                            </div>
                          </div>
                        ) : null}

                        {order.status === 'confirmed' && order.profile?.phone ? (
                          <a
                            href={`tel:${order.profile.phone}`}
                            className="flex items-center justify-center gap-2 h-12 px-4 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                          >
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-sm text-gray-900">{order.profile.phone}</span>
                          </a>
                        ) : null}
                      </div>

                      {/* Правая колонка — чат */}
                      <div className="lg:sticky lg:top-6 h-fit">
                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden h-[600px] flex flex-col">
                          {/* Заголовок чата с аватаркой */}
                          <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
                            {/* Аватарка собеседника */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(() => {
                                const isProvider = (order.profile as any)?.user_id === user?.id
                                const displayName = isProvider ? order.client_name : order.profile?.display_name
                                return displayName?.charAt(0).toUpperCase() || 'П'
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {(() => {
                                  const isProvider = (order.profile as any)?.user_id === user?.id
                                  return isProvider ? order.client_name : (order.profile?.display_name || 'Профиль')
                                })()}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {(order.profile as any)?.user_id === user?.id ? 'Клиент' : 'Исполнитель'}
                              </p>
                            </div>
                          </div>
                          {/* Чат */}
                          <CompactOrderChat
                            conversationId={(order as any).conversation?.id || order.conversation_id}
                            orderId={order.id}
                            currentUserRole={(order.profile as any)?.user_id === user?.id ? 'provider' : 'client'}
                            clientName={order.client_name}
                            providerName={order.profile?.display_name}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Нижний отступ для мобильного меню */}
      <div className="h-20 lg:h-0" />
    </div>
  )
}
