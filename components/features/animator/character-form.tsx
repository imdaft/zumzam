'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Camera, Video, X, CheckCircle2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { AIFieldAssistantWrapper } from '@/components/features/ai/ai-field-assistant'
import { ImageCropper } from '@/components/shared/image-cropper'
import { getCroppedImg } from '@/lib/canvasUtils'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(255),
  description: z.string().optional(),
  photos: z.array(z.string()).default([]),
  video_url: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  age_ranges: z.array(z.string()).default([]),
  program_types: z.array(z.string()).default([]),
  work_format: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CharacterFormProps {
  profileId: string
  initialData?: any
  isEditMode?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function CharacterForm({
  profileId,
  initialData,
  isEditMode = false,
  onSuccess,
  onCancel,
}: CharacterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPhotoCropperOpen, setIsPhotoCropperOpen] = useState(false)
  const [tempPhotoSrc, setTempPhotoSrc] = useState<string | null>(null)
  const tempPhotoObjectUrlRef = useRef<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const activeFileRef = useRef<File | null>(null)
  const [profileMeta, setProfileMeta] = useState<{ display_name: string; category: string; details?: any } | null>(null)

  useEffect(() => {
    return () => {
      if (tempPhotoObjectUrlRef.current) {
        URL.revokeObjectURL(tempPhotoObjectUrlRef.current)
        tempPhotoObjectUrlRef.current = null
      }
    }
  }, [])

  // Контекст профиля нужен для AI-подсказок (чтобы текст был "в стиле" профиля)
  useEffect(() => {
    let isMounted = true
    const loadProfileMeta = async () => {
      try {
        const response = await fetch(`/api/profiles/${profileId}`)
        if (!response.ok) throw new Error('Failed to load profile')
        
        const data = await response.json()
        if (isMounted && data) {
          setProfileMeta({
            display_name: data.display_name || '',
            category: data.category || 'animator',
            details: data.details || undefined,
          })
        }
      } catch (e) {
        // Не блокируем форму, просто оставляем fallback-контекст
        console.warn('[CharacterForm] Failed to load profile meta for AI:', e)
      }
    }
    loadProfileMeta()
    return () => {
      isMounted = false
    }
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  const defaultValues = useMemo<FormValues>(() => {
    if (!initialData) {
      return {
        name: '',
        description: '',
        photos: [],
        video_url: '',
        age_ranges: [],
        program_types: [],
        work_format: '',
      }
    }

    return {
      name: initialData.name || '',
      description: initialData.description || '',
      photos: Array.isArray(initialData.photos) ? initialData.photos : [],
      video_url: initialData.video_url || '',
      age_ranges: Array.isArray(initialData.age_ranges)
        ? initialData.age_ranges
        : (initialData.age_range ? [initialData.age_range] : []),
      program_types: Array.isArray(initialData.program_types) ? initialData.program_types : [],
      work_format: initialData.work_format || '',
    }
  }, [initialData])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      // Validate that we have an ID when editing
      if (isEditMode && (!initialData || !initialData.id)) {
        throw new Error('Cannot edit character: missing ID')
      }

      const url = isEditMode
        ? `/api/animator-characters/${initialData.id}`
        : '/api/animator-characters'
      const method = isEditMode ? 'PATCH' : 'POST'

      console.log('[CharacterForm] Submitting:', { url, method, isEditMode })

      const body = {
        ...values,
        profile_id: profileId,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[CharacterForm] Server error:', errorData)
        throw new Error(errorData.error || `Server returned ${res.status}`)
      }

      const responseData = await res.json()
      console.log('[CharacterForm] Success:', responseData)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('[CharacterForm] Error saving character:', error)
      console.error('[CharacterForm] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        values: values,
        profileId,
        isEditMode,
        initialDataId: initialData?.id,
      })
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось сохранить персонажа'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const startNextCrop = (filesQueue: File[]) => {
    const next = filesQueue[0]
    if (!next) {
      activeFileRef.current = null
      setTempPhotoSrc(null)
      setIsPhotoCropperOpen(false)
      setUploading(false)
      return
    }

    activeFileRef.current = next
    // Новый objectURL → ревоким старый
    if (tempPhotoObjectUrlRef.current) {
      URL.revokeObjectURL(tempPhotoObjectUrlRef.current)
      tempPhotoObjectUrlRef.current = null
    }
    const url = URL.createObjectURL(next)
    tempPhotoObjectUrlRef.current = url
    setTempPhotoSrc(url)
    setIsPhotoCropperOpen(true)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const selected = Array.from(files)
    // Валидация
    const okTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
    const filtered: File[] = []
    for (const f of selected) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`Файл слишком большой: ${f.name} (макс. 10 МБ)`)
        continue
      }
      if (f.type && !okTypes.has(f.type)) {
        toast.error(`Неподдерживаемый формат: ${f.name}`)
        continue
      }
      filtered.push(f)
    }
    if (filtered.length === 0) {
      e.target.value = ''
      return
    }

    setUploading(true)
    setPendingFiles(filtered)
    startNextCrop(filtered)
    e.target.value = '' // Reset input
  }

  const handleCancelCrop = () => {
    // Пропускаем текущий файл и идём к следующему
    setIsPhotoCropperOpen(false)
    setPendingFiles((prev) => {
      const rest = prev.slice(1)
      // отложенный запуск, чтобы не дергать setState в одном тике
      queueMicrotask(() => startNextCrop(rest))
      return rest
    })
  }

  const handlePhotoCropComplete = async (
    cropParams: any,
    _unused: any,
    _originalBlob: Blob,
    _isNewUpload: boolean
  ) => {
    const file = activeFileRef.current
    if (!file || !tempPhotoSrc) {
      handleCancelCrop()
      return
    }

    try {
      const blob = await getCroppedImg(tempPhotoSrc, cropParams?.croppedAreaPixels, 0, undefined, 1)
      if (!blob) {
        throw new Error('Не удалось обрезать изображение')
      }

      const croppedFile = new File([blob], `character-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка загрузки файла')
      }

      const { url } = await response.json()
      const currentPhotos = form.getValues('photos') || []
      form.setValue('photos', [...currentPhotos, url], { shouldDirty: true })

      // следующий файл
      setPendingFiles((prev) => {
        const rest = prev.slice(1)
        queueMicrotask(() => startNextCrop(rest))
        return rest
      })
    } catch (error) {
      console.warn('Upload/crop error:', error)
      toast.error(`Не удалось загрузить фото: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      // пропускаем файл и идём дальше
      setPendingFiles((prev) => {
        const rest = prev.slice(1)
        queueMicrotask(() => startNextCrop(rest))
        return rest
      })
    }
  }

  const removePhoto = (url: string) => {
    const currentPhotos = form.getValues('photos') || []
    form.setValue(
      'photos',
      currentPhotos.filter((p) => p !== url)
    )
  }

  const programTypesList = [
    { id: 'interactive', label: 'Интерактивная программа' },
    { id: 'show', label: 'Шоу-программа' },
    { id: 'quest', label: 'Квест' },
    { id: 'master_class', label: 'Мастер-класс' },
    { id: 'games', label: 'Игры и конкурсы' },
  ]

  const characterName = form.watch('name') || ''

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Редактировать персонажа' : 'Добавить персонажа'}
          </h1>
        </div>

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Название персонажа *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Человек-паук, Эльза, Единорог"
                      className="h-12 rounded-xl"
                      {...field}
                    />
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
                  <AIFieldAssistantWrapper
                    type="long"
                    currentText={field.value || ''}
                    profileName={(profileMeta?.display_name || characterName || 'Персонаж').trim()}
                    category={profileMeta?.category || 'animator'}
                    // Для площадок/шоу есть subtype, для аниматоров обычно нет — оставляем пустым
                    subtype={undefined}
                    existingData={{
                      longDescription: initialData?.description || '',
                    }}
                    onGenerated={(text) => field.onChange(text)}
                  >
                    <FormLabel className="text-base font-semibold">Описание программы</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите, что включает программа с этим персонажем..."
                        className="min-h-[120px] rounded-[18px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Опишите, что будет происходить на празднике, какие игры, конкурсы, чему научатся дети
                    </FormDescription>
                    <FormMessage />
                  </AIFieldAssistantWrapper>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Фотографии персонажа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              id="character-photo-upload"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('character-photo-upload')?.click()}
              disabled={uploading}
              className="rounded-xl"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...</>
              ) : (
                <><Camera className="mr-2 h-4 w-4" /> Загрузить фото</>
              )}
            </Button>

            {form.watch('photos')?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {form.watch('photos').map((url, index) => (
                  <div key={url} className="relative group aspect-square rounded-[24px] overflow-hidden border bg-slate-100">
                    <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ImageCropper
          imageSrc={tempPhotoSrc}
          isOpen={isPhotoCropperOpen}
          onClose={handleCancelCrop}
          onCropComplete={handlePhotoCropComplete}
          title="Обрезка фото персонажа"
          // Используем singleCropMode='mobile' (квадрат 1:1)
          singleCropMode="mobile"
          isNewUpload
        />

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Видео (опционально)</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ссылка на видео</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      className="h-12 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Добавьте ссылку на YouTube, Rutube или VK Видео с выступлением в этом образе
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Параметры программы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="age_ranges"
              render={() => {
                const ages = [
                  { id: '3-5', label: '3-5 лет' },
                  { id: '5-7', label: '5-7 лет' },
                  { id: '7-10', label: '7-10 лет' },
                  { id: '10-14', label: '10-14 лет' },
                  { id: 'universal', label: 'Любой возраст' },
                ]

                return (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Возрастная категория (можно выбрать несколько)</FormLabel>
                    <div className="space-y-3 mt-3">
                      {ages.map((age) => (
                        <FormField
                          key={age.id}
                          control={form.control}
                          name="age_ranges"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(age.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []

                                    let updated = checked
                                      ? [...current, age.id]
                                      : current.filter((val) => val !== age.id)

                                    // "universal" взаимоисключающе с конкретными диапазонами
                                    if (age.id === 'universal' && checked) {
                                      updated = ['universal']
                                    } else if (age.id !== 'universal' && checked) {
                                      updated = updated.filter((v) => v !== 'universal')
                                    }

                                    field.onChange(updated)
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-semibold cursor-pointer">
                                {age.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name="program_types"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Тип программы (можно выбрать несколько)</FormLabel>
                  <div className="space-y-3 mt-3">
                    {programTypesList.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="program_types"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  const updated = checked
                                    ? [...current, type.id]
                                    : current.filter((val) => val !== type.id)
                                  field.onChange(updated)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-semibold cursor-pointer">
                              {type.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="work_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Формат работы</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-[18px]">
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mobile">Только выездной</SelectItem>
                      <SelectItem value="studio">Только в студии</SelectItem>
                      <SelectItem value="both">Выездной и в студии</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-xl">
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-md shadow-orange-200"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> {isEditMode ? 'Сохранить изменения' : 'Добавить персонажа'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

