'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { ChevronRight } from 'lucide-react'

interface HostCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function HostCharacteristics({ data, onNext, onSkip }: HostCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [experienceYears, setExperienceYears] = useState(data.details?.experience_years || 3)
  const [ageGroups, setAgeGroups] = useState<string[]>(data.details?.age_groups || [])
  const [programTypes, setProgramTypes] = useState<string[]>(data.details?.program_types || [])
  const [programSpecifics, setProgramSpecifics] = useState<string[]>(data.details?.program_specifics || [])
  const [durationMin, setDurationMin] = useState(data.details?.duration_min || 120)
  const [bilingual, setBilingual] = useState(data.details?.bilingual || false)

  const ageGroupOptions = [
    { value: '0-3', label: '0-3 года' },
    { value: '3-7', label: '3-7 лет' },
    { value: '7-12', label: '7-12 лет' },
    { value: '12-18', label: '12-18 лет' },
    { value: '18+', label: '18+ лет' },
  ]

  const programTypeOptions: Option[] = [
    { value: 'birthday', label: 'День рождения' },
    { value: 'wedding', label: 'Свадьба' },
    { value: 'corporate', label: 'Корпоратив' },
    { value: 'graduation', label: 'Выпускной' },
    { value: 'anniversary', label: 'Юбилей' },
    { value: 'kids_party', label: 'Детский праздник' },
    { value: 'family', label: 'Семейное мероприятие' },
    { value: 'themed', label: 'Тематическое мероприятие' },
  ]

  // Специфичные программы в зависимости от подтипа
  const getProgramSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'kids':
        return {
          label: 'Детские программы',
          options: [
            { value: 'games_interactive', label: 'Игровая программа' },
            { value: 'contests', label: 'Конкурсы' },
            { value: 'quizzes', label: 'Викторины' },
            { value: 'themed_scenarios', label: 'Тематические сценарии' },
            { value: 'disco_kids', label: 'Детская дискотека' },
            { value: 'show_program', label: 'Шоу-программа' },
          ]
        }
      case 'family_corporate':
        return {
          label: 'Программы для взрослых',
          options: [
            { value: 'corporate_games', label: 'Корпоративные игры' },
            { value: 'toasts_speeches', label: 'Тосты и речи' },
            { value: 'team_building', label: 'Тимбилдинг' },
            { value: 'quiz_adult', label: 'Викторины для взрослых' },
            { value: 'wedding_ceremony', label: 'Выездная регистрация' },
            { value: 'anniversary_program', label: 'Юбилейная программа' },
          ]
        }
      default:
        return null
    }
  }

  const programConfig = getProgramSpecifics()

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
        experience_years: experienceYears,
        age_groups: ageGroups,
        program_types: programTypes,
        program_specifics: programSpecifics,
        duration_min: durationMin,
        bilingual,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'kids': return 'Ведущий детских мероприятий'
      case 'family_corporate': return 'Ведущий семейных/корпоративных мероприятий'
      default: return 'Ведущий'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного формата (можно пропустить)</p>

      <div className="space-y-6">
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

        {/* Типы программ */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Типы программ *</label>
          <MultiSelect
            options={programTypeOptions}
            selected={programTypes}
            onChange={setProgramTypes}
            placeholder="Выберите типы программ..."
          />
        </div>

        {/* Специфичные программы для выбранного подтипа */}
        {programConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{programConfig.label}</label>
            <MultiSelect
              options={programConfig.options}
              selected={programSpecifics}
              onChange={setProgramSpecifics}
              placeholder="Выберите форматы программ..."
            />
          </div>
        )}

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

        {/* Двуязычный */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Двуязычное ведение</h3>
            <p className="text-xs text-gray-500 mt-0.5">Проведение на двух языках</p>
          </div>
          <button
            type="button"
            onClick={() => setBilingual(!bilingual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              bilingual ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                bilingual ? 'translate-x-6' : 'translate-x-1'
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
          disabled={ageGroups.length === 0 || programTypes.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

