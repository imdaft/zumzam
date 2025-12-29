'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { PHOTOGRAPHY_STYLES, type PhotographyStyle } from '@/lib/constants/photographer-constants'

const formSchema = z.object({
  style: z.string().min(1, 'Выберите стиль'),
  title: z.string().min(2, 'Минимум 2 символа').max(255),
  description: z.string().optional(),
  photos: z.array(z.string()).default([]),
  base_price: z.number().min(0, 'Цена не может быть отрицательной').nullable(),
  duration: z.number().min(1, 'Минимум 1 минута').nullable(),
  photo_count: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PhotographyStyleFormProps {
  profileId: string
  initialData?: any
  isEditMode?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function PhotographyStyleForm({
  profileId,
  initialData,
  isEditMode = false,
  onSuccess,
  onCancel,
}: PhotographyStyleFormProps) {
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
            category: data.category || 'photographer',
          })
        }
      } catch (e) {
        console.warn('[PhotographyStyleForm] Failed to load profile meta:', e)
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
        style: '',
        title: '',
        description: '',
        photos: [],
        base_price: null,
        duration: null,
        photo_count: '',
      }
    }

    return {
      style: initialData.style || '',
      title: initialData.title || '',
      description: initialData.description || '',
      photos: Array.isArray(initialData.photos) ? initialData.photos : [],
      base_price: initialData.base_price || null,
      duration: initialData.duration || null,
      photo_count: initialData.photo_count || '',
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
        ? `/api/photography-styles/${initialData.id}`
        : '/api/photography-styles'
      const method = isEditMode ? 'PATCH' : 'POST'

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
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save style')
      }

      toast.success(isEditMode ? 'Стиль обновлен' : 'Стиль добавлен')
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving style:', error)
      toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось сохранить стиль'}`)
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

      const croppedFile = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

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

  const styleName = form.watch('title') || ''

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto pb-20">
        <div className="flex items-center gap-4 mb-6">
          <Button type="button" variant="ghost" onClick={onCancel} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? 'Редактировать стиль' : 'Добавить стиль съемки'}
          </h1>
        </div>

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Стиль съемки *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-[18px]">
                        <SelectValue placeholder="Выберите стиль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PHOTOGRAPHY_STYLES).map(([key, label]) => (
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Название *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Семейная фотосессия в студии"
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
                    profileName={(profileMeta?.display_name || styleName || 'Фотосъемка').trim()}
                    category={profileMeta?.category || 'photographer'}
                    subtype={undefined}
                    existingData={{
                      longDescription: initialData?.description || '',
                    }}
                    onGenerated={(text) => field.onChange(text)}
                  >
                    <FormLabel className="text-base font-semibold">Описание подхода</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите о вашем подходе к этому стилю съемки..."
                        className="min-h-[120px] rounded-[18px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Опишите, как проходит съемка, что включено, какой результат получит клиент
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
            <CardTitle className="text-xl font-bold">Примеры работ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              id="photo-upload"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
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
          title="Обрезка фото"
          singleCropMode="mobile"
          isNewUpload
        />

        <Card className="border-none shadow-sm rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Условия съемки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Стоимость (₽)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="5000"
                        className="h-12 rounded-xl"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Длительность (мин)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="60"
                        className="h-12 rounded-xl"
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
              name="photo_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Количество фото</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: 50-70 обработанных фото"
                      className="h-12 rounded-xl"
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
              <><CheckCircle2 className="mr-2 h-4 w-4" /> {isEditMode ? 'Сохранить изменения' : 'Добавить стиль'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}








