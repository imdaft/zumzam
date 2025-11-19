'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Camera,
  Sparkles,
} from 'lucide-react'

import { useUser } from '@/lib/hooks/useUser'
import { 
  serviceSchema, 
  type ServiceInput,
  SERVICE_TAGS,
  AGE_CATEGORIES,
  DURATIONS,
} from '@/lib/validations/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Форма создания/редактирования услуги
 */
export function ServiceForm() {
  const router = useRouter()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [priceType, setPriceType] = useState<'fixed' | 'range'>('fixed')
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      price: null,
      price_from: null,
      price_to: null,
      currency: 'RUB',
      duration_minutes: null,
      age_from: null,
      age_to: null,
      capacity_min: null,
      capacity_max: null,
      tags: [],
      active: true,
      featured: false,
    },
  })

  // Загрузка фото
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (максимум 10MB)`)
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} - не изображение`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrlData.publicUrl)
      }

      setUploadedPhotos([...uploadedPhotos, ...uploadedUrls])
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError(err.message || 'Ошибка загрузки фото')
    } finally {
      setIsLoading(false)
    }
  }

  // Переключение тега
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      if (selectedTags.length < 10) {
        setSelectedTags([...selectedTags, tag])
      }
    }
  }

  // Установка возрастной категории
  const setAgeCategory = (from: number, to: number) => {
    form.setValue('age_from', from)
    form.setValue('age_to', to)
  }

  // Обработка отправки
  const onSubmit = async (data: ServiceInput) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const serviceData = {
        ...data,
        tags: selectedTags,
        photos: uploadedPhotos,
        // Если выбран фиксированный тип, обнуляем диапазон
        ...(priceType === 'fixed' && {
          price_from: null,
          price_to: null,
        }),
        // Если выбран диапазон, обнуляем фиксированную цену
        ...(priceType === 'range' && {
          price: null,
        }),
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания услуги')
      }

      // Успех!
      toast.success('Услуга создана!', {
        description: 'Услуга успешно добавлена в ваш профиль',
      })
      
      // Редирект на список услуг
      router.push('/services')
    } catch (err: any) {
      console.error('Create service error:', err)
      toast.error('Ошибка создания услуги', {
        description: err.message || 'Попробуйте позже',
      })
      setError(err.message || 'Ошибка создания услуги')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Ошибки */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>
              Расскажите об услуге, которую вы предлагаете
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Название */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название услуги *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Праздник с Человеком-пауком"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Краткое и понятное название
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Описание */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Подробно опишите услугу: что входит, как проходит, что необходимо..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Минимум 20 символов
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Цена */}
        <Card>
          <CardHeader>
            <CardTitle>Цена</CardTitle>
            <CardDescription>
              Укажите стоимость услуги
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Тип цены */}
            <div>
              <FormLabel>Тип цены *</FormLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriceType('fixed')}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    priceType === 'fixed'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  }`}
                >
                  Фиксированная
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType('range')}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    priceType === 'range'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  }`}
                >
                  Диапазон
                </button>
              </div>
            </div>

            {/* Фиксированная цена */}
            {priceType === 'fixed' && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="5000"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                        <span className="text-sm text-muted-foreground">₽</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Диапазон цен */}
            {priceType === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>От *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="3000"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                          <span className="text-sm text-muted-foreground">₽</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>До *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="10000"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                          <span className="text-sm text-muted-foreground">₽</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детали */}
        <Card>
          <CardHeader>
            <CardTitle>Детали услуги</CardTitle>
            <CardDescription>
              Дополнительная информация об услуге
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Длительность */}
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Длительность</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <select
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                      >
                        <option value="">Выберите длительность</option>
                        {DURATIONS.map((duration) => (
                          <option key={duration.value} value={duration.value}>
                            {duration.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Возраст */}
            <div className="space-y-2">
              <FormLabel>Возраст детей</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {AGE_CATEGORIES.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => setAgeCategory(category.value.from, category.value.to)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      form.watch('age_from') === category.value.from &&
                      form.watch('age_to') === category.value.to
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="age_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="От (лет)"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="До (лет)"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Вместимость */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Мин. детей</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Макс. детей</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="20"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Теги */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Теги
            </CardTitle>
            <CardDescription>
              Выберите теги, которые описывают вашу услугу (максимум 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  disabled={!selectedTags.includes(tag) && selectedTags.length >= 10}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Выбрано: {selectedTags.length}/10
            </p>
          </CardContent>
        </Card>

        {/* Фото */}
        <Card>
          <CardHeader>
            <CardTitle>Фотографии</CardTitle>
            <CardDescription>
              Загрузите фото вашей услуги или мероприятия
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="service-photo-upload"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isLoading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('service-photo-upload')?.click()}
                  disabled={isLoading}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Загрузить фото
                </Button>
                <p className="text-xs text-muted-foreground">
                  До 10MB каждое. Форматы: JPG, PNG, WEBP, GIF
                </p>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedPhotos.map((url, index) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Создать услугу
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

