'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
// Supabase больше не используется
import { 
  Building2, 
  MapPin, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  FileText,
  Send
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

// Схема валидации формы заявки
const claimSchema = z.object({
  contact_name: z.string().min(2, 'Укажите ваше имя'),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Введите корректный email'),
  position: z.string().optional(),
  proof_description: z.string().min(10, 'Опишите, как вы можете подтвердить владение (минимум 10 символов)'),
  proof_links: z.string().optional(),
})

type ClaimInput = z.infer<typeof claimSchema>

interface Profile {
  id: string
  slug: string
  display_name: string
  description: string | null
  bio: string | null
  city: string
  address: string | null
  rating: number | null
  reviews_count: number
  main_photo: string | null
  cover_photo: string | null
  logo: string | null
  category: string
  claim_status: string
  user_id: string | null
}

export default function ClaimProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingRequest, setExistingRequest] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const form = useForm<ClaimInput>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      position: '',
      proof_description: '',
      proof_links: '',
    },
  })

  // Получаем slug из params
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  // Загружаем данные профиля и проверяем авторизацию
  useEffect(() => {
    if (!slug) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Проверяем авторизацию через API
        const userResponse = await fetch('/api/users/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          const user = userData?.data || null
          setCurrentUser(user)
          setIsAuthenticated(!!user)
        } else {
          setCurrentUser(null)
          setIsAuthenticated(false)
        }

        // Загружаем профиль через API
        const profileResponse = await fetch(`/api/profiles/by-slug/${slug}`)
        const profileResult = await profileResponse.json()

        if (!profileResponse.ok || !profileResult.profile) {
          setError(profileResult.error || 'Профиль не найден')
          setIsLoading(false)
          return
        }

        const profileData = profileResult.profile
        setProfile(profileData)

        // Если пользователь авторизован, заполняем email и проверяем существующую заявку
        if (user) {
          form.setValue('contact_email', user.email || '')

          // Проверяем, есть ли уже заявка от этого пользователя
          const claimResponse = await fetch('/api/claim')
          if (claimResponse.ok) {
            const claimResult = await claimResponse.json()
            const existingRequestData = claimResult.claim_requests?.find(
              (req: any) => req.profile_id === profileData.id && req.user_id === user.id
            )
            if (existingRequestData) {
              setExistingRequest(existingRequestData)
            }
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [slug, form])

  const onSubmit = async (data: ClaimInput) => {
    if (!profile || !currentUser) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Преобразуем строку ссылок в массив
      const proofLinksArray = data.proof_links
        ? data.proof_links.split('\n').map(link => link.trim()).filter(link => link.length > 0)
        : []

      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          contact_name: data.contact_name,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          position: data.position,
          proof_description: data.proof_description,
          proof_links: proofLinksArray,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка отправки заявки')
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Submit error:', err)
      setError(err.message || 'Произошла ошибка при отправке заявки')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Категория профиля на русском
  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      'venue': 'Студия / Площадка',
      'animator': 'Аниматор',
      'show': 'Шоу-программа',
      'quest': 'Квест',
      'master_class': 'Мастер-классы',
      'photographer': 'Фотограф',
      'agency': 'Агентство',
    }
    return map[cat] || 'Бизнес'
  }

  // Статус заявки на русском
  const getRequestStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'pending': { label: 'На рассмотрении', color: 'text-amber-600 bg-amber-50' },
      'approved': { label: 'Одобрена', color: 'text-green-600 bg-green-50' },
      'rejected': { label: 'Отклонена', color: 'text-red-600 bg-red-50' },
    }
    return map[status] || { label: status, color: 'text-gray-600 bg-gray-50' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Профиль не найден</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) return null

  // Если профиль уже имеет владельца
  if (profile.claim_status === 'claimed' && profile.user_id) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Профиль уже имеет владельца</h1>
          <p className="text-white/60 mb-6">
            Этот профиль уже принадлежит зарегистрированному пользователю. 
            Если вы считаете, что это ошибка, свяжитесь с нами.
          </p>
          <Link href={`/profiles/${profile.slug}`}>
            <Button className="bg-white text-black hover:bg-white/90">
              Посмотреть профиль
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Если заявка успешно отправлена
  if (success) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Заявка отправлена!</h1>
          <p className="text-white/60 mb-6">
            Мы рассмотрим вашу заявку в ближайшее время и свяжемся с вами по указанному email.
            Обычно это занимает 1-2 рабочих дня.
          </p>
          <div className="space-y-3">
            <Link href={`/profiles/${profile.slug}`}>
              <Button className="w-full bg-white text-black hover:bg-white/90">
                Посмотреть профиль
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Если уже есть заявка от этого пользователя
  if (existingRequest) {
    const statusInfo = getRequestStatusLabel(existingRequest.status)
    
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.color} mb-6`}>
            {existingRequest.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin" />}
            {existingRequest.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
            {existingRequest.status === 'rejected' && <AlertCircle className="w-4 h-4" />}
            <span className="font-medium">{statusInfo.label}</span>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Вы уже подали заявку</h1>
          
          {existingRequest.status === 'pending' && (
            <p className="text-white/60 mb-6">
              Ваша заявка на получение доступа к профилю <strong>{profile.display_name}</strong> находится на рассмотрении.
              Мы свяжемся с вами по email.
            </p>
          )}
          
          {existingRequest.status === 'approved' && (
            <p className="text-white/60 mb-6">
              Поздравляем! Ваша заявка одобрена. Теперь вы можете управлять профилем из личного кабинета.
            </p>
          )}
          
          {existingRequest.status === 'rejected' && (
            <>
              <p className="text-white/60 mb-4">
                К сожалению, ваша заявка была отклонена.
              </p>
              {existingRequest.rejection_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-red-300">
                    <strong>Причина:</strong> {existingRequest.rejection_reason}
                  </p>
                </div>
              )}
            </>
          )}
          
          <div className="space-y-3">
            {existingRequest.status === 'approved' && (
              <Link href="/dashboard">
                <Button className="w-full bg-white text-black hover:bg-white/90">
                  Перейти в личный кабинет
                </Button>
              </Link>
            )}
            <Link href={`/profiles/${profile.slug}`}>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                Посмотреть профиль
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1c1c1e]">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        {/* Кнопка назад */}
        <Link 
          href={`/profiles/${profile.slug}`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться к профилю</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Карточка профиля */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 mb-8 border border-white/10">
            <div className="flex items-start gap-4">
              {/* Лого или фото */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
                {profile.logo || profile.main_photo ? (
                  <Image
                    src={profile.logo || profile.main_photo || ''}
                    alt={profile.display_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white/40" />
                  </div>
                )}
              </div>
              
              {/* Информация */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {profile.display_name}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  {getCategoryLabel(profile.category)}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-white/50">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.city}
                    </span>
                  )}
                  {profile.rating && profile.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {profile.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Это ваш бизнес?
            </h1>
            <p className="text-white/60 max-w-md mx-auto">
              Подтвердите владение и получите полный контроль над профилем: 
              редактирование, отзывы, бронирования и статистика.
            </p>
          </div>

          {/* Форма или призыв к авторизации */}
          {!isAuthenticated ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Войдите, чтобы продолжить
                </h3>
                <p className="text-slate-500 mb-6">
                  Для подачи заявки на владение профилем необходимо войти в аккаунт или зарегистрироваться.
                </p>
                <div className="space-y-3">
                  <Link href={`/login?redirect=/claim/${profile.slug}`}>
                    <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl">
                      Войти
                    </Button>
                  </Link>
                  <Link href={`/register?redirect=/claim/${profile.slug}`}>
                    <Button variant="outline" className="w-full h-12 rounded-xl">
                      Зарегистрироваться
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                Заявка на получение доступа
              </h3>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Имя */}
                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ваше имя *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              placeholder="Иван Иванов"
                              className="pl-10 h-11 rounded-xl"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              className="pl-10 h-11 rounded-xl"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Телефон */}
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="tel"
                              placeholder="+7 (999) 123-45-67"
                              className="pl-10 h-11 rounded-xl"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Должность */}
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ваша должность</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Владелец, Директор, Менеджер..."
                            className="h-11 rounded-xl"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Описание подтверждения */}
                  <FormField
                    control={form.control}
                    name="proof_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Как вы можете подтвердить владение? *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Textarea
                              placeholder="Например: Я являюсь владельцем, могу подтвердить по телефону, указанному на сайте / в соцсетях..."
                              className="pl-10 min-h-[100px] rounded-xl resize-none"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Опишите, как мы можем убедиться, что вы действительно представляете этот бизнес
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ссылки для подтверждения */}
                  <FormField
                    control={form.control}
                    name="proof_links"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ссылки для подтверждения</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Textarea
                              placeholder="https://instagram.com/your_business&#10;https://vk.com/your_business&#10;https://your-website.ru"
                              className="pl-10 min-h-[80px] rounded-xl resize-none"
                              disabled={isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Укажите ссылки на соцсети или сайт (каждая ссылка с новой строки)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl mt-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Отправить заявку
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* Что вы получите */}
          <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <h4 className="text-white font-semibold mb-4">Что вы получите после подтверждения:</h4>
            <ul className="space-y-3">
              {[
                'Полный контроль над профилем и его редактирование',
                'Управление услугами, ценами и расписанием',
                'Получение заявок и бронирований от клиентов',
                'Доступ к отзывам и возможность отвечать на них',
                'Статистика просмотров и аналитика',
                'Приоритетное размещение в поиске',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

