'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Loader2, Plus, Eye, MousePointerClick, TrendingUp, Calendar, DollarSign, Trash2, ExternalLink, BarChart3, MoreHorizontal, Sparkles, Home } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/contexts/auth-context'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  moderation_notes: string
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
      name: string
      slug: string
    }
  }>
  created_at: string
}

export default function AdvertisingPage() {
  const router = useRouter()
  const { user, isClient, isLoading: authLoading } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  // Страница только для провайдеров
  if (!authLoading && isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Реклама для исполнителей</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          Раздел рекламы доступен только для исполнителей услуг.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full">
            <Link href="/">
              Найти услугу
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/advertising/campaigns')
      const data = await response.json()

      if (data.campaigns) {
        setCampaigns(data.campaigns)
        
        const stats = data.campaigns.reduce((acc: any, camp: Campaign) => {
          acc.spent += Number(camp.stats?.spent || 0)
          acc.impressions += Number(camp.stats?.impressions || 0)
          acc.clicks += Number(camp.stats?.clicks || 0)
          return acc
        }, { spent: 0, impressions: 0, clicks: 0 })

        setTotalSpent(stats.spent)
        setTotalImpressions(stats.impressions)
        setTotalClicks(stats.clicks)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Ошибка загрузки кампаний')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-700' },
      pending_approval: { label: 'На модерации', className: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'Активна', className: 'bg-green-100 text-green-700' },
      paused: { label: 'Приостановлена', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Завершена', className: 'bg-gray-100 text-gray-700' },
      rejected: { label: 'Отклонена', className: 'bg-red-100 text-red-700' }
    }
    const variant = variants[status] || { label: status, className: '' }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${variant.className}`}>
        {variant.label}
      </span>
    )
  }

  const handleDeleteClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowDeleteDialog(true)
  }

  const deleteCampaign = async () => {
    if (!selectedCampaign) return

    try {
      const response = await fetch(`/api/advertising/campaigns/${selectedCampaign.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Ошибка удаления кампании')
      }

      toast.success('Кампания удалена')
      setShowDeleteDialog(false)
      loadCampaigns()
    } catch (error: any) {
      console.error('Error deleting campaign:', error)
      toast.error(error.message || 'Ошибка удаления кампании')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0%'
    return ((clicks / impressions) * 100).toFixed(2) + '%'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-2 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-gray-900 leading-tight mb-2">Реклама</h1>
            <p className="text-gray-600 text-[15px]">Управление рекламными кампаниями</p>
          </div>
          <Button onClick={() => router.push('/advertising/create')} className="gap-2 bg-orange-500 hover:bg-orange-600 rounded-full px-6 h-11 text-[15px] font-medium w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4" />
            Создать кампанию
          </Button>
        </div>
      </div>

      {/* Статистика — стиль как в orders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] bg-gray-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">Кампаний</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            Активных: {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Показы</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString('ru-RU')}</div>
          <p className="text-xs text-gray-500 mt-1">
            CTR: {calculateCTR(totalImpressions, totalClicks)}
          </p>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] bg-green-50 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Клики</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString('ru-RU')}</div>
          <p className="text-xs text-gray-500 mt-1">Всего переходов</p>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[12px] bg-orange-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Потрачено</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</div>
          <p className="text-xs text-gray-500 mt-1">За весь период</p>
        </div>
      </div>

      {/* Информация о рекламных местах */}
      <div className="bg-blue-50 rounded-[24px] p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg text-blue-900">Доступные рекламные места</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Карусель на главной', price: '5,000₽/день', reach: '1000+ показов/день', desc: 'Максимальная видимость' },
            { name: 'Топ-3 в поиске', price: '500₽/день', reach: '500+ показов/день', desc: 'Первые места в результатах' },
            { name: 'Featured в категории', price: '300₽/день', reach: '300+ показов/день', desc: 'Выделение в категории' },
            { name: 'Баннер в профилях', price: '200₽/день', reach: '200+ показов/день', desc: 'Сайдбар профилей' },
          ].map((slot, idx) => (
            <div key={idx} className="bg-white p-4 rounded-[16px] shadow-sm">
              <div className="font-bold text-gray-900 mb-2">{slot.name}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Цена: <span className="font-medium">{slot.price}</span></div>
                <div>Охват: <span className="font-medium">{slot.reach}</span></div>
                <div className="text-xs text-gray-500">{slot.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Список кампаний */}
      <div>
        <h2 className="font-bold text-lg text-gray-900 mb-4">Ваши кампании</h2>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-[24px]">
            <div className="w-14 h-14 bg-white rounded-[16px] shadow-sm flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Начните продвигать свой бизнес
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Создайте первую рекламную кампанию и привлеките больше клиентов
            </p>
            <Button onClick={() => router.push('/advertising/create')} className="bg-orange-500 hover:bg-orange-600 rounded-full px-5">
              <Plus className="w-4 h-4 mr-2" />
              Создать кампанию
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Иконка */}
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-orange-500" />
                    </div>

                    {/* Инфо */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/advertising/${campaign.id}`}
                        className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors truncate block"
                      >
                        {campaign.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{campaign.description}</p>
                    </div>

                    {/* Даты */}
                    <div className="text-sm text-right hidden md:block">
                      <div className="font-medium text-gray-900">{formatDate(campaign.start_date)}</div>
                      <div className="text-gray-500">{formatDate(campaign.end_date)}</div>
                    </div>

                    {/* Статистика */}
                    <div className="flex items-center gap-4 text-sm hidden md:flex">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        {campaign.stats?.impressions || 0}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MousePointerClick className="w-4 h-4" />
                        {campaign.stats?.clicks || 0}
                      </div>
                    </div>

                    {/* Статус */}
                    {getStatusBadge(campaign.status)}

                    {/* Действия */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/advertising/${campaign.id}/analytics`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[12px] transition-colors"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[12px] transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/advertising/${campaign.id}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Детали
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(campaign)}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
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
            ))}
          </div>
        )}
      </div>

      {/* Диалог удаления */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Удалить кампанию?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Кампания и все её бронирования будут удалены навсегда.
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="py-4">
              <p className="text-sm">
                Вы собираетесь удалить кампанию <span className="font-semibold">«{selectedCampaign.title}»</span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-[12px]"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCampaign}
              className="gap-2 rounded-[12px]"
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
