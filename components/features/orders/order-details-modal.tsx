/**
 * Модальное окно с детальной информацией о сделке
 * Inline-редактирование в стиле AmoCRM
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Calendar, Clock, MapPin, User, Phone, Mail, MessageCircle, Building2, Plus, Trash2, DollarSign, Percent, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CompactOrderChat } from '@/components/features/chat/compact-order-chat'
import { useAuth } from '@/lib/contexts/auth-context'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// --- Types ---

interface OrderItem {
  id?: string
  service_title: string
  price: number
  quantity?: number
  service_description?: string
}

interface Service {
  id: string
  title: string
  description?: string
  price: number
  type?: 'main' | 'additional' | 'turnkey' | 'package'
}

interface Order {
  id: string
  order_number: string
  title?: string
  client_id?: string
  client_name: string
  client_phone: string
  client_email: string
  event_date: string
  event_time: string
  event_address: string
  child_age?: number
  children_count?: number
  total_amount: number
  discount?: number
  discount_type?: 'fixed' | 'percent'
  status: string
  client_message?: string
  provider_response?: string
  provider_internal_notes?: string
  created_at: string
  items: OrderItem[]
  profile_id: string
  custom_fields?: Record<string, any>
  pipeline_stage_id?: string | null
  conversation_id?: string | null
  pipeline_stage?: {
    id: string
    name: string
    color: string
    system_status: string | null
  }
}

interface CustomFieldConfig {
  id: string
  name: string
  type: 'text' | 'number' | 'date'
}

interface Profile {
  id: string
  user_id?: string
  display_name: string
  slug: string
  logo?: string
  custom_fields_config?: CustomFieldConfig[]
}

interface PipelineStage {
  id: string
  name: string
  color: string
  position: number
  is_system: boolean
  system_status?: string | null
}

interface PipelineForModal {
  id: string
  name: string
  is_default?: boolean
  stages: PipelineStage[]
}

interface OrderDetailsModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
  availableStages?: PipelineStage[]
  pipelines?: PipelineForModal[]
  selectedPipelineId?: string
}

// --- Helper Components ---

// Компактное поле в стиле AmoCRM (две колонки: label | value)
const CompactInlineField = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  readonly = false
}: { 
  label: string
  value: any
  onChange: (val: any) => void
  type?: string
  readonly?: boolean
}) => (
  <div className="flex items-center py-1.5 border-b border-gray-100 last:border-0 min-h-[32px]">
    <div className="text-[11px] text-gray-500 w-32 shrink-0">{label}</div>
    <div className="flex-1">
      {readonly ? (
        <div className="text-[12px] text-gray-900">{value || '—'}</div>
      ) : (
        <Input 
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          className="h-6 text-[12px] px-0 py-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none rounded-none"
          placeholder="—"
        />
      )}
    </div>
  </div>
)

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onUpdate,
  availableStages = [],
  pipelines: pipelinesProp,
  selectedPipelineId: selectedPipelineIdProp,
}: OrderDetailsModalProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileServices, setProfileServices] = useState<Service[]>([])
  const [currentStage, setCurrentStage] = useState<{
    id: string
    name: string
    color: string
    system_status: string | null
  } | null>(null)

  const pipelines = pipelinesProp || []
  const hasPipelines = pipelines.length > 0
  const canMoveBetweenPipelines = hasPipelines && pipelines.length > 1

  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(selectedPipelineIdProp || null)
  const [selectedStageId, setSelectedStageId] = useState<string>('')

  const getIncomingStageId = (stages: PipelineStage[]) => {
    return (
      stages.find(s => s.system_status === 'pending')?.id ||
      stages.find(s => s.is_system && s.position === 0)?.id ||
      ''
    )
  }

  const activeStagesForSelector: PipelineStage[] = useMemo(() => {
    if (hasPipelines && selectedPipelineId) {
      const p = pipelines.find(x => x.id === selectedPipelineId)
      return p?.stages || []
    }
    return availableStages
  }, [availableStages, hasPipelines, pipelines, selectedPipelineId])

  const activePipelineName = useMemo(() => {
    if (!hasPipelines || !selectedPipelineId) return null
    return pipelines.find(p => p.id === selectedPipelineId)?.name || null
  }, [hasPipelines, pipelines, selectedPipelineId])

  // Определяем роль текущего пользователя ДИНАМИЧЕСКИ (после загрузки profile)
  const currentUserRole: 'client' | 'provider' = useMemo(() => {
    if (!profile || !user) return 'client'
    return profile.user_id === user.id ? 'provider' : 'client'
  }, [profile, user])
  
  // Ref для отслеживания текущего order ID и предотвращения повторных загрузок
  const prevOrderIdRef = useRef<string | null>(null)
  const loadedRef = useRef<boolean>(false) // Защита от двойной загрузки
  
  // Флаг изменений
  const [hasChanges, setHasChanges] = useState(false)
  
  // Helper для отметки изменений
  const markAsChanged = () => setHasChanges(true)
  
  // Editable state
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventAddress, setEventAddress] = useState('')
  const [childAge, setChildAge] = useState<number | ''>('')
  const [childrenCount, setChildrenCount] = useState<number | ''>('')
  const [services, setServices] = useState<OrderItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed')
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [internalNotes, setInternalNotes] = useState('')
  const [isAddingService, setIsAddingService] = useState(false)
  const [newServiceTitle, setNewServiceTitle] = useState('')
  const [newServicePrice, setNewServicePrice] = useState<number | ''>(0)
  const [isAddingField, setIsAddingField] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')

  // При открытии модалки или смене order загружаем данные СТРОГО ОДИН РАЗ
  useEffect(() => {
    // Сброс при закрытии
    if (!isOpen) {
      prevOrderIdRef.current = null
      loadedRef.current = false // Сбрасываем флаг загрузки
      setHasChanges(false)
      return
    }
    
    if (!order) return
    
    // ЖЁСТКАЯ ЗАЩИТА: загружаем только если:
    // 1. order.id изменился (другая заявка)
    // 2. И ещё НЕ загружали для этого ID (защита от дублей)
    const needsLoad = order.id !== prevOrderIdRef.current && !loadedRef.current
    
    if (needsLoad) {
      console.log('📥 Loading order data:', order.id, 'title:', order.title, 'items:', order.items?.length)
      
      prevOrderIdRef.current = order.id
      loadedRef.current = true // БЛОКИРУЕМ повторные загрузки
      
      // Название по умолчанию: "Сделка #номер"
      setTitle(order.title || `Сделка #${order.order_number}`)
      setEventDate(order.event_date || '')
      setEventTime(order.event_time || '')
      setEventAddress(order.event_address || '')
      setChildAge(order.child_age ?? '')
      setChildrenCount(order.children_count ?? '')
      setServices(order.items || [])
      setDiscount(order.discount || 0)
      setDiscountType(order.discount_type || 'fixed')
      setCustomFields(order.custom_fields || {})
      setInternalNotes(order.provider_internal_notes || '')
      setCurrentStage(order.pipeline_stage ? {
        id: order.pipeline_stage.id,
        name: order.pipeline_stage.name,
        color: order.pipeline_stage.color,
        system_status: order.pipeline_stage.system_status,
      } : null)
      setHasChanges(false)

      // Инициализация выбора воронки/этапа для селектора:
      if (hasPipelines) {
        const stageId = order.pipeline_stage_id || order.pipeline_stage?.id || ''
        const pipelineByStage = stageId
          ? pipelines.find(p => p.stages?.some(s => s.id === stageId))
          : null

        const initialPipelineId =
          pipelineByStage?.id ||
          selectedPipelineIdProp ||
          pipelines.find(p => p.is_default)?.id ||
          pipelines[0]?.id ||
          null

        setSelectedPipelineId(initialPipelineId)

        const initialStages = initialPipelineId
          ? (pipelines.find(p => p.id === initialPipelineId)?.stages || [])
          : []

        const initialStageId = stageId || getIncomingStageId(initialStages)
        setSelectedStageId(initialStageId)
      } else {
        setSelectedStageId(order.pipeline_stage_id || order.pipeline_stage?.id || '')
      }
      
      loadProfile(order.profile_id)
    } else if (order.id !== prevOrderIdRef.current) {
      // Если ID изменился, но loadedRef = true, значит это второй вызов useEffect
      console.warn('⚠️ Blocked duplicate load for order:', order.id)
    }
  }, [order?.id, isOpen, hasPipelines, pipelines, selectedPipelineIdProp])

  const loadProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/by-id/${profileId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        
        // Загружаем услуги профиля
        const servicesResponse = await fetch(`/api/services?profile_id=${profileId}`)
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json()
          setProfileServices(servicesData.services || [])
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  // Функция сохранения изменений
  const handleSave = async () => {
    if (!order || isSaving) return // Защита от двойного вызова

    console.log('💾 Saving order:', order.id, 'items:', services.length)
    setIsSaving(true)
    try {
      const servicesTotal = services.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
      const discountAmount = discountType === 'percent' 
        ? Math.floor(servicesTotal * discount / 100)
        : discount
      const finalTotal = Math.max(0, servicesTotal - discountAmount)

      // Если название пустое, возвращаем дефолтное
      const finalTitle = title.trim() || `Сделка #${order.order_number}`
      
      const payload = {
        title: finalTitle,
        event_date: eventDate,
        event_time: eventTime,
        event_address: eventAddress,
        child_age: childAge === '' ? undefined : Number(childAge),
        children_count: childrenCount === '' ? undefined : Number(childrenCount),
        items: services,
        discount: discountAmount, // Сохраняем в рублях
        discount_type: discountType,
        total_amount: finalTotal,
        custom_fields: customFields,
        provider_internal_notes: internalNotes
      }
      
      // Обновляем локальное состояние, если применили дефолтное название
      if (title.trim() === '') {
        setTitle(finalTitle)
      }

      console.log('📤 Sending PATCH with items:', services.map(s => s.service_title))

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save failed:', errorText)
        throw new Error('Failed to update order')
      }

      console.log('✅ Order saved successfully:', order.id)
      setHasChanges(false) // Сбрасываем флаг изменений
      toast.success('Изменения сохранены')
      
      // Обновляем order в родительском компоненте
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Не удалось сохранить изменения')
    } finally {
      setIsSaving(false)
    }
  }

  // Функция отмены изменений
  const handleCancel = () => {
    if (!order) return
    
    // Возвращаем все поля к исходным значениям
    setTitle(order.title || `Сделка #${order.order_number}`)
    setEventDate(order.event_date || '')
    setEventTime(order.event_time || '')
    setEventAddress(order.event_address || '')
    setChildAge(order.child_age ?? '')
    setChildrenCount(order.children_count ?? '')
    setServices(order.items || [])
    setDiscount(order.discount || 0)
    setDiscountType(order.discount_type || 'fixed')
    setCustomFields(order.custom_fields || {})
    setInternalNotes(order.provider_internal_notes || '')
    
    setHasChanges(false)
    toast.info('Изменения отменены')
  }

  const handleAddService = (serviceId?: string) => {
    if (serviceId) {
      const service = profileServices.find(s => s.id === serviceId)
      if (service) {
        setServices([...services, {
          service_id: service.id, // ВАЖНО: сохраняем service_id для связи
          service_title: service.title,
          price: service.price,
          service_description: service.description
        }])
      }
    } else if (newServiceTitle.trim()) {
      // Кастомная услуга без service_id
      setServices([...services, {
        service_title: newServiceTitle.trim(),
        price: newServicePrice || 0
      }])
      setNewServiceTitle('')
      setNewServicePrice(0)
    }
    setIsAddingService(false)
    markAsChanged()
  }

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
    markAsChanged()
  }

  const handleAddCustomField = async () => {
    if (!newFieldName.trim() || !profile) return

    try {
      const newFieldConfig: CustomFieldConfig = {
        id: crypto.randomUUID(),
        name: newFieldName.trim(),
        type: 'text'
      }

      const updatedConfig = [...(profile.custom_fields_config || []), newFieldConfig]

      const response = await fetch(`/api/profiles/by-id/${profile.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updatedConfig })
      })

      if (!response.ok) throw new Error('Failed to save field config')

      setProfile({ ...profile, custom_fields_config: updatedConfig })
      setNewFieldName('')
      setIsAddingField(false)
      toast.success('Поле добавлено')
    } catch (error) {
      toast.error('Ошибка при добавлении поля')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: 'Входящая', color: 'bg-orange-100 text-orange-700' },
      confirmed: { label: 'Подтверждено', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'В работе', color: 'bg-amber-100 text-amber-700' },
      completed: { label: 'Успешно', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Отменено', color: 'bg-gray-100 text-gray-600' },
      rejected: { label: 'Отклонено', color: 'bg-red-100 text-red-700' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge className={`${config.color} border-0 rounded-sm px-2 py-0.5 text-[11px] font-normal uppercase tracking-wide`}>
        {config.label}
      </Badge>
    )
  }

  if (!order) return null

  const servicesTotal = services.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  const discountAmount = discountType === 'percent' 
    ? Math.floor(servicesTotal * discount / 100)
    : discount
  const finalTotal = Math.max(0, servicesTotal - discountAmount)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-0 sm:rounded-none md:rounded-lg bg-white">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Сделка #{order.order_number}</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="h-14 px-4 border-b flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="flex flex-col">
              <Input 
                value={title}
                onChange={(e) => { setTitle(e.target.value); markAsChanged(); }}
                placeholder="Название сделки"
                className="h-7 text-base font-semibold border-0 border-b border-transparent hover:border-gray-200 focus-visible:border-blue-500 rounded-none bg-transparent shadow-none focus-visible:ring-0 px-0 max-w-md"
              />
              <span className="text-[10px] text-gray-400">Сделка #{order.order_number}</span>
            </div>
            {/* Воронка / этап сделки */}
            {currentUserRole === 'provider' && (availableStages.length > 0 || hasPipelines) && currentStage ? (
              <div className="flex items-center gap-2">
                {/* Выбор воронки (если есть несколько) */}
                {canMoveBetweenPipelines && selectedPipelineId && (
                  <Select
                    value={selectedPipelineId}
                    onValueChange={(nextPipelineId) => {
                      setSelectedPipelineId(nextPipelineId)
                      const nextStages = pipelines.find(p => p.id === nextPipelineId)?.stages || []
                      const nextDefaultStageId = getIncomingStageId(nextStages)
                      setSelectedStageId(nextDefaultStageId)
                      // Этап меняется пользователем отдельным действием (выбором этапа)
                    }}
                  >
                    <SelectTrigger className="h-7 w-[180px]">
                      <SelectValue placeholder="Воронка" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Выбор этапа (фактически переносит сделку) */}
                <Select
                  value={selectedStageId || ''}
                  onValueChange={async (newStageId) => {
                    if (!order) return
                    try {
                      const response = await fetch(`/api/orders/${order.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pipeline_stage_id: newStageId }),
                      })

                      if (!response.ok) throw new Error('Failed to update stage')

                      setSelectedStageId(newStageId)

                      const newStage = activeStagesForSelector.find(s => s.id === newStageId)
                      if (newStage) {
                        setCurrentStage({
                          id: newStage.id,
                          name: newStage.name,
                          color: newStage.color,
                          system_status: newStage.system_status || null,
                        })
                      }

                      toast.success(activePipelineName ? `Этап обновлён (${activePipelineName})` : 'Этап обновлён')
                      if (onUpdate) onUpdate()
                    } catch (error) {
                      console.error('Stage update error:', error)
                      toast.error('Не удалось изменить этап')
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 bg-transparent focus:ring-0 px-0">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${currentStage.color}20`,
                        color: currentStage.color === 'gray' ? '#6b7280' :
                          currentStage.color === 'orange' ? '#f97316' :
                          currentStage.color === 'yellow' ? '#eab308' :
                          currentStage.color === 'blue' ? '#3b82f6' :
                          currentStage.color === 'green' ? '#10b981' : '#000',
                      }}
                    >
                      {currentStage.name}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {activeStagesForSelector.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: stage.color === 'gray' ? '#6b7280' :
                                stage.color === 'orange' ? '#f97316' :
                                stage.color === 'yellow' ? '#eab308' :
                                stage.color === 'blue' ? '#3b82f6' :
                                stage.color === 'green' ? '#10b981' : '#000',
                            }}
                          />
                          <span>{stage.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : currentStage ? (
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${currentStage.color}20`,
                  color: currentStage.color === 'gray' ? '#6b7280' : 
                         currentStage.color === 'orange' ? '#f97316' :
                         currentStage.color === 'yellow' ? '#eab308' :
                         currentStage.color === 'blue' ? '#3b82f6' :
                         currentStage.color === 'green' ? '#10b981' : '#000'
                }}
              >
                {currentStage.name}
              </span>
            ) : getStatusBadge(order.status)}
            {profile && (
              <span className="text-[11px] text-gray-400 ml-2 border-l pl-3">
                {profile.display_name}
              </span>
            )}
          </div>
          
          {/* Кнопки Сохранить / Отменить (показываются только при изменениях) */}
          {hasChanges && (
            <div className="flex items-center gap-2 mr-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleCancel}
                className="h-8 text-xs"
              >
                Отменить
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          )}
          
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 rounded-sm">
            <X className="w-5 h-5 text-gray-400" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN */}
          <div className="w-[350px] md:w-[400px] flex flex-col border-r border-gray-200 bg-white overflow-y-auto">
            
            {/* 1. Основная информация */}
            <div className="px-4 py-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Основное</h3>
              <div>
                <div className="flex items-center py-1.5 border-b border-gray-100 min-h-[32px]">
                  <div className="text-[11px] text-gray-500 w-32 shrink-0">Бюджет</div>
                  <div className="text-[13px] font-bold text-blue-600">{finalTotal.toLocaleString()} ₽</div>
                </div>
                <div className="flex items-center py-1.5 border-b border-gray-100 min-h-[32px]">
                  <div className="text-[11px] text-gray-500 w-32 shrink-0">Дата</div>
                  <Input 
                    type="date"
                    value={eventDate}
                    onChange={(e) => { setEventDate(e.target.value); markAsChanged(); }}
                    className="h-6 text-[12px] px-0 py-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none rounded-none flex-1"
                  />
                </div>
                <div className="flex items-center py-1.5 border-b border-gray-100 min-h-[32px]">
                  <div className="text-[11px] text-gray-500 w-32 shrink-0">Время</div>
                  <Input 
                    type="time"
                    value={eventTime}
                    onChange={(e) => { setEventTime(e.target.value); markAsChanged(); }}
                    className="h-6 text-[12px] px-0 py-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none rounded-none flex-1"
                  />
                </div>
                <CompactInlineField 
                  label="Адрес" 
                  value={eventAddress} 
                  onChange={(v) => { setEventAddress(v); markAsChanged(); }}
                />
                <CompactInlineField 
                  label="Кол-во детей" 
                  value={childrenCount === '' ? '' : childrenCount} 
                  onChange={(v) => { setChildrenCount(v === '' ? '' : Number(v)); markAsChanged(); }}
                  type="number" 
                />
                <CompactInlineField 
                  label="Возраст" 
                  value={childAge === '' ? '' : childAge} 
                  onChange={(v) => { setChildAge(v === '' ? '' : Number(v)); markAsChanged(); }}
                  type="number" 
                />
              </div>
            </div>

            {/* 2. Кастомные поля */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Детали</h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-4 px-1 text-[9px] text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsAddingField(true)}
                >
                  Настроить
                </Button>
              </div>

              {isAddingField && (
                <div className="mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                  <Input 
                    placeholder="Название поля" 
                    className="h-6 text-[11px] mb-1 bg-white"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingField(false)} className="h-5 text-[9px] px-2">Отмена</Button>
                    <Button size="sm" onClick={handleAddCustomField} className="h-5 text-[9px] px-2 bg-blue-600 text-white">Добавить</Button>
                  </div>
                </div>
              )}

              <div>
                {profile?.custom_fields_config?.map((field) => (
                  <CompactInlineField 
                    key={field.id}
                    label={field.name} 
                    value={customFields[field.id] ?? ''} 
                    onChange={(v) => {
                      setCustomFields({...customFields, [field.id]: v})
                      markAsChanged()
                    }}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  />
                ))}
                {(!profile?.custom_fields_config || profile.custom_fields_config.length === 0) && (
                  <div className="text-[11px] text-gray-400 italic py-2">Нет дополнительных полей</div>
                )}
              </div>
            </div>

            {/* 3. Примечания */}
            <div className="px-4 py-3 border-t border-gray-200">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Примечание</h3>
              <Textarea
                value={internalNotes}
                onChange={(e) => { setInternalNotes(e.target.value); markAsChanged(); }}
                placeholder="Заметки..."
                className="min-h-[60px] text-[11px] bg-yellow-50 border-yellow-200 focus:border-yellow-400"
              />
            </div>

            {/* 4. Состав заказа (компактно) */}
            <div className="px-4 py-3 border-t border-gray-200">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Товары</h3>
              <div className="space-y-2">
                {services.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs group">
                    <div className="flex-1 mr-2">
                      <Input 
                        value={item.service_title} 
                        onChange={(e) => {
                          const newServices = [...services]
                          newServices[idx].service_title = e.target.value
                          setServices(newServices)
                          markAsChanged()
                        }}
                        className="h-6 text-xs border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-0 rounded-none"
                      />
                    </div>
                    <Input 
                      type="number"
                      value={item.price ?? 0} 
                      onChange={(e) => {
                        const newServices = [...services]
                        newServices[idx].price = e.target.value === '' ? 0 : Number(e.target.value)
                        setServices(newServices)
                        markAsChanged()
                      }}
                      className="h-6 text-xs w-16 border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent px-0 text-right rounded-none"
                    />
                    <button 
                      onClick={() => handleRemoveService(idx)}
                      className="ml-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Добавление услуги */}
              {isAddingService ? (
                <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                  <Select onValueChange={(v) => v === 'custom' ? null : handleAddService(v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Выбрать услугу" />
                    </SelectTrigger>
                    <SelectContent>
                      {profileServices.length === 0 ? (
                        <SelectItem value="loading" disabled className="text-xs text-gray-400">
                          Загрузка услуг...
                        </SelectItem>
                      ) : (
                        <>
                          {profileServices.map(service => (
                            <SelectItem key={service.id} value={service.id} className="text-xs">
                              {service.title} — {service.price?.toLocaleString() || 0} ₽
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" className="text-xs font-semibold text-blue-600">+ Своя услуга</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Название" 
                      className="h-7 text-xs"
                      value={newServiceTitle}
                      onChange={(e) => setNewServiceTitle(e.target.value)}
                    />
                    <Input 
                      type="number"
                      placeholder="Цена" 
                      className="h-7 text-xs w-20"
                      value={newServicePrice === '' ? '' : newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingService(false)} className="h-6 text-[10px]">Отмена</Button>
                    <Button size="sm" onClick={() => handleAddService()} className="h-6 text-[10px]">Добавить</Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingService(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2 text-[10px] w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Добавить
                </Button>
              )}

              {/* Итого компактно */}
              <div className="mt-4 pt-3 border-t space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Сумма</span>
                  <span>{servicesTotal} ₽</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Скидка</span>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number"
                      value={discount ?? 0} 
                      onChange={(e) => { setDiscount(e.target.value === '' ? 0 : Number(e.target.value)); markAsChanged(); }}
                      className="h-6 w-14 text-xs border-gray-200 text-right"
                    />
                    <Select value={discountType} onValueChange={(v: any) => { setDiscountType(v); markAsChanged(); }}>
                      <SelectTrigger className="h-6 w-12 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">₽</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span></span>
                    <span>-{discountAmount} ₽</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Итого</span>
                  <span className="text-blue-600">{finalTotal} ₽</span>
                </div>
              </div>
            </div>

            {/* 5. Контакт (внизу) */}
            <div className="px-4 py-3 border-t border-gray-200">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Контакт</h3>
              <div>
                <CompactInlineField label="Имя" value={order.client_name} onChange={() => {}} readonly />
                <CompactInlineField label="Телефон" value={order.client_phone} onChange={() => {}} readonly />
                <CompactInlineField label="Email" value={order.client_email} onChange={() => {}} readonly />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - только чат */}
          <div className="flex-1 flex flex-col bg-gray-50">{/* Чат */}
            <div className="flex-1 flex flex-col relative">
              <div className="absolute inset-0 flex flex-col">
                <div className="h-10 border-b bg-white px-4 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    История и чат
                  </span>
                </div>
                
                <div className="flex-1 relative bg-white">
                  <div className="absolute inset-0">
                    <CompactOrderChat
                      orderId={order.id}
                      conversationId={order.conversation_id}
                      currentUserRole={currentUserRole}
                      clientName={order.client_name}
                      providerName={profile?.display_name || 'Исполнитель'}
                      providerAvatar={profile?.logo}
                      fullHeight={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
