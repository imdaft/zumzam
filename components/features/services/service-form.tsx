'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, X, Plus, Copy } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  animatorDetailsSchema,
  showDetailsSchema,
  venueDetailsSchema,
  questDetailsSchema,
  masterClassDetailsSchema,
  photographerDetailsSchema,
  baseServiceSchema,
  ServiceTypeEnum
} from '@/lib/validations/service'

const formSchema = baseServiceSchema.extend({
  details: z.union([
    animatorDetailsSchema,
    showDetailsSchema,
    venueDetailsSchema,
    questDetailsSchema,
    masterClassDetailsSchema,
    photographerDetailsSchema,
    z.record(z.any())
  ])
})

type FormValues = z.infer<typeof formSchema>

interface ServiceFormProps {
  initialData?: any
  profileCategory: string
  profileId: string
  isEditMode?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function ServiceForm({ 
  initialData, 
  profileCategory, 
  profileId,
  isEditMode = false,
  onSuccess,
  onCancel
}: ServiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Инициализация tier_packages из initialData если они есть
  const initialTierPackages = initialData?.details?.tier_packages || []
  const [tierPackages, setTierPackages] = useState<Array<{
    name: string, 
    price: number, 
    duration: number, 
    includes: string[],
    highlighted_includes?: string[],
    savings?: number,
    price_options?: Array<{condition: string, price: number}>
  }>>( initialTierPackages)
  const [showTierPackages, setShowTierPackages] = useState(initialTierPackages.length > 0)

  const defaultServiceType = isEditMode ? initialData.service_type : 
    (profileCategory === 'agency' ? 'animator' : profileCategory)

  // Очищаем null значения из initialData (заменяем на пустые строки или 0)
  // Поддержка name (из БД) и title (для формы)
  const cleanedInitialData = initialData ? {
    ...initialData,
    title: initialData.name || initialData.title || '',
    description: initialData.description || '',
    price: initialData.price ?? 0,
    price_type: initialData.price_type || 'fixed',
    duration: initialData.duration ?? 60,
    images: initialData.images || [],
    service_type: initialData.service_type || defaultServiceType,
    is_additional: initialData.is_additional ?? false,
    is_package: initialData.is_package ?? false,
    package_includes: initialData.package_includes || [],
    details: initialData.details || {}
  } : null

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: cleanedInitialData || {
      title: '',
      description: '',
      price: 0,
      price_type: 'fixed',
      duration: 60,
      images: [],
      service_type: defaultServiceType,
      is_additional: false,
      is_package: false,
      package_includes: [],
      details: {}
    }
  })

  // Категории, которые не поддерживают пакеты и "праздники под ключ"
  const simpleServiceCategories = ['animator', 'show', 'quest', 'master_class', 'photographer']
  const isSimpleServiceCategory = 
    simpleServiceCategories.includes(profileCategory) ||
    (profileCategory === 'agency' && simpleServiceCategories.includes(form.watch('service_type')))
  
  // Для совместимости с существующим кодом (аниматоры)
  const isAnimatorService = isSimpleServiceCategory

  // Для простых категорий пакеты/под ключ не поддерживаем — принудительно держим выключенными
  const forceAnimatorServiceTypeConstraints = () => {
    if (!isSimpleServiceCategory) return
    form.setValue('is_package', false, { shouldDirty: true })
    form.setValue('package_includes', [], { shouldDirty: true })
    setShowTierPackages(false)
    setTierPackages([])
  }

  useEffect(() => {
    // Если это услуга аниматора (или агентство выбрало тип animator) — всегда сбрасываем пакеты.
    // Это защищает от старых данных (is_package/tier_packages) и не даёт UI "застрять" без выбранного типа.
    if (!isAnimatorService) return
    const isPkg = Boolean(form.getValues('is_package'))
    if (isPkg || showTierPackages || (tierPackages?.length || 0) > 0) {
      forceAnimatorServiceTypeConstraints()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimpleServiceCategory])

  const onSubmit = async (values: FormValues) => {
    console.log('[ServiceForm] ===== onSubmit STARTED =====')
    console.log('[ServiceForm] Form values:', values)
    
    setIsLoading(true)
    try {
      console.log('[ServiceForm] onSubmit called', { 
        isEditMode, 
        profileId,
        serviceType: values.service_type,
        hasImages: values.images?.length || 0
      })
      
      const url = isEditMode ? `/api/services/${initialData.id}` : '/api/services'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Для аниматоров запрещаем создание пакетов/под ключ
      const cleanedValues: FormValues = isAnimatorService
        ? ({
            ...values,
            is_package: false,
            package_includes: [],
            details: {
              ...(values.details || {}),
              tier_packages: undefined,
            },
          } as FormValues)
        : values

      // Для многоуровневых пакетов автоматически вычисляем минимальную цену
      let finalPrice = cleanedValues.price
      let finalPriceType = cleanedValues.price_type
      
      if (!isSimpleServiceCategory && showTierPackages && tierPackages.length > 0) {
        const prices = tierPackages.map(t => t.price).filter(p => p > 0)
        if (prices.length > 0) {
          finalPrice = Math.min(...prices)
          finalPriceType = 'from'
        }
      }

      // Добавляем profile_id и tier_packages в тело запроса
      // Переименовываем title -> name для совместимости с базой данных
      const { title, ...restValues } = cleanedValues
      const body = {
        ...restValues,
        name: title, // Используем name вместо title
        price: finalPrice,
        price_type: finalPriceType,
        profile_id: profileId,
        details: {
          ...(cleanedValues.details || {}),
          tier_packages: !isAnimatorService && showTierPackages ? tierPackages : undefined
        }
      }

      console.log('[ServiceForm] Sending request to:', url, { method, bodySize: JSON.stringify(body).length })

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      console.log('[ServiceForm] Response status:', res.status)

      if (!res.ok) {
        const errorData = await res.json()
        console.error('[ServiceForm] API error response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to save service')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        // Fallback behavior
        router.refresh()
        router.back()
      }
    } catch (error) {
      console.error('[ServiceForm] Error saving service:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при сохранении услуги'
      setTimeout(() => alert(`Ошибка: ${errorMessage}`), 0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'services')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const { url } = await res.json()
      
      const currentImages = form.getValues('images') || []
      form.setValue('images', [...currentImages, url])
    } catch (error: any) {
      console.error('[ServiceForm] Error uploading image:', error)
      setTimeout(() => alert(`Ошибка загрузки: ${error.message || 'Неизвестная ошибка'}`), 0)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images')
    form.setValue('images', currentImages.filter((_, i) => i !== index))
  }

  // Обработчик ошибок валидации
  const onError = (errors: any) => {
    console.error('[ServiceForm] ===== VALIDATION ERRORS =====')
    console.error('[ServiceForm] Errors:', errors)
    console.error('[ServiceForm] Form values:', form.getValues())
    
    // Форматируем ошибки для показа
    const errorMessages = Object.entries(errors).map(([key, val]: [string, any]) => {
      if (Array.isArray(val)) {
        return `${key}: ${val.map((v: any, i: number) => `[${i}] ${v?.message || JSON.stringify(v)}`).join(', ')}`
      }
      return `${key}: ${val.message || JSON.stringify(val)}`
    }).join('\n')
    
    alert(`Ошибки валидации формы:\n\n${errorMessages}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8 max-w-3xl mx-auto pb-20">
        
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Основная информация</h2>
          
          {/* Выбор типа услуги: Основная / Дополнительная / Праздник под ключ / Пакетное предложение */}
          <FormField
            control={form.control}
            name="is_additional"
            render={({ field: additionalField }) => (
              <FormField
                control={form.control}
                name="is_package"
                render={({ field: packageField }) => (
                  <FormItem>
                    <FormLabel>Тип услуги</FormLabel>
                    <div className={`grid gap-3 ${isSimpleServiceCategory ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          additionalField.onChange(false)
                          packageField.onChange(false)
                          setShowTierPackages(false)
                          if (isSimpleServiceCategory) forceAnimatorServiceTypeConstraints()
                        }}
                        className={`px-4 py-3 rounded-full font-medium transition-all ${
                          !additionalField.value && !packageField.value
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {profileCategory === 'animator' ? 'Программа' : 'Основная'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          additionalField.onChange(true)
                          packageField.onChange(false)
                          setShowTierPackages(false)
                          if (isSimpleServiceCategory) forceAnimatorServiceTypeConstraints()
                        }}
                        className={`px-4 py-3 rounded-full font-medium transition-all ${
                          additionalField.value && !packageField.value
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {profileCategory === 'animator' ? 'Доп. услуга' : 'Дополнительная'}
                      </button>
                      {!isSimpleServiceCategory && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              additionalField.onChange(false)
                              packageField.onChange(true)
                              setShowTierPackages(false)
                            }}
                            className={`px-4 py-3 rounded-full font-medium transition-all ${
                              packageField.value && !showTierPackages
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Праздник под ключ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              additionalField.onChange(false)
                              packageField.onChange(true)
                              setShowTierPackages(true)
                              if (tierPackages.length === 0) {
                                setTierPackages([{ name: '', price: 0, duration: 60, includes: [''], price_options: [] }])
                              }
                            }}
                            className={`px-4 py-3 rounded-full font-medium transition-all ${
                              showTierPackages
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Пакеты (Эконом/VIP)
                          </button>
                        </>
                      )}
                    </div>
                    <FormDescription>
                      {isSimpleServiceCategory ? (
                        <>
                          {profileCategory === 'animator' && (
                            <>
                              <strong>Программа</strong> — основная программа аниматора. <strong>Доп. услуги</strong> — аквагрим, шоу пузырей, мини‑мастер‑класс и т.п.
                            </>
                          )}
                          {profileCategory === 'show' && (
                            <>
                              <strong>Основная</strong> — ваши шоу-программы. <strong>Дополнительная</strong> — реквизит, звук, свет и другие опции.
                            </>
                          )}
                          {profileCategory === 'quest' && (
                            <>
                              <strong>Основная</strong> — квест-программы. <strong>Дополнительная</strong> — реквизит, аниматоры, фото/видеосъёмка.
                            </>
                          )}
                          {profileCategory === 'master_class' && (
                            <>
                              <strong>Основная</strong> — мастер-классы. <strong>Дополнительная</strong> — материалы, расходники, дополнительное время.
                            </>
                          )}
                          {profileCategory === 'photographer' && (
                            <>
                              <strong>Основная</strong> — фотосъёмка. <strong>Дополнительная</strong> — дополнительные часы, ретушь, печать фото, фотокниги.
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <strong>Основные</strong> — аниматоры, шоу. <strong>Дополнительные</strong> — оборудование, декор. <strong>Праздник под ключ</strong> — готовый пакет с фиксированным наполнением. <strong>Пакеты</strong> — несколько уровней на выбор (Эконом, Стандарт, VIP).
                        </>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />
          
          {profileCategory === 'agency' && (
            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория услуги</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-[18px]">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="animator">Аниматор</SelectItem>
                      <SelectItem value="show">Шоу</SelectItem>
                      <SelectItem value="venue">Площадка</SelectItem>
                      <SelectItem value="quest">Квест</SelectItem>
                      <SelectItem value="master_class">Мастер-класс</SelectItem>
                      <SelectItem value="photographer">Фотограф</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Так как вы агентство, вы можете создавать услуги разных типов.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название услуги</FormLabel>
                <FormControl>
                  <Input placeholder="Например: Шоу мыльных пузырей" {...field} className="rounded-[18px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Расскажите подробно, что входит в услугу..." 
                    className="min-h-[120px] rounded-[18px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Скрываем поля цены и длительности для многоуровневых пакетов */}
          {!showTierPackages && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Стоимость (₽)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="rounded-[18px]" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип оплаты</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-[18px]">
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Фиксированная цена</SelectItem>
                          <SelectItem value="from">От (минимальная цена)</SelectItem>
                          <SelectItem value="hourly">В час</SelectItem>
                          <SelectItem value="per_person">За человека</SelectItem>
                          <SelectItem value="negotiable">Договорная</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Длительность (мин)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60" 
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="rounded-[18px]" 
                      />
                    </FormControl>
                    <FormDescription>Примерное время оказания услуги</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Что включено в пакет (для простого "Праздника под ключ") */}
          {form.watch('is_package') && !form.watch('details.tier_packages') && !isAnimatorService && (
            <FormField
              control={form.control}
              name="package_includes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Что включено в праздник под ключ</FormLabel>
                  <FormDescription className="mb-3">
                    Введите элемент и нажмите Enter. Например: "Ведущий", "Фотозона", "8 детей участников"
                  </FormDescription>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Например: Ведущий"
                        className="rounded-[18px] h-12"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const input = e.currentTarget
                            const value = input.value.trim()
                            const currentValues = field.value || []
                            if (value && !currentValues.includes(value)) {
                              field.onChange([...currentValues, value])
                              input.value = ''
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-[18px] h-12 px-4"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          const value = input?.value.trim()
                          const currentValues = field.value || []
                          if (value && !currentValues.includes(value)) {
                            field.onChange([...currentValues, value])
                            input.value = ''
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((item, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium"
                          >
                            <span>✓ {item}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentValues = field.value || []
                                field.onChange(currentValues.filter((_, i) => i !== index))
                              }}
                              className="hover:bg-orange-100 rounded-full p-0.5"
                            >
                              <X className="w-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Пакетные предложения с уровнями (Эконом, Стандарт, VIP) */}
          {showTierPackages && !isSimpleServiceCategory && (
            <div className="space-y-6 p-6 bg-gradient-to-br from-orange-50 to-white rounded-[28px] border-2 border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Пакетные предложения</h3>
                  <p className="text-sm text-muted-foreground">Создайте несколько уровней (Эконом, Стандарт, VIP)</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-12 rounded-full"
                  onClick={() => {
                    setTierPackages([...tierPackages, { name: '', price: 0, duration: 60, includes: [''], price_options: [] }])
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить пакет
                </Button>
              </div>

              <div className="space-y-4">
                {tierPackages.map((tier, tierIndex) => (
                  <div key={tierIndex} className="bg-white rounded-[28px] border-2 border-orange-200 p-5 relative">
                    {/* Кнопки управления */}
                    <div className="absolute -top-2 -right-2 flex gap-1">
                      {/* Кнопка дублировать */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-white border-slate-200 hover:bg-orange-50"
                        onClick={() => {
                          const duplicated = { ...tier, name: `${tier.name} (копия)` }
                          const updated = [...tierPackages]
                          updated.splice(tierIndex + 1, 0, duplicated)
                          setTierPackages(updated)
                        }}
                        title="Дублировать пакет"
                      >
                        <Copy className="w-3.5 h-3.5 text-orange-600" />
                      </Button>
                      
                      {/* Кнопка удалить */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => {
                          setTierPackages(tierPackages.filter((_, i) => i !== tierIndex))
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Название пакета */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Название</label>
                        <Input
                          placeholder="Эконом"
                          className="h-10 rounded-[18px] font-semibold"
                          value={tier.name || ''}
                          onChange={(e) => {
                            const updated = [...tierPackages]
                            updated[tierIndex] = { ...tier, name: e.target.value }
                            setTierPackages(updated)
                          }}
                        />
                      </div>

                      {/* Цена */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Стоимость (₽)</label>
                        <Input
                          type="number"
                          placeholder="10000"
                          className="h-10 rounded-[18px]"
                          value={tier.price || 0}
                          onChange={(e) => {
                            const updated = [...tierPackages]
                            updated[tierIndex] = { ...tier, price: parseInt(e.target.value) || 0 }
                            setTierPackages(updated)
                          }}
                        />
                      </div>

                      {/* Длительность */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Длительность (мин)</label>
                        <Input
                          type="number"
                          placeholder="60"
                          className="h-10 rounded-[18px]"
                          value={tier.duration || 60}
                          onChange={(e) => {
                            const updated = [...tierPackages]
                            updated[tierIndex] = { ...tier, duration: parseInt(e.target.value) || 60 }
                            setTierPackages(updated)
                          }}
                        />
                      </div>
                      
                      {/* Экономия */}
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1.5 block">Экономия (₽)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-10 rounded-[18px]"
                          value={tier.savings || ''}
                          onChange={(e) => {
                            const updated = [...tierPackages]
                            const value = e.target.value ? parseInt(e.target.value) : undefined
                            updated[tierIndex] = { ...tier, savings: value }
                            setTierPackages(updated)
                          }}
                        />
                        <p className="text-xs text-slate-500 mt-1">Необязательно</p>
                      </div>

                      {/* Что включено */}
                      <div className="md:col-span-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-slate-600">Что включено</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const updated = [...tierPackages]
                              updated[tierIndex] = { 
                                ...tier, 
                                includes: [...(tier.includes || []), ''] 
                              }
                              setTierPackages(updated)
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Добавить
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {(tier.includes || []).map((item: string, itemIndex: number) => (
                            <div key={itemIndex} className="flex gap-2 items-start">
                              <Input
                                placeholder="Например: 2 часа времени"
                                className="h-9 rounded-[18px] text-sm flex-1"
                                value={item}
                                onChange={(e) => {
                                  const updated = [...tierPackages]
                                  const includes = [...(tier.includes || [])]
                                  includes[itemIndex] = e.target.value
                                  updated[tierIndex] = { ...tier, includes }
                                  setTierPackages(updated)
                                }}
                              />
                              <label className="flex items-center gap-1.5 px-2 py-2 bg-slate-50 rounded-[18px] hover:bg-slate-100 transition-colors cursor-pointer shrink-0" title="Выделить как уникальное отличие">
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 rounded-[18px] border-slate-300 text-orange-600 focus:ring-orange-600"
                                  checked={(tier.highlighted_includes || []).includes(item)}
                                  onChange={(e) => {
                                    const updated = [...tierPackages]
                                    const highlighted = tier.highlighted_includes || []
                                    if (e.target.checked) {
                                      updated[tierIndex] = { 
                                        ...tier, 
                                        highlighted_includes: [...highlighted, item] 
                                      }
                                    } else {
                                      updated[tierIndex] = { 
                                        ...tier, 
                                        highlighted_includes: highlighted.filter((h: string) => h !== item) 
                                      }
                                    }
                                    setTierPackages(updated)
                                  }}
                                />
                                <span className="text-xs text-slate-600">★</span>
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => {
                                  const updated = [...tierPackages]
                                  updated[tierIndex] = { 
                                    ...tier, 
                                    includes: tier.includes.filter((_: string, i: number) => i !== itemIndex),
                                    highlighted_includes: (tier.highlighted_includes || []).filter((h: string) => h !== item)
                                  }
                                  setTierPackages(updated)
                                }}
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          💡 Отметьте звёздочкой уникальные пункты, чтобы выделить их на странице профиля
                        </p>
                      </div>

                      {/* Особенности цены (будни/выходные) */}
                      <div className="md:col-span-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-slate-600">Особенности цены (до 3 вариантов)</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const updated = [...tierPackages]
                              const currentOptions = tier.price_options || []
                              if (currentOptions.length < 3) {
                                updated[tierIndex] = { 
                                  ...tier, 
                                  price_options: [...currentOptions, { condition: '', price: 0 }] 
                                }
                                setTierPackages(updated)
                              }
                            }}
                            disabled={(tier.price_options || []).length >= 3}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Добавить вариант
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(tier.price_options || []).map((option: any, optionIndex: number) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                placeholder="Например: Будни"
                                className="h-9 rounded-[18px] text-sm flex-1"
                                value={option.condition}
                                onChange={(e) => {
                                  const updated = [...tierPackages]
                                  const options = [...(tier.price_options || [])]
                                  options[optionIndex] = { ...option, condition: e.target.value }
                                  updated[tierIndex] = { ...tier, price_options: options }
                                  setTierPackages(updated)
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="15000"
                                className="h-9 rounded-[18px] text-sm w-32"
                                value={option.price || 0}
                                onChange={(e) => {
                                  const updated = [...tierPackages]
                                  const options = [...(tier.price_options || [])]
                                  options[optionIndex] = { ...option, price: parseInt(e.target.value) || 0 }
                                  updated[tierIndex] = { ...tier, price_options: options }
                                  setTierPackages(updated)
                                }}
                              />
                              <span className="text-xs text-slate-500 self-center">₽</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => {
                                  const updated = [...tierPackages]
                                  updated[tierIndex] = { 
                                    ...tier, 
                                    price_options: (tier.price_options || []).filter((_: any, i: number) => i !== optionIndex) 
                                  }
                                  setTierPackages(updated)
                                }}
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          ))}
                          {(!tier.price_options || tier.price_options.length === 0) && (
                            <p className="text-xs text-slate-500 italic">
                              Нажмите "Добавить вариант" для указания разных цен (будни/выходные)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(!form.watch('details.tier_packages') || form.watch('details.tier_packages').length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Нет пакетов. Добавьте первый пакет (например, "Эконом", "Стандарт", "VIP")</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <FormLabel>Фотографии</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(form.watch('images') || []).map((url, index) => (
                <div key={index} className="relative aspect-square rounded-[24px] overflow-hidden group">
                  <img src={url} alt={`Service ${index}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.12)] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Добавить фото</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-full"
            onClick={() => onCancel ? onCancel() : router.back()}
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full min-w-[150px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Сохранить изменения' : 'Создать услугу'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
