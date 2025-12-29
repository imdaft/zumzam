/**
 * Страница управления воронками продаж
 * Только для сервисов (провайдеров)
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/contexts/auth-context'
import { useFeatureAccess } from '@/components/shared/feature-gate'
import { toast } from 'sonner'

interface PipelineStage {
  id: string
  name: string
  color: string
  position: number
  is_system: boolean
  system_status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | null
}

interface CardField {
  id: string
  label: string
  key: keyof Omit<CardSettings, 'amountSize' | 'dateFormat' | 'fieldOrder'>
  visible: boolean
}

interface CardSettings {
  showTitle: boolean
  showClientName: boolean
  showProfileName: boolean
  showDate: boolean
  showTime: boolean
  showAmount: boolean
  showItemsCount: boolean
  amountSize: 'small' | 'medium' | 'large'
  dateFormat: 'short' | 'long'
  fieldOrder?: string[]
  // Новые настройки
  titleSize?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg'
  titleWeight?: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold'
  clientNameSize?: 'text-xs' | 'text-sm' | 'text-base'
  clientNameWeight?: 'font-normal' | 'font-medium' | 'font-semibold'
  dateSize?: 'text-xs' | 'text-sm'
  cardPadding?: 'compact' | 'normal' | 'spacious'
  cardBorderRadius?: 'square' | 'rounded' | 'rounded-lg'
}

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
  stages: PipelineStage[]
  card_settings?: CardSettings
}

const STAGE_COLORS = [
  { value: 'orange', label: 'Оранжевый', class: 'bg-orange-500' },
  { value: 'blue', label: 'Синий', class: 'bg-blue-500' },
  { value: 'purple', label: 'Фиолетовый', class: 'bg-purple-500' },
  { value: 'green', label: 'Зелёный', class: 'bg-green-500' },
  { value: 'red', label: 'Красный', class: 'bg-red-500' },
  { value: 'yellow', label: 'Жёлтый', class: 'bg-yellow-500' },
  { value: 'pink', label: 'Розовый', class: 'bg-pink-500' },
  { value: 'indigo', label: 'Индиго', class: 'bg-indigo-500' },
  { value: 'gray', label: 'Серый', class: 'bg-gray-500' },
]

// Компонент предпросмотра карточки
function CardPreview({ cardSettings }: { cardSettings?: CardSettings }) {
  const mockOrder = {
    order_number: 42,
    title: 'Сделка #42', // Дефолтное название
    client_name: 'Иван Петров',
    profile: { display_name: 'Kids Point' },
    event_date: new Date().toISOString(),
    event_time: '15:00:00',
    total_amount: 15000,
    items: [{}, {}, {}] // 3 услуги
  }

  // Применяем настройки
  const getTitleClass = () => {
    const size = cardSettings?.titleSize ?? 'text-sm'
    const weight = cardSettings?.titleWeight ?? 'font-semibold'
    return `${size} ${weight} text-gray-900 line-clamp-1`
  }

  const getClientNameClass = () => {
    const size = cardSettings?.clientNameSize ?? 'text-sm'
    const weight = cardSettings?.clientNameWeight ?? 'font-normal'
    return `${size} ${weight} text-gray-700`
  }

  const getDateClass = () => {
    const size = cardSettings?.dateSize ?? 'text-xs'
    return `${size} text-gray-500`
  }

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

  const formatDate = (date: Date) => {
    if (cardSettings?.dateFormat === 'long') {
      return format(date, 'dd MMMM yyyy', { locale: ru })
    }
    return format(date, 'dd MMM', { locale: ru })
  }

  const formatTime = (time: string) => {
    return time?.split(':').slice(0, 2).join(':') || ''
  }

  const fieldOrder = cardSettings?.fieldOrder || ['title', 'clientName', 'profileName', 'date', 'time', 'amount', 'itemsCount']

  return (
    <div className={`bg-white border border-gray-200 ${getBorderRadiusClass()} ${getPaddingClass()} shadow-sm`}>
      {/* Первая строка: Название профиля в правом верхнем углу */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {/* Основная информация слева (title содержит номер, если не задано custom) */}
          {fieldOrder
            .filter(fieldId => fieldId !== 'profileName')
            .map((fieldId) => {
              switch (fieldId) {
                case 'title':
                  return (cardSettings?.showTitle ?? true) && mockOrder.title ? (
                    <div key="title" className={getTitleClass()}>
                      {mockOrder.title}
                    </div>
                  ) : null

                case 'clientName':
                  return (cardSettings?.showClientName ?? true) ? (
                    <div key="clientName" className={getClientNameClass()}>
                      {mockOrder.client_name}
                    </div>
                  ) : null

                case 'date':
                  return (cardSettings?.showDate ?? true) ? (
                    <div key="date" className={getDateClass()}>
                      {formatDate(new Date(mockOrder.event_date))}
                      {(cardSettings?.showTime ?? true) && ' • ' + formatTime(mockOrder.event_time)}
                    </div>
                  ) : null

                case 'time':
                  return null

                case 'amount':
                  return (cardSettings?.showAmount ?? true) ? (
                    <div key="amount" className={getAmountClass()}>
                      {mockOrder.total_amount.toLocaleString()} ₽
                    </div>
                  ) : null

                case 'itemsCount':
                  return (cardSettings?.showItemsCount ?? true) && mockOrder.items.length > 0 ? (
                    <div key="itemsCount" className="text-xs text-gray-400">
                      {mockOrder.items.length} услуги
                    </div>
                  ) : null

                default:
                  return null
              }
          })}
        </div>

        {/* Название профиля справа */}
        {(cardSettings?.showProfileName ?? true) && mockOrder.profile && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap shrink-0">
            {mockOrder.profile.display_name}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Компонент для управления порядком полей карточки
function CardFieldsManager({ 
  pipelineId, 
  cardSettings,
  onUpdate
}: {
  pipelineId: string
  cardSettings?: CardSettings
  onUpdate: (settings: CardSettings) => void
}) {
  const defaultFields = [
    { id: 'title', label: 'Название сделки', key: 'showTitle' as const },
    { id: 'clientName', label: 'Имя клиента', key: 'showClientName' as const },
    { id: 'profileName', label: 'Название профиля', key: 'showProfileName' as const },
    { id: 'date', label: 'Дата мероприятия', key: 'showDate' as const },
    { id: 'time', label: 'Время', key: 'showTime' as const },
    { id: 'amount', label: 'Сумма заказа', key: 'showAmount' as const },
    { id: 'itemsCount', label: 'Количество услуг', key: 'showItemsCount' as const },
  ]

  // Получаем порядок полей из настроек или используем дефолтный
  const fieldOrder = cardSettings?.fieldOrder || defaultFields.map(f => f.id)
  const orderedFields = fieldOrder.map(id => defaultFields.find(f => f.id === id)!).filter(Boolean)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = orderedFields.findIndex(f => f.id === active.id)
    const newIndex = orderedFields.findIndex(f => f.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(orderedFields, oldIndex, newIndex)
    const newOrder = reordered.map(f => f.id)

    const updatedSettings = {
      ...(cardSettings || {}),
      fieldOrder: newOrder
    } as CardSettings

    // Сохраняем на сервере
    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_settings: updatedSettings }),
      })

      if (!response.ok) throw new Error('Failed to update field order')

      onUpdate(updatedSettings)
      toast.success('Порядок полей обновлен')
    } catch (error) {
      console.error('Update field order error:', error)
      toast.error('Не удалось обновить порядок')
    }
  }

  const toggleField = async (fieldKey: keyof Omit<CardSettings, 'amountSize' | 'dateFormat' | 'fieldOrder'>) => {
    const updatedSettings = {
      ...(cardSettings || {}),
      [fieldKey]: !(cardSettings?.[fieldKey] ?? true)
    } as CardSettings

    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_settings: updatedSettings }),
      })

      if (!response.ok) throw new Error('Failed to update field')

      onUpdate(updatedSettings)
      toast.success('Настройки обновлены')
    } catch (error) {
      console.error('Toggle field error:', error)
      toast.error('Не удалось обновить настройку')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={orderedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {orderedFields.map((field) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              isChecked={cardSettings?.[field.key] ?? true}
              onToggle={() => toggleField(field.key)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

// Компонент перетаскиваемого поля
function SortableFieldItem({ 
  field, 
  isChecked, 
  onToggle 
}: { 
  field: { id: string; label: string }
  isChecked: boolean
  onToggle: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        suppressHydrationWarning
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300"
      />
      <span className="text-sm flex-1">{field.label}</span>
    </div>
  )
}

// Компонент сортируемого этапа
function SortableStageItem({ stage, getColorClass, onEdit, onDelete }: {
  stage: PipelineStage
  getColorClass: (color: string) => string
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      {!stage.is_system && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className={`w-3 h-3 rounded-full ${getColorClass(stage.color)}`} />
      <span className="flex-1 font-medium text-gray-900">{stage.name}</span>
      {stage.is_system ? (
        <Badge variant="secondary" className="text-xs">Системный</Badge>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function PipelinesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { hasAccess: hasCrmAccess, isLoading: crmAccessLoading } = useFeatureAccess('crm')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false)
  const [isCreatingStage, setIsCreatingStage] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [newPipelineDescription, setNewPipelineDescription] = useState('')
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('blue')
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadPipelines()
    }
  }, [user])

  const loadPipelines = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/pipelines')
      if (!response.ok) throw new Error('Failed to load pipelines')
      const data = await response.json()
      setPipelines(data.pipelines || [])
    } catch (error) {
      console.error('Load pipelines error:', error)
      toast.error('Не удалось загрузить воронки')
    } finally {
      setIsLoading(false)
    }
  }

  const createPipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error('Введите название воронки')
      return
    }

    try {
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPipelineName.trim(),
          description: newPipelineDescription.trim() || null
        }),
      })

      if (!response.ok) throw new Error('Failed to create pipeline')

      toast.success('Воронка создана')
      setIsCreatingPipeline(false)
      setNewPipelineName('')
      setNewPipelineDescription('')
      loadPipelines()
    } catch (error) {
      console.error('Create pipeline error:', error)
      toast.error('Не удалось создать воронку')
    }
  }

  const deletePipeline = async (id: string) => {
    if (!confirm('Удалить воронку? Все этапы будут удалены.')) return

    try {
      const response = await fetch(`/api/pipelines/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      toast.success('Воронка удалена')
      loadPipelines()
    } catch (error: any) {
      console.error('Delete pipeline error:', error)
      toast.error(error.message || 'Не удалось удалить воронку')
    }
  }

  const createStage = async () => {
    if (!newStageName.trim() || !selectedPipeline) {
      toast.error('Заполните все поля')
      return
    }

    try {
      const response = await fetch(`/api/pipelines/${selectedPipeline}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName.trim(),
          color: newStageColor
        }),
      })

      if (!response.ok) throw new Error('Failed to create stage')

      toast.success('Этап добавлен')
      setIsCreatingStage(false)
      setNewStageName('')
      setNewStageColor('blue')
      setSelectedPipeline(null)
      loadPipelines()
    } catch (error) {
      console.error('Create stage error:', error)
      toast.error('Не удалось создать этап')
    }
  }

  const updateStage = async (stageId: string, updates: Partial<PipelineStage>) => {
    try {
      const response = await fetch(`/api/pipelines/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update stage')

      toast.success('Этап обновлён')
      loadPipelines()
    } catch (error: any) {
      console.error('Update stage error:', error)
      toast.error(error.message || 'Не удалось обновить этап')
    }
  }

  const deleteStage = async (stageId: string) => {
    if (!confirm('Удалить этап?')) return

    try {
      const response = await fetch(`/api/pipelines/stages/${stageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      toast.success('Этап удалён')
      loadPipelines()
    } catch (error: any) {
      console.error('Delete stage error:', error)
      toast.error(error.message || 'Не удалось удалить этап')
    }
  }

  const getColorClass = (color: string) => {
    const colorConfig = STAGE_COLORS.find(c => c.value === color)
    return colorConfig?.class || 'bg-gray-500'
  }

  // Обновление настроек карточки
  const updateCardSetting = async (pipelineId: string, key: string, value: any) => {
    try {
      const pipeline = pipelines.find(p => p.id === pipelineId)
      if (!pipeline) return

      const updatedSettings = {
        ...(pipeline.card_settings || {}),
        [key]: value
      }

      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_settings: updatedSettings }),
      })

      if (!response.ok) throw new Error('Failed to update card settings')

      // Обновляем локальное состояние
      setPipelines(pipelines.map(p =>
        p.id === pipelineId
          ? { ...p, card_settings: updatedSettings }
          : p
      ))

      toast.success('Настройки карточки обновлены')
    } catch (error) {
      console.error('Update card settings error:', error)
      toast.error('Не удалось обновить настройки')
    }
  }

  // Сортировка этапов с drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent, pipelineId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const pipeline = pipelines.find(p => p.id === pipelineId)
    if (!pipeline) return

    // Фильтруем только кастомные этапы (между "Входящие" и "Забронировано")
    const customStages = pipeline.stages.filter(s => !s.is_system && s.position > 0 && s.position < 50)
    const oldIndex = customStages.findIndex(s => s.id === active.id)
    const newIndex = customStages.findIndex(s => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedStages = arrayMove(customStages, oldIndex, newIndex)
    
    // Обновляем позиции (равномерно распределяем между 1 и 49)
    const positionStep = 48 / (reorderedStages.length + 1)
    for (let i = 0; i < reorderedStages.length; i++) {
      const newPosition = Math.floor(1 + (i + 1) * positionStep)
      if (reorderedStages[i].position !== newPosition) {
        await updateStage(reorderedStages[i].id, { position: newPosition })
      }
    }

    loadPipelines()
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (crmAccessLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    )
  }

  if (hasCrmAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Настройки CRM недоступны</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Управление воронками доступно на тарифах с CRM. Без CRM вы можете работать с заявками и их статусами в разделе заявок.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/crm')}
            className="hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Воронки продаж</h1>
            <p className="text-gray-600 mt-1">
              Настройте этапы работы со сделками
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreatingPipeline(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать воронку
        </Button>
      </div>

      {/* Pipelines */}
      {pipelines.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">Нет воронок</p>
          <Button onClick={() => setIsCreatingPipeline(true)}>
            Создать первую воронку
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {pipeline.name}
                    </h3>
                    {pipeline.is_default && (
                      <Badge variant="secondary">По умолчанию</Badge>
                    )}
                  </div>
                  {pipeline.description && (
                    <p className="text-sm text-gray-600">{pipeline.description}</p>
                  )}
                </div>
                {!pipeline.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePipeline(pipeline.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>

              {/* Stages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Этапы ({pipeline.stages.length})
                  </span>
                  {/* Кнопка добавления этапа отображается только для кастомных этапов */}
                  {pipeline.stages.some(s => s.system_status === 'pending') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPipeline(pipeline.id)
                        setIsCreatingStage(true)
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить этап
                    </Button>
                  )}
                </div>
                
                {/* Этапы воронки */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Этапы воронки</h3>
                </div>
                <div className="grid gap-2">
                  {/* "Входящие" */}
                  {pipeline.stages.filter(s => s.system_status === 'pending').map(stage => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      getColorClass={getColorClass}
                      onEdit={() => setEditingStage(stage)}
                      onDelete={() => deleteStage(stage.id)}
                    />
                  ))}
                  
                  {/* Кастомные этапы (с DnD) */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, pipeline.id)}
                  >
                    <SortableContext
                      items={pipeline.stages.filter(s => !s.is_system && s.position > 0 && s.position < 50).map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pipeline.stages
                        .filter(s => !s.is_system && s.position > 0 && s.position < 50)
                        .map(stage => (
                          <SortableStageItem
                            key={stage.id}
                            stage={stage}
                            getColorClass={getColorClass}
                            onEdit={() => setEditingStage(stage)}
                            onDelete={() => deleteStage(stage.id)}
                          />
                        ))}
                    </SortableContext>
                  </DndContext>

                  {/* "Забронировано" */}
                  {pipeline.stages.filter(s => s.system_status === 'confirmed').map(stage => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      getColorClass={getColorClass}
                      onEdit={() => setEditingStage(stage)}
                      onDelete={() => deleteStage(stage.id)}
                    />
                  ))}

                  {/* "В работе" */}
                  {pipeline.stages.filter(s => s.system_status === 'in_progress').map(stage => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      getColorClass={getColorClass}
                      onEdit={() => setEditingStage(stage)}
                      onDelete={() => deleteStage(stage.id)}
                    />
                  ))}

                  {/* "Завершено", "Отменено", "Отклонено" */}
                  {pipeline.stages.filter(s => s.system_status === 'completed' || s.system_status === 'cancelled' || s.system_status === 'rejected').map(stage => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      getColorClass={getColorClass}
                      onEdit={() => setEditingStage(stage)}
                      onDelete={() => deleteStage(stage.id)}
                    />
                  ))}
                </div>

                {/* Настройки внешнего вида карточки - ПОСЛЕ этапов */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Настройки карточки на Канбане</h3>
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Левая колонка: Видимость полей */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Отображать на карточке (перетащите для изменения порядка):</Label>
                      <CardFieldsManager 
                        pipelineId={pipeline.id}
                        cardSettings={pipeline.card_settings}
                        onUpdate={(settings) => {
                          setPipelines(pipelines.map(p =>
                            p.id === pipeline.id
                              ? { ...p, card_settings: settings }
                              : p
                          ))
                        }}
                      />
                    </div>

                    {/* Средняя колонка: Настройки стиля */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Название сделки</Label>
                        <div className="space-y-2">
                          <Select
                            value={pipeline.card_settings?.titleSize ?? 'text-sm'}
                            onValueChange={(value) => updateCardSetting(pipeline.id, 'titleSize', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Размер" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-xs">Очень маленький</SelectItem>
                              <SelectItem value="text-sm">Маленький</SelectItem>
                              <SelectItem value="text-base">Средний</SelectItem>
                              <SelectItem value="text-lg">Большой</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={pipeline.card_settings?.titleWeight ?? 'font-semibold'}
                            onValueChange={(value) => updateCardSetting(pipeline.id, 'titleWeight', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Жирность" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="font-normal">Обычный</SelectItem>
                              <SelectItem value="font-medium">Средний</SelectItem>
                              <SelectItem value="font-semibold">Полужирный</SelectItem>
                              <SelectItem value="font-bold">Жирный</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Имя клиента</Label>
                        <div className="space-y-2">
                          <Select
                            value={pipeline.card_settings?.clientNameSize ?? 'text-sm'}
                            onValueChange={(value) => updateCardSetting(pipeline.id, 'clientNameSize', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Размер" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-xs">Маленький</SelectItem>
                              <SelectItem value="text-sm">Средний</SelectItem>
                              <SelectItem value="text-base">Большой</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={pipeline.card_settings?.clientNameWeight ?? 'font-normal'}
                            onValueChange={(value) => updateCardSetting(pipeline.id, 'clientNameWeight', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Жирность" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="font-normal">Обычный</SelectItem>
                              <SelectItem value="font-medium">Средний</SelectItem>
                              <SelectItem value="font-semibold">Полужирный</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Размер даты</Label>
                        <Select
                          value={pipeline.card_settings?.dateSize ?? 'text-xs'}
                          onValueChange={(value) => updateCardSetting(pipeline.id, 'dateSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-xs">Маленький</SelectItem>
                            <SelectItem value="text-sm">Средний</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Размер суммы</Label>
                        <Select
                          value={pipeline.card_settings?.amountSize ?? 'small'}
                          onValueChange={(value) => updateCardSetting(pipeline.id, 'amountSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Маленький (менее заметный)</SelectItem>
                            <SelectItem value="medium">Средний</SelectItem>
                            <SelectItem value="large">Большой (акцент)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Формат даты</Label>
                        <Select
                          value={pipeline.card_settings?.dateFormat ?? 'short'}
                          onValueChange={(value) => updateCardSetting(pipeline.id, 'dateFormat', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">Короткий (30 нояб.)</SelectItem>
                            <SelectItem value="long">Полный (30 ноября 2024)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Отступы</Label>
                        <Select
                          value={pipeline.card_settings?.cardPadding ?? 'normal'}
                          onValueChange={(value) => updateCardSetting(pipeline.id, 'cardPadding', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Компактные</SelectItem>
                            <SelectItem value="normal">Обычные</SelectItem>
                            <SelectItem value="spacious">Просторные</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Скругление углов</Label>
                        <Select
                          value={pipeline.card_settings?.cardBorderRadius ?? 'rounded-lg'}
                          onValueChange={(value) => updateCardSetting(pipeline.id, 'cardBorderRadius', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square">Квадратные</SelectItem>
                            <SelectItem value="rounded">Слегка скругленные</SelectItem>
                            <SelectItem value="rounded-lg">Скругленные</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Правая колонка: Live Preview */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Предпросмотр карточки:</Label>
                      <CardPreview cardSettings={pipeline.card_settings} />
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Pipeline Dialog */}
      <Dialog open={isCreatingPipeline} onOpenChange={setIsCreatingPipeline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать воронку</DialogTitle>
            <DialogDescription>
              Новая воронка будет создана с базовыми этапами
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pipeline-name">Название</Label>
              <Input
                id="pipeline-name"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="Основная воронка"
              />
            </div>
            <div>
              <Label htmlFor="pipeline-description">Описание</Label>
              <Textarea
                id="pipeline-description"
                value={newPipelineDescription}
                onChange={(e) => setNewPipelineDescription(e.target.value)}
                placeholder="Описание воронки..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingPipeline(false)}>
              Отмена
            </Button>
            <Button onClick={createPipeline}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Stage Dialog */}
      <Dialog open={isCreatingStage} onOpenChange={setIsCreatingStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить этап</DialogTitle>
            <DialogDescription>
              Этап будет добавлен перед "Успешно реализовано"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage-name">Название</Label>
              <Input
                id="stage-name"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Согласование"
              />
            </div>
            <div>
              <Label htmlFor="stage-color">Цвет</Label>
              <Select value={newStageColor} onValueChange={setNewStageColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingStage(false)}>
              Отмена
            </Button>
            <Button onClick={createStage}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать этап</DialogTitle>
          </DialogHeader>
          {editingStage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-stage-name">Название</Label>
                <Input
                  id="edit-stage-name"
                  defaultValue={editingStage.name}
                  onBlur={(e) => {
                    if (e.target.value !== editingStage.name) {
                      updateStage(editingStage.id, { name: e.target.value })
                      setEditingStage(null)
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-stage-color">Цвет</Label>
                <Select
                  value={editingStage.color}
                  onValueChange={(color) => {
                    updateStage(editingStage.id, { color })
                    setEditingStage(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStage(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

