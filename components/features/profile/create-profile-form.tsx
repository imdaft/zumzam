'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  X,
  Camera,
  Video,
  Sparkles,
} from 'lucide-react'

import { useUser } from '@/lib/hooks/useUser'
import { 
  profileSchema, 
  type ProfileInput, 
  generateSlug,
  POPULAR_TAGS,
} from '@/lib/validations/profile'
import { CITIES } from '@/lib/constants'
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
 * Форма создания профиля студии/аниматора
 */
export function CreateProfileForm() {
  const router = useRouter()
  const { user, profile } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Редирект если профиль уже существует
  useEffect(() => {
    if (profile) {
      router.push('/dashboard')
    }
  }, [profile, router])

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
      slug: '',
      bio: '',
      description: '',
      city: '',
      address: '',
      tags: [],
      price_range: '$$',
      email: user?.email || '',
      phone: '',
      website: '',
      social_links: {
        vk: '',
        instagram: '',
        telegram: '',
        youtube: '',
      },
      portfolio_url: '',
    },
  })

  // Автогенерация slug при вводе названия
  const handleNameChange = (value: string) => {
    form.setValue('display_name', value)
    const slug = generateSlug(value)
    form.setValue('slug', slug)
  }

  // Загрузка фото
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        // Проверка размера (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Файл ${file.name} слишком большой (максимум 10MB)`)
        }

        // Проверка типа
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} - не изображение`)
        }

        // Загружаем файл
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Получаем публичный URL
        const { data: publicUrlData } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrlData.publicUrl)
      }

      setUploadedPhotos([...uploadedPhotos, ...uploadedUrls])
      
      // Если это первое фото, делаем его обложкой
      if (!coverPhoto && uploadedUrls.length > 0) {
        setCoverPhoto(uploadedUrls[0])
      }
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError(err.message || 'Ошибка загрузки фото')
    } finally {
      setIsLoading(false)
    }
  }

  // Удаление фото
  const handlePhotoRemove = (url: string) => {
    setUploadedPhotos(uploadedPhotos.filter(p => p !== url))
    if (coverPhoto === url) {
      setCoverPhoto(uploadedPhotos[0] || null)
    }
  }

  // Загрузка видео
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Проверка размера (50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Видео слишком большое (максимум 50MB)')
      }

      // Проверка типа
      if (!file.type.startsWith('video/')) {
        throw new Error('Файл не является видео')
      }

      // Загружаем файл
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      setUploadedVideos([...uploadedVideos, publicUrlData.publicUrl])
    } catch (err: any) {
      console.error('Video upload error:', err)
      setError(err.message || 'Ошибка загрузки видео')
    } finally {
      setIsLoading(false)
    }
  }

  // Удаление видео
  const handleVideoRemove = (url: string) => {
    setUploadedVideos(uploadedVideos.filter(v => v !== url))
  }

  // Добавление тега
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      if (selectedTags.length < 10) {
        setSelectedTags([...selectedTags, tag])
      }
    }
  }

  // Обработка отправки формы
  const onSubmit = async (data: ProfileInput) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Добавляем загруженные файлы в данные
      const profileData = {
        ...data,
        tags: selectedTags,
        photos: uploadedPhotos,
        videos: uploadedVideos,
        cover_photo: coverPhoto,
      }

      // Отправляем на API
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания профиля')
      }

      // Успех! Редирект на публичный профиль
      router.push(`/profiles/${data.slug}`)
    } catch (err: any) {
      console.error('Create profile error:', err)
      setError(err.message || 'Ошибка создания профиля')
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
              Расскажите о себе или вашей студии
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Название */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Студия 'Праздник'"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL-адрес профиля *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        detinarakete.com/profiles/
                      </span>
                      <Input placeholder="prazdnik" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Генерируется автоматически, но можно изменить
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Краткое описание */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Краткое описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Организуем незабываемые детские праздники в Москве"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Максимум 500 символов. Отображается в поисковой выдаче.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Подробное описание */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подробное описание *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите подробнее о вашей студии, услугах, опыте..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Минимум 50 символов. Опишите что делает вас уникальными.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Локация */}
        <Card>
          <CardHeader>
            <CardTitle>Локация</CardTitle>
            <CardDescription>Где вы находитесь</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Город */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Город *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    >
                      <option value="">Выберите город</option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Адрес */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адрес</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ул. Примерная, д. 1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Опционально. Будет показан на карте.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Теги и категории */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Теги и категории
            </CardTitle>
            <CardDescription>
              Выберите минимум 1 тег, максимум 10. Это поможет родителям найти вас.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
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
            {selectedTags.length === 0 && (
              <p className="mt-2 text-sm text-destructive">
                Выберите хотя бы один тег
              </p>
            )}
          </CardContent>
        </Card>

        {/* Портфолио */}
        <Card>
          <CardHeader>
            <CardTitle>Портфолио</CardTitle>
            <CardDescription>
              Загрузите фото и видео ваших мероприятий
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Фото */}
            <div>
              <FormLabel>Фото</FormLabel>
              <div className="mt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isLoading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Загрузить фото
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    До 10MB каждое. Форматы: JPG, PNG, WEBP, GIF
                  </p>
                </div>

                {/* Превью фото */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedPhotos.map((url, index) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="aspect-video w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove(url)}
                          className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {coverPhoto === url && (
                          <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            Обложка
                          </div>
                        )}
                        {coverPhoto !== url && (
                          <button
                            type="button"
                            onClick={() => setCoverPhoto(url)}
                            className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Сделать обложкой
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Видео */}
            <div>
              <FormLabel>Видео</FormLabel>
              <div className="mt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="video-upload"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('video-upload')?.click()}
                    disabled={isLoading}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Загрузить видео
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    До 50MB. Форматы: MP4, WEBM, OGG
                  </p>
                </div>

                {/* Превью видео */}
                {uploadedVideos.length > 0 && (
                  <div className="space-y-2">
                    {uploadedVideos.map((url, index) => (
                      <div key={url} className="flex items-center gap-2 rounded-lg border p-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-sm truncate">Видео {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleVideoRemove(url)}
                          className="rounded-full p-1 text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Контакты */}
        <Card>
          <CardHeader>
            <CardTitle>Контакты и цены</CardTitle>
            <CardDescription>Как с вами связаться</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="studio@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Телефон */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+7 900 123 45 67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ценовой диапазон */}
            <FormField
              control={form.control}
              name="price_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ценовой диапазон</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: '$', label: 'Эконом (до 5000₽)' },
                        { value: '$$', label: 'Средний (5000-15000₽)' },
                        { value: '$$$', label: 'Премиум (от 15000₽)' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                            field.value === option.value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input bg-background hover:bg-accent'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Сайт */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сайт</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Социальные сети */}
            <div className="space-y-3">
              <FormLabel>Социальные сети</FormLabel>
              
              <FormField
                control={form.control}
                name="social_links.vk"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://vk.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://instagram.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.telegram"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="@username или https://t.me/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Кнопка отправки */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading || selectedTags.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание профиля...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Создать профиль
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

