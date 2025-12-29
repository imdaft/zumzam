'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'

interface OutdoorCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function OutdoorCharacteristics({ data, onNext, onSkip }: OutdoorCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  const [locationType, setLocationType] = useState(data.details?.location_type || '')
  
  // Особенности открытой площадки
  const [features, setFeatures] = useState<Record<string, boolean>>(
    data.details?.features || {
      covered_area: false,
      heating: false,
      lighting: false,
      power_supply: false,
      water_supply: false,
      restrooms: false,
      parking: false,
      playground: false,
    }
  )

  // Погодные условия
  const [weatherOptions, setWeatherOptions] = useState<string[]>(data.details?.weather_options || [])

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'outdoor',
        capacity_max: capacity ? parseInt(capacity) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        location_type: locationType,
        features,
        weather_options: weatherOptions,
      },
    })
  }

  const featuresList = [
    { key: 'covered_area', label: 'Крытая зона' },
    { key: 'heating', label: 'Обогрев' },
    { key: 'lighting', label: 'Освещение' },
    { key: 'power_supply', label: 'Электричество' },
    { key: 'water_supply', label: 'Водопровод' },
    { key: 'restrooms', label: 'Санузлы' },
    { key: 'parking', label: 'Парковка' },
    { key: 'playground', label: 'Детская площадка' },
  ]

  const locationTypes = [
    { value: 'park', label: 'Парк' },
    { value: 'beach', label: 'Пляж / Набережная' },
    { value: 'base', label: 'База отдыха' },
    { value: 'garden', label: 'Сад / Усадьба' },
    { value: 'roof', label: 'Крыша / Терраса' },
    { value: 'other', label: 'Другое' },
  ]

  const weatherOpts = [
    { value: 'all_season', label: 'Всесезонная' },
    { value: 'summer_only', label: 'Только летом' },
    { value: 'rain_protected', label: 'Защита от дождя' },
  ]

  const toggleWeatherOption = (value: string) => {
    if (weatherOptions.includes(value)) {
      setWeatherOptions(weatherOptions.filter(w => w !== value))
    } else {
      setWeatherOptions([...weatherOptions, value])
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Открытая площадка</h1>
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
              placeholder="20-200"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">Площадь (м²)</label>
            <Input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="100-1000"
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        </div>

        {/* Тип локации */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Тип локации</label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="flex h-11 sm:h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Выберите тип</option>
            {locationTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Погодные условия */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Работа в разную погоду</label>
          <div className="grid grid-cols-1 gap-2">
            {weatherOpts.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleWeatherOption(option.value)}
                className={`p-3 rounded-[12px] border-2 transition-all text-sm font-medium text-left ${
                  weatherOptions.includes(option.value)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Особенности */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Особенности площадки</label>
          <div className="space-y-2">
            {featuresList.map((feature) => (
              <button
                key={feature.key}
                type="button"
                onClick={() => setFeatures({ ...features, [feature.key]: !features[feature.key] })}
                className="w-full flex items-center gap-3 p-3 sm:p-4 rounded-[12px] border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  features[feature.key] ? 'bg-orange-50' : 'bg-gray-100'
                }`}>
                  {features[feature.key] ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" strokeWidth={2.5} />
                  ) : (
                    <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" strokeWidth={2} />
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-medium ${
                  features[feature.key] ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {feature.label}
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

















