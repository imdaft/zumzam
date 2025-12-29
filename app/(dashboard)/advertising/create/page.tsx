'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
// Supabase client removed - используем API endpoints
import { useAuth } from '@/lib/contexts/auth-context'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { CalendarIcon } from 'lucide-react'

interface AdSlot {
  id: string
  slug: string
  name: string
  description: string
  price_per_day: number
  price_per_week: number
  price_per_month: number
  format: any
  avg_impressions_per_day: number
}

interface Profile {
  id: string
  display_name: string
  slug: string
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [adSlots, setAdSlots] = useState<AdSlot[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  
  // Форма
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [profileId, setProfileId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  
  // Расчет стоимости
  const [duration, setDuration] = useState(0)
  const [totalCost, setTotalCost] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    calculateCost()
  }, [startDate, endDate, selectedSlot])

  const loadData = async () => {
    try {
      // Загружаем рекламные слоты
      const slotsResponse = await fetch('/api/advertising/slots')
      const slotsData = await slotsResponse.json()
      if (slotsData.slots) {
        setAdSlots(slotsData.slots)
      }

      // Загружаем профили пользователя через API
      const profilesResponse = await fetch('/api/profiles?mine=true')
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json()
        const profilesList = profilesData.profiles || []
        
        // Преобразуем в нужный формат
        const formattedProfiles = profilesList.map((p: any) => ({
          id: p.id,
          display_name: p.display_name,
          slug: p.slug
        }))
        
        setProfiles(formattedProfiles)
        if (formattedProfiles.length > 0) {
          setProfileId(formattedProfiles[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const calculateCost = () => {
    if (!startDate || !endDate || !selectedSlot) {
      setDuration(0)
      setTotalCost(0)
      return
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const slot = adSlots.find(s => s.id === selectedSlot)
    
    if (slot) {
      setDuration(days)
      setTotalCost(days * slot.price_per_day)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение')
      return
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB')
      return
    }

    setIsUploading(true)
    setImageFile(file)

    try {
      console.log('📤 Uploading image to Supabase Storage...', file.name, file.size)
      
      // Создаем FormData для загрузки
      const formData = new FormData()
      formData.append('file', file)
      
      // Загружаем в Supabase Storage через API
      const uploadResponse = await fetch('/api/advertising/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка загрузки изображения')
      }
      
      const { url } = await uploadResponse.json()
      console.log('✅ Image uploaded successfully:', url)
      
      setImageUrl(url)
      toast.success('Изображение загружено!')
    } catch (error: any) {
      console.error('❌ Error uploading image:', error)
      toast.error(error?.message || 'Ошибка загрузки изображения')
      setImageFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl('')
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📝 Starting campaign creation...', {
      title,
      imageUrl: imageUrl.substring(0, 50) + '...',
      linkUrl,
      startDate,
      endDate,
      selectedSlot,
      profileId
    })
    
    if (!title || !imageUrl || !linkUrl || !startDate || !endDate || !selectedSlot) {
      toast.error('Заполните все обязательные поля')
      return
    }

    if (profiles.length === 0) {
      toast.error('У вас нет профилей. Создайте профиль сначала.')
      router.push('/dashboard')
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 Sending campaign to API...')
      
      // Создаем кампанию
      const campaignResponse = await fetch('/api/advertising/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: profileId || profiles[0].id,
          title,
          description,
          image_url: imageUrl,
          link_url: linkUrl,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          bid_amount: totalCost,
          total_budget: totalCost
        })
      })

      console.log('📡 Campaign API response:', campaignResponse.status)

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json().catch(() => ({}))
        console.error('❌ Campaign API error:', errorData)
        throw new Error(errorData.error || 'Ошибка создания кампании')
      }

      const { campaign } = await campaignResponse.json()
      console.log('✅ Campaign created:', campaign.id)

      // Создаем бронирование слота
      console.log('📅 Creating booking for slot:', selectedSlot)
      
      // Создаем бронирование через API
      const bookingResponse = await fetch('/api/advertising/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
          ad_slot_id: selectedSlot,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_cost: totalCost,
          status: 'pending'
        })
      })

      console.log('📡 Booking API response:', bookingResponse.status)

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json().catch(() => ({}))
        console.error('❌ Booking API error:', errorData)
        throw new Error(errorData.error || 'Ошибка создания бронирования')
      }

      const { booking } = await bookingResponse.json()
      console.log('✅ Booking created successfully:', booking.id)
      
      toast.success('Кампания создана и отправлена на модерацию')
      
      // Небольшая задержка для красоты
      setTimeout(() => {
        router.push('/advertising')
      }, 500)
    } catch (error: any) {
      console.error('❌ Error creating campaign:', error)
      toast.error(error?.message || 'Ошибка создания кампании')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoadingSlots) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Создать рекламную кампанию</h1>
        <p className="text-gray-600 mt-2">Заполните форму для создания рекламы</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Название и описание вашей кампании</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Название кампании *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Скидка 50% на детские праздники"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание акции или предложения"
                rows={3}
              />
            </div>

            {profiles.length > 1 && (
              <div>
                <Label htmlFor="profile">Профиль для рекламы</Label>
                <Select value={profileId} onValueChange={setProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите профиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Креатив */}
        <Card>
          <CardHeader>
            <CardTitle>Рекламные материалы</CardTitle>
            <CardDescription>Изображение и ссылка для баннера</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Изображение баннера *</Label>
              <p className="text-sm text-gray-500 mb-3">
                Рекомендуемый размер: 800x400px, макс. 5MB
              </p>

              {!imageUrl ? (
                <div className="space-y-3">
                  {/* Загрузка файла */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="imageFile"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                          <p className="text-sm text-gray-600">Загрузка...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Загрузить изображение с компьютера
                          </p>
                          <p className="text-xs text-gray-500">
                            Нажмите для выбора файла (JPG, PNG, GIF, WebP)
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Разделитель */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">или используйте URL</span>
                    </div>
                  </div>

                  {/* Ввод URL */}
                  <div>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      type="url"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Рекомендуем: загрузите изображение на imgur.com или используйте прямую ссылку
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative border rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Превью баннера" 
                    className="w-full h-64 object-cover"
                    onError={() => {
                      toast.error('Не удалось загрузить изображение')
                      setImageUrl('')
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="linkUrl">Ссылка при клике *</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/profiles/my-studio или https://example.com"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Куда будут переходить пользователи при клике на баннер
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Место размещения */}
        <Card>
          <CardHeader>
            <CardTitle>Место размещения</CardTitle>
            <CardDescription>Выберите, где будет показываться ваша реклама</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adSlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSlot === slot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedSlot === slot.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedSlot === slot.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">{slot.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-6">{slot.description}</p>
                      <div className="flex items-center gap-4 mt-2 ml-6 text-sm">
                        <span className="text-gray-500">
                          Охват: <span className="font-medium text-gray-900">
                            {slot.avg_impressions_per_day}+ показов/день
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-gray-900">
                        {formatCurrency(slot.price_per_day)}
                      </div>
                      <div className="text-sm text-gray-500">за день</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Период показа */}
        <Card>
          <CardHeader>
            <CardTitle>Период показа</CardTitle>
            <CardDescription>Выберите даты начала и окончания кампании</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Дата начала *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !startDate && 'text-gray-500'
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        // Если дата окончания раньше новой даты начала, сбрасываем её
                        if (endDate && date && endDate < date) {
                          setEndDate(undefined)
                        }
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return date < today
                      }}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
                {startDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Выбрано: {format(startDate, 'dd MMMM yyyy', { locale: ru })}
                  </p>
                )}
              </div>

              <div>
                <Label>Дата окончания *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !endDate && 'text-gray-500'
                      }`}
                      disabled={!startDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => {
                        if (!startDate) return true
                        const minDate = new Date(startDate)
                        minDate.setHours(0, 0, 0, 0)
                        return date < minDate
                      }}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>
                {!startDate && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Сначала выберите дату начала
                  </p>
                )}
                {endDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Выбрано: {format(endDate, 'dd MMMM yyyy', { locale: ru })}
                  </p>
                )}
              </div>
            </div>

            {duration > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-blue-900">Продолжительность кампании</div>
                    <div className="text-sm text-blue-700 mt-1">
                      {duration} {duration === 1 ? 'день' : duration < 5 ? 'дня' : 'дней'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalCost)}</div>
                    <div className="text-sm text-blue-700">Итого к оплате</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Информация о модерации */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Модерация</h4>
                <p className="text-sm text-yellow-800">
                  После создания кампания будет отправлена на модерацию. 
                  Обычно это занимает до 24 часов. Вы получите уведомление, 
                  когда кампания будет одобрена или отклонена.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопки */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading || totalCost === 0} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>Создать кампанию за {formatCurrency(totalCost)}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

