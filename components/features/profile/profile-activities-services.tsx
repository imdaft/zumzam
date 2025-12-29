'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

interface Activity {
  id: string
  name_ru: string
  name_en: string
  icon: string | null
  category: string
  description: string | null
}

interface Service {
  id: string
  name_ru: string
  name_en: string
  icon: string | null
  service_type: string
  description: string | null
}

interface ProfileActivitiesServicesProps {
  profileId: string
}

export function ProfileActivitiesServices({ profileId }: ProfileActivitiesServicesProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Загружаем связи профиля с каталогами и сами каталоги
        const [profileRes, activityCatalogRes, serviceCatalogRes] = await Promise.all([
          fetch(`/api/profiles/${profileId}/catalog`).catch(() => null),
          fetch('/api/catalogs?name=activity_catalog'),
          fetch('/api/catalogs?name=service_catalog'),
        ])

        let activityIds: string[] = []
        let serviceIds: string[] = []

        if (profileRes?.ok) {
          const profileData = await profileRes.json()
          activityIds = profileData.activities || []
          serviceIds = profileData.services || []
        }

        const [activityCatalogData, serviceCatalogData] = await Promise.all([
          activityCatalogRes.ok ? activityCatalogRes.json() : { items: [] },
          serviceCatalogRes.ok ? serviceCatalogRes.json() : { items: [] },
        ])

        // Сопоставляем ID с данными каталога
        if (activityCatalogData.items) {
          const formatted = activityIds
            .map((id) => activityCatalogData.items.find((item: any) => item.id === id))
            .filter(Boolean)
            .map((item: any) => ({
              id: item.id,
              name_ru: item.name_ru,
              name_en: item.name_en,
              icon: item.icon,
              category: item.category,
              description: item.description,
            }))
          setActivities(formatted)
        }

        if (serviceCatalogData.items) {
          const formatted = serviceIds
            .map((id) => serviceCatalogData.items.find((item: any) => item.id === id))
            .filter(Boolean)
            .map((item: any) => ({
              id: item.id,
              name_ru: item.name_ru,
              name_en: item.name_en,
              icon: item.icon,
              service_type: item.category, // используем category как service_type
              description: item.description,
            }))
          setServices(formatted)
        }
      } catch (error) {
        console.error('[ProfileActivitiesServices] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [profileId])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="h-24 bg-slate-200 rounded-xl"></div>
      </div>
    )
  }

  if (activities.length === 0 && services.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Активности */}
      {activities.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Что мы предлагаем</CardTitle>
            </div>
            <CardDescription>
              Активности и программы для детских праздников
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-100 hover:border-orange-300 hover:shadow-sm transition-all"
                >
                  {/* Icon/Emoji */}
                  <div className="text-3xl leading-none shrink-0">
                    {activity.icon || '🎯'}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 mb-1">
                      {activity.name_ru}
                    </h4>

                    {activity.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Услуги */}
      {services.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Дополнительные услуги</CardTitle>
            </div>
            <CardDescription>
              Всё необходимое для праздника в одном месте
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {/* Icon/Emoji */}
                  <div className="text-2xl leading-none shrink-0">
                    {service.icon || '✨'}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 mb-1">
                      {service.name_ru}
                    </h4>

                    {service.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}





