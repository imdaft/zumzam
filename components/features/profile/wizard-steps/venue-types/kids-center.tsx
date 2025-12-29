'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface KidsCenterCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function KidsCenterCharacteristics({ data, onNext, onSkip }: KidsCenterCharacteristicsProps) {
  const [capacity, setCapacity] = useState(data.details?.capacity_max || 20)
  const [area, setArea] = useState(data.details?.area_sqm || 50)
  const [ageGroups, setAgeGroups] = useState<string[]>(data.details?.age_groups || [])
  
  // Удобства для детского центра
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    Object.entries(data.details?.amenities || {})
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  // Правила
  const [selectedRules, setSelectedRules] = useState<string[]>(
    Object.entries(data.details?.rules || {})
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const handleNext = () => {
    onNext({
      details: {
        subtype: 'kids_center',
        capacity_max: capacity,
        area_sqm: area,
        age_groups: ageGroups,
        amenities: selectedAmenities.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        rules: selectedRules.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
      },
    })
  }

  const amenitiesList: Amenity[] = [
    { id: 'play_zone', label: 'Игровая зона', icon: '🎮', category: 'Основное' },
    { id: 'rest_room', label: 'Комната отдыха', icon: '🛋️', category: 'Основное' },
    { id: 'kids_bathroom', label: 'Детский санузел', icon: '🚽', category: 'Санузел' },
    { id: 'changing_table', label: 'Пеленальный стол', icon: '🍼', category: 'Санузел' },
    { id: 'kitchen', label: 'Кухня / Чайная', icon: '☕', category: 'Питание' },
    { id: 'parking', label: 'Парковка', icon: '🚗', category: 'Инфраструктура' },
    { id: 'ac', label: 'Кондиционер', icon: '❄️', category: 'Климат' },
    { id: 'heating', label: 'Отопление', icon: '🔥', category: 'Климат' },
  ]

  const rulesList: Amenity[] = [
    { id: 'own_food', label: 'Можно свою еду', icon: '🍕' },
    { id: 'own_alcohol', label: 'Можно свой алкоголь', icon: '🍾' },
    { id: 'own_animators', label: 'Можно своих аниматоров', icon: '🤡' },
    { id: 'decor_allowed', label: 'Можно свой декор', icon: '🎈' },
    { id: 'pets_allowed', label: 'Можно с животными', icon: '🐕' },
  ]

  const ageGroupOptions = [
    { value: '0-3', label: '0-3 года' },
    { value: '3-7', label: '3-7 лет' },
    { value: '7-12', label: '7-12 лет' },
    { value: '12+', label: '12+ лет' },
  ]

  const toggleAgeGroup = (value: string) => {
    if (ageGroups.includes(value)) {
      setAgeGroups(ageGroups.filter(g => g !== value))
    } else {
      setAgeGroups([...ageGroups, value])
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Детский центр</h1>
      <p className="text-sm text-gray-500 mb-6">Характеристики площадки (можно пропустить)</p>

      <div className="space-y-6">
        {/* Вместимость и площадь */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            value={capacity}
            onChange={setCapacity}
            min={5}
            max={500}
            step={5}
            label="Вместимость (чел)"
            suffix="чел"
          />
          <NumberInput
            value={area}
            onChange={setArea}
            min={10}
            max={1000}
            step={10}
            label="Площадь (м²)"
            suffix="м²"
          />
        </div>

        {/* Возрастные группы */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Возрастные группы</label>
          <div className="grid grid-cols-2 gap-2">
            {ageGroupOptions.map((group) => (
              <button
                key={group.value}
                type="button"
                onClick={() => toggleAgeGroup(group.value)}
                className={`p-3 rounded-[12px] border-2 transition-all text-sm font-medium ${
                  ageGroups.includes(group.value)
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Удобства */}
        <AmenitiesSelector
          amenities={amenitiesList}
          selected={selectedAmenities}
          onChange={setSelectedAmenities}
          label="Удобства"
          columns={2}
        />

        {/* Правила */}
        <AmenitiesSelector
          amenities={rulesList}
          selected={selectedRules}
          onChange={setSelectedRules}
          label="Правила площадки"
          columns={1}
        />
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

