'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'

interface ParkCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function ParkCharacteristics({ data, onNext, onSkip }: ParkCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  
  // Аттракционы и развлечения
  const [attractions, setAttractions] = useState<string[]>(data.details?.attractions || [])
  
  // Удобства для парка развлечений
  const [amenities, setAmenities] = useState<Record<string, boolean>>(
    data.details?.amenities || {
      food_court: false,
      restrooms: false,
      first_aid: false,
      lockers: false,
      parking: false,
      kids_zone: false,
      rest_area: false,
      photo_zone: false,
    }
  )

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'park',
        capacity_max: capacity ? parseInt(capacity) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        attractions,
        amenities,
      },
    })
  }

  const amenitiesList = [
    { key: 'food_court', label: 'Фуд-корт' },
    { key: 'restrooms', label: 'Санузлы' },
    { key: 'first_aid', label: 'Медпункт' },
    { key: 'lockers', label: 'Камеры хранения' },
    { key: 'parking', label: 'Парковка' },
    { key: 'kids_zone', label: 'Детская зона' },
    { key: 'rest_area', label: 'Зона отдыха' },
    { key: 'photo_zone', label: 'Фотозоны' },
  ]

  const attractionOptions = [
    { value: 'trampolines', label: 'Батуты' },
    { value: 'climbing', label: 'Скалодром' },
    { value: 'rides', label: 'Аттракционы' },
    { value: 'vr', label: 'VR-зона' },
    { value: 'arcade', label: 'Игровые автоматы' },
    { value: 'rope_park', label: 'Верёвочный парк' },
    { value: 'other', label: 'Другое' },
  ]

  const toggleAttraction = (value: string) => {
    if (attractions.includes(value)) {
      setAttractions(attractions.filter(a => a !== value))
    } else {
      setAttractions([...attractions, value])
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Парк развлечений</h1>
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
              placeholder="50-500"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Площадь (м²)</label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="200-5000"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        </div>

        {/* Аттракционы */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Аттракционы и развлечения</label>
          <div className="grid grid-cols-2 gap-2">
            {attractionOptions.map((attraction) => (
              <button
                key={attraction.value}
                type="button"
                onClick={() => toggleAttraction(attraction.value)}
                className={`p-3 rounded-[12px] border-2 transition-all text-sm font-medium ${
                  attractions.includes(attraction.value)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {attraction.label}
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

















