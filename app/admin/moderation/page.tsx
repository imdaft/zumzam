'use client'

import { useEffect, useState } from 'react'
import { 
  Shield, 
  Building2, 
  MessageSquare, 
  Image as ImageIcon, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { logger } from '@/lib/logger'

interface ModerationStats {
  profiles: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
  reviews: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
  reports: {
    open: number
    resolved: number
    total: number
  }
  recentActions: {
    id: string
    type: 'profile' | 'review' | 'report'
    action: 'approve' | 'reject' | 'delete'
    target_name: string
    moderator: string
    created_at: string
  }[]
}

/**
 * Дашборд модерации для администраторов
 * Показывает очереди на модерацию и статистику
 */
export default function ModerationDashboardPage() {
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchStats()
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      logger.error('[Moderation] Failed to fetch stats', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Мок данных пока нет API
  const mockStats: ModerationStats = stats || {
    profiles: { pending: 5, approved: 128, rejected: 12, total: 145 },
    reviews: { pending: 23, approved: 456, rejected: 34, total: 513 },
    reports: { open: 3, resolved: 47, total: 50 },
    recentActions: []
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Модерация
          </h1>
          <p className="text-slate-600 mt-1">
            Управление контентом и жалобами
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Очереди модерации */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Профили */}
        <Card className={mockStats.profiles.pending > 0 ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-slate-600" />
              Профили
            </CardTitle>
            <CardDescription>Новые и изменённые</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-amber-600">
                  {mockStats.profiles.pending}
                </span>
                <Badge variant={mockStats.profiles.pending > 0 ? 'default' : 'secondary'}>
                  <Clock className="w-3 h-3 mr-1" />
                  Ожидают
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {mockStats.profiles.approved}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  {mockStats.profiles.rejected}
                </span>
              </div>
              <Link href="/admin/profiles?status=pending">
                <Button className="w-full gap-2" variant={mockStats.profiles.pending > 0 ? 'default' : 'outline'}>
                  Модерировать
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Отзывы */}
        <Card className={mockStats.reviews.pending > 0 ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              Отзывы
            </CardTitle>
            <CardDescription>Новые отзывы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-amber-600">
                  {mockStats.reviews.pending}
                </span>
                <Badge variant={mockStats.reviews.pending > 0 ? 'default' : 'secondary'}>
                  <Clock className="w-3 h-3 mr-1" />
                  Ожидают
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {mockStats.reviews.approved}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  {mockStats.reviews.rejected}
                </span>
              </div>
              <Link href="/admin/reviews?status=pending">
                <Button className="w-full gap-2" variant={mockStats.reviews.pending > 0 ? 'default' : 'outline'}>
                  Модерировать
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Жалобы */}
        <Card className={mockStats.reports.open > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
              Жалобы
            </CardTitle>
            <CardDescription>От пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-4xl font-bold ${mockStats.reports.open > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {mockStats.reports.open}
                </span>
                <Badge variant={mockStats.reports.open > 0 ? 'destructive' : 'secondary'}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Открыто
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {mockStats.reports.resolved} решено
                </span>
              </div>
              <Link href="/admin/reports">
                <Button className="w-full gap-2" variant={mockStats.reports.open > 0 ? 'destructive' : 'outline'}>
                  Рассмотреть
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Общая статистика */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Статистика модерации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Профилей всего</span>
                <span className="font-bold">{mockStats.profiles.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Отзывов всего</span>
                <span className="font-bold">{mockStats.reviews.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Жалоб за месяц</span>
                <span className="font-bold">{mockStats.reports.total}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700">Процент одобрения</span>
                <span className="font-bold text-green-700">
                  {Math.round((mockStats.profiles.approved / mockStats.profiles.total) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/profiles">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Building2 className="w-6 h-6" />
                  <span>Все профили</span>
                </Button>
              </Link>
              <Link href="/admin/reviews">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span>Все отзывы</span>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <Shield className="w-6 h-6" />
                  <span>Пользователи</span>
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                  <TrendingUp className="w-6 h-6" />
                  <span>Аналитика</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние действия */}
      {mockStats.recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Последние действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockStats.recentActions.map((action) => (
                <div 
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {action.action === 'approve' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {action.action === 'reject' && <XCircle className="w-5 h-5 text-red-500" />}
                    {action.action === 'delete' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    <div>
                      <span className="font-medium">{action.target_name}</span>
                      <span className="text-slate-500 text-sm ml-2">
                        {action.type === 'profile' && 'профиль'}
                        {action.type === 'review' && 'отзыв'}
                        {action.type === 'report' && 'жалоба'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">
                    {action.moderator}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

