/**
 * Страница оформления заказа (Checkout)
 * Клиент заполняет форму и создаёт заявку из корзины
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShoppingBag, Calendar as CalendarIcon, MapPin, User, Phone, Mail, MessageSquare, FileText, ExternalLink, Home, Globe, Clock, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { AddressSelector } from '@/components/features/profile/address-selector'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createOrderSchema, type CreateOrderFormData } from '@/lib/validations/order'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AlertCircle } from 'lucide-react'
import tracker from '@/lib/analytics/tracker'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useUser()
  const { items, getTotal, fetchCart, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [addressMode, setAddressMode] = useState<'branch' | 'custom'>('custom')

  // Состояние для TimePicker
  const [selectedHour, setSelectedHour] = useState<string>('')
  const [selectedMinute, setSelectedMinute] = useState<string>('')
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Получаем provider_id и profile_id из корзины
  const firstItem = items[0]
  const providerId = firstItem?.service?.profile_id
  const profileId = firstItem?.profile_id
  const activeProfileName = firstItem?.profile?.display_name

  // Загружаем профиль исполнителя для проверки наличия юр. документов и филиалов
  useEffect(() => {
    if (profileId) {
      fetch(`/api/profiles/by-id/${profileId}`)
        .then(res => res.json())
        .then(data => {
          setProviderProfile(data)
          // Если есть филиалы, по умолчанию ставим выбор филиала
          if (data.locations && data.locations.length > 0) {
            setAddressMode('branch')
          }
        })
        .catch(err => console.error('Error fetching provider profile:', err))
    }
  }, [profileId])

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      profile_id: '',
      provider_id: '',
      event_date: '',
      event_time: '',
      event_address: '',
      child_age: '' as any,
      children_count: '' as any,
      client_name: '',
      client_phone: '',
      client_email: '',
      client_message: '',
      agree_with_terms: false,
    },
  })

  // Синхронизация кастомного выбора времени с формой
  useEffect(() => {
    if (selectedHour && selectedMinute) {
      form.setValue('event_time', `${selectedHour}:${selectedMinute}`, { shouldValidate: true })
    }
  }, [selectedHour, selectedMinute, form])

  // Обновляем форму когда загружается корзина и пользователь
  useEffect(() => {
    if (providerId && profileId) {
      form.setValue('provider_id', providerId)
      form.setValue('profile_id', profileId)
    }
    if (profile?.full_name) {
      form.setValue('client_name', profile.full_name)
    }
    if (profile?.phone) {
      form.setValue('client_phone', profile.phone)
    }
    if (user?.email) {
      form.setValue('client_email', user.email)
    }
  }, [providerId, profileId, profile, user, form])

  const onSubmit = async (data: CreateOrderFormData) => {
    if (items.length === 0) {
      toast.error('Корзина пуста', {
        description: 'Добавьте услуги перед оформлением заявки',
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('[Checkout] Sending data:', data)
      
      // Добавляем total_amount к данным заказа
      const orderData = {
        ...data,
        total_amount: total, // Передаём общую стоимость из корзины
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      console.log('[Checkout] Response:', response.status, result)

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания заказа')
      }
      
      toast.success('Заявка отправлена! 🎉', {
        description: 'Мы свяжемся с вами в ближайшее время',
      })

      // Трекаем создание заказа
      if (result.order?.id && profileId) {
        tracker.trackOrderCreate(result.order.id, total, profileId)
      }

      // Переходим на страницу заказа СРАЗУ, не дожидаясь очистки корзины
      // чтобы избежать ре-рендера с пустой корзиной
      if (result.order?.id) {
        router.push(`/orders/${result.order.id}`)
      } else {
        router.push('/orders')
      }

      // Очищаем корзину асинхронно в фоне (не блокируем навигацию)
      clearCart().catch((clearError) => {
        console.error('[Checkout] Failed to clear cart:', clearError)
      })
    } catch (error: any) {
      console.error('[Checkout] Ошибка:', error)
      toast.error('Не удалось создать заявку', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearCart = async () => {
    const confirmClear = window.confirm('Очистить корзину и начать заново?')
    if (!confirmClear) return
    try {
      await clearCart()
      toast.success('Корзина очищена')
    } catch (error: any) {
      toast.error('Не удалось очистить корзину', { description: error?.message })
    }
  }

  // Фиксируем вход в checkout как старт оформления (для воронки)
  const total = getTotal()
  const hasLocations = providerProfile?.locations && providerProfile.locations.length > 0
  
  useEffect(() => {
    if (!profileId) return
    if (!items || items.length === 0) return
    tracker.trackCheckoutStartWithProfile(total, items.length, profileId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

  // Показываем пустую корзину ПОСЛЕ всех хуков
  if (items.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h1>
          <p className="text-gray-500 mb-6">Добавьте услуги, чтобы оформить заявку</p>
          <Button onClick={() => router.push('/')}>
            На главную
          </Button>
        </div>
      </div>
    )
  }
  
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Оформление заявки</h1>
        <p className="text-gray-500">Заполните форму, и мы свяжемся с вами для уточнения деталей</p>
        {activeProfileName && (
          <div className="mt-3 p-3 border rounded-xl bg-slate-50 text-sm text-slate-700 flex items-center justify-between gap-3">
            <span>Вы оформляете заявку у исполнителя: <strong>{activeProfileName}</strong></span>
            <Button variant="outline" size="sm" onClick={handleClearCart}>
              Очистить корзину
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Информация о мероприятии */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  Информация о мероприятии
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[13px] font-medium text-gray-700">Дата</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-12 w-full rounded-[16px] border-gray-200 bg-gray-50/50 hover:bg-white hover:border-orange-200 focus:ring-orange-500 pl-3 text-left font-normal transition-all",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "d MMMM yyyy", { locale: ru })
                                ) : (
                                  <span>Выберите дату</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 rounded-[16px]" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              locale={ru}
                              className="rounded-[16px]"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="event_time"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[13px] font-medium text-gray-700">Время</FormLabel>
                        <Popover open={isTimePopoverOpen} onOpenChange={setIsTimePopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "h-12 w-full rounded-[16px] border-gray-200 bg-gray-50/50 hover:bg-white hover:border-orange-200 focus:ring-orange-500 pl-3 text-left font-normal transition-all",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  field.value
                                ) : (
                                  <span>--:--</span>
                                )}
                                <Clock className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-0 rounded-[16px]" align="start">
                            <div className="flex h-[300px]">
                              {/* Часы */}
                              <div className="flex-1 overflow-y-auto border-r custom-scrollbar">
                                <div className="p-2 text-center font-medium text-xs text-gray-500 sticky top-0 bg-white border-b">
                                  Часы
                                </div>
                                <div className="p-1 space-y-1">
                                  {hours.map((hour) => (
                                    <div
                                      key={hour}
                                      onClick={() => {
                                        setSelectedHour(hour)
                                        // Если минуты не выбраны, ставим 00 по умолчанию
                                        if (!selectedMinute) setSelectedMinute('00')
                                      }}
                                      className={cn(
                                        "px-3 py-2 text-center rounded-lg cursor-pointer text-sm transition-colors",
                                        selectedHour === hour 
                                          ? "bg-orange-100 text-orange-700 font-semibold" 
                                          : "hover:bg-gray-100 text-gray-700"
                                      )}
                                    >
                                      {hour}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Минуты */}
                              <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-2 text-center font-medium text-xs text-gray-500 sticky top-0 bg-white border-b">
                                  Минуты
                                </div>
                                <div className="p-1 space-y-1">
                                  {minutes.map((minute) => (
                                    <div
                                      key={minute}
                                      onClick={() => {
                                        setSelectedMinute(minute)
                                        // Если часы не выбраны, автозакрытие не делаем
                                        if (selectedHour) setIsTimePopoverOpen(false)
                                      }}
                                      className={cn(
                                        "px-3 py-2 text-center rounded-lg cursor-pointer text-sm transition-colors",
                                        selectedMinute === minute 
                                          ? "bg-orange-100 text-orange-700 font-semibold" 
                                          : "hover:bg-gray-100 text-gray-700"
                                      )}
                                    >
                                      {minute}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Выбор адреса (Филиал или Свой адрес) */}
                <div className="mt-6 space-y-4">
                  {hasLocations && (
                    <div className="flex p-1 bg-gray-100 rounded-[14px] w-fit">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressMode('branch')
                          form.setValue('event_address', '')
                        }}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-[10px] transition-all",
                          addressMode === 'branch' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          В филиале
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddressMode('custom')
                          form.setValue('event_address', '')
                        }}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-[10px] transition-all",
                          addressMode === 'custom' 
                            ? "bg-white text-gray-900 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Выезд / Свой адрес
                        </div>
                      </button>
                    </div>
                  )}

                  {addressMode === 'branch' && hasLocations ? (
                    <FormField
                      control={form.control}
                      name="event_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] font-medium text-gray-700">Выберите филиал</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-[16px] border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-orange-500 transition-colors">
                                <SelectValue placeholder="Выберите филиал из списка" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providerProfile.locations.map((loc: any) => (
                                <SelectItem key={loc.id} value={`${loc.city}, ${loc.address} (${loc.name})`}>
                                  <span className="font-medium">{loc.name}</span>
                                  <span className="text-gray-500 ml-2 text-xs">{loc.city}, {loc.address}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="event_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <AddressSelector
                              city=""
                              address={field.value}
                              onAddressChange={(addr) => field.onChange(addr)}
                              label="Адрес проведения"
                              placeholder="Начните вводить адрес..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="child_age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-gray-700">Возраст ребенка</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="лет"
                            className="h-12 rounded-[16px] border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-orange-500 transition-colors"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value)
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="children_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium text-gray-700">Количество детей</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="человек"
                            className="h-12 rounded-[16px] border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-orange-500 transition-colors"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value)
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Контактная информация */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Ваши контакты
                </h2>
                <p className="text-sm text-gray-500 mb-4 -mt-2">
                  Данные заполнены автоматически из вашего профиля. 
                  <Link href="/settings" className="text-blue-600 hover:underline ml-1">
                    Изменить в настройках
                  </Link>
                </p>

                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-700">Ваше имя</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Иван Иванов" 
                          {...field} 
                          readOnly={!!profile?.full_name}
                          className={cn(
                            "h-12 rounded-[16px] border-gray-200 transition-colors",
                            profile?.full_name ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50/50 focus:bg-white"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_phone"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-[13px] font-medium text-gray-700">Телефон</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+7 (900) 123-45-67" 
                          {...field} 
                          readOnly={!!profile?.phone}
                          className={cn(
                            "h-12 rounded-[16px] border-gray-200 transition-colors",
                            profile?.phone ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50/50 focus:bg-white"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_email"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-[13px] font-medium text-gray-700">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="example@email.com" 
                          {...field} 
                          readOnly={!!user?.email}
                          className={cn(
                            "h-12 rounded-[16px] border-gray-200 transition-colors",
                            user?.email ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-gray-50/50 focus:bg-white"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_message"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="text-[13px] font-medium text-gray-700">Комментарий</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Дополнительные пожелания или вопросы..."
                          className="resize-none min-h-[100px] rounded-[16px] border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-orange-500 transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Если контактные данные изменились, укажите новые здесь
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Согласие с условиями исполнителя */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <FormField
                  control={form.control}
                  name="agree_with_terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1 rounded-md border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          required
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-slate-900 cursor-pointer">
                          Я ознакомлен(а) с условиями исполнителя{' '}
                          {providerProfile?.slug ? (
                            <Link
                              href={`/profiles/${providerProfile.slug}/legal`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              (посмотреть документы)
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-gray-500 text-xs">(документы не предоставлены)</span>
                          )}
                        </FormLabel>
                        <FormDescription className="text-xs text-slate-600 mt-1">
                          Договор заключается напрямую между вами и исполнителем. 
                          ZumZam не несёт ответственности за качество услуг.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-[16px] shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Отправка...
                  </>
                ) : (
                  'Отправить заявку'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Сводка заказа */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ваш заказ</h2>
            
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-dashed border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.service?.title}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 ml-2 whitespace-nowrap">
                    {(item.price_snapshot * item.quantity).toLocaleString()} ₽
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900">Итого:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {total.toLocaleString()} ₽
                </span>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-[16px] text-xs text-blue-800">
                <p className="font-bold mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Это предварительная заявка
                </p>
                <p className="opacity-90">Сервис свяжется с вами для уточнения деталей и окончательной стоимости.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
