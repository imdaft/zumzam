'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import { ChevronRight } from 'lucide-react'

interface DjMusicianCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function DjMusicianCharacteristics({ data, onNext, onSkip }: DjMusicianCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [genres, setGenres] = useState<string[]>(data.details?.genres || [])
  const [customGenre, setCustomGenre] = useState('')
  const [performanceSpecifics, setPerformanceSpecifics] = useState<string[]>(data.details?.performance_specifics || [])
  const [experienceYears, setExperienceYears] = useState(data.details?.experience_years || 5)
  const [eventTypes, setEventTypes] = useState<string[]>(data.details?.event_types || [])
  const [durationMin, setDurationMin] = useState(data.details?.duration_min || 120)
  const [equipmentIncluded, setEquipmentIncluded] = useState(data.details?.equipment_included !== false)

  const genreOptions: Option[] = [
    { value: 'pop', label: 'Поп' },
    { value: 'rock', label: 'Рок' },
    { value: 'disco', label: 'Диско' },
    { value: 'house', label: 'Хаус' },
    { value: 'r&b', label: 'R&B' },
    { value: 'jazz', label: 'Джаз' },
    { value: 'acoustic', label: 'Акустика' },
    { value: 'kids', label: 'Детская музыка' },
  ]

  // Специфичные варианты в зависимости от подтипа
  const getPerformanceSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'dj':
        return {
          label: 'Форматы DJ-сетов',
          options: [
            { value: 'disco_kids', label: 'Детская дискотека' },
            { value: 'party_music', label: 'Танцевальная музыка' },
            { value: 'remix_sets', label: 'Ремиксы и миксы' },
            { value: 'karaoke', label: 'Караоке' },
            { value: 'light_show', label: 'Световое шоу' },
          ]
        }
      case 'musician':
        return {
          label: 'Форматы живых выступлений',
          options: [
            { value: 'guitar_vocal', label: 'Гитара и вокал' },
            { value: 'violin', label: 'Скрипка' },
            { value: 'piano', label: 'Фортепиано' },
            { value: 'saxophone', label: 'Саксофон' },
            { value: 'band', label: 'Группа/Ансамбль' },
            { value: 'acoustic_set', label: 'Акустический сет' },
          ]
        }
      case 'host_music':
        return {
          label: 'Комбинированный формат',
          options: [
            { value: 'host_dj_combo', label: 'Ведущий + DJ' },
            { value: 'host_music_combo', label: 'Ведущий + живая музыка' },
            { value: 'interactive_music', label: 'Интерактив с музыкой' },
            { value: 'games_music', label: 'Игры под музыку' },
          ]
        }
      default:
        return null
    }
  }

  const performanceConfig = getPerformanceSpecifics()

  const eventTypeOptions: Option[] = [
    { value: 'birthday', label: 'День рождения' },
    { value: 'wedding', label: 'Свадьба' },
    { value: 'corporate', label: 'Корпоратив' },
    { value: 'kids_party', label: 'Детский праздник' },
    { value: 'graduation', label: 'Выпускной' },
    { value: 'festival', label: 'Фестиваль' },
  ]

  const addCustomGenre = () => {
    if (customGenre.trim() && !genres.includes(customGenre)) {
      setGenres([...genres, customGenre.trim()])
      setCustomGenre('')
    }
  }

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        genres,
        performance_specifics: performanceSpecifics,
        equipment_included: equipmentIncluded,
        experience_years: experienceYears,
        event_types: eventTypes,
        duration_min: durationMin,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'dj': return 'Диджей (DJ)'
      case 'musician': return 'Музыкант'
      case 'host_music': return 'Ведущий с музыкой'
      default: return 'Диджей / Музыкант'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного формата (можно пропустить)</p>

      <div className="space-y-6">
        {/* Жанры */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Жанры *</label>
          <MultiSelect
            options={genreOptions}
            selected={genres}
            onChange={setGenres}
            placeholder="Выберите жанры..."
          />
          
          <div className="mt-2 flex gap-2">
            <Input
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder="Или добавьте свой жанр"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGenre())}
            />
            <Button type="button" onClick={addCustomGenre} variant="outline">
              Добавить
            </Button>
          </div>
        </div>

        {/* Специфичные форматы для выбранного подтипа */}
        {performanceConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{performanceConfig.label}</label>
            <MultiSelect
              options={performanceConfig.options}
              selected={performanceSpecifics}
              onChange={setPerformanceSpecifics}
              placeholder="Выберите форматы..."
            />
          </div>
        )}

        {/* Типы мероприятий */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Типы мероприятий *</label>
          <MultiSelect
            options={eventTypeOptions}
            selected={eventTypes}
            onChange={setEventTypes}
            placeholder="Выберите типы мероприятий..."
          />
        </div>

        {/* Опыт работы */}
        <NumberInput
          value={experienceYears}
          onChange={setExperienceYears}
          min={0}
          max={50}
          step={1}
          label="Опыт работы (лет)"
          suffix="лет"
        />

        {/* Минимальная длительность */}
        <NumberInput
          value={durationMin}
          onChange={setDurationMin}
          min={60}
          max={480}
          step={30}
          label="Минимальная длительность (мин)"
          suffix="мин"
        />

        {/* Оборудование включено */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Оборудование включено</h3>
            <p className="text-xs text-gray-500 mt-0.5">Звуковая и световая аппаратура</p>
          </div>
          <button
            type="button"
            onClick={() => setEquipmentIncluded(!equipmentIncluded)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              equipmentIncluded ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                equipmentIncluded ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
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
          disabled={genres.length === 0 || eventTypes.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

