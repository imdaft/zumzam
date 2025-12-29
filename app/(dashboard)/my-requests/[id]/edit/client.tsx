'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, Save, Cake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  CLIENT_TYPES,
  CATEGORIES,
  VENUE_TYPES,
  AGE_OPTIONS,
  BUDGET_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  CONTACT_TIME_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  SPB_DISTRICTS,
  LO_DISTRICTS,
} from '@/lib/types/order-request'
import { cn } from '@/lib/utils'

interface EditRequestClientProps {
  request: any
}

export function EditRequestClient({ request }: EditRequestClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBirthday, setShowBirthday] = useState(!!(request.birthday_child_name || request.birthday_child_age))
  
  const [formData, setFormData] = useState({
    title: request.title || '',
    description: request.description || '',
    category: request.category || '',
    client_type: request.client_type || 'parent',
    company_name: request.company_name || '',
    event_date: request.event_date || '',
    event_time: request.event_time || '',
    city: request.city || 'Санкт-Петербург',
    district: request.district || '',
    venue_type: request.venue_type || '',
    venue_address: request.venue_address || '',
    metro: request.metro || '',
    budget: request.budget || '',
    budget_negotiable: request.budget_negotiable || false,
    children_count: request.children_count || 10,
    children_age_from: request.children_age_from || 5,
    children_age_to: request.children_age_to || 8,
    birthday_child_name: request.birthday_child_name || '',
    birthday_child_age: request.birthday_child_age || 6,
    is_urgent: request.is_urgent || false,
    contact_name: request.contact_name || '',
    contact_phone: request.contact_phone || '',
    contact_method: request.contact_method || 'chat',
    contact_time: request.contact_time || 'anytime',
    payment_type: request.payment_type || '',
  })

  const districts = formData.city === 'Ленобласть' ? LO_DISTRICTS : SPB_DISTRICTS

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Очищаем данные именинника, если он не выбран
          birthday_child_name: showBirthday ? formData.birthday_child_name : null,
          birthday_child_age: showBirthday ? formData.birthday_child_age : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при обновлении объявления')
      }

      toast.success('Объявление обновлено!')
      router.push(`/my-requests/${request.id}`)
    } catch (error: any) {
      console.error('Ошибка:', error)
      toast.error('Не удалось обновить объявление', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2">
        <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] px-3 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
            type="button"
            aria-label="Назад"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-gray-900 truncate">Редактировать объявление</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 px-4 text-sm font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-4">
          {/* Основная информация */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Основная информация</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Например: Аниматор на детский праздник"
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client_type">Тип заказчика</Label>
                <Select value={formData.client_type} onValueChange={(value) => handleChange('client_type', value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.emoji} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.client_type === 'venue' || formData.client_type === 'organizer') && (
                <div>
                  <Label htmlFor="company_name">Название организации</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="ТРЦ Галерея"
                    className="mt-1.5"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Расскажите подробнее о вашем празднике..."
                  className="mt-1.5 min-h-[120px]"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Дата и место */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Дата и место</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_date">Дата мероприятия</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleChange('event_date', e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="event_time">Время</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => handleChange('event_time', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Регион</Label>
                <div className="flex gap-2 mt-1.5">
                  {['Санкт-Петербург', 'Ленобласть'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange('city', c)}
                      className={cn(
                        "flex-1 h-10 rounded-full border-2 font-medium transition-all text-sm",
                        formData.city === c 
                          ? "border-orange-500 bg-orange-50 text-orange-700" 
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="district">Район</Label>
                <Select value={formData.district || 'any'} onValueChange={(value) => handleChange('district', value === 'any' ? '' : value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Любой район" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="any">Любой район</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="venue_type">Тип площадки</Label>
                <Select value={formData.venue_type || 'none'} onValueChange={(value) => handleChange('venue_type', value === 'none' ? '' : value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Не указан" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указан</SelectItem>
                    {VENUE_TYPES.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.client_type === 'venue' || formData.client_type === 'organizer' || formData.client_type === 'colleague') && (
                <>
                  <div>
                    <Label htmlFor="venue_address">Адрес</Label>
                    <Input
                      id="venue_address"
                      value={formData.venue_address}
                      onChange={(e) => handleChange('venue_address', e.target.value)}
                      placeholder="ул. Пример, д. 1"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metro">Ближайшее метро</Label>
                    <Input
                      id="metro"
                      value={formData.metro}
                      onChange={(e) => handleChange('metro', e.target.value)}
                      placeholder="м. Невский проспект"
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="space-y-4">
          {/* Дети */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Участники</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="children_count">Количество детей</Label>
                <div className="flex items-center gap-4 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleChange('children_count', Math.max(1, formData.children_count - 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    value={formData.children_count}
                    onChange={(e) => handleChange('children_count', parseInt(e.target.value) || 0)}
                    className="w-20 h-10 text-center text-xl font-bold"
                    min={1}
                    max={100}
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('children_count', Math.min(100, formData.children_count + 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-orange-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <Label>Возраст детей</Label>
                <div className="flex gap-3 items-center mt-1.5">
                  <Select
                    value={String(formData.children_age_from)}
                    onValueChange={(value) => handleChange('children_age_from', Number(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-gray-400 font-medium">—</span>
                  <Select
                    value={String(formData.children_age_to)}
                    onValueChange={(value) => handleChange('children_age_to', Number(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Именинник */}
              <button
                type="button"
                onClick={() => setShowBirthday(!showBirthday)}
                className={cn(
                  "w-full p-4 rounded-[18px] border-2 flex items-center gap-3 transition-all",
                  showBirthday 
                    ? "border-orange-500 bg-orange-50" 
                    : "border-gray-200 hover:border-orange-300"
                )}
              >
                <Cake className={cn(
                  "w-5 h-5",
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
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={formData.birthday_child_name}
                    onChange={(e) => handleChange('birthday_child_name', e.target.value)}
                    placeholder="Имя ребёнка"
                    className="flex-1"
                  />
                  <Select
                    value={String(formData.birthday_child_age)}
                    onValueChange={(value) => handleChange('birthday_child_age', Number(value))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Бюджет и контакты */}
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Бюджет и контакты</h2>

            <div className="space-y-4">
              <div>
                <Label>Бюджет</Label>
                <div className="flex gap-3 mt-1.5">
                  <Select
                    value={formData.budget ? String(formData.budget) : 'none'}
                    onValueChange={(value) => handleChange('budget', value === 'none' ? '' : Number(value))}
                    disabled={formData.budget_negotiable}
                  >
                    <SelectTrigger className={cn("flex-1", formData.budget_negotiable && "opacity-50")}>
                      <SelectValue placeholder="Не указан" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не указан</SelectItem>
                      {BUDGET_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => handleChange('budget_negotiable', !formData.budget_negotiable)}
                    className={cn(
                      "px-4 h-10 rounded-full border-2 transition-all whitespace-nowrap font-medium",
                      formData.budget_negotiable 
                        ? "border-orange-500 bg-orange-50 text-orange-700" 
                        : "border-gray-200 text-gray-600 hover:border-orange-300"
                    )}
                  >
                    Договорная
                  </button>
                </div>
              </div>

              {(formData.client_type === 'venue' || formData.client_type === 'organizer' || formData.client_type === 'colleague') && (
                <div>
                  <Label>Способ оплаты</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {PAYMENT_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChange('payment_type', opt.id)}
                        className={cn(
                          "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                          formData.payment_type === opt.id 
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

              <div>
                <Label htmlFor="contact_name">Контактное имя</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleChange('contact_name', e.target.value)}
                  placeholder="Как к вам обращаться?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Телефон</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Способ связи</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {CONTACT_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange('contact_method', opt.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                        formData.contact_method === opt.id 
                          ? "border-orange-500 bg-orange-50 text-orange-700" 
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      )}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Удобное время для связи</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {CONTACT_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChange('contact_time', opt.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                        formData.contact_time === opt.id 
                          ? "border-orange-500 bg-orange-50 text-orange-700" 
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 rounded-[18px] border border-gray-100">
                <Checkbox 
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onCheckedChange={(checked) => handleChange('is_urgent', !!checked)}
                />
                <Label htmlFor="is_urgent" className="cursor-pointer">
                  Срочное объявление
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile submit button */}
        <div className="sm:hidden lg:col-span-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 rounded-full h-12 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </Button>
        </div>
      </form>

      <div className="h-20 lg:h-0" />
    </div>
  )
}





