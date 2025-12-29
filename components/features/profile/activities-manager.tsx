'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface Activity {
  id: string
  name: string
  category: string
  icon?: string
}

interface ActivitiesManagerProps {
  profileId: string
  category: string
  onUpdate?: () => void
}

export function ActivitiesManager({ profileId, category, onUpdate }: ActivitiesManagerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Определяем какой каталог использовать
  const getCatalogName = () => {
    switch (category) {
      case 'venue': return 'activity_catalog'
      case 'animator': return 'animator_services_catalog'
      case 'show': return 'show_types_catalog'
      case 'photographer': return 'photographer_styles_catalog'
      case 'master_class': return 'masterclass_types_catalog'
      case 'quest': return 'quest_types_catalog'
      case 'agency': return 'agency_services_catalog'
      default: return 'activity_catalog'
    }
  }

  // Определяем какое поле использовать в профиле
  const getFieldName = () => {
    return category === 'venue' ? 'activities' : 'primary_services'
  }

  useEffect(() => {
    loadData()
  }, [profileId, category])

  const loadData = async () => {
    try {
      const catalogName = getCatalogName()
      const fieldName = getFieldName()
      
      // Загружаем данные профиля и каталога параллельно
      const [profileRes, catalogRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}/catalog`),
        fetch(`/api/catalogs?name=${encodeURIComponent(catalogName)}`)
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        const selected = fieldName === 'activities' 
          ? (profileData.activities || [])
          : (profileData.services || [])
        setSelectedActivities(selected)
      }

      if (catalogRes.ok) {
        const catalogData = await catalogRes.json()
        setAvailableActivities(catalogData.items?.map((item: any) => ({
          id: item.id,
          name: item.name_ru,
          category: item.category,
          icon: item.icon,
          description: item.description,
        })) || [])
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
      toast.error('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fieldName = getFieldName()
      
      const payload = fieldName === 'activities'
        ? { activities: selectedActivities }
        : { services: selectedActivities }
      
      const response = await fetch(`/api/profiles/${profileId}/catalog`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      toast.success('Обновлено')
      setIsDialogOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const getActivityName = (id: string) => {
    return availableActivities.find(a => a.id === id)?.name || id
  }

  const groupedActivities = availableActivities.reduce((acc, activity) => {
    const cat = activity.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(activity)
    return acc
  }, {} as Record<string, Activity[]>)

  // Адаптивные заголовки в зависимости от категории
  const getTitle = () => {
    switch (category) {
      case 'venue': return 'Активности'
      case 'animator': return 'Программы и услуги'
      case 'show': return 'Виды шоу'
      case 'photographer': return 'Стили съёмки'
      case 'master_class': return 'Мастер-классы'
      case 'quest': return 'Квесты'
      case 'agency': return 'Услуги'
      default: return 'Услуги'
    }
  }

  const getDescription = () => {
    switch (category) {
      case 'venue': return 'Развлечения, которые есть на вашей площадке'
      case 'animator': return 'Что вы предлагаете клиентам'
      case 'show': return 'Шоу-программы, которые вы проводите'
      case 'photographer': return 'Виды фотосъёмки, которые вы делаете'
      case 'master_class': return 'Мастер-классы, которые вы проводите'
      case 'quest': return 'Квесты, которые вы организуете'
      case 'agency': return 'Услуги, которые вы предоставляете'
      default: return 'Выберите ваши услуги'
    }
  }

  if (loading) {
    return (
      <Card className="rounded-[24px] border-gray-100 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-[24px] border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              {getTitle()}
            </CardTitle>
            <CardDescription className="mt-1">
              {getDescription()}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Выберите активности</DialogTitle>
                <DialogDescription>
                  Отметьте все развлечения, которые доступны на вашей площадке
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {Object.entries(groupedActivities).map(([category, activities]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {activities.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-3 p-3 rounded-[18px] hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedActivities.includes(activity.id)}
                            onCheckedChange={() => handleToggle(activity.id)}
                          />
                          <label className="flex-1 text-sm font-medium text-gray-900 cursor-pointer">
                            {activity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                  className="rounded-full"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-orange-500 hover:bg-orange-600"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Сохранить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {selectedActivities.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">
              Вы еще не добавили ни одной активности
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить активности
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedActivities.map(activityId => (
              <Badge
                key={activityId}
                variant="secondary"
                className="px-3 py-1.5 text-sm font-medium bg-orange-50 text-orange-700 border-0"
              >
                {getActivityName(activityId)}
                <button
                  onClick={() => {
                    setSelectedActivities(prev => prev.filter(id => id !== activityId))
                  }}
                  className="ml-2 hover:text-orange-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

