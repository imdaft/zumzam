'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { ChevronRight } from 'lucide-react'

interface AnimatorCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function AnimatorCharacteristics({ data, onNext, onSkip }: AnimatorCharacteristicsProps) {
  const [characters, setCharacters] = useState(data.details?.characters || [])
  const [customCharacter, setCustomCharacter] = useState('')
  const [experienceYears, setExperienceYears] = useState(data.details?.experience_years || 1)
  const [ageGroups, setAgeGroups] = useState<string[]>(data.details?.age_groups || [])
  const [programDurationMin, setProgramDurationMin] = useState(data.details?.program_duration_min || 60)
  const [teamSize, setTeamSize] = useState(data.details?.team_size || 1)
  const [mobile, setMobile] = useState(data.details?.mobile || true)

  const characterOptions: Option[] = [
    { value: 'spiderman', label: 'Человек-паук' },
    { value: 'elsa', label: 'Эльза (Frozen)' },
    { value: 'mickey', label: 'Микки Маус' },
    { value: 'princess', label: 'Принцесса' },
    { value: 'superhero', label: 'Супергерой' },
    { value: 'pirate', label: 'Пират' },
    { value: 'clown', label: 'Клоун' },
    { value: 'fairy', label: 'Фея' },
    { value: 'santa', label: 'Дед Мороз' },
    { value: 'unicorn', label: 'Единорог' },
  ]

  const ageGroupOptions = [
    { value: '0-3', label: '0-3 года' },
    { value: '3-7', label: '3-7 лет' },
    { value: '7-12', label: '7-12 лет' },
    { value: '12+', label: '12+ лет' },
  ]

  const handleNext = () => {
    onNext({
      details: {
        characters,
        experience_years: experienceYears,
        age_groups: ageGroups,
        program_duration_min: programDurationMin,
        team_size: teamSize,
        mobile,
      },
    })
  }

  const addCustomCharacter = () => {
    if (customCharacter.trim() && !characters.includes(customCharacter)) {
      setCharacters([...characters, customCharacter.trim()])
      setCustomCharacter('')
    }
  }

  const toggleAgeGroup = (value: string) => {
    if (ageGroups.includes(value)) {
      setAgeGroups(ageGroups.filter(g => g !== value))
    } else {
      setAgeGroups([...ageGroups, value])
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Аниматор</h1>
      <p className="text-sm text-gray-500 mb-6">Характеристики услуг (можно пропустить)</p>

      <div className="space-y-6">
        {/* Персонажи */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Персонажи *</label>
          <MultiSelect
            options={characterOptions}
            selected={characters}
            onChange={setCharacters}
            placeholder="Выберите персонажей..."
          />
          
          {/* Добавить свой персонаж */}
          <div className="mt-2 flex gap-2">
            <Input
              value={customCharacter}
              onChange={(e) => setCustomCharacter(e.target.value)}
              placeholder="Или добавьте своего персонажа"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCharacter())}
            />
            <Button type="button" onClick={addCustomCharacter} variant="outline">
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

        {/* Длительность программы */}
        <NumberInput
          value={programDurationMin}
          onChange={setProgramDurationMin}
          min={15}
          max={360}
          step={15}
          label="Минимальная длительность программы (мин)"
          suffix="мин"
        />

        {/* Размер команды */}
        <NumberInput
          value={teamSize}
          onChange={setTeamSize}
          min={1}
          max={20}
          step={1}
          label="Количество аниматоров"
          suffix="чел"
        />

        {/* Выездная работа */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Выездная работа</h3>
            <p className="text-xs text-gray-500 mt-0.5">Готовы выехать к клиенту</p>
          </div>
          <button
            type="button"
            onClick={() => setMobile(!mobile)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              mobile ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                mobile ? 'translate-x-6' : 'translate-x-1'
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
          disabled={characters.length === 0 || ageGroups.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

















