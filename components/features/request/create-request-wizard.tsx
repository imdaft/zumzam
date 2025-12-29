'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  MapPin,
  Users,
  MessageSquare,
  Check,
  Loader2,
  Zap,
  Home,
  UtensilsCrossed,
  TreePine,
  Building,
  Cake,
  CalendarDays,
  Music,
  Shirt,
  Box,
  UserCircle,
  Building2,
  ClipboardList,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/lib/contexts/auth-context'
import { RequestDraftChat } from '@/components/features/request/request-draft-chat'
import { 
  CLIENT_TYPES,
  CATEGORIES,
  VENUE_TYPES,
  AGE_OPTIONS,
  BUDGET_OPTIONS,
  CONTACT_TIME_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  POPULAR_CHARACTERS,
  SHOW_TYPES,
  MASTERCLASS_TYPES,
  DESCRIPTION_TEMPLATES,
  DESCRIPTION_PLACEHOLDERS,
  SPB_DISTRICTS,
  LO_DISTRICTS,
  type ClientType,
  type RequestCategory,
  type VenueType,
  type CreateRequestFormData,
  type AnimatorDetails,
  type ShowDetails,
} from '@/lib/types/order-request'

// Опции времени
const TIME_OPTIONS = (() => {
  const options = []
  for (let h = 9; h <= 21; h++) {
    options.push({ value: `${h.toString().padStart(2, '0')}:00`, label: `${h}:00` })
    options.push({ value: `${h.toString().padStart(2, '0')}:30`, label: `${h}:30` })
  }
  return options
})()

// Иконки для типов площадок
const venueIcons: Record<VenueType, React.ReactNode> = {
  home: <Home className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  kids_center: <Building className="w-5 h-5" />,
  club: <TreePine className="w-5 h-5" />,
  outdoor: <TreePine className="w-5 h-5" />,
  school: <Building className="w-5 h-5" />,
  office: <Building2 className="w-5 h-5" />,
  other: <MapPin className="w-5 h-5" />,
}

interface CreateRequestWizardProps {
  initialData?: Partial<CreateRequestFormData>
}

export function CreateRequestWizard({ initialData }: CreateRequestWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateRequestFormData>({
    city: 'Санкт-Петербург',
    budgetNegotiable: false,
    contactMethod: 'chat',
    childrenCount: 10,
    childrenAgeRange: { from: 5, to: 8 },
    details: {},
  })

  // Предзаполняем имя и телефон из профиля пользователя
  useEffect(() => {
    if (user) {
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const userPhone = user.phone || user.user_metadata?.phone || ''
      
      setFormData(prev => ({
        ...prev,
        contactName: prev.contactName || userName,
        contactPhone: prev.contactPhone || formatPhoneDisplay(userPhone),
      }))
    }
  }, [user])

  // Применяем initialData из AI черновика / query
  useEffect(() => {
    if (!initialData) return

    setFormData(prev => ({
      ...prev,
      ...initialData,
      eventDate: initialData.eventDate
        ? new Date(initialData.eventDate as unknown as string)
        : prev.eventDate,
      eventTime: initialData.eventTime ?? prev.eventTime,
      childrenAgeRange: initialData.childrenAgeRange ?? prev.childrenAgeRange,
      birthdayChild: initialData.birthdayChild ?? prev.birthdayChild,
      budgetNegotiable: initialData.budgetNegotiable ?? prev.budgetNegotiable ?? false,
      details: { ...(prev.details || {}), ...(initialData.details || {}) },
    }))
  }, [initialData])

  // Форматирование телефона для отображения
  function formatPhoneDisplay(phone: string): string {
    if (!phone) return '+7'
    const digits = phone.replace(/\D/g, '')
    const cleanDigits = digits.startsWith('7') || digits.startsWith('8') 
      ? digits.slice(1) 
      : digits
    
    if (cleanDigits.length === 0) return '+7'
    
    let formatted = '+7'
    if (cleanDigits.length > 0) formatted += ` (${cleanDigits.slice(0, 3)}`
    if (cleanDigits.length >= 3) formatted += ')'
    if (cleanDigits.length > 3) formatted += ` ${cleanDigits.slice(3, 6)}`
    if (cleanDigits.length > 6) formatted += `-${cleanDigits.slice(6, 8)}`
    if (cleanDigits.length > 8) formatted += `-${cleanDigits.slice(8, 10)}`
    
    return formatted
  }

  // Определяем нужны ли специфичные поля
  const needsCategoryDetails = useMemo(() => {
    // Для коллег всегда показываем специфику
    if (formData.clientType === 'colleague') return true
    // Для площадок и организаторов тоже
    if (formData.clientType === 'venue' || formData.clientType === 'organizer') return true
    // Для аниматоров всегда есть специфика
    if (formData.category === 'animator') return true
    if (formData.category === 'show') return true
    if (formData.category === 'masterclass') return true
    if (formData.category === 'santa') return true
    return false
  }, [formData.clientType, formData.category])

  // Динамическое количество шагов
  const TOTAL_STEPS = needsCategoryDetails ? 6 : 5

  // Автоопределение срочности
  const isUrgent = useMemo(() => {
    if (!formData.eventDate) return false
    const eventDate = new Date(formData.eventDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3
  }, [formData.eventDate])

  // Районы в зависимости от города
  const districts = useMemo(() => {
    return formData.city === 'Ленобласть' ? LO_DISTRICTS : SPB_DISTRICTS
  }, [formData.city])

  // Обновление данных формы
  const updateFormData = useCallback((updates: Partial<CreateRequestFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Обновление деталей категории
  const updateDetails = useCallback((details: Partial<AnimatorDetails | ShowDetails>) => {
    setFormData(prev => ({ 
      ...prev, 
      details: { ...prev.details, ...details } 
    }))
  }, [])

  // Навигация
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1)
    }
  }, [step, TOTAL_STEPS])

  const goBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }, [step])

  // Проверка валидности текущего шага
  const isStepValid = useCallback(() => {
    switch (step) {
      case 1:
        return !!formData.clientType
      case 2:
        return !!formData.category
      case 3:
        return !!formData.eventDate
      case 4:
        if (needsCategoryDetails) {
          return !!formData.venueType
        }
        return (formData.childrenCount ?? 0) > 0
      case 5:
        if (needsCategoryDetails) {
          return (formData.childrenCount ?? 0) > 0
        }
        return true
      case 6:
        return true
      default:
        return false
    }
  }, [step, formData, needsCategoryDetails])

  // Отправка формы
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const categoryLabel = CATEGORIES.find(c => c.id === formData.category)?.label || 'Услуга'
      const clientTypeLabel = CLIENT_TYPES.find(c => c.id === formData.clientType)?.label || ''
      const title = formData.description?.slice(0, 50) || `${categoryLabel} на праздник`
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title,
          isUrgent,
          eventDate: formData.eventDate?.toISOString().split('T')[0],
          childrenAgeFrom: formData.childrenAgeRange?.from,
          childrenAgeTo: formData.childrenAgeRange?.to,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при создании заявки')
      }

      const data = await response.json()
      toast.success('Заявка опубликована!', {
        description: 'Исполнители скоро увидят вашу заявку',
      })
      router.push(`/my-requests/${data.id}?created=true`)
    } catch (error: any) {
      console.error('Ошибка:', error)
      toast.error('Не удалось создать заявку', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Контент шага в зависимости от наличия специфичных полей
  const renderStep = () => {
    if (needsCategoryDetails) {
      switch (step) {
        case 1:
          return <StepClientType value={formData.clientType} companyName={formData.companyName} onChange={updateFormData} />
        case 2:
          return <StepCategory value={formData.category} onChange={updateFormData} />
        case 3:
          return <StepWhen date={formData.eventDate} time={formData.eventTime} isUrgent={isUrgent} onChange={updateFormData} />
        case 4:
          return <StepWhere city={formData.city} district={formData.district} venueType={formData.venueType} address={formData.address} metro={formData.metro} districts={districts} clientType={formData.clientType} onChange={updateFormData} />
        case 5:
          return <StepChildrenAndCategory formData={formData} onChange={updateFormData} updateDetails={updateDetails} />
        case 6:
          return <StepDetails formData={formData} onChange={updateFormData} />
        default:
          return null
      }
    } else {
      switch (step) {
        case 1:
          return <StepClientType value={formData.clientType} companyName={formData.companyName} onChange={updateFormData} />
        case 2:
          return <StepCategory value={formData.category} onChange={updateFormData} />
        case 3:
          return <StepWhen date={formData.eventDate} time={formData.eventTime} isUrgent={isUrgent} onChange={updateFormData} />
        case 4:
          return <StepChildren count={formData.childrenCount} ageRange={formData.childrenAgeRange} birthdayChild={formData.birthdayChild} onChange={updateFormData} />
        case 5:
          return <StepDetails formData={formData} onChange={updateFormData} />
        default:
          return null
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] flex flex-col">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2">
        <header className="bg-white border border-gray-100 shadow-sm rounded-[24px] mx-2 overflow-hidden">
          <div className="px-3 py-3">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <button
                onClick={step > 1 ? goBack : () => router.back()}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
                type="button"
                aria-label="Назад"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>

              <div className="flex-1 text-center min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Новая заявка
                </p>
              </div>

              {/* AI помощник */}
              <div className="shrink-0">
                <RequestDraftChat compact />
              </div>
            </div>
          </div>
          {/* Тонкая шкала прогресса */}
          <div className="w-full h-0.5 bg-gray-100">
            <div 
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </header>
      </div>

      {/* Контент */}
      <main className="flex-1 px-2 py-4 overflow-auto">
        <div className="max-w-lg mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Футер с кнопкой */}
      <footer className="sticky bottom-0 bg-[#F7F8FA] pt-2 pb-safe">
        <div className="mx-2 bg-white border border-gray-100 shadow-sm rounded-[24px] px-3 py-3">
          <div className="max-w-lg mx-auto">
          {step < TOTAL_STEPS ? (
            <Button
              onClick={goNext}
              disabled={!isStepValid()}
              className="w-full h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-full disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400"
            >
              Далее
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Публикуем...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Опубликовать заявку
                </>
              )}
            </Button>
          )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// === ШАГ 1: Тип заказчика ===
function StepClientType({ 
  value,
  companyName,
  onChange 
}: { 
  value?: ClientType
  companyName?: string
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  const clientTypeIcons: Record<ClientType, React.ReactNode> = {
    parent: <UserCircle className="w-7 h-7" />,
    venue: <Building2 className="w-7 h-7" />,
    organizer: <ClipboardList className="w-7 h-7" />,
    colleague: <RefreshCw className="w-7 h-7" />,
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Кто вы?
        </h1>
        <p className="text-gray-500 mt-2">
          Это поможет исполнителям понять ваши потребности
        </p>
      </div>

      <div className="space-y-3">
        {CLIENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onChange({ clientType: type.id })}
            className={cn(
              "w-full p-4 rounded-[24px] border-2 transition-all text-left bg-white",
              "hover:border-orange-300 hover:shadow-sm",
              "flex items-center gap-4",
              value === type.id 
                ? "border-orange-500 bg-orange-50 shadow-sm" 
                : "border-gray-100"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
              value === type.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
            )}>
              {clientTypeIcons[type.id]}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-semibold text-base",
                value === type.id ? "text-orange-700" : "text-gray-900"
              )}>
                {type.emoji} {type.label}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {type.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Дополнительное поле для организаций */}
      {(value === 'venue' || value === 'organizer') && (
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название организации
          </label>
          <Input
            type="text"
            value={companyName || ''}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder={value === 'venue' ? 'Например: ТРЦ Галерея' : 'Например: Праздник.PRO'}
            className="h-12 rounded-[18px] border-gray-200"
          />
        </div>
      )}
    </div>
  )
}

// === ШАГ 2: Выбор категории ===
function StepCategory({ 
  value, 
  onChange 
}: { 
  value?: RequestCategory
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Что вам нужно?
        </h1>
        <p className="text-gray-500 mt-2">
          Выберите тип услуги
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onChange({ category: category.id, details: {} })}
            className={cn(
              "p-4 rounded-[24px] border-2 transition-all text-left bg-white",
              "hover:border-orange-300 hover:shadow-sm",
              value === category.id 
                ? "border-orange-500 bg-orange-50 shadow-sm" 
                : "border-gray-100"
            )}
          >
            <span className="text-3xl">{category.emoji}</span>
            <p className={cn(
              "mt-2 font-medium text-sm",
              value === category.id ? "text-orange-700" : "text-gray-700"
            )}>
              {category.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// === ШАГ 3: Когда ===
function StepWhen({ 
  date,
  time,
  isUrgent,
  onChange 
}: { 
  date?: Date
  time?: string
  isUrgent: boolean
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  const today = new Date()
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Когда праздник?
        </h1>
      </div>

      <div className="space-y-4">
        {/* Дата */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата мероприятия
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal rounded-[18px] border-gray-200",
                  !date && "text-gray-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                {date ? format(date, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[24px]" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => onChange({ eventDate: d })}
                disabled={(d) => d < today || d > maxDate}
                locale={ru}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Время */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Время начала
          </label>
          <Select
            value={time || ''}
            onValueChange={(value) => onChange({ eventTime: value || undefined })}
          >
            <SelectTrigger className="h-12 rounded-[18px] border-gray-200">
              <SelectValue placeholder="Не указано" />
            </SelectTrigger>
            <SelectContent className="rounded-[28px]">
              <SelectItem value="none" className="rounded-[18px]">Не указано</SelectItem>
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="rounded-[18px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Срочность */}
        {isUrgent && (
          <div className="bg-red-50 rounded-[24px] p-4 border border-red-200 flex items-center gap-3">
            <Zap className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Срочный заказ</p>
              <p className="text-sm text-red-600">
                Мероприятие в ближайшие 3 дня
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// === ШАГ 4: Где (расширенный для venue/organizer/colleague) ===
function StepWhere({ 
  city,
  district,
  venueType,
  address,
  metro,
  districts,
  clientType,
  onChange 
}: { 
  city?: string
  district?: string
  venueType?: VenueType
  address?: string
  metro?: string
  districts: string[]
  clientType?: ClientType
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  const showAddress = clientType === 'venue' || clientType === 'organizer' || clientType === 'colleague'

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Где будет праздник?
        </h1>
      </div>

      <div className="space-y-4">
        {/* Город / Область */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Регион
          </label>
          <div className="flex gap-2">
            {['Санкт-Петербург', 'Ленобласть'].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ city: c, district: undefined })}
                className={cn(
                  "flex-1 h-12 rounded-[18px] border-2 font-medium transition-all text-sm",
                  city === c 
                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Район */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <Select
            value={district || ''}
            onValueChange={(value) => onChange({ district: value || undefined })}
          >
            <SelectTrigger className="h-12 rounded-[18px] border-gray-200">
              <SelectValue placeholder="Любой район" />
            </SelectTrigger>
            <SelectContent className="rounded-[28px] max-h-[300px]">
              <SelectItem value="any" className="rounded-[18px]">Любой район</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d} className="rounded-[18px]">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Адрес и метро (для коллег/площадок/организаторов) */}
        {showAddress && (
          <>
            <div className="bg-white rounded-[24px] p-4 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <Input
                type="text"
                value={address || ''}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="ул. Пример, д. 1"
                className="h-12 rounded-[18px] border-gray-200"
              />
            </div>
            <div className="bg-white rounded-[24px] p-4 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ближайшее метро
              </label>
              <Input
                type="text"
                value={metro || ''}
                onChange={(e) => onChange({ metro: e.target.value })}
                placeholder="м. Невский проспект"
                className="h-12 rounded-[18px] border-gray-200"
              />
            </div>
          </>
        )}

        {/* Тип площадки */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Тип площадки
          </label>
          <div className="grid grid-cols-2 gap-2">
            {VENUE_TYPES.map((venue) => (
              <button
                key={venue.id}
                onClick={() => onChange({ venueType: venue.id })}
                className={cn(
                  "p-3 rounded-[18px] border-2 flex items-center gap-2 transition-all",
                  "hover:border-orange-300",
                  venueType === venue.id 
                    ? "border-orange-500 bg-orange-50" 
                    : "border-gray-200"
                )}
              >
                <span className={cn(
                  venueType === venue.id ? "text-orange-500" : "text-gray-400"
                )}>
                  {venueIcons[venue.id]}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  venueType === venue.id ? "text-orange-700" : "text-gray-700"
                )}>
                  {venue.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// === ШАГ: Дети + Специфика категории ===
function StepChildrenAndCategory({ 
  formData,
  onChange,
  updateDetails
}: { 
  formData: CreateRequestFormData
  onChange: (data: Partial<CreateRequestFormData>) => void
  updateDetails: (details: Record<string, any>) => void 
}) {
  const [showBirthday, setShowBirthday] = useState(!!formData.birthdayChild?.name)
  
  // Обработчик ввода количества
  const handleCountChange = (value: string) => {
    const num = parseInt(value) || 0
    if (num >= 0 && num <= 100) {
      onChange({ childrenCount: num })
    }
  }

  const details = formData.details as AnimatorDetails || {}

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Расскажите о детях
        </h1>
      </div>

      <div className="space-y-4">
        {/* Количество детей */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Сколько детей?
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onChange({ childrenCount: Math.max(1, (formData.childrenCount || 1) - 1) })}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={formData.childrenCount || ''}
              onChange={(e) => handleCountChange(e.target.value)}
              className="w-20 h-14 text-center text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-[18px] focus:border-orange-500 focus:outline-none"
              min={1}
              max={100}
            />
            <button
              onClick={() => onChange({ childrenCount: Math.min(100, (formData.childrenCount || 1) + 1) })}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Возраст */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Возраст детей
          </label>
          <div className="flex gap-3 items-center">
            <Select
              value={String(formData.childrenAgeRange?.from || 5)}
              onValueChange={(value) => onChange({ 
                childrenAgeRange: { 
                  from: Number(value), 
                  to: Math.max(Number(value), formData.childrenAgeRange?.to || 8)
                } 
              })}
            >
              <SelectTrigger className="flex-1 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-gray-400 font-medium">—</span>
            <Select
              value={String(formData.childrenAgeRange?.to || 8)}
              onValueChange={(value) => onChange({ 
                childrenAgeRange: { 
                  from: Math.min(formData.childrenAgeRange?.from || 5, Number(value)), 
                  to: Number(value) 
                } 
              })}
            >
              <SelectTrigger className="flex-1 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Именинник */}
        <button
          onClick={() => setShowBirthday(!showBirthday)}
          className={cn(
            "w-full p-4 rounded-[24px] border-2 flex items-center gap-3 transition-all bg-white",
            showBirthday 
              ? "border-orange-500 bg-orange-50" 
              : "border-gray-200 hover:border-orange-300"
          )}
        >
          <Cake className={cn(
            "w-6 h-6",
            showBirthday ? "text-orange-500" : "text-gray-400"
          )} />
          <span className={cn(
            "font-medium",
            showBirthday ? "text-orange-700" : "text-gray-700"
          )}>
            Есть именинник
          </span>
        </button>

        {showBirthday && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 flex gap-3">
            <Input
              type="text"
              value={formData.birthdayChild?.name || ''}
              onChange={(e) => onChange({ 
                birthdayChild: { 
                  name: e.target.value, 
                  age: formData.birthdayChild?.age || 6 
                } 
              })}
              placeholder="Имя ребёнка"
              className="flex-1 h-12 rounded-[18px]"
            />
            <Select
              value={String(formData.birthdayChild?.age || 6)}
              onValueChange={(value) => onChange({ 
                birthdayChild: { 
                  name: formData.birthdayChild?.name || '', 
                  age: Number(value) 
                } 
              })}
            >
              <SelectTrigger className="w-28 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* === СПЕЦИФИЧНЫЕ ПОЛЯ ДЛЯ АНИМАТОРА === */}
        {formData.category === 'animator' && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 space-y-4">
            <p className="font-semibold text-gray-900">Требования к аниматору</p>
            
            {/* Персонаж */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Персонаж
              </label>
              <Select
                value={details.character || ''}
                onValueChange={(value) => updateDetails({ character: value || undefined })}
              >
                <SelectTrigger className="h-12 rounded-[18px] border-gray-200">
                  <SelectValue placeholder="Любой / на ваш выбор" />
                </SelectTrigger>
                <SelectContent className="rounded-[28px]">
                  <SelectItem value="any" className="rounded-[18px]">Любой / на ваш выбор</SelectItem>
                  {POPULAR_CHARACTERS.map((char) => (
                    <SelectItem key={char} value={char} className="rounded-[18px]">
                      {char}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Оборудование */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">Что должно быть у исполнителя?</p>
              
              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={details.hasOwnCostume || false}
                  onCheckedChange={(checked) => updateDetails({ hasOwnCostume: !!checked })}
                  className="h-5 w-5"
                />
                <Shirt className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Свой костюм персонажа</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={details.hasOwnProps || false}
                  onCheckedChange={(checked) => updateDetails({ hasOwnProps: !!checked })}
                  className="h-5 w-5"
                />
                <Box className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Свой реквизит</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={details.hasOwnSpeaker || false}
                  onCheckedChange={(checked) => updateDetails({ hasOwnSpeaker: !!checked })}
                  className="h-5 w-5"
                />
                <Music className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Своя колонка</span>
              </label>
            </div>

            {/* Если колонка своя не нужна */}
            {!details.hasOwnSpeaker && (
              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50">
                <Checkbox 
                  checked={details.speakerProvided || false}
                  onCheckedChange={(checked) => updateDetails({ speakerProvided: !!checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-gray-700">Колонка будет на месте</span>
              </label>
            )}
          </div>
        )}

        {/* === СПЕЦИФИЧНЫЕ ПОЛЯ ДЛЯ ШОУ === */}
        {formData.category === 'show' && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 space-y-4">
            <p className="font-semibold text-gray-900">Тип шоу</p>
            
            <Select
              value={(formData.details as ShowDetails)?.showType || ''}
              onValueChange={(value) => updateDetails({ showType: value || undefined })}
            >
              <SelectTrigger className="h-12 rounded-[18px] border-gray-200">
                <SelectValue placeholder="Выберите тип шоу" />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {SHOW_TYPES.map((show) => (
                  <SelectItem key={show.id} value={show.id} className="rounded-[18px]">
                    {show.emoji} {show.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-700">Условия площадки</p>
              
              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={(formData.details as ShowDetails)?.hasElectricity || false}
                  onCheckedChange={(checked) => updateDetails({ hasElectricity: !!checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-gray-700">Есть электричество</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={(formData.details as ShowDetails)?.outdoorOk || false}
                  onCheckedChange={(checked) => updateDetails({ outdoorOk: !!checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-gray-700">Можно на улице</span>
              </label>
            </div>
          </div>
        )}

        {/* === СПЕЦИФИЧНЫЕ ПОЛЯ ДЛЯ МАСТЕР-КЛАССА === */}
        {formData.category === 'masterclass' && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 space-y-4">
            <p className="font-semibold text-gray-900">Направление</p>
            
            <Select
              value={(formData.details as any)?.direction || ''}
              onValueChange={(value) => updateDetails({ direction: value || undefined })}
            >
              <SelectTrigger className="h-12 rounded-[18px] border-gray-200">
                <SelectValue placeholder="Выберите направление" />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {MASTERCLASS_TYPES.map((mc) => (
                  <SelectItem key={mc.id} value={mc.id} className="rounded-[18px]">
                    {mc.emoji} {mc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={(formData.details as any)?.materialsIncluded || false}
                  onCheckedChange={(checked) => updateDetails({ materialsIncluded: !!checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-gray-700">Материалы включены в стоимость</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-[18px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <Checkbox 
                  checked={(formData.details as any)?.takeHomeResult || false}
                  onCheckedChange={(checked) => updateDetails({ takeHomeResult: !!checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm text-gray-700">Результат на память детям</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// === ШАГ: Только дети (без специфики) ===
function StepChildren({ 
  count,
  ageRange,
  birthdayChild,
  onChange 
}: { 
  count?: number
  ageRange?: { from: number; to: number }
  birthdayChild?: { name: string; age: number }
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  const [showBirthday, setShowBirthday] = useState(!!birthdayChild?.name)

  const handleCountChange = (value: string) => {
    const num = parseInt(value) || 0
    if (num >= 0 && num <= 100) {
      onChange({ childrenCount: num })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Расскажите о детях
        </h1>
      </div>

      <div className="space-y-4">
        {/* Количество детей */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Сколько детей?
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onChange({ childrenCount: Math.max(1, (count || 1) - 1) })}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={count || ''}
              onChange={(e) => handleCountChange(e.target.value)}
              className="w-20 h-14 text-center text-3xl font-bold text-gray-900 border-2 border-gray-200 rounded-[18px] focus:border-orange-500 focus:outline-none"
              min={1}
              max={100}
            />
            <button
              onClick={() => onChange({ childrenCount: Math.min(100, (count || 1) + 1) })}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Возраст */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Возраст детей
          </label>
          <div className="flex gap-3 items-center">
            <Select
              value={String(ageRange?.from || 5)}
              onValueChange={(value) => onChange({ 
                childrenAgeRange: { 
                  from: Number(value), 
                  to: Math.max(Number(value), ageRange?.to || 8)
                } 
              })}
            >
              <SelectTrigger className="flex-1 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-gray-400 font-medium">—</span>
            <Select
              value={String(ageRange?.to || 8)}
              onValueChange={(value) => onChange({ 
                childrenAgeRange: { 
                  from: Math.min(ageRange?.from || 5, Number(value)), 
                  to: Number(value) 
                } 
              })}
            >
              <SelectTrigger className="flex-1 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Именинник */}
        <button
          onClick={() => setShowBirthday(!showBirthday)}
          className={cn(
            "w-full p-4 rounded-[24px] border-2 flex items-center gap-3 transition-all bg-white",
            showBirthday 
              ? "border-orange-500 bg-orange-50" 
              : "border-gray-200 hover:border-orange-300"
          )}
        >
          <Cake className={cn(
            "w-6 h-6",
            showBirthday ? "text-orange-500" : "text-gray-400"
          )} />
          <span className={cn(
            "font-medium",
            showBirthday ? "text-orange-700" : "text-gray-700"
          )}>
            Есть именинник
          </span>
        </button>

        {showBirthday && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100 flex gap-3">
            <Input
              type="text"
              value={birthdayChild?.name || ''}
              onChange={(e) => onChange({ 
                birthdayChild: { 
                  name: e.target.value, 
                  age: birthdayChild?.age || 6 
                } 
              })}
              placeholder="Имя ребёнка"
              className="flex-1 h-12 rounded-[18px]"
            />
            <Select
              value={String(birthdayChild?.age || 6)}
              onValueChange={(value) => onChange({ 
                birthdayChild: { 
                  name: birthdayChild?.name || '', 
                  age: Number(value) 
                } 
              })}
            >
              <SelectTrigger className="w-28 h-12 rounded-[18px] border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {AGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}

// === ШАГ: Детали ===
function StepDetails({ 
  formData,
  onChange 
}: { 
  formData: CreateRequestFormData
  onChange: (data: Partial<CreateRequestFormData>) => void 
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Получаем теги для текущей категории
  const availableTags = formData.category 
    ? DESCRIPTION_TEMPLATES[formData.category] 
    : DESCRIPTION_TEMPLATES.other

  // Добавление/удаление тега
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
      return newTags
    })
  }

  // Форматирование телефона
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const cleanDigits = digits.startsWith('7') || digits.startsWith('8') 
      ? digits.slice(1) 
      : digits
    
    let formatted = '+7'
    if (cleanDigits.length > 0) formatted += ` (${cleanDigits.slice(0, 3)}`
    if (cleanDigits.length >= 3) formatted += ')'
    if (cleanDigits.length > 3) formatted += ` ${cleanDigits.slice(3, 6)}`
    if (cleanDigits.length > 6) formatted += `-${cleanDigits.slice(6, 8)}`
    if (cleanDigits.length > 8) formatted += `-${cleanDigits.slice(8, 10)}`
    
    return formatted
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    onChange({ contactPhone: formatted })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Детали и пожелания
        </h1>
      </div>

      <div className="space-y-4">
        {/* Быстрые теги */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Добавьте пожелания
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  selectedTags.includes(tag)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Выбрано: {selectedTags.join(', ')}
            </p>
          )}
        </div>

        {/* Описание */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Опишите подробнее
          </label>
          <Textarea
            value={formData.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={formData.category 
              ? DESCRIPTION_PLACEHOLDERS[formData.category] 
              : 'Опишите, что вам нужно: тип мероприятия, пожелания по программе и любые другие детали.'
            }
            className="min-h-[120px] rounded-[18px] resize-none border-gray-200"
          />
        </div>

        {/* Бюджет */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Бюджет
          </label>
          <div className="flex gap-3">
            <Select
              value={formData.budget ? String(formData.budget) : ''}
              onValueChange={(value) => onChange({ budget: value ? Number(value) : undefined })}
              disabled={formData.budgetNegotiable}
            >
              <SelectTrigger className={cn(
                "flex-1 h-12 rounded-[18px] border-gray-200",
                formData.budgetNegotiable && "opacity-50"
              )}>
                <SelectValue placeholder="Не указан" />
              </SelectTrigger>
              <SelectContent className="rounded-[28px]">
                {BUDGET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="rounded-[18px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => onChange({ budgetNegotiable: !formData.budgetNegotiable, budget: undefined })}
              className={cn(
                "px-4 h-12 rounded-full border-2 transition-all whitespace-nowrap font-medium",
                formData.budgetNegotiable 
                  ? "border-orange-500 bg-orange-50 text-orange-700" 
                  : "border-gray-200 text-gray-600 hover:border-orange-300"
              )}
            >
              Договорная
            </button>
          </div>
        </div>

        {/* Способ оплаты (для профессионалов) */}
        {(formData.clientType === 'venue' || formData.clientType === 'organizer' || formData.clientType === 'colleague') && (
          <div className="bg-white rounded-[24px] p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Способ оплаты
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChange({ paymentType: opt.id as any })}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                    formData.paymentType === opt.id 
                      ? "border-orange-500 bg-orange-50 text-orange-700" 
                      : "border-gray-200 text-gray-600 hover:border-orange-300"
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Контактные данные из профиля */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Контактные данные
            </label>
            <span className="text-xs text-gray-400">из вашего профиля</span>
          </div>
          
          {/* Имя */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Имя</label>
            <Input
              type="text"
              value={formData.contactName || ''}
              onChange={(e) => onChange({ contactName: e.target.value })}
              placeholder="Как к вам обращаться?"
              className="h-11 rounded-[18px] border-gray-200"
            />
          </div>
          
          {/* Телефон */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Телефон</label>
            <Input
              type="tel"
              value={formData.contactPhone || '+7'}
              onChange={handlePhoneChange}
              placeholder="+7 (___) ___-__-__"
              className="h-11 text-base rounded-[18px] border-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              Виден только исполнителям, которых вы выберете
            </p>
          </div>
        </div>

        {/* Способ связи */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Предпочтительный способ связи
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ contactMethod: opt.id as any })}
                className={cn(
                  "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                  formData.contactMethod === opt.id 
                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                )}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Время для связи */}
        <div className="bg-white rounded-[24px] p-4 border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Удобное время для связи
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTACT_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ preferredContactTime: opt.id })}
                className={cn(
                  "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                  formData.preferredContactTime === opt.id 
                    ? "border-orange-500 bg-orange-50 text-orange-700" 
                    : "border-gray-200 text-gray-600 hover:border-orange-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRequestWizard
