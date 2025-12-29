'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, FormProvider, useFormContext, useWatch } from 'react-hook-form'
import { MapPin, Plus, X, ImageIcon, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { toast } from 'sonner'
import { AddressSelector } from './address-selector'
import { VenueDetailsForm } from './details-forms'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { CITIES } from '@/lib/constants'

interface LocationsManagerProps {
  profileId: string
  profileCategory: string
  onUpdate?: () => void
}

export function LocationsManager({ profileId, profileCategory, onUpdate }: LocationsManagerProps) {
  const [locations, setLocations] = useState<any[]>([])
  const [locationsMenuLabel, setLocationsMenuLabel] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingYandexData, setLoadingYandexData] = useState<number | null>(null)

  // Создаем форму для каждой локации отдельно
  const methods = useForm({
    defaultValues: {
      locations: [],
    }
  })

  useEffect(() => {
    fetchData()
  }, [profileId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Загружаем локации
      const locRes = await fetch(`/api/profile-locations?profile_id=${profileId}`)
      if (locRes.ok) {
        const locData = await locRes.json()
        setLocations(locData.locations || [])
        methods.setValue('locations', locData.locations || [])
      }

      // Загружаем locations_menu_label
      const profRes = await fetch(`/api/profiles/${profileId}`)
      if (profRes.ok) {
        const profData = await profRes.json()
        setLocationsMenuLabel(profData.profile?.locations_menu_label || '')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLocation = () => {
    const newLocation = {
      name: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      photos: [],
      video_url: '',
      yandex_url: '',
      is_main: locations.length === 0,
      active: true,
      details: {},
    }
    setLocations([...locations, newLocation])
  }

  const handleRemoveLocation = async (index: number) => {
    if (!confirm('Удалить этот адрес?')) return

    const location = locations[index]
    
    if (location.id) {
      setIsSaving(true)
      try {
        const res = await fetch(`/api/profile-locations/${location.id}`, {
          method: 'DELETE'
        })
        if (!res.ok) throw new Error('Ошибка удаления')
        
        setLocations(locations.filter((_, i) => i !== index))
        setTimeout(() => toast.success('Адрес удален'), 0)
        onUpdate?.()
      } catch (err) {
        setTimeout(() => toast.error('Не удалось удалить'), 0)
      } finally {
        setIsSaving(false)
      }
    } else {
      setLocations(locations.filter((_, i) => i !== index))
    }
  }

  const handleSetMainLocation = (index: number) => {
    const updated = locations.map((loc, i) => ({
      ...loc,
      is_main: i === index
    }))
    setLocations(updated)
  }

  const handleUpdateLocation = useCallback((index: number, field: string, value: any) => {
    setLocations(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const handleAddressChange = useCallback((index: number, address: string, coordinates?: [number, number]) => {
    setLocations(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], address }
      if (coordinates) {
        // Конвертируем в формат WKT для PostGIS: POINT(longitude latitude)
        const wkt = `POINT(${coordinates[1]} ${coordinates[0]})`
        updated[index] = { ...updated[index], geo_location: wkt }
      }
      return updated
    })
  }, [])

  const handleSaveAll = async () => {
    // Валидация
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i]
      if (!loc.city || !loc.address) {
        setTimeout(() => toast.error(`Филиал №${i + 1}: заполните город и адрес`), 0)
        return
      }
    }

    setIsSaving(true)
    try {
      console.log('[LocationsManager] Начало сохранения', { profileId, locationsMenuLabel, locations })
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f44af11-d8bf-40e4-ab90-d93dad5b63df', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'locations-manager.tsx:handleSaveAll:start',
          message: 'Start save',
          data: { profileId, locationsMenuLabelLen: locationsMenuLabel?.length || 0, locationsCount: locations.length },
          timestamp: Date.now(),
        })
      }).catch(() => {})
      // #endregion agent log

      // Сохраняем locations_menu_label
      const labelRes = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations_menu_label: locationsMenuLabel })
      })
      
      const labelResText = labelRes.ok ? 'ok' : await labelRes.text()

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f44af11-d8bf-40e4-ab90-d93dad5b63df', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: labelRes.ok ? 'H2' : 'H1',
          location: 'locations-manager.tsx:handleSaveAll:labelRes',
          message: 'Label save response',
          data: { ok: labelRes.ok, status: labelRes.status, body: labelResText?.slice(0, 200) },
          timestamp: Date.now(),
        })
      }).catch(() => {})
      // #endregion agent log

      if (!labelRes.ok) {
        console.error('[LocationsManager] Ошибка сохранения label:', labelResText)
        throw new Error('Ошибка сохранения названия')
      }

      // Сохраняем каждую локацию
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i]
        console.log(`[LocationsManager] Сохранение локации ${i}:`, location)

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2f44af11-d8bf-40e4-ab90-d93dad5b63df', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H3',
            location: 'locations-manager.tsx:handleSaveAll:beforeLocation',
            message: 'Before save location',
            data: { 
              idx: i, 
              hasId: Boolean(location.id), 
              city: location.city, 
              address: location.address, 
              hasGeo: Boolean(location.geo_location),
              geoType: location.geo_location ? typeof location.geo_location : 'none'
            },
            timestamp: Date.now(),
          })
        }).catch(() => {})
        // #endregion agent log
        
        // Подготавливаем данные для отправки
        const locationData = { ...location }
        
        // Конвертируем geo_location в WKT формат, если нужно
        if (locationData.geo_location) {
          if (typeof locationData.geo_location === 'object' && locationData.geo_location.coordinates) {
            // Если это объект GeoJSON, конвертируем в WKT
            const [lon, lat] = locationData.geo_location.coordinates
            locationData.geo_location = `POINT(${lon} ${lat})`
          } else if (Array.isArray(locationData.geo_location)) {
            // Если это массив [lat, lon], конвертируем в WKT
            const [lat, lon] = locationData.geo_location
            locationData.geo_location = `POINT(${lon} ${lat})`
          }
          // Если уже строка (WKT), оставляем как есть
        }
        
        if (locationData.id) {
          // Обновляем
          const updateRes = await fetch(`/api/profile-locations/${locationData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
          })
          
          // #region agent log
          const updateResBody = updateRes.ok ? 'ok' : await updateRes.text()
          fetch('http://127.0.0.1:7242/ingest/2f44af11-d8bf-40e4-ab90-d93dad5b63df', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'run3',
              hypothesisId: updateRes.ok ? 'H4' : 'H3',
              location: 'locations-manager.tsx:handleSaveAll:updateRes',
              message: 'Update location response',
              data: { idx: i, status: updateRes.status, ok: updateRes.ok, body: updateResBody?.slice(0, 200) },
              timestamp: Date.now(),
            })
          }).catch(() => {})
          // #endregion agent log

          if (!updateRes.ok) {
            console.error(`[LocationsManager] Ошибка обновления локации ${i}:`, updateResBody)
            throw new Error(`Ошибка обновления филиала №${i + 1}`)
          }
        } else {
          // Создаем
          const createRes = await fetch('/api/profile-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...locationData, profile_id: profileId })
          })
          
          if (!createRes.ok) {
            const error = await createRes.text()
            console.error(`[LocationsManager] Ошибка создания локации ${i}:`, error)
            throw new Error(`Ошибка создания филиала №${i + 1}`)
          }
          
          const newLocation = await createRes.json()
          console.log(`[LocationsManager] Создана локация ${i}:`, newLocation)
        }
      }

      console.log('[LocationsManager] Все локации сохранены успешно!')
      setTimeout(() => toast.success('Все адреса сохранены!'), 0)
      onUpdate?.()
      await fetchData()
    } catch (err: any) {
      console.error('[LocationsManager] Ошибка сохранения:', err)
      setTimeout(() => toast.error(err.message || 'Не удалось сохранить'), 0)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <Card className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] rounded-[24px] border-gray-200">
        <CardHeader className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Адреса и филиалы</CardTitle>
                <CardDescription className="text-sm text-gray-500">Управление физическими адресами</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddLocation}
              size="sm"
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить адрес
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-5 md:p-6 pt-0 space-y-6">
          {/* Название блока адресов в меню */}
          {locations.length > 0 && (
            <div className="p-5 bg-gray-50 rounded-[16px] border border-gray-200">
              <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                Название блока адресов в меню
                <HelpTooltip content="Отображается в навигации на странице профиля. Примеры: 'Наша студия', 'Где нас найти', 'Адреса'." />
              </label>
              <Input
                value={locationsMenuLabel}
                onChange={(e) => setLocationsMenuLabel(e.target.value)}
                placeholder={locations.length === 1 ? 'Наш адрес' : 'Наши адреса'}
                className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2">
                Например: "Наша студия", "Наш лофт", "Где нас найти" или оставьте пустым для автоматического названия
              </p>
            </div>
          )}

          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mb-4">Нет добавленных адресов</p>
              <Button type="button" onClick={handleAddLocation} className="h-12 rounded-[16px]">
                <MapPin className="w-4 h-4 mr-2" />
                Добавить адрес
              </Button>
            </div>
          ) : (
            <>
              {/* Навигация по адресам */}
              <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-[16px] border border-gray-200">
                {locations.map((location, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const element = document.getElementById(`location-${index}`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-white border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-xs sm:text-[13px] font-medium text-gray-700"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {location.name || `Филиал №${index + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    handleAddLocation()
                    setTimeout(() => {
                      const element = document.getElementById(`location-${locations.length}`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 100)
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-orange-500 hover:bg-orange-600 text-white transition-colors text-xs sm:text-[13px] font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Добавить адрес
                </button>
              </div>

              {/* Список локаций */}
              <div className="space-y-5">
                {locations.map((location, index) => (
                  <LocationCard
                    key={index}
                    location={location}
                    index={index}
                    profileCategory={profileCategory}
                    isLoading={isSaving}
                    loadingYandexData={loadingYandexData}
                    onUpdate={handleUpdateLocation}
                    onRemove={() => handleRemoveLocation(index)}
                    onSetMain={() => handleSetMainLocation(index)}
                    onAddressChange={handleAddressChange}
                    onLoadYandexData={async () => {
                      if (!location.yandex_url) return
                      setLoadingYandexData(index)
                      try {
                        await new Promise(resolve => setTimeout(resolve, 1500))
                        const rating = (4 + Math.random()).toFixed(1)
                        const reviews = Math.floor(10 + Math.random() * 100)
                        handleUpdateLocation(index, 'yandex_rating', parseFloat(rating))
                        handleUpdateLocation(index, 'yandex_review_count', reviews)
                        setTimeout(() => toast.success(`Данные обновлены: Рейтинг ${rating}, Отзывов ${reviews}`), 0)
                      } catch (e) {
                        setTimeout(() => toast.error('Не удалось загрузить данные с Яндекс.Карт'), 0)
                      } finally {
                        setLoadingYandexData(null)
                      }
                    }}
                    canRemove={locations.length > 1}
                  />
                ))}
              </div>
            </>
          )}

          {/* Кнопка сохранения */}
          {locations.length > 0 && (
            <div className="flex gap-2 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="rounded-xl"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить все адреса'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </FormProvider>
  )
}

// Отдельный компонент для карточки локации
interface LocationCardProps {
  location: any
  index: number
  profileCategory: string
  isLoading: boolean
  loadingYandexData: number | null
  onUpdate: (index: number, field: string, value: any) => void
  onRemove: () => void
  onSetMain: () => void
  onAddressChange: (index: number, address: string, coordinates?: [number, number]) => void
  onLoadYandexData: () => Promise<void>
  canRemove: boolean
}

function LocationCard({
  location,
  index,
  profileCategory,
  isLoading,
  loadingYandexData,
  onUpdate,
  onRemove,
  onSetMain,
  onAddressChange,
  onLoadYandexData,
  canRemove
}: LocationCardProps) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoUpload = async (photoIndex: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setTimeout(() => toast.error('Файл слишком большой (максимум 10MB)'), 0)
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'portfolio')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Ошибка загрузки')

      const { url } = await res.json()
      const newPhotos = [...(location.photos || []), url]
      onUpdate(index, 'photos', newPhotos)
      setTimeout(() => toast.success('Фото загружено'), 0)
    } catch (err: any) {
      setTimeout(() => toast.error(err.message), 0)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoRemove = (photoIndex: number) => {
    const newPhotos = [...(location.photos || [])]
    newPhotos.splice(photoIndex, 1)
    onUpdate(index, 'photos', newPhotos)
  }

  return (
    <div
      id={`location-${index}`}
      className="border border-gray-200 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-shadow scroll-mt-24"
    >
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 justify-between pb-3 sm:pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
              {location.name || `Филиал №${index + 1}`}
            </h3>
            {location.city && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{location.city}</p>}
          </div>
          {location.is_main && (
            <span className="text-[10px] font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-1 rounded-full shadow-sm whitespace-nowrap">
              Главный
            </span>
          )}
          {!location.is_main && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSetMain}
              className="h-8 px-3 text-[11px] rounded-[12px] hover:bg-orange-50 hover:text-orange-600 ml-auto whitespace-nowrap"
            >
              Сделать главным
            </Button>
          )}
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Основная информация */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block text-gray-700">Город *</label>
            <select
              value={location.city}
              onChange={(e) => onUpdate(index, 'city', e.target.value)}
              className="flex h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-xs sm:text-[13px] ring-offset-background focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 16 16%22 fill=%22none%22%3E%3Cpath d=%22M4 6L8 10L12 6%22 stroke=%22%23475569%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px_16px] pr-10 hover:border-gray-300 transition-colors"
            >
              <option value="">Выберите город</option>
              {CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block text-gray-700">Название филиала</label>
            <Input
              placeholder="Центральный офис, Филиал №1..."
              value={location.name || ''}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-2">
            <AddressSelector
              city={location.city}
              address={location.address || ''}
              onAddressChange={(address, coordinates) => onAddressChange(index, address, coordinates)}
              placeholder={`${location.city ? location.city + ', ' : ''}ул. Примерная, д. 1`}
              label="Адрес"
              required
            />
          </div>
          <div>
            <label className="text-xs sm:text-[13px] font-medium mb-2 block text-gray-700">Телефон</label>
            <Input
              placeholder="+7 (XXX) XXX-XX-XX"
              value={location.phone || ''}
              onChange={(e) => onUpdate(index, 'phone', e.target.value)}
              className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs sm:text-[13px] font-medium mb-2 block text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="filial@example.com"
              value={location.email || ''}
              onChange={(e) => onUpdate(index, 'email', e.target.value)}
              className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

            {/* Фото и видео (только для venue) */}
            {profileCategory === 'venue' && (
              <>
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div>
                    <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900">Фото и видео</h3>
                    <p className="text-[9px] sm:text-[10px] sm:text-[11px] text-gray-500 mt-1">
                      Загрузите до 6 фотографий и 1 видео для обзора локации
                    </p>
                  </div>

                  {/* Фото (до 6 штук) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, photoIndex) => {
                      const photoUrl = location.photos?.[photoIndex]
                      return (
                        <div
                          key={photoIndex}
                          className="relative aspect-square rounded-[16px] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          {photoUrl ? (
                            <>
                              <img src={photoUrl} alt={`Фото ${photoIndex + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handlePhotoRemove(photoIndex)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors gap-1.5">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-500" strokeWidth={2} />
                              </div>
                              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Добавить</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingPhoto}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handlePhotoUpload(photoIndex, file)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Видео и обложка */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-[13px] font-medium mb-2 block text-gray-700">Ссылка на видео-обзор</label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={location.video_url || ''}
                        onChange={(e) => onUpdate(index, 'video_url', e.target.value)}
                        className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500"
                      />
                      <p className="text-[9px] sm:text-[10px] sm:text-[11px] text-gray-500 mt-2">YouTube, Vimeo, Rutube</p>
                    </div>

                    <div>
                      <label className="text-xs sm:text-[13px] font-medium mb-2 block text-gray-700">Обложка видео (опционально)</label>
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-12 rounded-[12px] overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {location.video_cover ? (
                            <img src={location.video_cover} alt="Обложка" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Play className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-[12px] hover:bg-gray-50 cursor-pointer transition-colors w-full sm:w-auto">
                            <ImageIcon className="w-3.5 h-3.5 mr-2" />
                            {location.video_cover ? 'Заменить' : 'Загрузить'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('Файл слишком большой (макс 5MB)')
                                  return
                                }

                                const toastId = toast.loading('Загрузка обложки...')
                                try {
                                  const formData = new FormData()
                                  formData.append('file', file)
                                  formData.append('bucket', 'portfolio')

                                  const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData,
                                  })

                                  if (!res.ok) throw new Error('Ошибка загрузки')

                                  const { url } = await res.json()
                                  onUpdate(index, 'video_cover', url)
                                  toast.success('Обложка загружена', { id: toastId })
                                } catch (err: any) {
                                  toast.error(err.message || 'Ошибка', { id: toastId })
                                }
                              }}
                            />
                          </label>
                          {location.video_cover && (
                            <button
                              type="button"
                              onClick={() => onUpdate(index, 'video_cover', null)}
                              className="ml-2 text-xs text-red-500 hover:text-red-700 underline"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

          {/* Характеристики площадки */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <LocationDetailsFormWrapper
              locationIndex={index}
              details={location.details || {}}
              onUpdate={(field, value) => {
                const updatedDetails = { ...location.details, [field]: value }
                onUpdate(index, 'details', updatedDetails)
              }}
            />
          </div>

          {/* Интеграция с Яндекс.Картами */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900">Интеграция с Яндекс.Картами</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-[13px] font-medium text-gray-700 mb-2 block">Ссылка на организацию</label>
                <Input
                  placeholder="https://yandex.ru/maps/org/..."
                  value={location.yandex_url || ''}
                  onChange={(e) => onUpdate(index, 'yandex_url', e.target.value)}
                  className="h-12 rounded-[16px] border-gray-200 focus:ring-orange-500"
                />
                <p className="text-[9px] sm:text-[10px] sm:text-[11px] text-gray-500 mt-2">
                  Вставьте ссылку на вашу организацию на Яндекс.Картах для автоматической подгрузки рейтинга и отзывов.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onLoadYandexData}
                disabled={!location.yandex_url || loadingYandexData === index}
                className="w-full h-12 rounded-[16px] border-gray-200 hover:bg-gray-50 text-gray-900 font-medium"
              >
                {loadingYandexData === index ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка данных...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Загрузить отзывы с Яндекс.Карт
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Обертка для VenueDetailsForm чтобы передать данные из locations
function LocationDetailsFormWrapper({ 
  locationIndex, 
  details, 
  onUpdate 
}: { 
  locationIndex: number
  details: any
  onUpdate: (field: string, value: any) => void 
}) {
  // Мемоизируем serialized details для стабильности
  const detailsKey = useMemo(() => JSON.stringify(details), [details])
  
  const methods = useForm({
    defaultValues: {
      locations: [{ details }]
    }
  })

  // Обновляем defaultValues когда details меняется
  useEffect(() => {
    methods.reset({
      locations: [{ details }]
    })
  }, [detailsKey]) // Используем мемоизированный ключ

  // Следим за изменениями в форме и передаем наверх (с дебаунсом)
  const watchedDetails = useWatch({
    control: methods.control,
    name: `locations.0.details`
  })
  
  // Мемоизируем serialized watched details
  const watchedDetailsKey = useMemo(() => 
    watchedDetails ? JSON.stringify(watchedDetails) : '', 
    [watchedDetails]
  )

  useEffect(() => {
    if (!watchedDetails || !watchedDetailsKey) return
    
    const timer = setTimeout(() => {
      if (watchedDetailsKey !== detailsKey) {
        Object.keys(watchedDetails).forEach(key => {
          if (watchedDetails[key] !== details[key]) {
            onUpdate(key, watchedDetails[key])
          }
        })
      }
    }, 300) // Увеличена задержка для группировки изменений

    return () => clearTimeout(timer)
  }, [watchedDetailsKey, detailsKey, details, onUpdate]) // Добавлены все зависимости

  return (
    <FormProvider {...methods}>
      <VenueDetailsForm prefix="locations.0.details" hideCard />
    </FormProvider>
  )
}

