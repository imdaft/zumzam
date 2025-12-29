'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Camera,
  Trash2,
  Edit,
  MapPin,
  Plus,
  Image as ImageIcon,
  HelpCircle,
  FileText,
  User,
  Phone,
  Share2
} from 'lucide-react'

import { useUser } from '@/lib/hooks/useUser'
import { 
  profileSchema, 
  type ProfileInput, 
  generateSlug,
} from '@/lib/validations/profile'
import { checkProfileReadiness } from '@/lib/utils/verification'
import { cn, FORM_STYLES, UTILS } from '@/lib/design-system'
import { toast } from 'sonner'
import { CITIES } from '@/lib/constants'
import { PROFILE_CATEGORIES } from '@/lib/constants/profile-categories'
import { AIFieldAssistantWrapper } from '@/components/features/ai/ai-field-assistant'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AddressSelector } from './address-selector'
import { Switch } from '@/components/ui/switch'
import { InlineClassificationWizard } from './wizard/inline-classification-wizard-v2'
import { ModalClassificationWizard } from './wizard/modal-classification-wizard'
import {
  AnimatorDetailsForm,
  VenueDetailsForm, 
  ShowDetailsForm, 
  AgencyDetailsForm 
} from './details-forms'
import { ImageCropper } from '@/components/shared/image-cropper'
import { getCroppedImg } from '@/lib/canvasUtils'

interface CreateProfileFormProps {
  profileId?: string
  initialData?: any
  onCategoryChange?: (category: string) => void
  // Для обновления классификации в родителе
  onClassificationChange?: (classification: {
    primary_venue_type?: string
    activities?: string[]
    business_models?: string[]
    additional_services?: string[]
    space_type?: string
  }) => void
  // Для live-индикаторов готовности в родителе (редактирование профиля)
  onDraftChange?: (draft: Partial<any>) => void
  // Для мобильной версии - показывать ли аккордеон
  isMobile?: boolean
}

/**
 * Форма создания профиля студии/аниматора
 */
export function CreateProfileForm({ profileId, initialData, onCategoryChange, onClassificationChange, onDraftChange, isMobile = false }: CreateProfileFormProps) {
  const router = useRouter()
  const { user } = useUser()
  
  // Отладка: проверяем, что isMobile передается правильно
  useEffect(() => {
    if (isMobile) {
      console.log('📱 [CreateProfileForm] isMobile = true, должен рендериться аккордеон')
    } else {
      console.log('💻 [CreateProfileForm] isMobile = false, должны рендериться десктопные карточки')
    }
  }, [isMobile])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  
  // Состояния для диалога удаления
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<string>('')

  // Убрали uploadedPhotos/uploadedVideos
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [logo, setLogo] = useState<string | null>(null)
  const [originalCoverPhoto, setOriginalCoverPhoto] = useState<string | null>(null) // NEW: оригинал обложки

  // State for Cropper
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [tempCoverSrc, setTempCoverSrc] = useState<string | null>(null)
  const [isLogoCropperOpen, setIsLogoCropperOpen] = useState(false)
  const [tempLogoSrc, setTempLogoSrc] = useState<string | null>(null)
  const tempLogoObjectUrlRef = useRef<string | null>(null)

  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([])
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false)
  const [mobileInfoOpenSections, setMobileInfoOpenSections] = useState<string[]>(['basic-info'])

  // Ключ для sessionStorage (всегда режим редактирования)
  const STORAGE_KEY = useMemo(() => {
    if (profileId) return `profile-form-edit-${profileId}`
    return `profile-form-${user?.id || 'anonymous'}`
  }, [user?.id, profileId])

  // Очистка sessionStorage при монтировании (всегда редактирование)
  useEffect(() => {
    if (initialData) {
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch (e) {}
    }
  }, [initialData, STORAGE_KEY])

  // Создаём форму ПЕРЕД useEffect
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: (() => {
      const defaults = {
        category: (initialData?.category as any) || 'venue',
        details: initialData?.details || {},
        display_name: (initialData?.display_name || '') as string,
        slug: (initialData?.slug || '') as string,
        // Визард (шаг 1) хранится в profiles
        primary_venue_type: (initialData as any)?.primary_venue_type || undefined,
        // Визард (шаг 2/3) — связи, подгружаются отдельно; держим дефолты чтобы watch работал стабильно
        activities: (initialData as any)?.activities || [],
        services: (initialData as any)?.services || [],
        primary_services: (initialData as any)?.primary_services || [],
        additional_services: (initialData as any)?.additional_services || [],
        bio: (initialData?.bio || '') as string,
        description: (initialData?.description || '') as string,
        city: (initialData?.city || '') as string,
        address: (initialData?.address || '') as string,
        price_range: (initialData?.price_range || '$$') as '$' | '$$' | '$$$',
        email: (initialData?.email || user?.email || '') as string,
        phone: (initialData?.phone || '') as string,
        website: (initialData?.website || '') as string,
        social_links: initialData?.social_links || {
          vk: '' as string,
          instagram: '' as string,
          tiktok: '' as string,
          telegram: '' as string,
          youtube: '' as string,
        },
        portfolio_url: (initialData?.portfolio_url || '') as string,
        locations_menu_label: (initialData?.locations_menu_label || '') as string,
        is_published: initialData?.is_published || false,
      }
      return defaults
    })(),
  })

  // Важно для визарда: значения могут подгружаться асинхронно (relations из БД),
  // поэтому используем watch, чтобы UI визарда получал актуальные значения после refresh.
  const watchedCategory = form.watch('category')
  const watchedPrimaryVenueType = form.watch('primary_venue_type')
  const watchedActivities = form.watch('activities')
  const watchedServices = form.watch('services')
  const watchedPrimaryServices = form.watch('primary_services')
  const watchedAdditionalServices = form.watch('additional_services')


  // Проверяем тип пользователя (OAuth или email/password)
  useEffect(() => {
    // Временно отключено: endpoint /api/auth/session не существует
    // В будущем можно использовать user.app_metadata.provider из useAuth()
    setIsOAuthUser(false)
    setOauthProvider('Email')
  }, [])

  // Загружаем связанные активности и услуги (если редактируем существующий профиль)
  useEffect(() => {
    async function loadCatalogRelations() {
      if (!profileId || !initialData) return
      
      try {
        const resp = await fetch(`/api/profiles/${profileId}/catalog`, { method: 'GET' })
        if (!resp.ok) return

        const json = (await resp.json().catch(() => null)) as
          | { activities?: string[]; services?: string[] }
          | null

        if (!json) return

        form.setValue('activities', Array.isArray(json.activities) ? json.activities : [])
        form.setValue('services', Array.isArray(json.services) ? json.services : [])
      } catch (error) {
        // В dev Next.js показывает оверлей на console.error — не используем его тут
        console.log('[CreateProfileForm] Error loading catalog relations:', error)
      }
    }
    
    loadCatalogRelations()
  }, [profileId, initialData, form])

  // Вывод ошибок валидации в консоль (для отладки)
  useEffect(() => {
    const errors = form.formState.errors
    if (Object.keys(errors).length > 0) {
      console.log('⚠️ [Form Validation] Errors:', errors)
    }
  }, [form.formState.errors])

  // Сохраняем состояние формы в sessionStorage при изменении
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (hasLoadedOnce) {
        try {
          const formData = {
            formValues: value,
            // uploadedPhotos убраны
            // uploadedVideos убраны
            coverPhoto,
            originalCoverPhoto,
            faqItems,
          }
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
        } catch (error) {
          // В dev Next.js показывает оверлей на console.error — не используем его тут
          console.log('[CreateProfileForm] Error saving to sessionStorage:', error)
        }
      }

      // Live обновление "черновика" для родителя (чтобы readiness пересчитывался без сохранения)
      if (onDraftChange) {
        const v: any = value || {}
        onDraftChange({
          category: v.category,
          display_name: v.display_name,
          description: v.description,
          city: v.city,
          address: v.address,
          phone: v.phone,
          email: v.email,
          primary_venue_type: v.primary_venue_type,
          activities: v.activities,
          services: v.services,
          cover_photo: coverPhoto,
          logo: logo,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [form, coverPhoto, originalCoverPhoto, faqItems, hasLoadedOnce, STORAGE_KEY, onDraftChange, logo])

  // Отдельно синхронизируем изменения картинок (логотип/обложка), даже если поля формы не менялись
  useEffect(() => {
    if (!onDraftChange) return
    onDraftChange({
      cover_photo: coverPhoto,
      logo: logo,
    })
  }, [onDraftChange, coverPhoto, logo])

  // Функция для заполнения формы данными профиля
  const fillFormWithProfile = (profileData: any) => {
    // ВАЖНО: initialData с сервера обычно НЕ содержит связи каталога (activities/services).
    // Если здесь сбросить activities/services в [], то шаги 2–3 "сбрасываются" сразу после сохранения (router.refresh()).
    const currentActivities = Array.isArray(form.getValues('activities')) ? (form.getValues('activities') as any[]) : []
    const currentServices = Array.isArray(form.getValues('services')) ? (form.getValues('services') as any[]) : []

    form.reset({
      category: profileData.category || 'venue',
      details: profileData.details || {},
      display_name: String(profileData.display_name || ''),
      slug: String(profileData.slug || ''),
      primary_venue_type: profileData.primary_venue_type || undefined,
      // связи подгружаются отдельным эффектом, но дефолты должны быть массивами
      activities: Array.isArray(profileData.activities) ? profileData.activities : currentActivities,
      services: Array.isArray(profileData.services) ? profileData.services : currentServices,
      primary_services: Array.isArray(profileData.primary_services) ? profileData.primary_services : [],
      additional_services: Array.isArray(profileData.additional_services) ? profileData.additional_services : [],
      bio: String(profileData.bio || ''),
      description: String(profileData.description || ''),
      city: String(profileData.city || ''),
      address: String(profileData.address || ''),
      price_range: String(profileData.price_range || '$$') as '$' | '$$' | '$$$',
      email: String(profileData.email || user?.email || ''),
      phone: String(profileData.phone || ''),
      website: String(profileData.website || ''),
      social_links: profileData.social_links && typeof profileData.social_links === 'object' ? {
        vk: String(profileData.social_links.vk || ''),
        instagram: String(profileData.social_links.instagram || ''),
        tiktok: String(profileData.social_links.tiktok || ''),
        telegram: String(profileData.social_links.telegram || ''),
        youtube: String(profileData.social_links.youtube || ''),
      } : {
        vk: '',
        instagram: '',
        tiktok: '',
        telegram: '',
        youtube: '',
      },
      portfolio_url: String(profileData.portfolio_url || ''),
      locations_menu_label: String(profileData.locations_menu_label || 'Наши адреса'),
      is_published: !!profileData.is_published,
    })
    
    // Медиа (только обложка и логотип здесь)
    if (profileData.cover_photo) {
      setCoverPhoto(profileData.cover_photo)
      setOriginalCoverPhoto(profileData.cover_photo) // Сохраняем как оригинал тоже
    }
    if (profileData.logo) {
      setLogo(profileData.logo)
    }

    // Загружаем FAQ
    if (profileData.faq && Array.isArray(profileData.faq)) {
      setFaqItems(profileData.faq)
    }
  }

  // Функция для восстановления из sessionStorage
  const restoreFromSession = () => {
    try {
      const savedData = sessionStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        
        if (parsed.formValues) {
          const formValues = {
            ...parsed.formValues,
            tags: parsed.selectedTags || parsed.formValues.tags || [],
          }
          form.reset(formValues)
        }
        
        if (parsed.coverPhoto) setCoverPhoto(parsed.coverPhoto)
        if (parsed.originalCoverPhoto) setOriginalCoverPhoto(parsed.originalCoverPhoto)
      }
    } catch (error) {
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('[CreateProfileForm] Error loading from sessionStorage:', error)
    }
  }

  // Проверяем наличие профиля или загружаем для редактирования
  useEffect(() => {
    if (initialData) {
      fillFormWithProfile(initialData)
      setHasLoadedOnce(true)
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch (e) {}
    }
  }, [initialData, STORAGE_KEY])

  // Автогенерация slug при вводе названия
  const handleNameChange = (value: string) => {
    form.setValue('display_name', value)
    const slug = generateSlug(value)
    form.setValue('slug', slug)
    setSlugAvailable(null) // Сбросить статус при автогенерации
  }

  // Проверка доступности slug
  const handleSlugChange = async (value: string) => {
    form.setValue('slug', value)
    setSlugAvailable(null)
    
    if (!value || value.length < 3) return
    
    try {
      const res = await fetch(`/api/profiles/check-slug?slug=${encodeURIComponent(value)}`)
      if (res.ok) {
        const data = await res.json()
        setSlugAvailable(data.available)
      }
    } catch (e) {
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('Ошибка проверки slug:', e)
    }
  }

  // Загрузка логотипа
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      setError(`Файл слишком большой (максимум 5MB)`)
      toast.error('Файл слишком большой (максимум 5MB)')
      event.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      setError(`Файл не является изображением`)
      toast.error('Файл не является изображением')
      event.target.value = ''
      return
    }

    // HEIC/SVG и прочие экзотические форматы часто ломают загрузку/превью.
    // Для логотипа поддерживаем только растровые форматы, которые точно умеем обрабатывать.
    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    if (!allowedTypes.has(file.type)) {
      const message = 'Неподдерживаемый формат логотипа. Используйте PNG, JPG или WebP.'
      setError(message)
      toast.error(message)
      event.target.value = ''
      return
    }

    setError(null)

    // Открываем кроппер (с зумом) перед загрузкой
    try {
      // Чистим предыдущий object URL, если есть
      if (tempLogoObjectUrlRef.current) {
        URL.revokeObjectURL(tempLogoObjectUrlRef.current)
        tempLogoObjectUrlRef.current = null
      }
      const objectUrl = URL.createObjectURL(file)
      tempLogoObjectUrlRef.current = objectUrl
      setTempLogoSrc(objectUrl)
      setIsLogoCropperOpen(true)
      toast.success('Настройте логотип (кроп/увеличение) перед сохранением')
    } catch (e) {
      const message = 'Не удалось открыть изображение. Попробуйте другой файл.'
      setError(message)
      toast.error(message)
    } finally {
      event.target.value = ''
    }
  }

  const handleLogoCropComplete = async (
    cropData: any,
    _mobileCrop: any,
    _originalBlob: Blob,
    _isNewUpload: boolean
  ) => {
    if (!tempLogoSrc || !cropData?.croppedAreaPixels) {
      toast.error('Настройте кроп перед сохранением')
      return
    }

    setIsLogoCropperOpen(false)
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading('Сохранение логотипа...')

    try {
      // Генерируем обрезанную версию (1:1)
      const croppedBlob = await getCroppedImg(
        tempLogoSrc,
        cropData.croppedAreaPixels,
        0,
        undefined,
        1
      )

      if (!croppedBlob) {
        throw new Error('Не удалось обрезать изображение')
      }

      const file = new File([croppedBlob], `logo-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка загрузки логотипа')
      }

      const { url } = await response.json()
      setLogo(url)

      toast.dismiss(toastId)
      toast.success('Логотип сохранён')
    } catch (err: any) {
      // В dev-режиме Next показывает оверлей на console.error — здесь это ожидаемые ошибки.
      console.warn('[Logo] Upload/crop failed:', err)
      const message = err?.message || 'Ошибка загрузки логотипа'
      setError(message)
      toast.dismiss(toastId)
      toast.error(message)
    } finally {
      setIsLoading(false)
      // Чистим временный object URL
      if (tempLogoObjectUrlRef.current) {
        URL.revokeObjectURL(tempLogoObjectUrlRef.current)
        tempLogoObjectUrlRef.current = null
      }
      setTempLogoSrc(null)
    }
  }

  // Загрузка обложки - НОВАЯ СИСТЕМА (загружаем оригинал сразу)
  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError(`Файл слишком большой (максимум 10MB)`)
      toast.error('Файл слишком большой (максимум 10MB)')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError(`Файл не является изображением`)
      toast.error('Файл не является изображением')
      return
    }

    setIsLoading(true)
    setError(null)
    const toastId = toast.loading('Загрузка обложки...')

    try {
      // Загружаем ОРИГИНАЛ сразу
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка загрузки обложки')
      }

      const { url } = await response.json()
      
      // Сохраняем оригинал и отображаемую версию
      setOriginalCoverPhoto(url)
      setCoverPhoto(url)
      
      toast.dismiss(toastId)
      toast.success('Обложка загружена! Теперь можете настроить кроп или расширить AI.')
    } catch (err: any) {
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('Cover upload error:', err)
      setError(err.message || 'Ошибка загрузки обложки')
      toast.dismiss(toastId)
      toast.error(err.message || 'Ошибка загрузки обложки')
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  // Открываем редактор кропа
  const handleEditCover = () => {
    if (!originalCoverPhoto && !coverPhoto) {
      toast.error('Сначала загрузите обложку')
      return
    }
    setTempCoverSrc(originalCoverPhoto || coverPhoto)
    setIsCropperOpen(true)
  }

  const handleEditLogo = () => {
    if (!logo) {
      toast.error('Сначала загрузите логотип')
      return
    }
    // Если до этого был objectURL из нового файла — очищаем
    if (tempLogoObjectUrlRef.current) {
      URL.revokeObjectURL(tempLogoObjectUrlRef.current)
      tempLogoObjectUrlRef.current = null
    }
    setTempLogoSrc(logo)
    setIsLogoCropperOpen(true)
  }

  // Сохранение обрезанной обложки - НОВАЯ СИГНАТУРА
  const handleCropComplete = async (
    cropData: any, // desktop crop params
    _mobileCrop: any, // игнорируем
    originalBlob: Blob,
    _isNewUpload: boolean
  ) => {
    if (!cropData || !cropData.croppedAreaPixels) {
      toast.error('Настройте кроп перед сохранением')
      return
    }
    
    setIsCropperOpen(false)
    setIsLoading(true)
    const toastId = toast.loading('Сохранение обрезанной версии...')

    try {
      // Генерируем обрезанную версию
      const currentOriginalUrl = originalCoverPhoto || coverPhoto
      if (!currentOriginalUrl) throw new Error('Нет оригинала')

      const croppedBlob = await getCroppedImg(currentOriginalUrl, cropData.croppedAreaPixels)
      if (!croppedBlob) throw new Error('Ошибка нарезки')

      // Загружаем обрезанную версию
      const fileName = `cover-cropped-${Date.now()}.jpg`
      const file = new File([croppedBlob], fileName, { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка загрузки')
      }

      const { url } = await response.json()
      
      // Обновляем отображаемую версию (оригинал НЕ трогаем!)
      setCoverPhoto(url)
      
      toast.dismiss(toastId)
      toast.success('Обложка обрезана! ✨')
    } catch (err: any) {
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('Cover crop error:', err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Ошибка обрезки обложки')
    } finally {
      setIsLoading(false)
      setTempCoverSrc(null)
    }
  }

  // AI расширение обложки
  const handleExpandCover = async (args: { 
    direction: 'top' | 'bottom' | 'left' | 'right' | 'all'
    expandPercent: number
    mode: 'desktop' | 'mobile'
  }) => {
    const currentOriginalUrl = originalCoverPhoto || coverPhoto
    if (!currentOriginalUrl) {
      throw new Error('Нет оригинала для расширения')
    }

    console.log('[CreateProfileForm] handleExpandCover called:', args)
    console.log('[CreateProfileForm] originalCoverPhoto:', currentOriginalUrl)

    const response = await fetch('/api/ai/expand-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: profileId || 'temp', // Для нового профиля используем temp
        imageUrl: currentOriginalUrl,
        direction: args.direction,
        expandPercent: args.expandPercent,
      })
    })

    console.log('[CreateProfileForm] API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('[CreateProfileForm] API error:', errorData)
      throw new Error(errorData.error || 'Ошибка расширения изображения')
    }

    const result = await response.json()
    console.log('[CreateProfileForm] API result:', result)

    // Обновляем оригинал в редакторе
    if (result?.expandedImageUrl) {
      const newImageUrl = `${result.expandedImageUrl}?t=${Date.now()}`
      console.log('[CreateProfileForm] Setting new image:', newImageUrl)
      
      setOriginalCoverPhoto(result.expandedImageUrl)
      setTempCoverSrc(newImageUrl)
      
      toast.success(`Изображение расширено на ${args.expandPercent}%! ${result.creditsUsed > 0 ? `Списано ${result.creditsUsed} кредитов.` : ''}`)
    } else {
      console.warn('[CreateProfileForm] No expandedImageUrl in result')
    }
  }

  // Удаление профиля
  const handleDeleteProfile = async () => {
    if (!profileId) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      if (!isOAuthUser) {
        if (!deletePassword) throw new Error('Введите пароль')
        const verifyRes = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: deletePassword })
        })
        const verifyData = await verifyRes.json()
        if (!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.error || 'Неверный пароль')
      } else {
        const verifyRes = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const verifyData = await verifyRes.json()
        if (!verifyRes.ok || !verifyData.verified) throw new Error('Ошибка подтверждения пользователя')
      }
      const res = await fetch(`/api/profiles/${profileId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Ошибка удаления профиля')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setDeleteError(e.message || 'Не удалось удалить профиль')
      setIsDeleting(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    console.log('🚀 [onSubmit] Form submitted!', { hasUser: !!user, hasData: !!data })
    
    if (!user) {
      console.log('❌ [onSubmit] No user!')
      setError('Пользователь не авторизован')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!data.display_name || !data.slug) {
        console.log('❌ [onSubmit] Missing required fields:', { display_name: data.display_name, slug: data.slug })
        setError('Заполните все обязательные поля')
        setIsLoading(false)
        return
      }
      
      console.log('✅ [onSubmit] Starting profile save...')

      // Читаем данные классификации из формы (визард может сохранять в разные поля)
      const activitiesData = Array.isArray((data as any).activities) ? (data as any).activities : []
      const servicesData = Array.isArray((data as any).services) ? (data as any).services : []
      const primaryServicesData = Array.isArray((data as any).primary_services) ? (data as any).primary_services : []
      const additionalServicesData = Array.isArray((data as any).additional_services) ? (data as any).additional_services : []
      
      const { activities: _activities, services: _services, primary_services: _primary_services, additional_services: _additional_services, ...restData } = data as any
      
      // Диагностика
      console.log('🔍 [onSubmit] Classification data:', {
        activitiesCount: activitiesData?.length || 0,
        servicesCount: servicesData?.length || 0,
        primaryServicesCount: primaryServicesData?.length || 0,
        additionalServicesCount: additionalServicesData?.length || 0,
        activities: activitiesData,
        services: servicesData,
        primary_services: primaryServicesData,
        additional_services: additionalServicesData,
      })
      
      // Отправляем только базовые поля (без триггеров БД)
      const profileData: any = {
        display_name: restData.display_name,
        slug: restData.slug,
        bio: restData.bio,
        description: restData.description,
        // Классификация (шаг 1 визарда) хранится в profiles
        category: restData.category, // ВАЖНО: категория профиля
        primary_venue_type: restData.primary_venue_type,
        // Классификация (шаг 2/3) — сохраняем на сервере вместе с PATCH (route.ts вытащит и запишет связи)
        activities: activitiesData,
        services: servicesData,
        primary_services: primaryServicesData,
        additional_services: additionalServicesData,
        phone: restData.phone,
        email: restData.email,
        website: restData.website,
        faq: faqItems.filter(item => item.question.trim() && item.answer.trim()),
        cover_photo: coverPhoto,
        logo: logo,
      }
      
      // Добавляем остальные поля осторожно
      if (restData.city) profileData.city = restData.city
      if (restData.address) profileData.address = restData.address
      if (restData.details) profileData.details = restData.details
      if ('instagram' in restData) profileData.instagram = restData.instagram
      if ('vk' in restData) profileData.vk = restData.vk
      if ('telegram' in restData) profileData.telegram = restData.telegram
      if ('whatsapp' in restData) profileData.whatsapp = restData.whatsapp
      if ('youtube' in restData) profileData.youtube = restData.youtube
      if ('locations' in restData) profileData.locations = restData.locations
      if ('photos' in restData) profileData.photos = restData.photos
      if ('videos' in restData) profileData.videos = restData.videos

      // Всегда PATCH - профиль уже создан через quick-create
      const apiUrl = profileId ? `/api/profiles/${profileId}` : '/api/profiles/me'
      const method = 'PATCH'

      console.log('📡 [onSubmit] Fetching:', { apiUrl, method, profileId })
      console.log('📤 [onSubmit] Sending profileData:', {
        ...profileData,
        activities: profileData.activities,
        services: profileData.services,
        primary_services: profileData.primary_services,
        additional_services: profileData.additional_services,
      })
      
      let response: Response
      try {
        response = await fetch(apiUrl, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        })
        console.log('📥 [onSubmit] Response status:', response.status, response.statusText)
      } catch (fetchError: any) {
        // В dev Next.js показывает оверлей на console.error — не используем его тут
        console.log('❌ [onSubmit] Fetch error:', fetchError)
        throw new Error(`Ошибка сети: ${fetchError.message || 'Failed to fetch'}`)
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        // В dev Next.js показывает оверлей на console.error — не используем его тут
        console.log('❌ [onSubmit] Response not OK:', { status: response.status, errorText })
        throw new Error(`Ошибка сохранения профиля: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      const savedProfileId = result.profile?.id || profileId

      // activities/services сохраняются внутри PATCH на сервере

      setTimeout(() => { try { sessionStorage.removeItem(STORAGE_KEY) } catch (error) {} }, 0)
      
      setError(null)
      
      // Формируем описание с деталями сохранения
      const savedDetails = []
      if (activitiesData && activitiesData.length > 0) {
        savedDetails.push(`${activitiesData.length} активностей`)
      }
      if (servicesData && servicesData.length > 0) {
        savedDetails.push(`${servicesData.length} услуг`)
      }
      if (primaryServicesData && primaryServicesData.length > 0) {
        savedDetails.push(`${primaryServicesData.length} услуг`)
      }
      if (additionalServicesData && additionalServicesData.length > 0) {
        savedDetails.push(`${additionalServicesData.length} доп. услуг`)
      }
      const description = savedDetails.length > 0 
        ? `Сохранено: ${savedDetails.join(', ')}` 
        : 'Все изменения применены'
      
      toast.success('Профиль успешно сохранён!', {
        description,
        duration: 4000,
      })
      
      // Обновляем данные на странице
      router.refresh()
    } catch (err: any) {
      // Логируем без console.error чтобы не триггерить overlay
      if (process.env.NODE_ENV === 'development') {
        console.log('[CreateProfileForm] Error:', err)
      }
      setError(err.message || 'Не удалось сохранить профиль')
    } finally {
      setIsLoading(false)
    }
  }

  const onError = (errors: any) => {
    // В dev Next.js показывает оверлей на console.error — не используем его тут
    console.log('❌ [Form Validation] Submit blocked by errors:', errors)
    toast.error('Проверьте форму', {
      description: 'Есть ошибки в заполнении полей',
    })
  }

  return (
    <Form {...form}>
      <form id="profile-main-form" onSubmit={form.handleSubmit(onSubmit, onError)}>
        <div className={cn('px-1 sm:container sm:mx-auto sm:px-6', 'py-2 sm:py-6', UTILS.stack)}>
            {/* Главный заголовок страницы */}
            <div className="hidden lg:block px-2 sm:px-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Настройка профиля</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
                Заполните информацию о вашем профиле, чтобы клиенты могли легко найти вас и понять, что вы предлагаете.
              </p>
            </div>

            {error && <div className="px-2 sm:px-0"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert></div>}

            {/* СЕКЦИЯ: Классификация профиля (универсальный визард) */}
            <Card id="section-category" className="w-full rounded-[24px] sm:rounded-[28px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] scroll-mt-24 overflow-hidden">
              <CardHeader className="px-2 sm:px-6 py-3 sm:py-5 border-b border-slate-200">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-2xl font-bold text-slate-900 leading-tight">
                    Классификация профиля
                  </CardTitle>
                    <CardDescription className="text-[11px] sm:text-sm text-slate-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                      Выберите категорию и услуги. Это поможет клиентам найти вас в поиске.
                  </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('open-classification-wizard')?.click()}
                    className="hidden sm:inline-flex h-9 rounded-full px-4 text-xs font-semibold"
                  >
                    Открыть
                  </Button>
                </div>
              </CardHeader>
              <div className="px-2 py-3 sm:px-6 sm:py-6">
                {/* Десктопная версия - InlineWizard */}
                <div className="hidden lg:block">
                <InlineClassificationWizard
                  initialData={(() => {
                    const initialData = {
                      category: watchedCategory,
                      primary_venue_type: (watchedPrimaryVenueType as any) || undefined,
                      primary_services: Array.isArray(watchedPrimaryServices) ? watchedPrimaryServices : (Array.isArray(watchedActivities) ? watchedActivities : []),
                      additional_services: Array.isArray(watchedAdditionalServices) ? watchedAdditionalServices : (Array.isArray(watchedServices) ? watchedServices : []),
                    }
                    return initialData
                  })()}
                  onUpdate={(data) => {
                    // Сохраняем категорию
                    if (data.category) {
                      form.setValue('category', data.category as any)
                      onCategoryChange?.(data.category)
                    }
                    
                    // Для venue сохраняем тип площадки
                    if (data.category === 'venue') {
                      form.setValue('primary_venue_type', data.primary_venue_type || undefined)
                    }
                    
                    // ИСПРАВЛЕНИЕ: НЕ затираем данные пустыми массивами
                    // Сохраняем основные услуги только если массив НЕ пустой ИЛИ пользователь явно очистил
                    const currentPrimaryServices = form.getValues('primary_services')
                    const currentAdditionalServices = form.getValues('additional_services')
                    
                    if (data.category === 'venue') {
                      // Для venue всегда обновляем (чтобы не было конфликта с activities)
                      form.setValue('activities', data.primary_services)
                    } else {
                      // Обновляем только если данные НЕ пустые ИЛИ текущие данные тоже пустые
                      if (data.primary_services.length > 0 || currentPrimaryServices?.length === 0) {
                        form.setValue('primary_services', data.primary_services)
                      }
                    }
                    
                    // Обновляем доп. услуги только если данные НЕ пустые ИЛИ текущие данные тоже пустые
                    if (data.additional_services.length > 0 || currentAdditionalServices?.length === 0) {
                      form.setValue('additional_services', data.additional_services)
                    }
                    
                    // Уведомляем родителя
                    onClassificationChange?.({
                      primary_venue_type: data.primary_venue_type,
                      activities: data.category === 'venue' ? data.primary_services : [],
                      additional_services: data.additional_services,
                    })
                  }}
                />
                </div>

                {/* Мобильная версия - Кнопка + Модалка */}
                <div className="lg:hidden space-y-4">
                  {watchedCategory && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-[18px]">
                      <p className="text-xs font-semibold text-orange-900 mb-2">Текущая классификация:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-900 border border-orange-200">
                          {watchedCategory ? (PROFILE_CATEGORIES[watchedCategory]?.nameRu || watchedCategory) : ''}
                        </span>
                        {watchedPrimaryVenueType && (
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-900 border border-orange-200">
                            {watchedPrimaryVenueType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    id="open-classification-wizard"
                    type="button"
                    onClick={() => setIsClassificationModalOpen(true)}
                    variant={watchedCategory ? "outline" : "default"}
                    className="w-full h-12 rounded-[18px] text-base font-semibold"
                  >
                    {watchedCategory ? 'Изменить классификацию' : 'Выбрать категорию профиля'}
                  </Button>
                  
                  <ModalClassificationWizard
                    open={isClassificationModalOpen}
                    onOpenChange={setIsClassificationModalOpen}
                    initialData={{
                      category: watchedCategory,
                      primary_venue_type: (watchedPrimaryVenueType as any) || undefined,
                      primary_services: Array.isArray(watchedPrimaryServices) ? watchedPrimaryServices : (Array.isArray(watchedActivities) ? watchedActivities : []),
                      additional_services: Array.isArray(watchedAdditionalServices) ? watchedAdditionalServices : (Array.isArray(watchedServices) ? watchedServices : []),
                    }}
                    onComplete={async (data) => {
                      // Сохраняем категорию
                      if (data.category) {
                        form.setValue('category', data.category as any)
                        onCategoryChange?.(data.category)
                      }
                      
                      // Для venue сохраняем тип площадки
                      if (data.category === 'venue') {
                        form.setValue('primary_venue_type', data.primary_venue_type || undefined)
                      }
                      
                      const currentPrimaryServices = form.getValues('primary_services')
                      const currentAdditionalServices = form.getValues('additional_services')
                      
                      if (data.category === 'venue') {
                        form.setValue('activities', data.primary_services)
                      } else {
                        if (data.primary_services.length > 0 || currentPrimaryServices?.length === 0) {
                          form.setValue('primary_services', data.primary_services)
                        }
                      }
                      
                      if (data.additional_services.length > 0 || currentAdditionalServices?.length === 0) {
                        form.setValue('additional_services', data.additional_services)
                      }
                      
                      // Уведомляем родителя
                      onClassificationChange?.({
                        primary_venue_type: data.primary_venue_type,
                        activities: data.category === 'venue' ? data.primary_services : [],
                        additional_services: data.additional_services,
                      })
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Мобильная версия: Аккордеон для всех секций основной информации */}
            {isMobile ? (
              <Card className="rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
                <CardHeader className="px-3 py-3 border-b border-slate-200">
                  <CardTitle className="text-[15px] font-bold text-slate-900 leading-tight text-left">
                    Основная информация
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 leading-tight mt-1 text-left">
                    Заполните основные данные профиля
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion
                    type="multiple"
                    value={mobileInfoOpenSections}
                    onValueChange={setMobileInfoOpenSections}
                    className="divide-y divide-slate-200"
                  >
            {/* Основная информация */}
                    <AccordionItem value="basic-info" className="border-0">
                      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                        <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                          <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="min-w-0 flex items-center">
                            <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                              Основная информация
                            </div>
                          </div>
                          <span className="w-2 h-2 mt-1" aria-hidden="true" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0 pt-0">
                        <div className="p-2 sm:p-6 pt-0 space-y-4 sm:space-y-8">
                          {/* Название */}
                          <FormField control={form.control} name="display_name" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                                  Название профиля *
                                </FormLabel>
                                <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                  Ваше имя или название студии. Это первое, что увидят клиенты.
                                </FormDescription>
                                <FormControl>
                                  <Input 
                                    placeholder="Например: Студия 'Праздник' или Аниматор Мария" 
                                    className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2"
                                    {...field} 
                                    onChange={(e) => handleNameChange(e.target.value)} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          
                          {/* URL-адрес */}
                          <FormField control={form.control} name="slug" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                                  URL-адрес профиля *
                                </FormLabel>
                                <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                  Уникальная ссылка на ваш профиль. Создаётся автоматически из названия.
                                </FormDescription>
                                <FormControl>
                                  <div className="flex flex-col sm:flex-row items-stretch gap-0 overflow-hidden rounded-[18px] border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all mt-1.5 sm:mt-2">
                                    <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-0 bg-gray-50 sm:border-r border-b sm:border-b-0 border-gray-200">
                                      <span className="text-[10px] sm:text-xs text-gray-600 font-medium">zumzam.ru/profiles/</span>
                                    </div>
                                    <Input 
                                      placeholder="ваш-уникальный-адрес" 
                                      className="h-10 sm:h-12 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base" 
                                      {...field} 
                                      onChange={(e) => handleSlugChange(e.target.value)} 
                                    />
                                  </div>
                                </FormControl>
                                {slugAvailable === true && <FormDescription className="text-[10px] sm:text-xs font-medium text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Адрес доступен</FormDescription>}
                                {slugAvailable === false && <FormDescription className="text-[10px] sm:text-xs font-medium text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Адрес уже занят</FormDescription>}
                                <FormMessage />
                              </FormItem>
                            )} />
                          
                          {/* Описание */}
                          <FormField control={form.control} name="description" render={({ field }) => (
                              <FormItem>
                                <AIFieldAssistantWrapper
                                  type="long"
                                  currentText={field.value || ''}
                                  profileName={(form.getValues('display_name') || '').trim()}
                                  category={form.getValues('category') || 'venue'}
                                  subtype={(form.getValues('details') as any)?.venue_type}
                                  existingData={{
                                    longDescription: String(initialData?.description || ''),
                                  }}
                                  onGenerated={(text) => field.onChange(text)}
                                >
                                  <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                                    Описание профиля
                                  </FormLabel>
                                  <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                    Краткий рассказ о вас: чем занимаетесь, какие услуги предлагаете, что важно для клиентов.
                                  </FormDescription>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Например: Организуем детские праздники с профессиональными аниматорами. Работаем 7 лет, более 500 довольных клиентов..."
                                      className="min-h-[100px] sm:min-h-[160px] rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2 leading-snug sm:leading-relaxed"
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </AIFieldAssistantWrapper>
                              </FormItem>
                            )} />

                          {/* Город */}
                          <FormField control={form.control} name="city" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                                  Город *
                                </FormLabel>
                                <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                  Город, где вы работаете. По нему клиенты будут вас находить.
                                </FormDescription>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2">
                                      <SelectValue placeholder="Выберите город" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {CITIES.map(city => (
                                      <SelectItem key={city} value={city}>
                                        {city}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Характеристики аниматора */}
                    {form.watch('category') === 'animator' && (
                      <AccordionItem value="animator-details" className="border-0">
                        <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                          <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                            <User className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="min-w-0 flex items-center">
                              <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                                Характеристики аниматора
                              </div>
                            </div>
                            <span className="w-2 h-2 mt-1" aria-hidden="true" />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pb-0 pt-0">
                          <div className="w-full scroll-mt-24">
                            <AnimatorDetailsForm prefix="details" hideHeader={true} />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {/* Логотип */}
                    <AccordionItem value="logo" className="border-0">
                      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                        <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                          <ImageIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="min-w-0 flex items-center">
                            <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                              Логотип
                            </div>
                          </div>
                          <span className="w-2 h-2 mt-1" aria-hidden="true" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0 pt-0">
                        <div className="p-2 sm:p-6 pt-0">
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleLogoUpload}
                            disabled={isLoading}
                            className="hidden"
                          />
                          
                          {!logo ? (
                            <button
                              type="button"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              disabled={isLoading}
                              className="w-full border-2 border-dashed border-gray-200 rounded-[24px] p-4 sm:p-8 hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                              <div className="flex flex-col items-center gap-2 sm:gap-4">
                                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                                  <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-slate-400 group-hover:text-orange-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-0.5 sm:mb-1">Загрузите логотип</p>
                                  <p className="text-[10px] sm:text-xs text-slate-500">PNG, JPG до 5MB • Рекомендуется 500×500px</p>
                                </div>
                                <div className="h-9 sm:h-11 rounded-full px-3 sm:px-6 pointer-events-none border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white flex items-center justify-center">
                                  Выбрать файл
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="flex flex-col md:flex-row gap-3 sm:gap-6 items-start">
                              <div className="relative group">
                                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-[18px] sm:rounded-[24px] overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.10)]">
                                  <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLogo(null)}
                                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                >
                                  <X className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                              </div>
                              
                              <div className="flex-1 space-y-2 sm:space-y-3">
                                <div className="p-2.5 sm:p-4 bg-green-50 rounded-[18px] border border-green-100">
                                  <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                      <p className="text-[11px] sm:text-xs font-semibold text-green-900 mb-0.5 sm:mb-1">Логотип загружен</p>
                                      <p className="text-[10px] sm:text-xs text-green-700 leading-snug">Отлично! Ваш логотип будет отображаться в профиле.</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => document.getElementById('logo-upload')?.click()} 
                                  disabled={isLoading}
                                  className="h-9 sm:h-11 rounded-full w-full md:w-auto text-xs sm:text-sm"
                                >
                                  <Camera className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  Заменить логотип
                                </Button>
                                
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={handleEditLogo}
                                  disabled={isLoading}
                                  className="h-9 sm:h-11 rounded-full w-full md:w-auto bg-white hover:bg-gray-100 border border-gray-200 text-xs sm:text-sm"
                                >
                                  <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  Кроп / Увеличение
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Обложка профиля */}
                    <AccordionItem value="cover" className="border-0">
                      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                        <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                          <ImageIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="min-w-0 flex items-center">
                            <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                              Обложка профиля
                            </div>
                          </div>
                          <span className="w-2 h-2 mt-1" aria-hidden="true" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0 pt-0">
                        <div className="p-2 sm:p-6 pt-0">
                          <input type="file" id="cover-upload" accept="image/*" onChange={handleCoverUpload} disabled={isLoading} className="hidden" />
                          
                          {!coverPhoto ? (
                            <button
                              type="button"
                              onClick={() => document.getElementById('cover-upload')?.click()}
                              disabled={isLoading}
                              className="w-full border-2 border-dashed border-slate-200 rounded-[24px] aspect-video hover:border-orange-300 hover:bg-orange-50 transition-all group overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
                            >
                              <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-4 p-4 sm:p-8">
                                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/80 group-hover:bg-orange-50 flex items-center justify-center transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.10)]">
                                  <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-slate-400 group-hover:text-orange-600 transition-colors" strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-0.5 sm:mb-1">Загрузите обложку</p>
                                  <p className="text-[10px] sm:text-xs text-slate-500">PNG, JPG до 5MB • Формат 16:9 • Минимум 1920×1080px</p>
                                </div>
                                <div className="h-9 sm:h-11 rounded-full px-3 sm:px-6 pointer-events-none border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white flex items-center justify-center">
                                  Выбрать файл
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="space-y-2 sm:space-y-4">
                              <div className="relative w-full aspect-video rounded-[18px] sm:rounded-[24px] overflow-hidden border-2 border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] group">
                                <img src={coverPhoto} alt="Cover preview" className="w-full h-full object-cover" />
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3">
                                  <Button 
                                    type="button" 
                                    variant="secondary"
                                    onClick={() => document.getElementById('cover-upload')?.click()} 
                                    disabled={isLoading}
                                    className="h-9 sm:h-11 rounded-full bg-white hover:bg-gray-100 text-xs sm:text-sm"
                                  >
                                    <Camera className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Заменить
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="secondary"
                                    onClick={handleEditCover} 
                                    disabled={isLoading}
                                    className="h-9 sm:h-11 rounded-full bg-white hover:bg-gray-100 text-xs sm:text-sm"
                                  >
                                    <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Кроп / AI расширение</span>
                                    <span className="sm:hidden">Кроп</span>
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCoverPhoto(null)
                                      setOriginalCoverPhoto(null)
                                    }}
                                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
                                  >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="p-2.5 sm:p-4 bg-green-50 rounded-[18px] border border-green-100">
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] sm:text-xs font-semibold text-green-900 mb-0.5 sm:mb-1">Обложка загружена</p>
                                    <p className="text-[10px] sm:text-xs text-green-700 leading-snug">Отлично! Обложка будет отображаться в шапке профиля. Наведите на изображение для редактирования или расширения AI.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Контакты */}
                    <AccordionItem value="contacts" className="border-0">
                      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                        <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                          <Phone className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="min-w-0 flex items-center">
                            <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                              Контакты
                            </div>
                          </div>
                          <span className="w-2 h-2 mt-1" aria-hidden="true" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0 pt-0">
                        <div className="p-2 sm:p-6 pt-0 space-y-4 sm:space-y-8">
                          <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">Телефон *</FormLabel>
                                  <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                    Номер телефона для связи с вами. Будет виден клиентам.
                                  </FormDescription>
                                  <FormControl>
                                    <Input 
                                      placeholder="+7 (999) 123-45-67" 
                                      className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">Email *</FormLabel>
                                  <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                                    Электронная почта для связи. Будет видна клиентам.
                                  </FormDescription>
                                  <FormControl>
                                    <Input 
                                      type="email" 
                                      placeholder="example@mail.ru" 
                                      className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Социальные сети */}
                    <AccordionItem value="social" className="border-0">
                      <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                        <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                          <Share2 className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="min-w-0 flex items-center">
                            <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                              Социальные сети
                            </div>
                          </div>
                          <span className="w-2 h-2 mt-1" aria-hidden="true" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0 pt-0">
                        <div className="p-2 sm:p-6 pt-0 space-y-2 sm:space-y-4 pt-1 sm:pt-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900">Сайт и социальные сети</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug">Добавьте ссылки, чтобы клиенты могли узнать о вас больше.</p>
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-100 rounded-[18px] shrink-0 text-sm sm:text-lg">🌐</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://example.com" {...field} /></div></FormControl></FormItem>)} />
                            <FormField control={form.control} name="social_links.vk" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">VK</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://vk.com/..." {...field} /></div></FormControl></FormItem>)} />
                            <FormField control={form.control} name="social_links.instagram" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-orange-50 text-orange-700 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">IG</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://instagram.com/..." {...field} /></div></FormControl></FormItem>)} />
                            <FormField control={form.control} name="social_links.tiktok" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-900 text-white rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">TT</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://tiktok.com/@..." {...field} /></div></FormControl></FormItem>)} />
                            <FormField control={form.control} name="social_links.telegram" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-sky-50 text-sky-600 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">TG</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="@username" {...field} /></div></FormControl></FormItem>)} />
                            <FormField control={form.control} name="social_links.youtube" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-[18px] shrink-0 font-bold text-[9px] sm:text-xs">YT</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://youtube.com/..." {...field} /></div></FormControl></FormItem>)} />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Десктопная версия: все секции как отдельные карточки */}
                {/* Основная информация */}
                <Card id="section-info" className="w-full rounded-[24px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] scroll-mt-24">
              <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-2xl font-bold text-gray-900 leading-tight">Основная информация</CardTitle>
                <CardDescription className="text-[11px] sm:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                  Это то, что увидят клиенты при поиске. Укажите название и кратко опишите, чем занимаетесь.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 space-y-4 sm:space-y-8">
                {/* Название */}
                <FormField control={form.control} name="display_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                        Название профиля *
                      </FormLabel>
                      <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                        Ваше имя или название студии. Это первое, что увидят клиенты.
                      </FormDescription>
                      <FormControl>
                        <Input 
                          placeholder="Например: Студия 'Праздник' или Аниматор Мария" 
                          className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2"
                          {...field} 
                          onChange={(e) => handleNameChange(e.target.value)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                
                {/* URL-адрес */}
                <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                        URL-адрес профиля *
                      </FormLabel>
                      <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                        Уникальная ссылка на ваш профиль. Создаётся автоматически из названия.
                      </FormDescription>
                      <FormControl>
                        <div className="flex flex-col sm:flex-row items-stretch gap-0 overflow-hidden rounded-[18px] border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all mt-1.5 sm:mt-2">
                          <div className="flex items-center px-2 sm:px-4 py-1.5 sm:py-0 bg-gray-50 sm:border-r border-b sm:border-b-0 border-gray-200">
                            <span className="text-[10px] sm:text-xs text-gray-600 font-medium">zumzam.ru/profiles/</span>
                          </div>
                          <Input 
                            placeholder="ваш-уникальный-адрес" 
                            className="h-10 sm:h-12 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base" 
                            {...field} 
                            onChange={(e) => handleSlugChange(e.target.value)} 
                          />
                        </div>
                      </FormControl>
                      {slugAvailable === true && <FormDescription className="text-[10px] sm:text-xs font-medium text-green-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Адрес доступен</FormDescription>}
                      {slugAvailable === false && <FormDescription className="text-[10px] sm:text-xs font-medium text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Адрес уже занят</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )} />
                
                {/* Описание */}
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <AIFieldAssistantWrapper
                        type="long"
                        currentText={field.value || ''}
                        profileName={(form.getValues('display_name') || '').trim()}
                        category={form.getValues('category') || 'venue'}
                        subtype={(form.getValues('details') as any)?.venue_type}
                        existingData={{
                          longDescription: String(initialData?.description || ''),
                        }}
                        onGenerated={(text) => field.onChange(text)}
                      >
                        <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                          Описание профиля
                        </FormLabel>
                        <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                          Краткий рассказ о вас: чем занимаетесь, какие услуги предлагаете, что важно для клиентов.
                        </FormDescription>
                        <FormControl>
                          <Textarea 
                            placeholder="Например: Организуем детские праздники с профессиональными аниматорами. Работаем 7 лет, более 500 довольных клиентов..."
                            className="min-h-[100px] sm:min-h-[160px] rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2 leading-snug sm:leading-relaxed"
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </AIFieldAssistantWrapper>
                    </FormItem>
                  )} />

                {/* Город */}
                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-sm font-semibold text-gray-900">
                        Город *
                      </FormLabel>
                      <FormDescription className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                        Город, где вы работаете. По нему клиенты будут вас находить.
                      </FormDescription>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2">
                            <SelectValue placeholder="Выберите город" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
              </CardContent>
            </Card>

            {/* Характеристики аниматора (только для аниматоров) */}
            {form.watch('category') === 'animator' && (
              <div className="w-full scroll-mt-24">
                <AnimatorDetailsForm prefix="details" />
              </div>
            )}

            {/* Логотип */}
            <Card id="section-logo" className="w-full rounded-[24px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden scroll-mt-24">
              <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-2xl font-bold text-gray-900 leading-tight">Логотип</CardTitle>
                    <CardDescription className="text-[11px] sm:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                      Квадратное изображение. Будет видно рядом с названием в поиске.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isLoading}
                    className="h-8 sm:h-9 rounded-full px-3 sm:px-4 text-[11px] sm:text-xs font-semibold shrink-0"
                  >
                    Загрузить
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  disabled={isLoading}
                  className="hidden"
                />
                
                {!logo ? (
                  // Пустое состояние - красивая плашка для загрузки
                  <button
                    type="button"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isLoading}
                    className="w-full border-2 border-dashed border-gray-200 rounded-[24px] p-4 sm:p-8 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-2 sm:gap-4">
                      <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                        <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-slate-400 group-hover:text-orange-600 transition-colors" strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-0.5 sm:mb-1">Загрузите логотип</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">PNG, JPG до 5MB • Рекомендуется 500×500px</p>
                      </div>
                        <div className="h-9 sm:h-11 rounded-full px-3 sm:px-6 pointer-events-none border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white flex items-center justify-center">
                        Выбрать файл
                      </div>
                    </div>
                  </button>
                ) : (
                  // Загруженный логотип - красивый превью
                  <div className="flex flex-col md:flex-row gap-3 sm:gap-6 items-start">
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-[18px] sm:rounded-[24px] overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.10)]">
                        <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                      </div>
                      {/* Кнопка удаления при наведении */}
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="p-2.5 sm:p-4 bg-green-50 rounded-[18px] border border-green-100">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[11px] sm:text-xs font-semibold text-green-900 mb-0.5 sm:mb-1">Логотип загружен</p>
                            <p className="text-[10px] sm:text-xs text-green-700 leading-snug">Отлично! Ваш логотип будет отображаться в профиле.</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('logo-upload')?.click()} 
                        disabled={isLoading}
                        className="h-9 sm:h-11 rounded-full w-full md:w-auto text-xs sm:text-sm"
                      >
                        <Camera className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Заменить логотип
                      </Button>
                      
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleEditLogo}
                        disabled={isLoading}
                        className="h-9 sm:h-11 rounded-full w-full md:w-auto bg-white hover:bg-gray-100 border border-gray-200 text-xs sm:text-sm"
                      >
                        <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Кроп / Увеличение
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Обложка */}
            <Card id="section-cover" className="w-full rounded-[24px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden scroll-mt-24">
              <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-2xl font-bold text-slate-900 leading-tight">Обложка профиля</CardTitle>
                    <CardDescription className="text-[11px] sm:text-sm text-slate-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                      Широкое фото 16:9. Это первое, что увидят клиенты.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    disabled={isLoading}
                    className="h-8 sm:h-9 rounded-full px-3 sm:px-4 text-[11px] sm:text-xs font-semibold shrink-0"
                  >
                    Загрузить
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0">
                <input type="file" id="cover-upload" accept="image/*" onChange={handleCoverUpload} disabled={isLoading} className="hidden" />
                
                {!coverPhoto ? (
                  // Пустое состояние - красивая плашка для загрузки
                  <button
                    type="button"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    disabled={isLoading}
                    className="w-full border-2 border-dashed border-slate-200 rounded-[24px] aspect-video hover:border-orange-300 hover:bg-orange-50 transition-all group overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-4 p-4 sm:p-8">
                      <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/80 group-hover:bg-orange-50 flex items-center justify-center transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.10)]">
                        <Camera className="w-6 h-6 sm:w-10 sm:h-10 text-slate-400 group-hover:text-orange-600 transition-colors" strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 mb-0.5 sm:mb-1">Загрузите обложку</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">PNG, JPG до 5MB • Формат 16:9 • Минимум 1920×1080px</p>
                      </div>
                      <div className="h-9 sm:h-11 rounded-full px-3 sm:px-6 pointer-events-none border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 bg-white flex items-center justify-center">
                        Выбрать файл
                      </div>
                    </div>
                  </button>
                ) : (
                  // Загруженная обложка - полноширинный превью
                  <div className="space-y-2 sm:space-y-4">
                    <div className="relative w-full aspect-video rounded-[18px] sm:rounded-[24px] overflow-hidden border-2 border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] group">
                      <img src={coverPhoto} alt="Cover preview" className="w-full h-full object-cover" />
                      
                      {/* Оверлей с кнопками при наведении */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3">
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => document.getElementById('cover-upload')?.click()} 
                          disabled={isLoading}
                          className="h-9 sm:h-11 rounded-full bg-white hover:bg-gray-100 text-xs sm:text-sm"
                        >
                          <Camera className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Заменить
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={handleEditCover} 
                          disabled={isLoading}
                          className="h-9 sm:h-11 rounded-full bg-white hover:bg-gray-100 text-xs sm:text-sm"
                        >
                          <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Кроп / AI расширение</span>
                          <span className="sm:hidden">Кроп</span>
                        </Button>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverPhoto(null)
                            setOriginalCoverPhoto(null)
                          }}
                          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-2.5 sm:p-4 bg-green-50 rounded-[18px] border border-green-100">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[11px] sm:text-xs font-semibold text-green-900 mb-0.5 sm:mb-1">Обложка загружена</p>
                          <p className="text-[10px] sm:text-xs text-green-700 leading-snug">Отлично! Обложка будет отображаться в шапке профиля. Наведите на изображение для редактирования или расширения AI.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Контакты */}
            <Card id="section-contacts" className="w-full rounded-[24px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] scroll-mt-24">
              <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-2xl font-bold text-slate-900 leading-tight">Контакты</CardTitle>
                <CardDescription className="text-[11px] sm:text-sm text-slate-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                  Телефон, email и ссылки — чтобы клиенты могли связаться с вами.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6 pt-0 space-y-4 sm:space-y-8">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-sm font-semibold text-slate-900">
                        Телефон
                      </FormLabel>
                      <FormDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                        Основной номер для связи. Клиенты смогут позвонить или написать в WhatsApp.
                      </FormDescription>
                      <FormControl>
                        <Input className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2" type="tel" placeholder="+7 900 123 45 67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-sm font-semibold text-slate-900">
                        Email
                      </FormLabel>
                      <FormDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
                        Для уведомлений о заказах и связи с клиентами.
                      </FormDescription>
                      <FormControl>
                        <Input className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2" type="email" placeholder="studio@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-2 sm:space-y-4 pt-1 sm:pt-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">Сайт и социальные сети</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug">Добавьте ссылки, чтобы клиенты могли узнать о вас больше.</p>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-100 rounded-[18px] shrink-0 text-sm sm:text-lg">🌐</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://example.com" {...field} /></div></FormControl></FormItem>)} />
                    <FormField control={form.control} name="social_links.vk" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">VK</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://vk.com/..." {...field} /></div></FormControl></FormItem>)} />
                    <FormField control={form.control} name="social_links.instagram" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-orange-50 text-orange-700 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">IG</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://instagram.com/..." {...field} /></div></FormControl></FormItem>)} />
                    <FormField control={form.control} name="social_links.tiktok" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-900 text-white rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">TT</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://tiktok.com/@..." {...field} /></div></FormControl></FormItem>)} />
                    <FormField control={form.control} name="social_links.telegram" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-sky-50 text-sky-600 rounded-[18px] shrink-0 font-bold text-[10px] sm:text-sm">TG</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="@username" {...field} /></div></FormControl></FormItem>)} />
                    <FormField control={form.control} name="social_links.youtube" render={({ field }) => (<FormItem><FormControl><div className="flex items-center gap-2 sm:gap-3 h-10 sm:h-12 px-2.5 sm:px-3 border border-slate-200 rounded-[18px] bg-white hover:border-slate-300 transition-colors"><div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-[18px] shrink-0 font-bold text-[9px] sm:text-xs">YT</div><Input className="border-none shadow-none focus-visible:ring-0 h-auto px-0 text-sm sm:text-base" placeholder="https://youtube.com/..." {...field} /></div></FormControl></FormItem>)} />
                  </div>
                </div>
              </CardContent>
            </Card>
              </>
            )}

        </div>
      </form>

      <ImageCropper 
        key="cover-editor"
        imageSrc={tempCoverSrc} 
        isOpen={isCropperOpen} 
        onClose={() => { 
          setIsCropperOpen(false)
          setTempCoverSrc(null) 
        }} 
        onCropComplete={handleCropComplete} 
        title="Обрезка обложки"
        aspect={16 / 9}
        isNewUpload={false}
        singleCropMode="desktop"
        desktopImageUrl={originalCoverPhoto || undefined}
        onAIExpand={originalCoverPhoto ? handleExpandCover : undefined}
        aiExpandDirections={['top', 'bottom', 'left', 'right', 'all']}
        aiExpandDefaultPercent={40}
        aiExpandMinPercent={20}
        aiExpandMaxPercent={60}
        aiExpandStep={10}
        aiExpandCostCredits={10}
      />

      <ImageCropper
        key="logo-editor"
        imageSrc={tempLogoSrc}
        isOpen={isLogoCropperOpen}
        onClose={() => {
          setIsLogoCropperOpen(false)
          if (tempLogoObjectUrlRef.current) {
            URL.revokeObjectURL(tempLogoObjectUrlRef.current)
            tempLogoObjectUrlRef.current = null
          }
          setTempLogoSrc(null)
        }}
        onCropComplete={handleLogoCropComplete}
        title="Обрезка логотипа"
        singleCropMode="mobile"
        isNewUpload={false}
      />
    </Form>
  )
}

