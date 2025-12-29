'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'

interface LoftCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function LoftCharacteristics({ data, onNext, onSkip }: LoftCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  const [interiorStyle, setInteriorStyle] = useState(data.details?.interior_style || '')
  
  // Удобства для лофта/студии
  const [amenities, setAmenities] = useState<Record<string, boolean>>(
    data.details?.amenities || {
      photo_zone: false,
      professional_light: false,
      furniture: false,
      kitchen_bar: false,
      bathroom: false,
      parking: false,
      sound_music: false,
    }
  )

  // Декор
  const [decor, setDecor] = useState<Record<string, boolean>>(
    data.details?.decor || {
      neutral_walls: false,
      decor_allowed: false,
      own_furniture_allowed: false,
    }
  )

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'loft',
        capacity_max: capacity ? parseInt(capacity) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        interior_style: interiorStyle,
        amenities,
        decor,
      },
    })
  }

  const amenitiesList = [
    { key: 'photo_zone', label: 'Фотозона' },
    { key: 'professional_light', label: 'Профессиональный свет' },
    { key: 'furniture', label: 'Мебель (диваны, столы)' },
    { key: 'kitchen_bar', label: 'Кухня / Бар' },
    { key: 'bathroom', label: 'Санузел' },
    { key: 'parking', label: 'Парковка' },
    { key: 'sound_music', label: 'Звук / Музыка' },
  ]

  const decorList = [
    { key: 'neutral_walls', label: 'Нейтральные стены' },
    { key: 'decor_allowed', label: 'Возможность декора' },
    { key: 'own_furniture_allowed', label: 'Можно свою мебель' },
  ]

  const styleOptions = [
    { value: 'industrial', label: 'Индустриальный' },
    { value: 'scandinavian', label: 'Скандинавский' },
    { value: 'minimalism', label: 'Минимализм' },
    { value: 'modern', label: 'Современный' },
    { value: 'loft', label: 'Лофт' },
    { value: 'other', label: 'Другой' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Лофт / Студия</h1>
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
              placeholder="20-150"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Площадь (м²)</label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="80-300"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        </div>

        {/* Стиль интерьера */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Стиль интерьера</label>
          <select
            value={interiorStyle}
            onChange={(e) => setInteriorStyle(e.target.value)}
            className="flex h-11 sm:h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Выберите стиль</option>
            {styleOptions.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </div>

        {/* Удобства студийные */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Удобства студии</label>
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

        {/* Декор */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Декор и оформление</label>
          <div className="space-y-2">
            {decorList.map((decor_item) => (
              <button
                key={decor_item.key}
                type="button"
                onClick={() => setDecor({ ...decor, [decor_item.key]: !decor[decor_item.key] })}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-[12px] border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  decor[decor_item.key] ? 'bg-orange-50' : 'bg-gray-100'
                }`}>
                  {decor[decor_item.key] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" strokeWidth={2.5} />
                  ) : (
                    <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" strokeWidth={2} />
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${
                  decor[decor_item.key] ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {decor_item.label}
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

















