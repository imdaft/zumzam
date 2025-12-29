'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, MapPin, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { detectCityKey, CITY_DISTRICTS, type CityKey, type District } from '@/lib/data/districts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WorkArea {
  id: string
  area_name: string
  price_modifier: number
  travel_time?: number
}

interface GeographyManagerProps {
  profileId: string
  categoryType: 'animator' | 'show' | 'agency' | 'master_class' | 'photographer'
  hideHeader?: boolean
}

export function GeographyManager({ profileId, categoryType, hideHeader }: GeographyManagerProps) {
  const [areas, setAreas] = useState<WorkArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<WorkArea | null>(null)
  const [cityName, setCityName] = useState<string | null>(null)
  const [cityKey, setCityKey] = useState<CityKey | null>(null)
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('')

  // Тексты в зависимости от типа категории
  const texts = {
    animator: {
      title: 'География работы',
      description: 'Укажите районы и города, куда вы выезжаете на мероприятия',
      areaLabel: 'Район / Город',
      priceLabel: 'Доплата за выезд (₽)',
      timeLabel: 'Время в пути (мин)',
    },
    show: {
      title: 'География работы',
      description: 'Укажите районы и города, где вы проводите шоу-программы',
      areaLabel: 'Район / Город',
      priceLabel: 'Доплата за выезд (₽)',
      timeLabel: 'Время в пути (мин)',
    },
    agency: {
      title: 'География работы',
      description: 'Укажите районы и города, где вы организуете мероприятия',
      areaLabel: 'Район / Город',
      priceLabel: 'Доплата за выезд (₽)',
      timeLabel: 'Время в пути (мин)',
    },
    master_class: {
      title: 'География работы',
      description: 'Укажите районы и города, куда вы выезжаете с мастер-классами',
      areaLabel: 'Район / Город',
      priceLabel: 'Доплата за выезд (₽)',
      timeLabel: 'Время в пути (мин)',
    },
    photographer: {
      title: 'География работы',
      description: 'Укажите районы и города, где вы проводите фотосессии',
      areaLabel: 'Район / Город',
      priceLabel: 'Доплата за выезд (₽)',
      timeLabel: 'Время в пути (мин)',
    },
  }

  const currentTexts = texts[categoryType]

  // Загрузка данных
  useEffect(() => {
    fetchAreas()
    fetchProfileCity()
  }, [profileId])

  const fetchProfileCity = async () => {
    try {
      const res = await fetch(`/api/profiles/${profileId}`)
      if (res.ok) {
        const data = await res.json()
        const profileData = data?.profile ?? data
        const city = profileData?.city || null
        setCityName(city)
        const detected = detectCityKey(city || undefined)
        setCityKey(detected)
        if (detected) {
          setDistricts(CITY_DISTRICTS[detected].districts)
        } else {
          setDistricts([])
        }
      }
    } catch (error) {
      console.error('Error fetching profile city:', error)
    }
  }

  const fetchAreas = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/geography?profile_id=${profileId}`)
      if (res.ok) {
        const data = await res.json()
        setAreas(data.geography || [])
      }
    } catch (error) {
      console.error('Error fetching areas:', error)
      toast.error('Не удалось загрузить географию')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveArea = async (area: Partial<WorkArea>) => {
    try {
      const method = editingArea ? 'PUT' : 'POST'
      const url = editingArea
        ? `/api/geography/${editingArea.id}`
        : `/api/geography`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...area,
          profile_id: profileId,
        }),
      })

      if (!res.ok) throw new Error('Failed to save area')

      toast.success(editingArea ? 'Район обновлен' : 'Район добавлен')
      setIsDialogOpen(false)
      setEditingArea(null)
      fetchAreas()
    } catch (error) {
      console.error('Error saving area:', error)
      toast.error('Не удалось сохранить район')
    }
  }

  const saveAreaQuick = async (areaName: string) => {
    if (!areaName.trim()) return
    const exists = areas.some(a => a.area_name.toLowerCase() === areaName.toLowerCase())
    if (exists) {
      toast.info('Такой район уже добавлен')
      return
    }
    await handleSaveArea({ area_name: areaName.trim(), price_modifier: 0 })
  }

  const handlePreset = async (presetId: 'all_city' | 'all_region') => {
    try {
      if (!cityKey) {
        toast.error('Сначала укажите город профиля')
        return
      }
      const preset = CITY_DISTRICTS[presetId === 'all_city' ? cityKey : 'lo'].presets.find(p => p.id === presetId)
      if (!preset) {
        toast.error('Пресет недоступен')
        return
      }

      const exists = areas.some(a => a.area_name.toLowerCase() === preset.label.toLowerCase())
      if (exists) {
        toast.info('Пресет уже добавлен')
        return
      }

      await handleSaveArea({ area_name: preset.label, price_modifier: 0 })
      toast.success(preset.label)
    } catch (error) {
      console.error('Error applying preset:', error)
      toast.error('Не удалось применить пресет')
    }
  }

  const handleDeleteArea = async (id: string) => {
    if (!confirm('Удалить этот район?')) return

    try {
      const res = await fetch(`/api/geography/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete area')

      toast.success('Район удален')
      fetchAreas()
    } catch (error) {
      console.error('Error deleting area:', error)
      toast.error('Не удалось удалить район')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Загрузка...</div>
        </CardContent>
      </Card>
    )
  }

  const addButton = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setEditingArea(null)}
          className="rounded-[24px] h-10 px-4 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить район
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingArea ? 'Редактировать район' : 'Добавить район'}
          </DialogTitle>
          <DialogDescription>
            Укажите район или город и условия выезда
          </DialogDescription>
        </DialogHeader>
        <AreaForm
          area={editingArea}
          onSave={handleSaveArea}
          onCancel={() => {
            setIsDialogOpen(false)
            setEditingArea(null)
          }}
          texts={currentTexts}
        />
      </DialogContent>
    </Dialog>
  )

  const content = (
    <>
      {!hideHeader && (
        <CardHeader className="border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2 text-left">
                <MapPin className="w-5 h-5 text-orange-600 shrink-0" />
                <span>{currentTexts.title}</span>
              </CardTitle>
            </div>
            {addButton}
          </div>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-0" : "p-4"}>
        {hideHeader && areas.length > 0 && (
          <div className="px-3 pt-3 pb-2">
            {addButton}
          </div>
        )}
        {/* Быстрые действия */}
        {!hideHeader && (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 text-left">
                Город профиля: <span className="font-medium text-slate-900">{cityName || 'не указан'}</span>
              </span>
            {cityKey && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-[18px] h-8 px-3 text-xs"
                  onClick={() => handlePreset('all_city')}
                >
                  Все районы {CITY_DISTRICTS[cityKey].name}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-[18px] h-8 px-3 text-xs"
                  onClick={() => handlePreset('all_region')}
                >
                  Вся Ленобласть
                </Button>
              </>
            )}
          </div>

          {districts.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedDistrictCode}
                onValueChange={setSelectedDistrictCode}
              >
                <SelectTrigger className="w-[280px] h-10 rounded-[18px]">
                  <SelectValue placeholder="Выбрать район из списка" />
                </SelectTrigger>
                <SelectContent className="rounded-[18px]">
                  {districts.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="rounded-[18px] h-10 px-4"
                onClick={() => {
                  const found = districts.find(d => d.code === selectedDistrictCode)
                  if (found) {
                    saveAreaQuick(found.name)
                  } else {
                    toast.error('Выберите район из списка')
                  }
                }}
              >
                Добавить
              </Button>
            </div>
          )}
          </div>
        )}

        {areas.length === 0 ? (
          <div className={hideHeader ? "text-center py-12 px-3" : "text-center py-12"}>
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-base text-slate-600 mb-4">
              Добавьте районы выезда
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-[24px] h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить район
            </Button>
          </div>
        ) : (
          <div className={hideHeader ? "space-y-2 px-3 pb-3" : "space-y-2"}>
            {areas.map((area) => (
              <div
                key={area.id}
                className="grid grid-cols-[20px_1fr_auto] items-center gap-3 p-3 bg-slate-50 rounded-[18px] border border-slate-200 hover:border-orange-300 transition-colors"
              >
                {/* Колонка 1: Drag handle */}
                <GripVertical className="w-5 h-5 text-slate-400" />
                
                {/* Колонка 2: Основная информация */}
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 leading-tight text-left">
                    {area.area_name}
                  </h4>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-600">
                    {area.price_modifier > 0 && (
                      <span>Доплата: +{area.price_modifier} ₽</span>
                    )}
                    {area.price_modifier === 0 && (
                      <span className="text-green-600 font-medium">Без доплаты</span>
                    )}
                    {area.travel_time && (
                      <span>Время в пути: ~{area.travel_time} мин</span>
                    )}
                  </div>
                </div>
                
                {/* Колонка 3: Действия */}
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingArea(area)
                      setIsDialogOpen(true)
                    }}
                    className="rounded-[18px] h-8 px-3 text-xs hover:bg-slate-100"
                  >
                    Изменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteArea(area.id)}
                    className="rounded-[18px] h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </>
  )

  // Для мобильной версии (hideHeader=true) - без Card обертки
  if (hideHeader) {
    return <div className="space-y-0">{content}</div>
  }

  // Для десктопной версии - с Card оберткой
  return (
    <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] border border-slate-200">
      {content}
    </Card>
  )
}

// Форма добавления/редактирования района
function AreaForm({
  area,
  onSave,
  onCancel,
  texts,
}: {
  area: WorkArea | null
  onSave: (area: Partial<WorkArea>) => void
  onCancel: () => void
  texts: any
}) {
  const [areaName, setAreaName] = useState(area?.area_name || '')
  const [priceModifier, setPriceModifier] = useState(area?.price_modifier?.toString() || '0')
  const [travelTime, setTravelTime] = useState(area?.travel_time?.toString() || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!areaName.trim()) {
      toast.error('Укажите название района')
      return
    }

    onSave({
      ...(area?.id && { id: area.id }),
      area_name: areaName.trim(),
      price_modifier: parseInt(priceModifier) || 0,
      travel_time: travelTime ? parseInt(travelTime) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="area_name">{texts.areaLabel}</Label>
        <Input
          id="area_name"
          value={areaName}
          onChange={(e) => setAreaName(e.target.value)}
          placeholder="Например: Центральный район"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_modifier">{texts.priceLabel}</Label>
          <Input
            id="price_modifier"
            type="number"
            min="0"
            value={priceModifier}
            onChange={(e) => setPriceModifier(e.target.value)}
            placeholder="0"
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">0 = без доплаты</p>
        </div>

        <div>
          <Label htmlFor="travel_time">{texts.timeLabel}</Label>
          <Input
            id="travel_time"
            type="number"
            min="0"
            value={travelTime}
            onChange={(e) => setTravelTime(e.target.value)}
            placeholder="30"
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">Примерное время</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">
          {area ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  )
}





