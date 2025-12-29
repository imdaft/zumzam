'use client'

/**
 * Админка: Профили
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Link as LinkIcon, Copy, Check, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { CITIES } from '@/lib/constants'
import { generateSlug } from '@/lib/validations/profile'

interface Profile {
  id: string
  user_id: string | null
  display_name: string
  slug: string
  category: string
  city: string | null
  is_published: boolean
  verified: boolean
  rating: number | null
  reviews_count: number
  created_at: string
  claim_status: string | null
  claim_token: string | null
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Создание unclaimed профиля
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProfile, setNewProfile] = useState({
    display_name: '',
    slug: '',
    category: 'venue',
    city: '',
    description: '',
  })
  const isCreateFormValid = useMemo(() => {
    return (
      newProfile.display_name.trim().length >= 2 &&
      newProfile.slug.trim().length >= 2 &&
      newProfile.city.trim().length >= 2
    )
  }, [newProfile])
  
  // Показ ссылки для claim
  const [isClaimLinkDialogOpen, setIsClaimLinkDialogOpen] = useState(false)
  const [claimLinkProfile, setClaimLinkProfile] = useState<Profile | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [page, categoryFilter, statusFilter])

  const fetchProfiles = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter === 'published') params.append('is_published', 'true')
      else if (statusFilter === 'unpublished') params.append('is_published', 'false')
      if (search.trim()) params.append('search', search.trim())

      const response = await fetch(`/api/admin/profiles?${params}`)
      if (!response.ok) throw new Error('Failed')

      const data = await response.json()
      setProfiles(data.profiles || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchProfiles()
  }

  const togglePublished = async (profile: Profile) => {
    try {
      const response = await fetch(`/api/admin/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !profile.is_published }),
      })
      if (!response.ok) throw new Error('Failed')
      toast.success(profile.is_published ? 'Скрыт' : 'Опубликован')
      fetchProfiles()
    } catch {
      toast.error('Ошибка')
    }
  }

  const toggleVerified = async (profile: Profile) => {
    try {
      const response = await fetch(`/api/admin/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !profile.verified }),
      })
      if (!response.ok) throw new Error('Failed')
      toast.success(profile.verified ? 'Верификация снята' : 'Верифицирован')
      fetchProfiles()
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleDeleteProfile = (profile: Profile) => {
    setSelectedProfile(profile)
    setIsDeleteDialogOpen(true)
  }

  const deleteProfile = async () => {
    if (!selectedProfile) return
    try {
      const response = await fetch(`/api/admin/profiles/${selectedProfile.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed')
      
      // Сначала закрываем диалог
      setIsDeleteDialogOpen(false)
      
      // Обновляем список профилей
      queueMicrotask(() => {
        fetchProfiles()
      })
    } catch {
      // Ошибки тихо логируем в консоль, тосты отключены по запросу
    }
  }

  // Создание unclaimed профиля
  const createUnclaimedProfile = async () => {
    const name = newProfile.display_name.trim()
    const slug = newProfile.slug.trim()
    const city = newProfile.city.trim()

    if (name.length < 2 || slug.length < 2) {
      queueMicrotask(() => toast.error('Заполните название и slug (мин. 2 символа)'))
      return
    }

    if (city.length < 2) {
      queueMicrotask(() => toast.error('Укажите город'))
      return
    }
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/profiles/create-unclaimed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания')
      }
      
      // Сначала закрываем диалог создания
      setIsCreateDialogOpen(false)
      setNewProfile({ display_name: '', slug: '', category: 'venue', city: '', description: '' })
      
      // Показываем ссылку для claim
      setClaimLinkProfile(data.profile)
      setIsClaimLinkDialogOpen(true)
      
      // Откладываем toast и обновление списка на следующий тик
      queueMicrotask(() => {
        toast.success('Профиль создан!')
        fetchProfiles()
      })
    } catch (error: any) {
      queueMicrotask(() => {
        toast.error(error.message || 'Ошибка создания профиля')
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  // Копирование ссылки для claim
  const copyClaimLink = async (profile: Profile) => {
    if (!profile.claim_token) return
    
    const baseUrl = window.location.origin
    const claimUrl = `${baseUrl}/claim/token/${profile.claim_token}`
    
    try {
      await navigator.clipboard.writeText(claimUrl)
      setCopied(true)
      toast.success('Ссылка скопирована!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }
  
  // Показ диалога с ссылкой
  const showClaimLink = (profile: Profile) => {
    setClaimLinkProfile(profile)
    setIsClaimLinkDialogOpen(true)
    setCopied(false)
  }
  
  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      venue: 'Площадка / Студия',
      animator: 'Аниматор',
      show: 'Шоу-программа',
      quest: 'Квест',
      master_class: 'Мастер-класс',
      photographer: 'Фотограф',
      agency: 'Агентство',
    }
    return labels[cat] || cat
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Профили</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Создать без владельца
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Поиск по названию или slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} variant="outline">Найти</Button>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="venue">Площадка</SelectItem>
            <SelectItem value="animator">Аниматор</SelectItem>
            <SelectItem value="show">Шоу</SelectItem>
            <SelectItem value="quest">Квест</SelectItem>
            <SelectItem value="studio">Студия</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="published">Опубликованные</SelectItem>
            <SelectItem value="unpublished">Скрытые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
      {/* Таблица - десктоп */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Загрузка...
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Профили не найдены</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium w-28">Категория</th>
                <th className="px-4 py-3 font-medium w-32">Город</th>
                <th className="px-4 py-3 font-medium w-24 text-center">Владелец</th>
                <th className="px-4 py-3 font-medium w-20 text-center">Рейтинг</th>
                <th className="px-4 py-3 font-medium w-24 text-center">Статус</th>
                <th className="px-4 py-3 font-medium w-28">Дата</th>
                <th className="px-4 py-3 font-medium w-48 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{profile.display_name}</div>
                    <div className="text-sm text-gray-500">/{profile.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {categoryLabel(profile.category)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {profile.city || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {profile.user_id ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Есть</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded flex items-center gap-1 justify-center">
                        <UserX className="w-3 h-3" />
                        Нет
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {profile.rating ? (
                      <span className="text-sm">
                        ★ {profile.rating.toFixed(1)} <span className="text-gray-400">({profile.reviews_count})</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {profile.is_published ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-sm rounded">Опубл.</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded">Скрыт</span>
                      )}
                      {profile.verified && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {/* Кнопка ссылки для unclaimed профилей */}
                    {!profile.user_id && profile.claim_token && (
                      <button 
                        onClick={() => showClaimLink(profile)} 
                        className="text-amber-600 hover:text-amber-700 mr-2" 
                        title="Получить ссылку для владельца"
                      >
                        <LinkIcon className="w-4 h-4 inline" />
                      </button>
                    )}
                    <Link href={`/profiles/${profile.slug}`} target="_blank" className="text-blue-600 hover:underline mr-2">
                      Открыть
                    </Link>
                    <button onClick={() => togglePublished(profile)} className="text-gray-500 hover:text-gray-700 mr-2" title={profile.is_published ? 'Скрыть' : 'Опубликовать'}>
                      {profile.is_published ? '👁' : '👁‍🗨'}
                    </button>
                    <button onClick={() => toggleVerified(profile)} className="text-gray-500 hover:text-gray-700 mr-2" title={profile.verified ? 'Снять верификацию' : 'Верифицировать'}>
                      ✓
                    </button>
                    <button onClick={() => handleDeleteProfile(profile)} className="text-red-500 hover:text-red-700" title="Удалить">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Карточки - мобайл */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Загрузка...
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Профили не найдены</div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{profile.display_name}</div>
                  <div className="text-xs text-gray-500">/{profile.slug}</div>
                </div>
                <div className="flex gap-1 ml-2">
                  {profile.is_published ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Опубл.</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">Скрыт</span>
                  )}
                  {profile.verified && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">✓</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                <div>{categoryLabel(profile.category)} · {profile.city || '—'}</div>
                {profile.rating && (
                  <div>★ {profile.rating.toFixed(1)} ({profile.reviews_count} отзывов)</div>
                )}
                <div className="text-xs text-gray-500">{formatDate(profile.created_at)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/profiles/${profile.slug}`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Открыть</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => togglePublished(profile)} title={profile.is_published ? 'Скрыть' : 'Опубликовать'}>
                  {profile.is_published ? '👁' : '👁‍🗨'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleVerified(profile)} title={profile.verified ? 'Снять верификацию' : 'Верифицировать'}>
                  ✓
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteProfile(profile)} className="text-red-500 hover:text-red-700" title="Удалить">
                  ×
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Вперёд →
          </Button>
        </div>
      )}

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить профиль?</DialogTitle>
            <DialogDescription>Это действие необратимо. Профиль: {selectedProfile?.display_name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={deleteProfile}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания unclaimed профиля */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-xl rounded-[24px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-amber-500" />
              Создать профиль без владельца
            </DialogTitle>
            <DialogDescription>
              Создайте профиль бизнеса, а затем отправьте уникальную ссылку владельцу для подтверждения.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Название *</Label>
              <Input
                id="display_name"
                placeholder="Студия праздников «Веселье»"
                value={newProfile.display_name}
                onChange={(e) => {
                  setNewProfile(prev => ({ 
                    ...prev, 
                    display_name: e.target.value,
                    slug: generateSlug(e.target.value)
                  }))
                }}
                className="rounded-[16px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/profiles/</span>
                <Input
                  id="slug"
                  placeholder="studiya-veselye"
                  value={newProfile.slug}
                  onChange={(e) =>
                    setNewProfile(prev => ({
                      ...prev,
                      slug: generateSlug(e.target.value),
                    }))
                  }
                  className="rounded-[16px]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория *</Label>
                <Select value={newProfile.category} onValueChange={(val) => setNewProfile(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="rounded-[16px] border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Площадка / Студия</SelectItem>
                    <SelectItem value="animator">Аниматор</SelectItem>
                    <SelectItem value="show">Шоу-программа</SelectItem>
                    <SelectItem value="quest">Квест</SelectItem>
                    <SelectItem value="master_class">Мастер-класс</SelectItem>
                    <SelectItem value="photographer">Фотограф</SelectItem>
                    <SelectItem value="agency">Агентство</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Город *</Label>
                <Select
                  value={newProfile.city || ''}
                  onValueChange={(val) => setNewProfile(prev => ({ ...prev, city: val }))}
                >
                  <SelectTrigger id="city" className="rounded-[16px] border-gray-200">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Допускаются только города РФ из списка</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Краткое описание бизнеса..."
                value={newProfile.description}
                onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="rounded-[16px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Отмена
            </Button>
            <Button
              onClick={createUnclaimedProfile}
              disabled={isCreating || !isCreateFormValid}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-full transition-all duration-300"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог с ссылкой для claim */}
      <Dialog open={isClaimLinkDialogOpen} onOpenChange={setIsClaimLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-amber-500" />
              Ссылка для владельца
            </DialogTitle>
            <DialogDescription>
              Отправьте эту ссылку владельцу бизнеса <strong>{claimLinkProfile?.display_name}</strong>. 
              После перехода он сможет зарегистрироваться и получить доступ к профилю.
            </DialogDescription>
          </DialogHeader>
          
          {claimLinkProfile?.claim_token && (
            <div className="py-4">
              <div className="bg-gray-50 border rounded-lg p-3 flex items-center gap-2">
                <code className="flex-1 text-sm break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/claim/token/${claimLinkProfile.claim_token}` : ''}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyClaimLink(claimLinkProfile)}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                ⚠️ Эта ссылка одноразовая и секретная. Не публикуйте её в открытом доступе.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClaimLinkDialogOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={() => copyClaimLink(claimLinkProfile!)} className="bg-amber-500 hover:bg-amber-600">
              <Copy className="w-4 h-4 mr-2" />
              Копировать ссылку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
