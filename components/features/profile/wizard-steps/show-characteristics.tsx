'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { RangeSlider } from '@/components/ui/range-slider'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface ShowCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function ShowCharacteristics({ data, onNext, onSkip }: ShowCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [duration, setDuration] = useState<[number, number]>(
    data.details?.duration_min && data.details?.duration_max 
      ? [data.details.duration_min, data.details.duration_max]
      : [30, 60]
  )
  const [ageGroups, setAgeGroups] = useState<string[]>(data.details?.age_groups || [])
  const [participantsMax, setParticipantsMax] = useState(data.details?.participants_max || 20)
  const [showTypes, setShowTypes] = useState<string[]>(data.details?.show_types || [])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Object.entries({
      equipment_included: data.details?.equipment_included,
      indoor: data.details?.indoor,
      outdoor: data.details?.outdoor,
      safety_docs: data.details?.safety_docs,
    })
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const ageGroupOptions = [
    { value: '0-3', label: '0-3 года' },
    { value: '3-7', label: '3-7 лет' },
    { value: '7-12', label: '7-12 лет' },
    { value: '12+', label: '12+ лет' },
  ]

  // Специфичные варианты шоу в зависимости от подтипа
  const getShowTypeOptions = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'bubbles':
        return {
          label: 'Варианты шоу мыльных пузырей',
          options: [
            { value: 'classic', label: 'Классическое шоу' },
            { value: 'giant', label: 'Гигантские пузыри' },
            { value: 'person_in_bubble', label: 'Человек в пузыре' },
            { value: 'interactive', label: 'Интерактивное (дети участвуют)' },
            { value: 'fire_bubbles', label: 'Огненные пузыри' },
          ]
        }
      case 'science':
        return {
          label: 'Типы научных экспериментов',
          options: [
            { value: 'chemistry', label: 'Химические опыты' },
            { value: 'physics', label: 'Физические эксперименты' },
            { value: 'electricity', label: 'Опыты с электричеством' },
            { value: 'dry_ice', label: 'Шоу с сухим льдом' },
            { value: 'polymers', label: 'Полимеры и слаймы' },
          ]
        }
      case 'magic':
        return {
          label: 'Стили фокусов',
          options: [
            { value: 'close_up', label: 'Микромагия (близкая дистанция)' },
            { value: 'stage', label: 'Сценическая иллюзия' },
            { value: 'cards', label: 'Карточные фокусы' },
            { value: 'kids', label: 'Детские фокусы' },
            { value: 'mentalism', label: 'Менталист' },
          ]
        }
      case 'animals':
        return {
          label: 'Типы шоу с животными',
          options: [
            { value: 'dogs', label: 'Шоу дрессированных собак' },
            { value: 'birds', label: 'Шоу птиц (попугаи, совы)' },
            { value: 'reptiles', label: 'Шоу рептилий' },
            { value: 'mini_zoo', label: 'Контактный мини-зоопарк' },
            { value: 'pony', label: 'Пони и лошади' },
          ]
        }
      case 'cryo':
        return {
          label: 'Варианты криошоу',
          options: [
            { value: 'classic_cryo', label: 'Классическое криошоу' },
            { value: 'cryo_ice_cream', label: 'Крио-мороженое' },
            { value: 'cryo_cocktails', label: 'Крио-коктейли' },
            { value: 'smoke_effects', label: 'Дымовые эффекты' },
          ]
        }
      case 'light':
        return {
          label: 'Типы светового шоу',
          options: [
            { value: 'neon', label: 'Неоновое шоу' },
            { value: 'laser', label: 'Лазерное шоу' },
            { value: 'led', label: 'LED-шоу' },
            { value: 'uv', label: 'UV-шоу (ультрафиолет)' },
            { value: 'fire', label: 'Огненное шоу' },
          ]
        }
      case 'foam':
        return {
          label: 'Варианты пенной вечеринки',
          options: [
            { value: 'foam_disco', label: 'Пенная дискотека' },
            { value: 'foam_games', label: 'Игры в пене' },
            { value: 'foam_outdoor', label: 'Уличная пенная вечеринка' },
          ]
        }
      default:
        return null
    }
  }

  const showTypeConfig = getShowTypeOptions()

  const featuresList: Amenity[] = [
    { id: 'equipment_included', label: 'Оборудование включено', icon: '🎪' },
    { id: 'indoor', label: 'Проведение в помещении', icon: '🏠' },
    { id: 'outdoor', label: 'Проведение на улице', icon: '🌳' },
    { id: 'safety_docs', label: 'Есть документы по безопасности', icon: '📄' },
  ]

  const toggleAgeGroup = (value: string) => {
    if (ageGroups.includes(value)) {
      setAgeGroups(ageGroups.filter(g => g !== value))
    } else {
      setAgeGroups([...ageGroups, value])
    }
  }

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        duration_min: duration[0],
        duration_max: duration[1],
        age_groups: ageGroups,
        participants_max: participantsMax,
        show_types: showTypes,
        equipment_included: selectedFeatures.includes('equipment_included'),
        indoor: selectedFeatures.includes('indoor'),
        outdoor: selectedFeatures.includes('outdoor'),
        safety_docs: selectedFeatures.includes('safety_docs'),
      },
    })
  }

  // Определяем название шоу для заголовка
  const getShowTitle = () => {
    switch (subtype) {
      case 'bubbles': return 'Шоу мыльных пузырей'
      case 'science': return 'Научное шоу'
      case 'magic': return 'Шоу фокусов'
      case 'animals': return 'Шоу с животными'
      case 'cryo': return 'Криошоу'
      case 'light': return 'Световое шоу'
      case 'foam': return 'Пенная вечеринка'
      default: return 'Шоу-программа'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getShowTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного шоу (можно пропустить)</p>

      <div className="space-y-6">
        {/* Длительность */}
        <RangeSlider
          min={10}
          max={180}
          step={5}
          value={duration}
          onChange={setDuration}
          label="Длительность программы (мин)"
          formatValue={(v) => `${v} мин`}
        />

        {/* Возрастные группы */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Возрастные группы *</label>
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

        {/* Максимальное количество участников */}
        <NumberInput
          value={participantsMax}
          onChange={setParticipantsMax}
          min={5}
          max={500}
          step={5}
          label="Максимальное количество участников"
          suffix="чел"
        />

        {/* Специфичные варианты шоу для выбранного подтипа */}
        {showTypeConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{showTypeConfig.label}</label>
            <MultiSelect
              options={showTypeConfig.options}
              selected={showTypes}
              onChange={setShowTypes}
              placeholder="Выберите варианты..."
            />
          </div>
        )}

        {/* Особенности */}
        <AmenitiesSelector
          amenities={featuresList}
          selected={selectedFeatures}
          onChange={setSelectedFeatures}
          label="Особенности"
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
          disabled={ageGroups.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

