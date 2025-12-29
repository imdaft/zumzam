'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Eye, 
  MousePointerClick, 
  Users, 
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AnalyticsData {
  campaign: {
    id: string
    title: string
    stats: {
      impressions: number
      clicks: number
      spent: number
    }
  }
  demographics: {
    devices: { device_type: string; count: number }[]
    browsers: { browser: string; count: number }[]
    os: { os: string; count: number }[]
    cities: { city: string; count: number }[]
    countries: { country: string; count: number }[]
  }
  timeline: {
    date: string
    impressions: number
    clicks: number
  }[]
  topReferrers: { referrer: string; count: number }[]
  avgTimeOnPage: number
  bounceRate: number
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = (Array.isArray(params.id) ? params.id[0] : params.id) as string

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('[Analytics] 🔍 Mounted with params:', params)
    console.log('[Analytics] 🔍 campaignId:', campaignId)
    console.log('[Analytics] 🔍 typeof:', typeof campaignId)
    
    if (!campaignId || campaignId === 'undefined') {
      console.error('[Analytics] ❌ Invalid campaignId!')
      setIsLoading(false)
      toast.error('ID кампании не найден')
      return
    }
    
    loadAnalytics()
  }, [campaignId])

  const loadAnalytics = async () => {
    try {
      console.log('[Analytics] 📡 Fetching for campaign:', campaignId)
      const url = `/api/advertising/campaigns/${campaignId}/analytics`
      
      const response = await fetch(url)
      
      console.log('[Analytics] 📊 Response:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Analytics] ❌ Error:', errorText)
        throw new Error(`Ошибка: ${response.status}`)
      }

      const result = await response.json()
      console.log('[Analytics] ✅ Data loaded:', result)
      setData(result)
    } catch (error: any) {
      console.error('[Analytics] ❌ Exception:', error)
      toast.error(error.message || 'Ошибка загрузки аналитики')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCTR = () => {
    if (!data || data.campaign.stats.impressions === 0) return '0%'
    const ctr = (data.campaign.stats.clicks / data.campaign.stats.impressions) * 100
    return `${ctr.toFixed(2)}%`
  }

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return <Smartphone className="w-4 h-4" />
    if (device === 'tablet') return <Tablet className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Данные не найдены</p>
          <Button onClick={() => router.push('/advertising')} className="mt-4">
            Вернуться к кампаниям
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link href="/advertising">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Аналитика кампании</h1>
          <p className="text-gray-600 mt-1">{data.campaign.title}</p>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Показы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.campaign.stats.impressions.toLocaleString('ru-RU')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-green-500" />
              Клики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.campaign.stats.clicks.toLocaleString('ru-RU')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              CTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCTR()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Время на странице
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgTimeOnPage || 0}с</div>
          </CardContent>
        </Card>
      </div>

      {/* Демография */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Устройства */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Устройства
            </CardTitle>
            <CardDescription>Распределение по типам устройств</CardDescription>
          </CardHeader>
          <CardContent>
            {data.demographics.devices.length > 0 ? (
              <div className="space-y-3">
                {data.demographics.devices.map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.device_type)}
                      <span className="capitalize">{device.device_type || 'Неизвестно'}</span>
                    </div>
                    <Badge variant="outline">{device.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Браузеры */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Браузеры
            </CardTitle>
            <CardDescription>Популярные браузеры</CardDescription>
          </CardHeader>
          <CardContent>
            {data.demographics.browsers.length > 0 ? (
              <div className="space-y-3">
                {data.demographics.browsers.slice(0, 5).map((browser, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{browser.browser || 'Неизвестно'}</span>
                    <Badge variant="outline">{browser.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* ОС */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Операционные системы
            </CardTitle>
            <CardDescription>ОС пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            {data.demographics.os.length > 0 ? (
              <div className="space-y-3">
                {data.demographics.os.slice(0, 5).map((os, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{os.os || 'Неизвестно'}</span>
                    <Badge variant="outline">{os.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* География */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              География
            </CardTitle>
            <CardDescription>Города и страны</CardDescription>
          </CardHeader>
          <CardContent>
            {data.demographics.cities.length > 0 ? (
              <div className="space-y-3">
                {data.demographics.cities.slice(0, 5).map((city, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{city.city || 'Неизвестно'}</span>
                    <Badge variant="outline">{city.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Источники трафика */}
      {data.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Источники трафика
            </CardTitle>
            <CardDescription>Откуда приходят пользователи</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topReferrers.map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-md">
                    {ref.referrer || 'Прямой переход'}
                  </span>
                  <Badge variant="outline">{ref.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
