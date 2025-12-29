'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, 
  ShoppingBag, TrendingUp, Clock, Search, Eye, 
  MousePointerClick, ExternalLink, Loader2, Tag,
  Globe, BarChart3, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

interface UserDetail {
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    city: string | null
    role: string
    created_at: string
  }
  profiles: any[]
  statistics: {
    total_orders: number
    pending_orders: number
    confirmed_orders: number
    completed_orders: number
    cancelled_orders: number
    active_orders: number
    total_spent: number
    avg_order_value: number
    last_order_date: string | null
    total_activities: number
    page_views: number
    searches: number
    profile_views: number
    last_activity_date: string | null
    first_utm_source: string | null
    first_utm_campaign: string | null
    first_referrer: string | null
  }
  recentOrders: any[]
  sources: any[]
  recentActivity: any[]
  interests: any[]
  activityStats: Record<string, number>
  searchHistory: any[]
  viewedProfiles: any[]
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [data, setData] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user details')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Пользователь не найден</h3>
        </div>
      </div>
    )
  }

  const { user, statistics, profiles, recentOrders, sources, recentActivity, interests, activityStats, searchHistory, viewedProfiles } = data

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Не указано'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">Профиль пользователя</h1>
      </div>

      {/* User Info Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
              <p className="text-slate-600">{user.email}</p>
              <Badge className="mt-2">{user.role === 'admin' ? 'Администратор' : user.role === 'provider' ? 'Исполнитель' : 'Клиент'}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user.phone}</span>
            </div>
          )}
          {user.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{user.city}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Регистрация: {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ru })}</span>
          </div>
          {statistics.last_activity_date && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Был: {format(new Date(statistics.last_activity_date), 'dd MMM yyyy HH:mm', { locale: ru })}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Всего заказов</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{statistics.total_orders || 0}</p>
          <p className="text-sm text-slate-600 mt-1">
            Активных: <span className="font-semibold text-green-600">{statistics.active_orders || 0}</span>
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Потрачено</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{Math.round(statistics.total_spent || 0)} ₽</p>
          <p className="text-sm text-slate-600 mt-1">
            Средний чек: <span className="font-semibold text-blue-600">{Math.round(statistics.avg_order_value || 0)} ₽</span>
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Активность</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{statistics.total_activities || 0}</p>
          <p className="text-sm text-slate-600 mt-1">
            Просмотров: <span className="font-semibold text-purple-600">{statistics.page_views || 0}</span>
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Search className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Поисков</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{statistics.searches || 0}</p>
          <p className="text-sm text-slate-600 mt-1">
            Профилей: <span className="font-semibold text-orange-600">{statistics.profile_views || 0}</span>
          </p>
        </Card>
      </div>

      {/* Info card if no data */}
      {statistics.total_activities === 0 && recentOrders.length === 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Система аналитики активирована</h3>
              <p className="text-sm text-blue-700 mb-2">
                Данные о действиях пользователя начнут собираться автоматически. Вы увидите:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Просмотры страниц и профилей</li>
                <li>Поисковые запросы</li>
                <li>Клики по услугам</li>
                <li>Добавления в корзину</li>
                <li>Источники трафика (UTM метки, referrer)</li>
                <li>Информацию об устройстве (браузер, ОС, тип устройства)</li>
                <li>Время на странице и глубину прокрутки</li>
                <li>Автоматически выявленные интересы</li>
              </ul>
              <p className="text-sm text-blue-700 mt-2 font-medium">
                💡 Данные появятся после того, как пользователь начнет взаимодействовать с сайтом
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Заказы ({recentOrders.length})</TabsTrigger>
          <TabsTrigger value="activity">Активность ({recentActivity.length})</TabsTrigger>
          <TabsTrigger value="interests">Интересы ({interests.length})</TabsTrigger>
          <TabsTrigger value="sources">Источники ({sources.length})</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Последние заказы</h3>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Заказов пока нет</p>
              ) : (
                recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{order.order_number}</span>
                        <Badge variant={
                          order.status === 'completed' ? 'default' :
                          order.status === 'cancelled' ? 'destructive' :
                          order.status === 'confirmed' ? 'default' : 'secondary'
                        }>
                          {order.status === 'pending' && 'Ожидает'}
                          {order.status === 'confirmed' && 'Подтвержден'}
                          {order.status === 'completed' && 'Завершен'}
                          {order.status === 'cancelled' && 'Отменен'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{order.profiles?.display_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(order.event_date), 'dd MMM yyyy', { locale: ru })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{order.total_amount} ₽</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(order.created_at), 'dd.MM.yyyy', { locale: ru })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Order Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-slate-600 mb-1">Ожидают</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.pending_orders || 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 mb-1">Подтверждены</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.confirmed_orders || 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 mb-1">Завершены</p>
              <p className="text-2xl font-bold text-green-600">{statistics.completed_orders || 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600 mb-1">Отменены</p>
              <p className="text-2xl font-bold text-red-600">{statistics.cancelled_orders || 0}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(activityStats).map(([type, count]) => (
              <Card key={type} className="p-4">
                <p className="text-sm text-slate-600 mb-1 capitalize">{type.replace('_', ' ')}</p>
                <p className="text-2xl font-bold">{count as number}</p>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Последняя активность</h3>
            <div className="space-y-2">
              {recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action_type}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </p>
                  </div>
                  {activity.page_url && (
                    <p className="text-xs text-slate-500 truncate max-w-xs">{activity.page_url}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                История поиска
              </h3>
              <div className="space-y-2">
                {searchHistory.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium">{item.action_data.query || 'N/A'}</p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Interests Tab */}
        <TabsContent value="interests" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Интересы пользователя</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interests.length === 0 ? (
                <p className="text-slate-600 text-center py-8 col-span-2">Интересов пока не выявлено</p>
              ) : (
                interests.map((interest: any) => (
                  <div key={interest.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge>{interest.interest_type}</Badge>
                      <span className="text-sm font-semibold text-purple-600">
                        {interest.interest_score} взаимодействий
                      </span>
                    </div>
                    <p className="text-sm font-medium">{interest.interest_value}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Последнее: {format(new Date(interest.last_interaction), 'dd MMM yyyy', { locale: ru })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Источники трафика
            </h3>
            {statistics.first_utm_source && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Первый визит</p>
                <div className="space-y-1">
                  {statistics.first_utm_source && (
                    <p className="text-sm"><span className="text-slate-600">Источник:</span> <Badge>{statistics.first_utm_source}</Badge></p>
                  )}
                  {statistics.first_utm_campaign && (
                    <p className="text-sm"><span className="text-slate-600">Кампания:</span> <Badge variant="outline">{statistics.first_utm_campaign}</Badge></p>
                  )}
                  {statistics.first_referrer && (
                    <p className="text-xs text-slate-600 truncate">Referrer: {statistics.first_referrer}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Нет данных об источниках</p>
              ) : (
                sources.map((source: any) => (
                  <div key={source.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {source.utm_source && <Badge>{source.utm_source}</Badge>}
                      {source.utm_medium && <Badge variant="outline">{source.utm_medium}</Badge>}
                      {source.utm_campaign && <Badge variant="secondary">{source.utm_campaign}</Badge>}
                    </div>
                    {source.landing_page && (
                      <p className="text-xs text-slate-600 mb-1">Landing: {source.landing_page}</p>
                    )}
                    {source.referrer && (
                      <p className="text-xs text-slate-600 mb-1 truncate">Referrer: {source.referrer}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {source.device_type && <span>{source.device_type}</span>}
                      {source.browser && <span>{source.browser}</span>}
                      {source.city && <span>{source.city}</span>}
                      <span>{format(new Date(source.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profiles */}
      {profiles.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Профили пользователя</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map((profile: any) => (
              <Link 
                key={profile.id} 
                href={`/profiles/${profile.slug}`}
                target="_blank"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{profile.display_name}</h4>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{profile.category}</Badge>
                  {profile.verified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
                </div>
                {profile.rating && (
                  <p className="text-sm text-slate-600">
                    ⭐ {profile.rating} ({profile.reviews_count} отзывов)
                  </p>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

