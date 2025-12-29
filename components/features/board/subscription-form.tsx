'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Mail, 
  Send, 
  Smartphone, 
  X,
  Filter,
  Save,
  Loader2,
  MapPin,
  Wallet,
  Users,
  Calendar,
  Zap,
  Tag,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BoardSubscription, 
  BoardSubscriptionInput, 
  BoardSubscriptionFilters,
  EMAIL_FREQUENCY_OPTIONS,
  PRESET_FILTERS,
} from '@/lib/types/board-subscription'
import { 
  CATEGORIES, 
  CLIENT_TYPES, 
  VENUE_TYPES,
  SPB_DISTRICTS,
  RequestCategory,
  ClientType,
  VenueType,
} from '@/lib/types/order-request'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SubscriptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription?: BoardSubscription | null  // Для редактирования (должен иметь id)
  defaultValues?: Partial<BoardSubscriptionInput>  // Для предзаполнения при создании
  onSuccess?: () => void
}

export function SubscriptionForm({ 
  open, 
  onOpenChange, 
  subscription,
  defaultValues,
  onSuccess 
}: SubscriptionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Форма
  const [name, setName] = useState('')
  const [filters, setFilters] = useState<BoardSubscriptionFilters>({})
  const [notifyInternal, setNotifyInternal] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(false)
  const [notifyTelegram, setNotifyTelegram] = useState(false)
  const [notifyPush, setNotifyPush] = useState(false)
  const [emailFrequency, setEmailFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant')
  
  // Временные значения для UI
  const [keywordInput, setKeywordInput] = useState('')

  // Инициализация при редактировании или с defaultValues
  useEffect(() => {
    if (subscription && subscription.id) {
      // Режим редактирования - subscription должен иметь id
      setName(subscription.name || '')
      setFilters(subscription.filters || {})
      setNotifyInternal(subscription.notify_internal)
      setNotifyEmail(subscription.notify_email)
      setNotifyTelegram(subscription.notify_telegram)
      setNotifyPush(subscription.notify_push)
      setEmailFrequency(subscription.email_frequency)
    } else if (defaultValues) {
      // Предзаполнение для новой подписки
      setName(defaultValues.name || '')
      setFilters(defaultValues.filters || {})
      setNotifyInternal(defaultValues.notify_internal ?? true)
      setNotifyEmail(defaultValues.notify_email ?? false)
      setNotifyTelegram(defaultValues.notify_telegram ?? false)
      setNotifyPush(defaultValues.notify_push ?? false)
      setEmailFrequency(defaultValues.email_frequency || 'instant')
    } else {
      // Сброс формы для создания без предзаполнения
      setName('')
      setFilters({})
      setNotifyInternal(true)
      setNotifyEmail(false)
      setNotifyTelegram(false)
      setNotifyPush(false)
      setEmailFrequency('instant')
    }
    setKeywordInput('')
  }, [subscription, defaultValues, open])

  // Обработчики фильтров
  const toggleCategory = (category: RequestCategory) => {
    const current = filters.categories || []
    if (current.includes(category)) {
      setFilters({ ...filters, categories: current.filter(c => c !== category) })
    } else {
      setFilters({ ...filters, categories: [...current, category] })
    }
  }

  const toggleClientType = (clientType: ClientType) => {
    const current = filters.clientTypes || []
    if (current.includes(clientType)) {
      setFilters({ ...filters, clientTypes: current.filter(c => c !== clientType) })
    } else {
      setFilters({ ...filters, clientTypes: [...current, clientType] })
    }
  }

  const toggleDistrict = (district: string) => {
    const current = filters.districts || []
    if (current.includes(district)) {
      setFilters({ ...filters, districts: current.filter(d => d !== district) })
    } else {
      setFilters({ ...filters, districts: [...current, district] })
    }
  }

  const toggleVenueType = (venueType: VenueType) => {
    const current = filters.venueTypes || []
    if (current.includes(venueType)) {
      setFilters({ ...filters, venueTypes: current.filter(v => v !== venueType) })
    } else {
      setFilters({ ...filters, venueTypes: [...current, venueType] })
    }
  }

  const addKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (!keyword) return
    const current = filters.keywords || []
    if (!current.includes(keyword)) {
      setFilters({ ...filters, keywords: [...current, keyword] })
    }
    setKeywordInput('')
  }

  const removeKeyword = (keyword: string) => {
    const current = filters.keywords || []
    setFilters({ ...filters, keywords: current.filter(k => k !== keyword) })
  }

  // Применить пресет
  const applyPreset = (presetKey: keyof typeof PRESET_FILTERS) => {
    const preset = PRESET_FILTERS[presetKey]
    setName(preset.name)
    setFilters(preset.filters)
  }

  // Сохранение
  const handleSubmit = async () => {
    // Валидация - хотя бы один фильтр должен быть
    const hasFilters = 
      (filters.categories?.length || 0) > 0 ||
      (filters.clientTypes?.length || 0) > 0 ||
      filters.city ||
      (filters.districts?.length || 0) > 0 ||
      filters.budgetMin != null ||
      filters.budgetMax != null ||
      filters.urgentOnly ||
      (filters.keywords?.length || 0) > 0

    if (!hasFilters) {
      toast.error('Укажите хотя бы один фильтр')
      return
    }

    // Хотя бы один канал уведомлений
    if (!notifyInternal && !notifyEmail && !notifyTelegram && !notifyPush) {
      toast.error('Выберите хотя бы один способ уведомления')
      return
    }

    setIsLoading(true)

    try {
      const data: BoardSubscriptionInput = {
        name: name || undefined,
        filters,
        notify_internal: notifyInternal,
        notify_email: notifyEmail,
        notify_telegram: notifyTelegram,
        notify_push: notifyPush,
        email_frequency: emailFrequency,
      }

      const isEditing = subscription && subscription.id
      const url = isEditing 
        ? `/api/board-subscriptions/${subscription.id}`
        : '/api/board-subscriptions'
      
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка сохранения')
      }

      toast.success(isEditing ? 'Подписка обновлена' : 'Подписка создана')
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения')
    } finally {
      setIsLoading(false)
    }
  }

  const activeFiltersCount = [
    filters.categories?.length || 0,
    filters.clientTypes?.length || 0,
    filters.city ? 1 : 0,
    filters.districts?.length || 0,
    filters.venueTypes?.length || 0,
    (filters.budgetMin || filters.budgetMax) ? 1 : 0,
    (filters.ageFrom || filters.ageTo) ? 1 : 0,
    filters.urgentOnly ? 1 : 0,
    filters.keywords?.length || 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            {subscription?.id ? 'Редактировать подписку' : 'Новая подписка'}
          </DialogTitle>
          <DialogDescription>
            Получайте уведомления о новых объявлениях, соответствующих вашим критериям
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Название */}
          <div className="space-y-2">
            <Label>Название подписки (опционально)</Label>
            <Input
              placeholder="Например: Аниматоры СПб"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Быстрые пресеты */}
          {!subscription?.id && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Быстрые настройки</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESET_FILTERS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => applyPreset(key as keyof typeof PRESET_FILTERS)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Разделитель */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {activeFiltersCount} выбрано
                </span>
              )}
            </div>

            {/* Категории */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Категории услуг
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      filters.categories?.includes(cat.id)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Тип заказчика */}
            <div className="space-y-2 mt-4">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Тип заказчика
              </Label>
              <div className="flex flex-wrap gap-2">
                {CLIENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleClientType(type.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm transition-colors",
                      filters.clientTypes?.includes(type.id)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Город и районы */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Город
                </Label>
                <Select 
                  value={filters.city || '_any'} 
                  onValueChange={(v) => setFilters({ ...filters, city: v === '_any' ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Любой город" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_any">Любой город</SelectItem>
                    <SelectItem value="Санкт-Петербург">Санкт-Петербург</SelectItem>
                    <SelectItem value="Москва">Москва</SelectItem>
                    <SelectItem value="Ленинградская область">Ленинградская область</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Срочность</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={filters.urgentOnly || false}
                    onCheckedChange={(v) => setFilters({ ...filters, urgentOnly: v })}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Только срочные
                  </span>
                </div>
              </div>
            </div>

            {/* Районы (если выбран СПб) */}
            {(filters.city === 'Санкт-Петербург') && (
              <div className="space-y-2 mt-4">
                <Label>Районы</Label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-[18px]">
                  {SPB_DISTRICTS.map((district) => (
                    <button
                      key={district}
                      type="button"
                      onClick={() => toggleDistrict(district)}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs transition-colors",
                        filters.districts?.includes(district)
                          ? "bg-orange-500 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border"
                      )}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Бюджет */}
            <div className="space-y-2 mt-4">
              <Label className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                Бюджет
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    placeholder="От"
                    value={filters.budgetMin || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      budgetMin: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="До"
                    value={filters.budgetMax || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      budgetMax: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Возраст детей */}
            <div className="space-y-2 mt-4">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Возраст детей
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    placeholder="От"
                    min={1}
                    max={18}
                    value={filters.ageFrom || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      ageFrom: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="До"
                    min={1}
                    max={18}
                    value={filters.ageTo || ''}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      ageTo: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Ключевые слова */}
            <div className="space-y-2 mt-4">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                Ключевые слова
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Например: человек-паук"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Добавить
                </Button>
              </div>
              {filters.keywords && filters.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-orange-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Каналы уведомлений */}
          <div className="border-t pt-4">
            <Label className="mb-4 block">Куда отправлять уведомления</Label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">В личный кабинет</div>
                    <div className="text-xs text-gray-500">Уведомления на сайте</div>
                  </div>
                </div>
                <Switch checked={notifyInternal} onCheckedChange={setNotifyInternal} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">Push-уведомления</div>
                    <div className="text-xs text-gray-500">В браузер</div>
                  </div>
                </div>
                <Switch checked={notifyPush} onCheckedChange={setNotifyPush} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">На email</div>
                    <div className="text-xs text-gray-500">Письмо на почту</div>
                  </div>
                </div>
                <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
              </div>

              {notifyEmail && (
                <div className="ml-8 mt-2">
                  <Label className="text-sm">Частота email</Label>
                  <Select value={emailFrequency} onValueChange={(v) => setEmailFrequency(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_FREQUENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[18px]">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">В Telegram</div>
                    <div className="text-xs text-gray-500">Через бота ZumZam</div>
                  </div>
                </div>
                <Switch checked={notifyTelegram} onCheckedChange={setNotifyTelegram} />
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {subscription?.id ? 'Сохранить' : 'Создать подписку'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

