'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'

interface CafeCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function CafeCharacteristics({ data, onNext, onSkip }: CafeCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  const [cuisineType, setCuisineType] = useState(data.details?.cuisine_type || '')
  
  // Удобства для кафе/ресторана
  const [amenities, setAmenities] = useState<Record<string, boolean>>(
    data.details?.amenities || {
      kids_menu: false,
      kids_zone: false,
      high_chairs: false,
      changing_table: false,
      separate_room: false,
      outdoor_seating: false,
      parking: false,
      wi_fi: false,
    }
  )

  // Возможности проведения
  const [eventTypes, setEventTypes] = useState<string[]>(data.details?.event_types || [])

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'cafe',
        capacity_max: capacity ? parseInt(capacity) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        cuisine_type: cuisineType,
        amenities,
        event_types: eventTypes,
      },
    })
  }

  const amenitiesList = [
    { key: 'kids_menu', label: 'Детское меню' },
    { key: 'kids_zone', label: 'Детская зона' },
    { key: 'high_chairs', label: 'Детские стульчики' },
    { key: 'changing_table', label: 'Пеленальный стол' },
    { key: 'separate_room', label: 'Отдельный зал' },
    { key: 'outdoor_seating', label: 'Летняя веранда' },
    { key: 'parking', label: 'Парковка' },
    { key: 'wi_fi', label: 'Wi-Fi' },
  ]

  const cuisineOptions = [
    { value: 'european', label: 'Европейская' },
    { value: 'italian', label: 'Итальянская' },
    { value: 'japanese', label: 'Японская' },
    { value: 'mixed', label: 'Смешанная' },
    { value: 'fast_food', label: 'Фаст-фуд' },
    { value: 'other', label: 'Другая' },
  ]

  const eventTypeOptions = [
    { value: 'birthday', label: 'День рождения' },
    { value: 'banquet', label: 'Банкет' },
    { value: 'corporate', label: 'Корпоратив' },
    { value: 'wedding', label: 'Свадьба' },
  ]

  const toggleEventType = (value: string) => {
    if (eventTypes.includes(value)) {
      setEventTypes(eventTypes.filter(t => t !== value))
    } else {
      setEventTypes([...eventTypes, value])
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Кафе / Ресторан</h1>
      <p className="text-sm text-gray-500 mb-6">Характеристики площадки (можно пропустить)</p>

      <div className="space-y-6">
        {/* Вместимость и площадь */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Вместимость (чел)</label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="20-100"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Площадь (м²)</label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="50-200"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        </div>

        {/* Тип кухни */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Тип кухни</label>
          <select
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            className="flex h-11 sm:h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Выберите тип</option>
            {cuisineOptions.map(cuisine => (
              <option key={cuisine.value} value={cuisine.value}>{cuisine.label}</option>
            ))}
          </select>
        </div>

        {/* Типы мероприятий */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Подходит для</label>
          <div className="grid grid-cols-2 gap-2">
            {eventTypeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleEventType(type.value)}
                className={`p-3 rounded-[12px] border-2 transition-all text-sm font-medium ${
                  eventTypes.includes(type.value)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Удобства */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Удобства</label>
          <div className="space-y-2">
            {amenitiesList.map((amenity) => (
              <button
                key={amenity.key}
                type="button"
                onClick={() => setAmenities({ ...amenities, [amenity.key]: !amenities[amenity.key] })}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-[12px] border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  amenities[amenity.key] ? 'bg-orange-50' : 'bg-gray-100'
                }`}>
                  {amenities[amenity.key] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" strokeWidth={2.5} />
                  ) : (
                    <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" strokeWidth={2} />
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${
                  amenities[amenity.key] ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {amenity.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-6">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-11 sm:h-12 rounded-full font-semibold text-sm"
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

















