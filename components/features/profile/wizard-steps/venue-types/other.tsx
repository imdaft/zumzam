'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'

interface OtherVenueCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function OtherVenueCharacteristics({ data, onNext, onSkip }: OtherVenueCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  const [description, setDescription] = useState(data.details?.venue_description || '')
  
  // Базовые удобства
  const [amenities, setAmenities] = useState<Record<string, boolean>>(
    data.details?.amenities || {
      parking: false,
      restrooms: false,
      wi_fi: false,
      kitchen: false,
      ac: false,
      sound: false,
    }
  )

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'other',
        capacity_max: capacity ? parseInt(capacity) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        venue_description: description,
        amenities,
      },
    })
  }

  const amenitiesList = [
    { key: 'parking', label: 'Парковка' },
    { key: 'restrooms', label: 'Санузлы' },
    { key: 'wi_fi', label: 'Wi-Fi' },
    { key: 'kitchen', label: 'Кухня' },
    { key: 'ac', label: 'Кондиционер' },
    { key: 'sound', label: 'Звуковое оборудование' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Нестандартная площадка</h1>
      <p className="text-sm text-gray-500 mb-6">Опишите особенности вашей площадки</p>

      <div className="space-y-6">
        {/* Описание площадки */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">
            Что это за площадка?
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: антикафе, коворкинг, музей, библиотека..."
            className="min-h-[100px] rounded-[16px]"
          />
        </div>

        {/* Вместимость и площадь */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Вместимость (чел)</label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="10-100"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Площадь (м²)</label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="30-200"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        </div>

        {/* Базовые удобства */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Базовые удобства</label>
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

















