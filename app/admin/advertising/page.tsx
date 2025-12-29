'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Eye, MousePointerClick, TrendingUp, DollarSign, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, User, Plus, Edit, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/contexts/auth-context'
import Link from 'next/link'
import Image from 'next/image'
import { ImageCropper } from '@/components/shared/image-cropper'

interface Campaign {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  start_date: string
  end_date: string
  status: string
  moderation_status: string
  moderation_notes: string | null
  moderated_at: string | null
  profile_id: string | null
  metadata: {
    display_order?: number
  } | null
  profile: {
    id: string
    display_name: string
    slug: string
    email: string
  } | null
  stats: {
    impressions: number
    clicks: number
    conversions: number
    spent: number
  }
  bookings: Array<{
    id: string
    start_date: string
    end_date: string
    total_cost: number
    status: string
    ad_slot: {
      id: string
      name: string
      slug: string
      price_per_day: number
    }
  }>
  created_at: string
}

interface Profile {
  id: string
  display_name: string
  slug: string
}

export default function AdminAdvertisingPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Диалоги
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showModerationDialog, setShowModerationDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Форма кампании
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    profile_id: '',
    display_order: 0,
    status: 'active',
    is_system: false
  })
  
  // Модерация
  const [moderationStatus, setModerationStatus] = useState<string>('')
  const [moderationNotes, setModerationNotes] = useState('')
  
  // Загрузка изображения
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [moderationFilter, setModerationFilter] = useState<string>('all')

  useEffect(() => {
    checkAdminAccess()
  }, [user, authLoading])

  const checkAdminAccess = async () => {
    try {
      if (authLoading) return
      if (!user) {
        router.push('/login?redirect=/admin/advertising')
        return
      }

      const response = await fetch('/api/user')
      if (!response.ok) throw new Error('Failed to check access')
      const data = await response.json()
      
      if (data.role !== 'admin') {
        toast.error('Доступ запрещён')
        router.push('/')
        return
      }

      setIsAdmin(true)
      loadCampaigns()
      loadProfiles()
    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/advertising/campaigns')
      if (!response.ok) {
        throw new Error('Ошибка загрузки кампаний')
      }
      const data = await response.json()
      // Сортируем по display_order
      const sorted = (data.campaigns || []).sort((a: Campaign, b: Campaign) => {
        const aOrder = a.metadata?.display_order || 999
        const bOrder = b.metadata?.display_order || 999
        return aOrder - bOrder
      })
      setCampaigns(sorted)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Не удалось загрузить кампании')
    }
  }

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/profiles/public')
      if (!response.ok) return
      const data = await response.json()
      setProfiles(data.profiles || [])
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }

  const handleCreateClick = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      profile_id: '',
      display_order: campaigns.length,
      status: 'active',
      is_system: false
    })
    setShowCreateDialog(true)
  }

  const handleEditClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setFormData({
      title: campaign.title,
      description: campaign.description || '',
      image_url: campaign.image_url,
      link_url: campaign.link_url,
      start_date: campaign.start_date.split('T')[0],
      end_date: campaign.end_date.split('T')[0],
      profile_id: campaign.profile_id || '',
      display_order: campaign.metadata?.display_order || 0,
      status: campaign.status,
      is_system: !campaign.profile // Если нет профиля, значит системный
    })
    setShowEditDialog(true)
  }

  const handleModerateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setModerationStatus(campaign.moderation_status || 'pending')
    setModerationNotes(campaign.moderation_notes || '')
    setShowModerationDialog(true)
  }

  const handleDeleteClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDeleteDialog(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      // Загружаем на сервер
      const uploadFormData = new FormData()
      uploadFormData.append('file', croppedBlob, `ad-${Date.now()}.jpg`)

      const uploadResponse = await fetch('/api/advertising/upload-image', {
        method: 'POST',
        body: uploadFormData
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Ошибка загрузки изображения')
      }

      const { url } = await uploadResponse.json()
      setFormData(prev => ({ ...prev, image_url: url }))
      toast.success('Изображение загружено')
      setIsCropperOpen(false)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Не удалось загрузить изображение')
    }
  }

  const saveCampaign = async (isCreate: boolean) => {
    if (!formData.title || !formData.image_url || !formData.link_url) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setIsSaving(true)
    try {
      const method = isCreate ? 'POST' : 'PATCH'
      const body = isCreate 
        ? formData
        : { campaignId: selectedCampaign?.id, ...formData }

      const response = await fetch('/api/admin/advertising/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(isCreate ? 'Ошибка создания кампании' : 'Ошибка обновления кампании')
      }

      toast.success(isCreate ? 'Кампания создана' : 'Кампания обновлена')
      setShowCreateDialog(false)
      setShowEditDialog(false)
      loadCampaigns()
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast.error('Не удалось сохранить кампанию')
    } finally {
      setIsSaving(false)
    }
  }

  const saveModerationStatus = async () => {
    if (!selectedCampaign) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/advertising/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          moderationStatus,
          moderationNotes
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка обновления статуса')
      }

      toast.success('Статус модерации обновлён')
      setShowModerationDialog(false)
      loadCampaigns()
    } catch (error) {
      console.error('Error saving moderation status:', error)
      toast.error('Не удалось обновить статус')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCampaign = async () => {
    if (!selectedCampaign) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/advertising/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign.id })
      })

      if (!response.ok) {
        throw new Error('Ошибка удаления кампании')
      }

      toast.success('Кампания удалена')
      setShowDeleteDialog(false)
      loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Не удалось удалить кампанию')
    } finally {
      setIsSaving(false)
    }
  }

  const changeDisplayOrder = async (campaign: Campaign, direction: 'up' | 'down') => {
    const currentOrder = campaign.metadata?.display_order || 0
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1

    try {
      const response = await fetch('/api/admin/advertising/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          display_order: newOrder
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка изменения порядка')
      }

      toast.success('Порядок обновлен')
      loadCampaigns()
    } catch (error) {
      console.error('Error changing order:', error)
      toast.error('Не удалось изменить порядок')
    }
  }

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Одобрено</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Отклонено</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />На модерации</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Не проверено</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Активна</Badge>
      case 'paused':
        return <Badge variant="outline">Приостановлена</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Завершена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false
    if (moderationFilter !== 'all' && campaign.moderation_status !== moderationFilter) return false
    return true
  })

  const totalCampaigns = campaigns.length
  const pendingModeration = campaigns.filter(c => c.moderation_status === 'pending').length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.stats?.spent || 0), 0)

  if (authLoading || isLoading) {
    return (
      <div className="p-6 text-gray-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Загрузка...
      </div>
    )
  }

  if (!isAdmin) return null

  // ВАЖНО: это НЕ React-компонент, а render-функция.
  // Если объявить компонент внутри рендера и использовать как <CampaignForm />,
  // React будет считать его "новым типом" на каждый setState → размонтирование/монтаж,
  // из-за чего инпуты теряют фокус (симптом: вводится 1 символ и поле "деактивируется").
  const renderCampaignForm = () => (
    <div className="space-y-4">
      {/* Превью изображения */}
      {formData.image_url && (
        <div
          className="relative w-full rounded-lg overflow-hidden bg-gray-100"
          style={{ aspectRatio: '21/9' }}
        >
          <Image
            src={formData.image_url}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Загрузка изображения */}
      <div>
        <Label>Изображение *</Label>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Загрузить изображение
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Название */}
      <div>
        <Label htmlFor="title">Название *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Например: Студия детских праздников"
        />
      </div>

      {/* Описание */}
      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Краткое описание рекламы..."
          rows={3}
        />
      </div>

      {/* Ссылка */}
      <div>
        <Label htmlFor="link_url">Ссылка *</Label>
        <Input
          id="link_url"
          type="url"
          value={formData.link_url}
          onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>

      {/* Даты */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Дата начала *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="end_date">Дата окончания *</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Привязка к профилю (для буста) */}
      <div>
        <Label htmlFor="profile_id">Профиль для буста (необязательно)</Label>
        <Select value={formData.profile_id || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, profile_id: value === 'none' ? '' : value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите профиль..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без привязки</SelectItem>
            {profiles.slice(0, 50).map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Профиль получит преимущество в поиске и на карте
        </p>
      </div>

      {/* Приоритет показа */}
      <div>
        <Label htmlFor="display_order">Приоритет показа (чем меньше число, тем выше в карусели)</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
        />
      </div>

      {/* Статус */}
      <div>
        <Label htmlFor="status">Статус</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Активна</SelectItem>
            <SelectItem value="paused">Приостановлена</SelectItem>
            <SelectItem value="completed">Завершена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Системный баннер */}
      <div className="flex items-center gap-2">
        <input
          id="is_system"
          type="checkbox"
          checked={formData.is_system}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            is_system: e.target.checked,
            profile_id: e.target.checked ? '' : prev.profile_id // Сбрасываем профиль для системных
          }))}
          className="w-4 h-4 rounded border-gray-300"
        />
        <Label htmlFor="is_system" className="cursor-pointer">
          Системный баннер (заглушка)
        </Label>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Системные баннеры показываются когда нет платных рекламных кампаний
      </p>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Управление рекламой</h1>
          <p className="text-sm text-gray-500">Все рекламные кампании на платформе</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          Создать кампанию
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{totalCampaigns}</div>
          <div className="text-sm text-gray-500">Всего кампаний</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingModeration}</div>
          <div className="text-sm text-gray-500">На модерации</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{activeCampaigns}</div>
          <div className="text-sm text-gray-500">Активных</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString('ru-RU')} ₽</div>
          <div className="text-sm text-gray-500">Общий доход</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Статус кампании</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="active">Активна</SelectItem>
                <SelectItem value="paused">Приостановлена</SelectItem>
                <SelectItem value="completed">Завершена</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Статус модерации</label>
            <Select value={moderationFilter} onValueChange={setModerationFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">На модерации</SelectItem>
                <SelectItem value="approved">Одобрено</SelectItem>
                <SelectItem value="rejected">Отклонено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Список кампаний */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            Кампании не найдены
          </div>
        ) : (
          filteredCampaigns.map((campaign, index) => (
            <div key={campaign.id} className="bg-white border rounded-lg p-6 hover:shadow-sm transition-shadow">
              <div className="flex gap-6">
                {/* Управление порядком */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => changeDisplayOrder(campaign, 'up')}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <div className="text-xs text-center text-gray-500">
                    {campaign.metadata?.display_order || 0}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === filteredCampaigns.length - 1}
                    onClick={() => changeDisplayOrder(campaign, 'down')}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Превью */}
                <div
                  className="relative w-64 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                  style={{ aspectRatio: '21/9' }}
                >
                  <Image
                    src={campaign.image_url}
                    alt={campaign.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Информация */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{campaign.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <User className="w-3 h-3" />
                        {campaign.profile ? (
                          <>
                            <Link href={`/profiles/${campaign.profile.slug}`} className="hover:text-orange-500">
                              {campaign.profile.display_name}
                            </Link>
                            <span>·</span>
                            <span>{campaign.profile.email}</span>
                          </>
                        ) : (
                          <span className="text-orange-600 font-medium">Системный баннер (заглушка)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getModerationBadge(campaign.moderation_status)}
                      {getStatusBadge(campaign.status)}
                    </div>
                  </div>

                  {/* Статистика */}
                  <div className="flex gap-6 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{campaign.stats.impressions.toLocaleString('ru-RU')}</span>
                      <span className="text-gray-500">показов</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MousePointerClick className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{campaign.stats.clicks.toLocaleString('ru-RU')}</span>
                      <span className="text-gray-500">кликов</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{campaign.stats.spent.toLocaleString('ru-RU')} ₽</span>
                      <span className="text-gray-500">потрачено</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {campaign.stats.clicks > 0 
                          ? ((campaign.stats.clicks / campaign.stats.impressions) * 100).toFixed(2)
                          : '0.00'
                        }%
                      </span>
                      <span className="text-gray-500">CTR</span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(campaign)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerateClick(campaign)}
                    >
                      Модерация
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={campaign.link_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Открыть
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteClick(campaign)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>

              {/* Примечания модератора */}
              {campaign.moderation_notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-medium text-gray-500 mb-1">Примечания модератора:</div>
                  <div className="text-sm text-gray-700">{campaign.moderation_notes}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Диалог создания */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать рекламную кампанию</DialogTitle>
            <DialogDescription>
              Заполните информацию о рекламной кампании
            </DialogDescription>
          </DialogHeader>
          {renderCampaignForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => saveCampaign(true)} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать кампанию</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.title}
            </DialogDescription>
          </DialogHeader>
          {renderCampaignForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => saveCampaign(false)} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог модерации */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Модерация кампании</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4">
              <div
                className="relative w-full rounded-lg overflow-hidden bg-gray-100"
                style={{ aspectRatio: '21/9' }}
              >
                <Image
                  src={selectedCampaign.image_url}
                  alt={selectedCampaign.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <Label>Статус модерации</Label>
                <Select value={moderationStatus} onValueChange={setModerationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">На модерации</SelectItem>
                    <SelectItem value="approved">Одобрено</SelectItem>
                    <SelectItem value="rejected">Отклонено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Примечания (необязательно)</Label>
                <Textarea
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Добавьте комментарий для рекламодателя..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModerationDialog(false)}>
              Отмена
            </Button>
            <Button onClick={saveModerationStatus} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить кампанию?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить кампанию "{selectedCampaign?.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={deleteCampaign} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Cropper */}
      <ImageCropper
        imageSrc={imageSrc}
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
        aspect={21 / 9}
      />
    </div>
  )
}










