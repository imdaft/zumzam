'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import { ChevronRight } from 'lucide-react'

interface AgencyCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function AgencyCharacteristics({ data, onNext, onSkip }: AgencyCharacteristicsProps) {
  const [services, setServices] = useState<string[]>(data.details?.services || [])
  const [customService, setCustomService] = useState('')
  const [experienceYears, setExperienceYears] = useState(data.details?.experience_years || 3)
  const [eventsPerYear, setEventsPerYear] = useState(data.details?.events_per_year || 50)
  const [teamSize, setTeamSize] = useState(data.details?.team_size || 5)
  const [fullPackage, setFullPackage] = useState(data.details?.full_package !== false)

  const serviceOptions: Option[] = [
    { value: 'venue', label: 'Поиск и аренда площадки' },
    { value: 'catering', label: 'Кейтеринг' },
    { value: 'entertainment', label: 'Развлекательная программа' },
    { value: 'decoration', label: 'Оформление' },
    { value: 'photo_video', label: 'Фото/Видео съёмка' },
    { value: 'invitations', label: 'Приглашения' },
    { value: 'gifts', label: 'Подарки гостям' },
    { value: 'transport', label: 'Транспорт' },
  ]

  const addCustomService = () => {
    if (customService.trim() && !services.includes(customService)) {
      setServices([...services, customService.trim()])
      setCustomService('')
    }
  }

  const handleNext = () => {
    onNext({
      details: {
        services,
        experience_years: experienceYears,
        events_per_year: eventsPerYear,
        team_size: teamSize,
        full_package: fullPackage,
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Агентство праздников</h1>
      <p className="text-sm text-gray-500 mb-6">Характеристики услуг (можно пропустить)</p>

      <div className="space-y-6">
        {/* Услуги */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Услуги *</label>
          <MultiSelect
            options={serviceOptions}
            selected={services}
            onChange={setServices}
            placeholder="Выберите услуги..."
          />
          
          <div className="mt-2 flex gap-2">
            <Input
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
              placeholder="Или добавьте свою услугу"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
            />
            <Button type="button" onClick={addCustomService} variant="outline">
              Добавить
            </Button>
          </div>
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

        {/* Мероприятий в год */}
        <NumberInput
          value={eventsPerYear}
          onChange={setEventsPerYear}
          min={1}
          max={500}
          step={5}
          label="Количество мероприятий в год"
          suffix="шт"
        />

        {/* Размер команды */}
        <NumberInput
          value={teamSize}
          onChange={setTeamSize}
          min={1}
          max={100}
          step={1}
          label="Размер команды"
          suffix="чел"
        />

        {/* Организация под ключ */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Организация «под ключ»</h3>
            <p className="text-xs text-gray-500 mt-0.5">Полный комплекс услуг</p>
          </div>
          <button
            type="button"
            onClick={() => setFullPackage(!fullPackage)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              fullPackage ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                fullPackage ? 'translate-x-6' : 'translate-x-1'
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
          disabled={services.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

















