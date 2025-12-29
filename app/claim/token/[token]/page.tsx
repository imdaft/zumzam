'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
// Supabase больше не используется
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Sparkles,
  User
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Profile {
  id: string
  slug: string
  display_name: string
  description: string | null
  city: string | null
  main_photo: string | null
  logo: string | null
  category: string
  claim_status: string
  user_id: string | null
}

export default function ClaimByTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const supabase = createClient()

  // Получаем токен из params
  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  // Загружаем данные профиля по токену
  useEffect(() => {
    if (!token) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Проверяем авторизацию
        const user = await getCurrentUser()
        setCurrentUser(user)
        setIsAuthenticated(!!user)

        // Загружаем профиль по токену
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, slug, display_name, description, city, main_photo, logo, category, claim_status, user_id')
          .eq('claim_token', token)
          .single()

        if (profileError || !profileData) {
          setError('Ссылка недействительна или профиль не найден')
          setIsLoading(false)
          return
        }

        // Проверяем, не забран ли уже профиль
        if (profileData.user_id || profileData.claim_status === 'claimed') {
          setError('Этот профиль уже имеет владельца')
          setProfile(profileData)
          setIsLoading(false)
          return
        }

        setProfile(profileData)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Ошибка загрузки данных')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [token, supabase])

  // Принятие профиля
  const handleClaim = async () => {
    if (!profile || !currentUser || !token) return

    setIsClaiming(true)
    setError(null)

    try {
      const response = await fetch('/api/claim/by-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка принятия профиля')
      }

      setSuccess(true)
      
      // Редирект в личный кабинет (страница списков профилей)
      setTimeout(() => {
        router.push('/profiles')
      }, 1200)
    } catch (err: any) {
      console.error('Claim error:', err)
      setError(err.message || 'Произошла ошибка')
    } finally {
      setIsClaiming(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  // Ошибка (невалидный токен или уже занят)
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ссылка недействительна</h1>
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

  // Профиль уже имеет владельца
  if (profile && (profile.user_id || profile.claim_status === 'claimed')) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Профиль уже имеет владельца</h1>
          <p className="text-white/60 mb-6">
            Профиль <strong>{profile.display_name}</strong> уже принадлежит зарегистрированному пользователю.
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

  // Успешно принято
  if (success) {
    return (
      <div className="min-h-screen bg-[#1c1c1e] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Поздравляем! 🎉</h1>
          <p className="text-white/60 mb-6">
            Профиль <strong>{profile?.display_name}</strong> теперь ваш! 
            Переходим в личный кабинет...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#1c1c1e]">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-green-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-lg mx-auto">
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
                {profile.city && (
                  <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.city}
                  </p>
                )}
              </div>
            </div>
            
            {profile.description && (
              <p className="text-white/70 text-sm mt-4 line-clamp-3">
                {profile.description}
              </p>
            )}
          </div>

          {/* Заголовок */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Получите свой профиль!
            </h1>
            <p className="text-white/60 max-w-sm mx-auto">
              Вас пригласили стать владельцем этого профиля на ZumZam. 
              {!isAuthenticated && ' Войдите или зарегистрируйтесь, чтобы принять приглашение.'}
            </p>
          </div>

          {/* Действия */}
          {!isAuthenticated ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Войдите, чтобы принять профиль
                </h3>
                <p className="text-slate-500 mb-6">
                  Для получения доступа к профилю необходимо войти в аккаунт или зарегистрироваться.
                </p>
                <div className="space-y-3">
                  <Link href={`/login?redirect=/claim/token/${token}`}>
                    <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl">
                      Войти
                    </Button>
                  </Link>
                  <Link href={`/register?redirect=/claim/token/${token}`}>
                    <Button variant="outline" className="w-full h-12 rounded-xl">
                      Зарегистрироваться
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Всё готово!
                </h3>
                <p className="text-slate-500 mb-6">
                  Вы вошли как <strong>{currentUser?.email}</strong>. 
                  Нажмите кнопку ниже, чтобы стать владельцем профиля.
                </p>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
                    {error}
                  </div>
                )}
                
                <Button 
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Принимаем...
                    </>
                  ) : (
                    <>
                      Принять профиль
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Что вы получите */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              После принятия вы сможете редактировать профиль, добавлять услуги, 
              получать заявки и отвечать на отзывы.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

