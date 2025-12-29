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
import { Loader2, Camera, X, CheckCircle2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { AIFieldAssistantWrapper } from '@/components/features/ai/ai-field-assistant'
import { ImageCropper } from '@/components/shared/image-cropper'
import { getCroppedImg } from '@/lib/canvasUtils'
import { toast } from 'sonner'
import {
  QUEST_THEMES,
  QUEST_DIFFICULTY,
  QUEST_DURATIONS,
  QUEST_AGE_RANGES,
  QUEST_ACTIVITY_TYPES,
  type QuestTheme,
  type QuestDifficulty,
  type QuestAgeRange,
  type QuestActivityType,
} from '@/lib/constants/quest-constants'

const formSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(255),
  description: z.string().optional(),
  photos: z.array(z.string()).default([]),
  video_url: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  themes: z.array(z.string()).min(1, 'Выберите хотя бы одну тематику'),
  difficulty: z.string().min(1, 'Укажите сложность'),
  duration: z.number().min(1, 'Укажите длительность').nullable(),
  min_participants: z.number().min(1, 'Минимум 1 участник').nullable(),
  max_participants: z.number().min(1, 'Минимум 1 участник').nullable(),
  age_ranges: z.array(z.string()).default([]),
  activity_type: z.string().optional(),
  props_included: z.boolean().default(false),
  actor_included: z.boolean().default(false),
  venue_requirements: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface QuestProgramFormProps {
  profileId: string
  initialData?: any
  isEditMode?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuestProgramForm({
  profileId,
  initialData,
  isEditMode = false,
  onSuccess,
  onCancel,
}: QuestProgramFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPhotoCropperOpen, setIsPhotoCropperOpen] = useState(false)
  const [tempPhotoSrc, setTempPhotoSrc] = useState<string | null>(null)
  const tempPhotoObjectUrlRef = useRef<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const activeFileRef = useRef<File | null>(null)
  const [profileMeta, setProfileMeta] = useState<{ display_name: string; category: string } | null>(null)

  useEffect(() => {
    return () => {
      if (tempPhotoObjectUrlRef.current) {
        URL.revokeObjectURL(tempPhotoObjectUrlRef.current)
        tempPhotoObjectUrlRef.current = null
      }
    }
  }, [])

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
            category: data.category || 'quest',
          })
        }
      } catch (e) {
        console.warn('[QuestForm] Failed to load profile meta:', e)
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
        themes: [],
        difficulty: '',
        duration: null,
        min_participants: null,
        max_participants: null,
        age_ranges: [],
        activity_type: '',
        props_included: false,
        actor_included: false,
        venue_requirements: '',
      }
    }

    return {
      name: initialData.name || '',
      description: initialData.description || '',
      photos: Array.isArray(initialData.photos) ? initialData.photos : (initialData.photo ? [initialData.photo] : []),
      video_url: initialData.video_url || '',
      themes: Array.isArray(initialData.themes) ? initialData.themes : [],
      difficulty: initialData.difficulty || '',
      duration: initialData.duration_minutes || initialData.duration || null,  // FIXED: duration_minutes from DB
      min_participants: initialData.min_players || initialData.min_participants || null,  // FIXED: min_players from DB
      max_participants: initialData.max_players || initialData.max_participants || null,  // FIXED: max_players from DB
      age_ranges: Array.isArray(initialData.age_ranges) ? initialData.age_ranges : [],
      activity_type: initialData.activity_type || '',
      props_included: initialData.props_included || false,
      actor_included: initialData.actor_included || false,
      venue_requirements: initialData.venue_requirements || '',
    }
  }, [initialData])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const url = isEditMode
        ? `/api/quest-programs/${initialData.id}`
        : '/api/quest-programs'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Transform form data to match DB schema
      const body = {
        profile_id: profileId,
        name: values.name,
        description: values.description || null,
        duration_minutes: values.duration || null,
        themes: values.themes || [],
        difficulty: values.difficulty || null,
        min_players: values.min_participants || null,  // FIXED: rename to min_players
        max_players: values.max_participants || null,  // FIXED: rename to max_players
        age_ranges: values.age_ranges || [],
        activity_type: values.activity_type || null,
        props_included: values.props_included || false,
        actor_included: values.actor_included || false,
        venue_requirements: values.venue_requirements || null,
        video_url: values.video_url || null,
        photos: values.photos || [],  // Will be transformed by API to photo (first element)
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save quest')
      }

      toast.success(isEditMode ? 'Квест обновлен' : 'Квест добавлен')
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving quest:', error)
      toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось сохранить квест'}`)
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
    e.target.value = ''
  }

  const handleCancelCrop = () => {
    setIsPhotoCropperOpen(false)
    setPendingFiles((prev) => {
      const rest = prev.slice(1)
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

      const croppedFile = new File([blob], `quest-${Date.now()}.jpg`, { type: 'image/jpeg' })

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

      setPendingFiles((prev) => {
        const rest = prev.slice(1)
        queueMicrotask(() => startNextCrop(rest))
        return rest
      })
    } catch (error) {
      console.warn('Upload/crop error:', error)
      toast.error(`Не удалось загрузить фото: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
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

  const questName = form.watch('name') || ''

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Редактировать квест' : 'Добавить квест'}
          </h1>
        </div>

        <Card className="border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Название квеста *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Пиратское приключение, Школа волшебства"
                      className="h-12 rounded-[18px]"
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
                    profileName={(profileMeta?.display_name || questName || 'Квест').trim()}
                    category={profileMeta?.category || 'quest'}
                    subtype={undefined}
                    existingData={{
                      longDescription: initialData?.description || '',
                    }}
                    onGenerated={(text) => field.onChange(text)}
                  >
                    <FormLabel className="text-base font-semibold">Описание сюжета</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите о сюжете квеста, какие задания ждут участников..."
                        className="min-h-[120px] rounded-[18px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Опишите сюжет, задания и то, что будет происходить во время квеста
                    </FormDescription>
                    <FormMessage />
                  </AIFieldAssistantWrapper>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Фотографии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              id="quest-photo-upload"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('quest-photo-upload')?.click()}
              disabled={uploading}
              className="rounded-full"
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
          title="Обрезка фото"
          singleCropMode="mobile"
          isNewUpload
        />

        <Card className="border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px]">
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
                      className="h-12 rounded-[18px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Добавьте ссылку на видео с прохождения квеста
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Параметры квеста</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="themes"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Тематика * (можно выбрать несколько)</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {Object.entries(QUEST_THEMES).map(([key, label]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name="themes"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border border-slate-200 p-4 bg-slate-50/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(key)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  const updated = checked
                                    ? [...current, key]
                                    : current.filter((val) => val !== key)
                                  field.onChange(updated)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-semibold cursor-pointer">
                              {label}
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
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Сложность *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-[18px]">
                        <SelectValue placeholder="Выберите сложность" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(QUEST_DIFFICULTY).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Длительность *</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    value={field.value?.toString() ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-[18px]">
                        <SelectValue placeholder="Выберите длительность" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUEST_DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value.toString()}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="min_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Минимум участников *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="5"
                        className="h-12 rounded-[18px]"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Максимум участников *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="15"
                        className="h-12 rounded-[18px]"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="age_ranges"
              render={() => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Возрастная категория (можно выбрать несколько)</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {Object.entries(QUEST_AGE_RANGES).map(([key, label]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name="age_ranges"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border border-slate-200 p-4 bg-slate-50/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(key)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  const updated = checked
                                    ? [...current, key]
                                    : current.filter((val) => val !== key)
                                  field.onChange(updated)
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-semibold cursor-pointer">
                              {label}
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
              name="activity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Тип активности</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-[18px]">
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(QUEST_ACTIVITY_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Игровые характеристики</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="props_included"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border border-slate-200 p-4 bg-slate-50/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-semibold cursor-pointer">
                    Реквизит включен
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actor_included"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border border-slate-200 p-4 bg-slate-50/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-semibold cursor-pointer">
                    Актер в игре
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue_requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Требования к площадке</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опишите требования к помещению для проведения квеста"
                      className="min-h-[80px] rounded-[18px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-full">
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> {isEditMode ? 'Сохранить изменения' : 'Добавить квест'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

