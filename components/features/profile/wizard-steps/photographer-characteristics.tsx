'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { ChevronRight } from 'lucide-react'

interface PhotographerCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function PhotographerCharacteristics({ data, onNext, onSkip }: PhotographerCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [eventTypes, setEventTypes] = useState<string[]>(data.details?.event_types || [])
  const [experienceYears, setExperienceYears] = useState(data.details?.experience_years || 3)
  const [deliveryDays, setDeliveryDays] = useState(data.details?.delivery_days || 7)
  const [editingIncluded, setEditingIncluded] = useState(data.details?.editing_included !== false)
  const [serviceSpecifics, setServiceSpecifics] = useState<string[]>(data.details?.service_specifics || [])

  const eventTypeOptions: Option[] = [
    { value: 'birthday', label: 'День рождения' },
    { value: 'wedding', label: 'Свадьба' },
    { value: 'corporate', label: 'Корпоратив' },
    { value: 'family', label: 'Семейная съёмка' },
    { value: 'kids', label: 'Детская съёмка' },
    { value: 'graduation', label: 'Выпускной' },
    { value: 'christening', label: 'Крестины' },
    { value: 'holiday', label: 'Праздники' },
  ]

  // Специфичные опции в зависимости от подтипа
  const getSubtypeSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'photo_only':
        return {
          label: 'Стили фотосъёмки',
          options: [
            { value: 'reportage', label: 'Репортажная съёмка' },
            { value: 'posed', label: 'Постановочная съёмка' },
            { value: 'artistic', label: 'Художественная съёмка' },
            { value: 'lifestyle', label: 'Lifestyle-съёмка' },
            { value: 'studio', label: 'Студийная съёмка' },
          ]
        }
      case 'video_only':
        return {
          label: 'Форматы видеосъёмки',
          options: [
            { value: 'full_event', label: 'Полная съёмка мероприятия' },
            { value: 'highlight', label: 'Highlights (короткий ролик)' },
            { value: 'teaser', label: 'Teaser (тизер)' },
            { value: 'interview', label: 'Интервью и поздравления' },
            { value: 'drone', label: 'Аэросъёмка (дрон)' },
          ]
        }
      case 'photo_video':
        return {
          label: 'Форматы комплексной съёмки',
          options: [
            { value: 'full_coverage', label: 'Полное покрытие (фото + видео)' },
            { value: 'photo_plus_teaser', label: 'Фотосъёмка + видео-тизер' },
            { value: 'two_specialists', label: 'Два специалиста (фото и видео)' },
            { value: 'hybrid', label: 'Гибридная съёмка (один специалист)' },
          ]
        }
      default:
        return null
    }
  }

  const subtypeConfig = getSubtypeSpecifics()

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        event_types: eventTypes,
        experience_years: experienceYears,
        editing_included: editingIncluded,
        delivery_days: deliveryDays,
        service_specifics: serviceSpecifics,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'photo_only': return 'Фотосъёмка'
      case 'video_only': return 'Видеосъёмка'
      case 'photo_video': return 'Фото и видеосъёмка'
      default: return 'Фото/Видео'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного формата (можно пропустить)</p>

      <div className="space-y-6">
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

        {/* Специфичные форматы для выбранного подтипа */}
        {subtypeConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{subtypeConfig.label}</label>
            <MultiSelect
              options={subtypeConfig.options}
              selected={serviceSpecifics}
              onChange={setServiceSpecifics}
              placeholder="Выберите форматы..."
            />
          </div>
        )}

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

        {/* Срок сдачи материалов */}
        <NumberInput
          value={deliveryDays}
          onChange={setDeliveryDays}
          min={1}
          max={90}
          step={1}
          label="Срок сдачи материалов (дней)"
          suffix="дн"
        />

        {/* Обработка включена */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Обработка включена</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {subtype === 'video_only' ? 'Монтаж и цветокоррекция' : 'Ретушь и цветокоррекция'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingIncluded(!editingIncluded)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              editingIncluded ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                editingIncluded ? 'translate-x-6' : 'translate-x-1'
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
          disabled={eventTypes.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

