'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { 
  Plus, Building2, MapPin, Star, Eye, FileText, 
  Edit, ExternalLink, Loader2, CheckCircle2,
  BarChart3, Sparkles, Copy, Trash2, MoreHorizontal, Home
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProfileDraftsList } from '@/components/features/profile/profile-drafts-list'
import { useProfileDrafts } from '@/hooks/use-profile-drafts'
import { toast } from 'sonner'

interface Profile {
  id: string
  display_name: string
  slug: string
  category: string
  city: string
  rating: number
  reviews_count: number
  is_published: boolean
  verified: boolean
  cover_photo?: string
  views_count?: number
  orders_count?: number
}

export default function ProfilesPage() {
  const { user, isClient, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all')
  const { drafts } = useProfileDrafts()
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null)
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)

  useEffect(() => {
    // Загружаем профили только если пользователь авторизован
    // Используем небольшую задержку, чтобы не блокировать начальный рендер
    if (!user) return
    
    const timer = setTimeout(() => {
      loadProfiles()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [user])

  // Страница только для провайдеров
  if (!isAuthLoading && isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[24px] border border-gray-100 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Эта страница для исполнителей</h1>
        <p className="text-gray-600 mb-6 max-w-md px-4">
          Раздел "Мои профили" доступен только для исполнителей услуг. 
          Если вы хотите стать исполнителем, обновите свой аккаунт.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full">
            <Link href="/search">
              Найти услугу
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const loadProfiles = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/profiles/check')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return

    setDeletingProfileId(profileToDelete.id)

    try {
      const response = await fetch(`/api/profiles/${profileToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить профиль')
      }

      // Удаляем профиль из списка
      setProfiles(profiles.filter(p => p.id !== profileToDelete.id))
      
      toast.success('Профиль успешно удален', {
        description: `Профиль "${profileToDelete.name}" был удален`,
        duration: 3000,
      })
      
      setProfileToDelete(null)
    } catch (error: any) {
      console.error('Error deleting profile:', error)
      toast.error('Ошибка удаления', {
        description: error.message || 'Не удалось удалить профиль',
        duration: 5000,
      })
    } finally {
      setDeletingProfileId(null)
    }
  }

  const handleCreateProfile = async () => {
    setIsCreatingProfile(true)

    try {
      const response = await fetch('/api/profiles/quick-create', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Не удалось создать профиль')
      }

      const { profile } = await response.json()
      
      // Сразу редирект на редактирование
      router.push(`/profiles/${profile.slug}/edit`)
    } catch (error: any) {
      console.error('Error creating profile:', error)
      toast.error('Ошибка создания', {
        description: error.message || 'Не удалось создать профиль',
        duration: 5000,
      })
    } finally {
      setIsCreatingProfile(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      venue: 'Площадка',
      animator: 'Аниматор',
      show: 'Шоу-программа',
      quest: 'Квест',
      photographer: 'Фотограф',
      agency: 'Агентство',
    }
    return labels[category] || category
  }

  const filteredProfiles = profiles.filter(p => {
    if (filter === 'active') return p.is_published
    if (filter === 'draft') return !p.is_published
    return true
  })

  const activeCount = profiles.filter(p => p.is_published).length
  // Черновики = только неопубликованные профили из БД (localStorage показываем отдельно)
  const draftCount = profiles.filter(p => !p.is_published).length
  const localDraftsCount = drafts.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!profileToDelete} onOpenChange={(open) => !open && setProfileToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              Удалить профиль?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              Вы уверены, что хотите удалить профиль{' '}
              <span className="font-semibold text-gray-900">
                "{profileToDelete?.name}"
              </span>
              ? Это действие нельзя отменить. Все данные профиля, включая услуги, отзывы и статистику будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingProfileId} className="rounded-full">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteProfile()
              }}
              disabled={!!deletingProfileId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 rounded-full"
            >
              {deletingProfileId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить профиль'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="pt-2 pb-6">
        {/* Заголовок + кнопка */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Мои профили</h1>
            <p className="text-gray-600 text-[15px]">Управление вашими профилями и услугами</p>
          </div>

          {/* Десктоп: Фильтры + Кнопка */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Табы фильтров */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                  filter === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                  filter === 'active' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Активные
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                  filter === 'draft' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Черновики
              </button>
            </div>
            
            {/* Незавершённые черновики */}
            {localDraftsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{localDraftsCount} незавершённых</span>
              </div>
            )}

            <Button 
              onClick={handleCreateProfile}
              disabled={isCreatingProfile}
              className="bg-orange-500 hover:bg-orange-600 rounded-full px-4 h-10 text-sm font-medium shrink-0"
            >
              {isCreatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Создать
                </>
              )}
            </Button>
          </div>

          {/* Мобильная: только кнопка */}
          <Button 
            onClick={handleCreateProfile}
            disabled={isCreatingProfile}
            className="sm:hidden bg-orange-500 hover:bg-orange-600 rounded-full px-4 h-10 text-sm font-medium shrink-0"
          >
            {isCreatingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                Создать
              </>
            )}
          </Button>
        </div>

        {/* Мобильная: Фильтры + незавершённые под заголовком */}
        <div className="flex sm:hidden flex-col gap-3">
          {/* Табы фильтров */}
          <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                filter === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                filter === 'active' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                filter === 'draft' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Черновики
            </button>
          </div>
          
          {/* Незавершённые черновики */}
          {localDraftsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-700 w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="font-medium">{localDraftsCount} незавершённых</span>
            </div>
          )}
        </div>
      </div>

      {/* Profiles List */}
      {filter === 'draft' && localDraftsCount > 0 && (
        <div className="space-y-3">
          <ProfileDraftsList />
          {draftCount > 0 && (
            <div className="border-t pt-4 mt-4">
              <h2 className="text-base font-bold text-gray-900 mb-3">
                Созданные черновики ({draftCount})
              </h2>
            </div>
          )}
        </div>
      )}

      {filteredProfiles.length === 0 && (filter !== 'draft' || drafts.length === 0) ? (
        <div className="text-center py-20 bg-white rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-5">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-[24px] font-bold text-gray-900 mb-3">
            {filter === 'all' ? 'Нет профилей' : filter === 'active' ? 'Нет активных профилей' : 'Нет черновиков'}
          </h2>
          <p className="text-[15px] leading-relaxed text-gray-600 mb-8 max-w-sm mx-auto px-4">
            {filter === 'all' 
              ? 'Создайте профиль, чтобы клиенты могли найти вас'
              : 'Измените фильтр или создайте новый профиль'
            }
          </p>
          {filter === 'all' && (
            <Button 
              onClick={handleCreateProfile}
              disabled={isCreatingProfile}
              className="bg-orange-500 hover:bg-orange-600 rounded-full px-5 h-10"
            >
              {isCreatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать профиль
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => {
            // Сокращения городов
            const getCityShort = (city: string) => {
              const shorts: Record<string, string> = {
                'Санкт-Петербург': 'СПб',
                'Москва': 'МСК',
                'Екатеринбург': 'ЕКБ',
                'Нижний Новгород': 'НН',
                'Новосибирск': 'НСК',
              }
              return shorts[city] || city
            }

            return (
              <div 
                key={profile.id}
                className="bg-white rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    {/* Фото */}
                    <Link href={`/profiles/${profile.slug}`} target="_blank" className="shrink-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-gray-100 overflow-hidden flex items-center justify-center">
                        {profile.cover_photo ? (
                          <img 
                            src={profile.cover_photo} 
                            alt={profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg sm:text-xl font-bold text-gray-400">
                            {profile.display_name?.[0] || 'P'}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      {/* Верхняя строка: Имя + галочка */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link 
                            href={`/profiles/${profile.slug}`}
                            target="_blank"
                            className="font-semibold text-base sm:text-lg text-gray-900 hover:text-orange-600 transition-colors truncate"
                          >
                            {profile.display_name}
                          </Link>
                          {profile.verified && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          )}
                        </div>

                        {/* Статус - десктоп: капсула */}
                        <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          profile.is_published 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {profile.is_published ? 'Активен' : 'Черновик'}
                        </span>
                      </div>

                      {/* Нижняя строка */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Категория [+ Город + Статистика только десктоп] */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{getCategoryLabel(profile.category)}</span>
                          
                          {/* Город - только десктоп */}
                          {profile.city && (
                            <>
                              <span className="text-gray-300 hidden sm:inline">|</span>
                              <span className="hidden sm:inline">{getCityShort(profile.city)}</span>
                            </>
                          )}
                          
                          {/* Статистика - только десктоп */}
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold text-gray-900">{profile.rating ? Number(profile.rating).toFixed(1) : '0.0'}</span>
                              <span className="text-gray-400">({profile.reviews_count || 0})</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              <span>{profile.views_count || 0}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{profile.orders_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* Кнопки - десктоп */}
                        <div className="hidden lg:flex items-center gap-1.5">
                          <Link
                            href={`/profiles/${profile.slug}`}
                            target="_blank"
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            Открыть
                          </Link>
                          <Link
                            href={`/profiles/${profile.slug}/edit`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            Изменить
                          </Link>
                          <Link
                            href={`/analytics?profile=${profile.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            Статистика
                          </Link>
                          <Link
                            href={`/advertising?profile=${profile.id}`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            Продвижение
                          </Link>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-[16px]">
                              <DropdownMenuItem className="flex items-center gap-2 rounded-[12px]">
                                <Copy className="w-4 h-4" />
                                Дублировать
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-red-600 focus:text-red-600 rounded-[12px]"
                                disabled={deletingProfileId === profile.id}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setTimeout(() => {
                                    setProfileToDelete({ id: profile.id, name: profile.display_name })
                                  }, 0)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Мобильная версия: Статус-точка + Меню */}
                    <div className="flex sm:hidden items-center gap-2 shrink-0">
                      {/* Статус-точка */}
                      <div className={`w-2 h-2 rounded-full ${
                        profile.is_published ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      
                      {/* Меню */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-[18px]">
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/profiles/${profile.slug}`} target="_blank" className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Открыть
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/profiles/${profile.slug}/edit`} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Изменить
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/analytics?profile=${profile.id}`} className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Статистика
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/advertising?profile=${profile.id}`} className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Продвижение
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 rounded-[12px]">
                            <Copy className="w-4 h-4" />
                            Дублировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-red-600 focus:text-red-600 rounded-[12px]"
                            disabled={deletingProfileId === profile.id}
                            onSelect={(e) => {
                              e.preventDefault()
                              setTimeout(() => {
                                setProfileToDelete({ id: profile.id, name: profile.display_name })
                              }, 0)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Планшет: только меню (lg скрывает кнопки, но не sm) */}
                    <div className="hidden sm:block lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-[18px]">
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/profiles/${profile.slug}`} target="_blank" className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Открыть
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/profiles/${profile.slug}/edit`} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Изменить
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/analytics?profile=${profile.id}`} className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Статистика
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-[12px]">
                            <Link href={`/advertising?profile=${profile.id}`} className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Продвижение
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-2 rounded-[12px]">
                            <Copy className="w-4 h-4" />
                            Дублировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-red-600 focus:text-red-600 rounded-[12px]"
                            disabled={deletingProfileId === profile.id}
                            onSelect={(e) => {
                              e.preventDefault()
                              setTimeout(() => {
                                setProfileToDelete({ id: profile.id, name: profile.display_name })
                              }, 0)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

