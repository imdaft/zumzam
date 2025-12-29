/**
 * Канбан-доска для управления заявками
 * Перетаскивание между этапами воронки
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Loader2, Calendar, Clock, User, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/contexts/auth-context'
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
}

interface Pipeline {
  id: string
  name: string
  stages: PipelineStage[]
}

interface Order {
  id: string
  client_name: string
  client_phone: string
  event_date: string
  event_time: string
  total_amount: number
  status: string
  pipeline_stage_id: string | null
  created_at: string
  items: any[]
}

export default function KanbanPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

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
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Загружаем воронки
      const pipelinesResponse = await fetch('/api/pipelines')
      if (!pipelinesResponse.ok) throw new Error('Failed to load pipelines')
      const pipelinesData = await pipelinesResponse.json()
      
      setPipelines(pipelinesData.pipelines || [])
      
      // Выбираем первую воронку
      if (pipelinesData.pipelines && pipelinesData.pipelines.length > 0) {
        setSelectedPipeline(pipelinesData.pipelines[0])
      }

      // Загружаем заявки
      const ordersResponse = await fetch('/api/orders?role=provider')
      if (!ordersResponse.ok) throw new Error('Failed to load orders')
      const ordersData = await ordersResponse.json()
      
      setOrders(ordersData.orders || [])
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const orderId = active.id
    const newStageId = over.id

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

      toast.success('Заявка перемещена')
    } catch (error) {
      console.error('Update order error:', error)
      toast.error('Не удалось переместить заявку')
      // Откатываем изменения
      loadData()
    } finally {
      setActiveId(null)
    }
  }

  const getOrdersByStage = (stageId: string) => {
    return orders.filter(order => order.pipeline_stage_id === stageId)
  }

  const getOrdersWithoutStage = () => {
    return orders.filter(order => !order.pipeline_stage_id)
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
    }
    return colors[color] || 'bg-gray-500'
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
        <p className="text-gray-500 mb-4">Нет доступных воронок</p>
        <Button onClick={() => router.push('/pipelines')}>
          Создать воронку
        </Button>
      </div>
    )
  }

  // Отфильтровываем только этапы до 100 (без системных "Успешно" и "Не реализовано")
  const activeStages = selectedPipeline.stages.filter(stage => stage.position < 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Канбан-доска</h1>
          <p className="text-gray-600 mt-1">
            {selectedPipeline.name} • {orders.length} заявок
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pipelines.length > 1 && (
            <select
              value={selectedPipeline.id}
              onChange={(e) => {
                const pipeline = pipelines.find(p => p.id === e.target.value)
                if (pipeline) setSelectedPipeline(pipeline)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" onClick={loadData}>
            Обновить
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {activeStages.map((stage) => {
            const stageOrders = getOrdersByStage(stage.id)
            
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                orders={stageOrders}
                colorClass={getStageColor(stage.color)}
                activeId={activeId}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              <OrderCard order={orders.find(o => o.id === activeId)!} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// Компонент колонки
function KanbanColumn({ 
  stage, 
  orders, 
  colorClass,
  activeId 
}: { 
  stage: PipelineStage
  orders: Order[]
  colorClass: string
  activeId: string | null
}) {
  const { useDroppable } = require('@dnd-kit/core')
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
        <Badge variant="secondary" className="ml-auto">
          {orders.length}
        </Badge>
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {orders.map((order) => (
          <DraggableOrderCard key={order.id} order={order} isDragging={order.id === activeId} />
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
function DraggableOrderCard({ order, isDragging }: { order: Order; isDragging: boolean }) {
  const { useDraggable } = require('@dnd-kit/core')
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
      <OrderCard order={order} />
    </div>
  )
}

// Компонент карточки заявки
function OrderCard({ order, isDragging = false }: { order: Order; isDragging?: boolean }) {
  return (
    <Card className={cn(
      'p-4 hover:shadow-md transition-shadow',
      isDragging && 'rotate-2'
    )}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-900 text-sm">
              {order.client_name}
            </span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {order.total_amount.toLocaleString()} ₽
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(order.event_date), 'dd MMM', { locale: ru })}</span>
          <Clock className="w-3 h-3 ml-2" />
          <span>{order.event_time}</span>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="text-xs text-gray-500">
            {order.items.length} {order.items.length === 1 ? 'услуга' : 'услуг'}
          </div>
        )}
      </div>
    </Card>
  )
}


