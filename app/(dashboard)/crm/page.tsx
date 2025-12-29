/**
 * Единая CRM страница с переключением вида (список/канбан)
 * Как в AmoCRM
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Loader2, List, LayoutGrid, Settings, AlertCircle, Building2 } from 'lucide-react'
import { OrderDetailsModal } from '@/components/features/orders/order-details-modal'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/contexts/auth-context'
import { useFeatureAccess } from '@/components/shared/feature-gate'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PipelineStage {
  id: string
  name: string
  color: string
  position: number
  is_system: boolean
  system_status?: string | null
}

interface Pipeline {
  id: string
  name: string
  stages: PipelineStage[]
  card_settings?: Record<string, unknown>
  is_default?: boolean
  profile_id: string
  profile?: {
    id: string
    display_name: string
  }
}

interface Order {
  id: string
  order_number: string
  title?: string
  client_name: string
  client_phone: string
  client_email: string
  event_date: string
  event_time: string
  event_address: string
  total_amount: number
  status: string
  pipeline_stage_id: string | null
  created_at: string
  items: unknown[]
  profile_id: string
  profile?: {
    display_name: string
    slug: string
  }
  pipeline_stage?: {
    id: string
    name: string
    color: string
    system_status: string | null
  }
}

type ViewMode = 'list' | 'kanban'

export default function CRMPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isClient } = useAuth()
  const { hasAccess: hasCrmAccess, isLoading: crmAccessLoading } = useFeatureAccess('crm')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    // Если CRM недоступна (роль/подписка) — просто не грузим данные и не держим вечный лоадер
    if (isClient) {
      setIsLoading(false)
      return
    }
    if (hasCrmAccess === false) {
      setIsLoading(false)
      return
    }
    if (hasCrmAccess === true) {
      loadData()
    }
  }, [user, isClient, hasCrmAccess])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Загружаем воронки
      const pipelinesResponse = await fetch('/api/pipelines')
      if (!pipelinesResponse.ok) {
        const errorText = await pipelinesResponse.text()
        console.error('Pipelines response error:', errorText)
        
        // Если профиль не найден - перенаправляем на создание
        if (errorText.includes('Profile not found')) {
          toast.error('Создайте профиль в настройках для доступа к CRM')
          router.push('/settings')
          return
        }
        
        throw new Error('Failed to load pipelines')
      }
      
      const pipelinesData = await pipelinesResponse.json()
      console.log('Pipelines loaded:', pipelinesData)
      
      const nextPipelines: Pipeline[] = pipelinesData.pipelines || []
      setPipelines(nextPipelines)

      // Загружаем сделки (orders)
      const ordersResponse = await fetch('/api/orders?role=provider&backfill_unassigned=1')
      if (!ordersResponse.ok) {
        console.error('Orders response error:', await ordersResponse.text())
        throw new Error('Failed to load orders')
      }
      
      const ordersData = await ordersResponse.json()
      console.log('Orders loaded:', ordersData.orders?.length || 0)

      // ⚡️ Больше не делаем пачку PATCH запросов:
      // новые сделки получают "Входящие" на сервере при создании,
      // а легаси сделки без stage отображаем в "Входящие" на клиенте.
      setOrders(ordersData.orders || [])

      // Автовыбор воронки:
      // 1) сохраняем текущую, если она ещё существует
      // 2) иначе выбираем ту, где есть реальные сделки (по pipeline_stage_id)
      // 3) иначе дефолтную, иначе первую
      setSelectedPipeline((prev) => {
        if (!nextPipelines.length) return null
        if (prev) {
          const stillExists = nextPipelines.find(p => p.id === prev.id)
          if (stillExists) return stillExists
        }

        const incomingOrders: Order[] = ordersData.orders || []
        const stageIdFromOrders = incomingOrders.find(o => o.pipeline_stage_id)?.pipeline_stage_id || null
        if (stageIdFromOrders) {
          const pipelineWithStage = nextPipelines.find(p => p.stages?.some(s => s.id === stageIdFromOrders))
          if (pipelineWithStage) return pipelineWithStage
        }

        // Пробуем выбрать дефолтную воронку для профиля, где есть сделки
        const profileIdFromOrders = incomingOrders.find(o => o.profile_id)?.profile_id || null
        if (profileIdFromOrders) {
          const defaultForProfile = nextPipelines.find(p => p.profile_id === profileIdFromOrders && p.is_default)
          if (defaultForProfile) return defaultForProfile
          const anyForProfile = nextPipelines.find(p => p.profile_id === profileIdFromOrders)
          if (anyForProfile) return anyForProfile
        }

        const anyDefault = nextPipelines.find(p => p.is_default) || null
        return anyDefault || nextPipelines[0]
      })
    } catch (error: unknown) {
      console.error('Load data error:', error)
      const message = error instanceof Error ? error.message : 'Не удалось загрузить данные'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const orderId = String(active.id)
    const newStageId = String(over.id)

    // Оптимистичное обновление
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, pipeline_stage_id: newStageId }
        : order
    ))

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_stage_id: newStageId }),
      })

      if (!response.ok) throw new Error('Failed to update order')

      toast.success('Сделка перемещена')
    } catch (error) {
      console.error('Update order error:', error)
      toast.error('Не удалось переместить сделку')
      loadData()
    } finally {
      setActiveId(null)
    }
  }

  // ✅ Режим "одна воронка на пользователя":
  // Показываем сделки по ВСЕМ профилям в одной доске,
  // а принадлежность к профилю — бейджем на карточке.
  //
  // Сделки из "других" воронок отображаем в правильных колонках по system_status/order.status.
  // При первом перемещении/смене этапа они автоматически "переезжают" в выбранную воронку
  // (т.к. мы сохраняем pipeline_stage_id выбранной воронки).
  const stageIdSet = useMemo(() => {
    return new Set((selectedPipeline?.stages || []).map((s) => s.id))
  }, [selectedPipeline])

  const stageIdBySystemStatus = useMemo(() => {
    const map: Record<string, string> = {}
    for (const stage of selectedPipeline?.stages || []) {
      if (stage.system_status) {
        map[stage.system_status] = stage.id
      }
    }
    return map
  }, [selectedPipeline])

  const fallbackStageId = useMemo(() => {
    if (!selectedPipeline) return null
    // В приоритете: "Входящие" -> первый кастомный этап -> первый этап
    const incoming = selectedPipeline.stages.find(s => s.system_status === 'pending' || (s.is_system && s.position === 0))
    if (incoming) return incoming.id
    const firstCustom = selectedPipeline.stages.find(s => !s.is_system && s.position > 0 && s.position < 50)
    return (firstCustom || selectedPipeline.stages[0] || null)?.id ?? null
  }, [selectedPipeline])

  const getEffectiveStageId = (order: Order) => {
    // 1) Уже в выбранной воронке — оставляем как есть
    if (order.pipeline_stage_id && stageIdSet.has(order.pipeline_stage_id)) {
      return order.pipeline_stage_id
    }

    // 2) Пытаемся сопоставить по system_status этапа (если заказ пришёл из другой воронки)
    const systemStatus = order.pipeline_stage?.system_status || null
    if (systemStatus && stageIdBySystemStatus[systemStatus]) {
      return stageIdBySystemStatus[systemStatus]
    }

    // 3) Пытаемся сопоставить по order.status
    const status = order.status
    if (status && stageIdBySystemStatus[status]) {
      return stageIdBySystemStatus[status]
    }

    // 4) Легаси без этапа — считаем входящими
    if (!order.pipeline_stage_id && stageIdBySystemStatus.pending) {
      return stageIdBySystemStatus.pending
    }

    return fallbackStageId
  }

  const ordersInSelectedPipeline = useMemo(() => {
    if (!selectedPipeline) return []
    // В одной доске показываем все сделки, вычисляя "виртуальный" этап для отображения.
    return orders
  }, [orders, selectedPipeline])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredOrders = ordersInSelectedPipeline.filter((order) => {
    if (!normalizedSearch) return true
    const haystack = [
      order.order_number,
      order.title,
      order.client_name,
      order.client_phone,
      order.profile?.display_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch)
  })

  const getOrdersByStage = (stage: PipelineStage) => {
    return filteredOrders.filter(order => getEffectiveStageId(order) === stage.id)
  }

  const getStageColor = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'bg-orange-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      gray: 'bg-gray-500',
    }
    return colors[color] || 'bg-gray-500'
  }

  // Блокировки (важно: после всех хуков)
  if (!authLoading && crmAccessLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (!authLoading && isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CRM для исполнителей</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Раздел CRM доступен только для исполнителей услуг.
        </p>
        <Button onClick={() => router.push('/dashboard')} className="bg-orange-500 hover:bg-orange-600 rounded-full">
          Вернуться на главную
        </Button>
      </div>
    )
  }

  if (!authLoading && hasCrmAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CRM доступна по подписке</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Без CRM вы всё равно можете работать с заявками: переписка, материалы и статусы доступны в разделе заявок.
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/orders')} variant="outline" className="rounded-full">
            Перейти к заявкам
          </Button>
          <Button onClick={() => router.push('/pricing')} className="bg-orange-500 hover:bg-orange-600 rounded-full">
            Подключить CRM
          </Button>
        </div>
      </div>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (!selectedPipeline) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Создайте профиль сервиса
          </h2>
          <p className="text-gray-600 mb-6">
            Для работы с CRM необходимо создать профиль вашего сервиса
          </p>
          <Button onClick={() => router.push('/settings')} size="lg">
            Перейти в настройки
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-600 mt-1">
            {filteredOrders.length} сделок
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Поиск */}
          <div className="hidden md:block w-[260px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: клиент, телефон, №, название…"
            />
          </div>

          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Канбан
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                Список
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" onClick={loadData}>
            Обновить
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/pipelines')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {selectedPipeline.stages
              .sort((a, b) => a.position - b.position)
              .map((stage) => {
                const stageOrders = getOrdersByStage(stage)
                
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    orders={stageOrders}
                    colorClass={getStageColor(stage.color)}
                    activeId={activeId}
                    cardSettings={selectedPipeline?.card_settings}
                    onOrderClick={(order) => {
                      setSelectedOrder(order)
                      setIsModalOpen(true)
                    }}
                  />
                )
              })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="opacity-50">
                <OrderCard 
                  order={orders.find(o => o.id === activeId)!} 
                  isDragging 
                  onClick={() => {}}
                  cardSettings={selectedPipeline?.card_settings}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {selectedPipeline.stages
            .sort((a, b) => a.position - b.position)
            .map((stage) => {
              const stageOrders = getOrdersByStage(stage)
              
              return (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', getStageColor(stage.color))} />
                    <h3 className="font-bold text-gray-900">{stage.name}</h3>
                    <Badge variant="secondary">{stageOrders.length}</Badge>
                  </div>
                  
                  {stageOrders.length > 0 ? (
                    <div className="space-y-2">
                      {stageOrders.map(order => (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          compact 
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsModalOpen(true)
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 pl-5">Нет сделок</p>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* Модальное окно с деталями сделки */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          availableStages={selectedPipeline?.stages || []}
          pipelines={pipelines}
          selectedPipelineId={selectedPipeline.id}
          onClose={() => {
            console.log('🔄 Modal closing...')
            const orderId = selectedOrder.id
            
            // Сначала закрываем модалку и сбрасываем selectedOrder
            setIsModalOpen(false)
            setSelectedOrder(null)
            
            // Загружаем актуальные данные ПОСЛЕ закрытия (асинхронно, без await)
            fetch(`/api/orders/${orderId}`)
              .then(response => {
                if (response.ok) {
                  return response.json()
                }
                throw new Error('Failed to reload')
              })
              .then(data => {
                console.log('✅ Order reloaded:', data.order.title || orderId, 'items:', data.order.items?.length)
                // Обновляем в списке orders для отображения в канбане/списке
                setOrders(prevOrders => 
                  prevOrders.map(o => o.id === data.order.id ? data.order : o)
                )
              })
              .catch(error => {
                console.error('Failed to reload order:', error)
              })
          }}
          onUpdate={() => {
            // onUpdate оставляем пустым, т.к. обновление происходит при закрытии
          }}
        />
      )}
    </div>
  )
}

// Компонент колонки канбана
function KanbanColumn({ 
  stage, 
  orders, 
  colorClass,
  activeId,
  cardSettings,
  onOrderClick
}: { 
  stage: PipelineStage
  orders: Order[]
  colorClass: string
  activeId: string | null
  cardSettings?: Record<string, unknown>
  onOrderClick?: (order: Order) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4 border-2',
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn('w-3 h-3 rounded-full', colorClass)} />
        <h3 className="font-bold text-gray-900">{stage.name}</h3>
        {stage.is_system && (
          <Badge variant="secondary" className="text-xs ml-auto">
            Системный
          </Badge>
        )}
        {!stage.is_system && (
          <Badge variant="secondary" className="ml-auto">
            {orders.length}
          </Badge>
        )}
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {orders.map((order) => (
          <DraggableOrderCard 
            key={order.id} 
            order={order} 
            isDragging={order.id === activeId}
            cardSettings={cardSettings}
            onClick={() => onOrderClick?.(order)}
          />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            Перетащите сюда
          </div>
        )}
      </div>
    </div>
  )
}

// Компонент перетаскиваемой карточки
function DraggableOrderCard({ order, isDragging, cardSettings, onClick }: { order: Order; isDragging: boolean; cardSettings?: Record<string, unknown>; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: order.id })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <OrderCard order={order} cardSettings={cardSettings} onClick={onClick} />
    </div>
  )
}

// Компонент карточки сделки
function OrderCard({ order, isDragging = false, compact = false, onClick, cardSettings }: { 
  order: Order; 
  isDragging?: boolean; 
  compact?: boolean; 
  onClick?: () => void;
  cardSettings?: {
    showTitle?: boolean
    showClientName?: boolean
    showProfileName?: boolean
    showDate?: boolean
    showTime?: boolean
    showAmount?: boolean
    showItemsCount?: boolean
    amountSize?: 'small' | 'medium' | 'large'
    dateFormat?: 'short' | 'long'
    fieldOrder?: string[]
    titleSize?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg'
    titleWeight?: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold'
    clientNameSize?: 'text-xs' | 'text-sm' | 'text-base'
    clientNameWeight?: 'font-normal' | 'font-medium' | 'font-semibold'
    dateSize?: 'text-xs' | 'text-sm'
    cardPadding?: 'compact' | 'normal' | 'spacious'
    cardBorderRadius?: string
  }
}) {
  // Упрощаем время - убираем секунды
  const formatTime = (time: string) => {
    return time?.split(':').slice(0, 2).join(':') || ''
  }

  // Размер суммы
  const getAmountClass = () => {
    switch (cardSettings?.amountSize) {
      case 'large':
        return 'text-lg font-bold text-blue-600'
      case 'medium':
        return 'text-base font-semibold text-gray-600'
      case 'small':
      default:
        return 'text-sm font-medium text-gray-400'
    }
  }

  // Формат даты
  const formatDate = (date: Date) => {
    if (cardSettings?.dateFormat === 'long') {
      return format(date, 'dd MMMM yyyy', { locale: ru })
    }
    return format(date, 'dd MMM', { locale: ru })
  }

  // Стили для заголовка
  const getTitleClass = () => {
    const size = cardSettings?.titleSize ?? 'text-sm'
    const weight = cardSettings?.titleWeight ?? 'font-semibold'
    return `${size} ${weight} text-gray-900 line-clamp-1`
  }

  // Стили для имени клиента
  const getClientNameClass = () => {
    const size = cardSettings?.clientNameSize ?? 'text-sm'
    const weight = cardSettings?.clientNameWeight ?? 'font-normal'
    return `${size} ${weight} text-gray-700`
  }

  // Стили для даты
  const getDateClass = () => {
    const size = cardSettings?.dateSize ?? 'text-xs'
    return `${size} text-gray-500`
  }

  // Стили для карточки
  const getPaddingClass = () => {
    switch (cardSettings?.cardPadding) {
      case 'compact':
        return 'p-2'
      case 'spacious':
        return 'p-4'
      case 'normal':
      default:
        return 'p-3'
    }
  }

  const getBorderRadiusClass = () => {
    return cardSettings?.cardBorderRadius ?? 'rounded-lg'
  }

  return (
    <Card 
      className={cn(
        `${getBorderRadiusClass()} ${getPaddingClass()} hover:shadow-md transition-shadow cursor-pointer bg-white`,
        isDragging && 'rotate-2',
        compact && 'flex items-center justify-between'
      )}
      onClick={onClick}
    >
      {compact ? (
        <>
          <div className="flex flex-col gap-1 flex-1">
            <span className="font-semibold text-gray-900 text-sm">
              {order.client_name}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(order.event_date), 'dd MMM', { locale: ru })} • {formatTime(order.event_time)}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {order.total_amount.toLocaleString()} ₽
          </span>
        </>
      ) : (
        <div>
          {/* Первая строка: Название профиля в правом верхнем углу */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              {/* Рендерим основную информацию слева (title теперь содержит номер, если не задано custom) */}
              {(cardSettings?.fieldOrder || ['title', 'clientName', 'profileName', 'date', 'time', 'amount', 'itemsCount'])
                .filter((fieldId: string) => fieldId !== 'profileName')
                .map((fieldId: string) => {
                  switch (fieldId) {
                    case 'title':
                      return (cardSettings?.showTitle ?? true) && order.title ? (
                        <div key="title" className={getTitleClass()}>
                          {order.title}
                        </div>
                      ) : null

                    case 'clientName':
                      return (cardSettings?.showClientName ?? true) ? (
                        <div key="clientName" className={getClientNameClass()}>
                          {order.client_name}
                        </div>
                      ) : null

                    case 'date':
                      return (cardSettings?.showDate ?? true) ? (
                        <div key="date" className={getDateClass()}>
                          {formatDate(new Date(order.event_date))}
                          {(cardSettings?.showTime ?? true) && ' • ' + formatTime(order.event_time)}
                        </div>
                      ) : null

                    case 'time':
                      return null

                    case 'amount':
                      return (cardSettings?.showAmount ?? true) ? (
                        <div key="amount" className={getAmountClass()}>
                          {order.total_amount.toLocaleString()} ₽
                        </div>
                      ) : null

                    case 'itemsCount':
                      return (cardSettings?.showItemsCount ?? true) && order.items && order.items.length > 0 ? (
                        <div key="itemsCount" className="text-xs text-gray-400">
                          {order.items.length} {order.items.length === 1 ? 'услуга' : order.items.length < 5 ? 'услуги' : 'услуг'}
                        </div>
                      ) : null

                    default:
                      return null
                  }
              })}
            </div>
            
            {/* Название профиля справа */}
            {(cardSettings?.showProfileName ?? true) && order.profile && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap shrink-0">
                {order.profile.display_name}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

