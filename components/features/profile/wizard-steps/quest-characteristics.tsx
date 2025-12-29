'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { RangeSlider } from '@/components/ui/range-slider'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { ChevronRight } from 'lucide-react'

interface QuestCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function QuestCharacteristics({ data, onNext, onSkip }: QuestCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [difficulty, setDifficulty] = useState(data.details?.difficulty || 'medium')
  const [durationMin, setDurationMin] = useState(data.details?.duration_min || 60)
  const [participants, setParticipants] = useState<[number, number]>(
    data.details?.participants_min && data.details?.participants_max
      ? [data.details.participants_min, data.details.participants_max]
      : [2, 6]
  )
  const [ageMin, setAgeMin] = useState(data.details?.age_min || 12)
  const [themes, setThemes] = useState<string[]>(data.details?.theme || [])
  const [questSpecifics, setQuestSpecifics] = useState<string[]>(data.details?.quest_specifics || [])
  const [hintsAvailable, setHintsAvailable] = useState(data.details?.hints_available !== false)
  const [actorIncluded, setActorIncluded] = useState(data.details?.actor_included || false)
  const [mobile, setMobile] = useState(data.details?.mobile || false)

  const themeOptions: Option[] = [
    { value: 'horror', label: 'Хоррор' },
    { value: 'detective', label: 'Детектив' },
    { value: 'adventure', label: 'Приключения' },
    { value: 'fantasy', label: 'Фэнтези' },
    { value: 'sci-fi', label: 'Научная фантастика' },
    { value: 'historical', label: 'Исторический' },
    { value: 'comedy', label: 'Комедия' },
    { value: 'kids', label: 'Детский' },
  ]

  // Специфичные особенности в зависимости от подтипа
  const getQuestSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'location':
        return {
          label: 'Особенности локации',
          options: [
            { value: 'multi_room', label: 'Несколько комнат' },
            { value: 'immersive', label: 'Полное погружение' },
            { value: 'tech_puzzles', label: 'Технологичные загадки' },
            { value: 'physical_tasks', label: 'Физические задания' },
            { value: 'themed_interior', label: 'Тематический интерьер' },
          ]
        }
      case 'mobile':
        return {
          label: 'Форматы выездного квеста',
          options: [
            { value: 'outdoor_quest', label: 'Уличный квест' },
            { value: 'home_quest', label: 'Квест на дому' },
            { value: 'city_quest', label: 'Городской квест' },
            { value: 'treasure_hunt', label: 'Поиск сокровищ' },
            { value: 'team_building', label: 'Тимбилдинг' },
          ]
        }
      default:
        return null
    }
  }

  const questConfig = getQuestSpecifics()

  const difficultyLevels = [
    { value: 'easy', label: 'Лёгкий', emoji: '😊' },
    { value: 'medium', label: 'Средний', emoji: '🤔' },
    { value: 'hard', label: 'Сложный', emoji: '😰' },
  ]

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        difficulty,
        duration_min: durationMin,
        participants_min: participants[0],
        participants_max: participants[1],
        age_min: ageMin,
        theme: themes,
        quest_specifics: questSpecifics,
        hints_available: hintsAvailable,
        actor_included: actorIncluded,
        mobile,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'location': return 'Квест на локации'
      case 'mobile': return 'Выездной квест'
      default: return 'Квест'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного формата (можно пропустить)</p>

      <div className="space-y-6">
        {/* Сложность */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Уровень сложности</label>
          <div className="grid grid-cols-3 gap-2">
            {difficultyLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setDifficulty(level.value)}
                className={`p-3 rounded-[12px] border-2 transition-all text-sm font-medium ${
                  difficulty === level.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{level.emoji}</div>
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Длительность */}
        <NumberInput
          value={durationMin}
          onChange={setDurationMin}
          min={30}
          max={180}
          step={15}
          label="Длительность (мин)"
          suffix="мин"
        />

        {/* Количество участников */}
        <RangeSlider
          min={1}
          max={20}
          step={1}
          value={participants}
          onChange={setParticipants}
          label="Количество участников"
          formatValue={(v) => `${v} чел`}
        />

        {/* Минимальный возраст */}
        <NumberInput
          value={ageMin}
          onChange={setAgeMin}
          min={6}
          max={18}
          step={1}
          label="Минимальный возраст"
          suffix="лет"
        />

        {/* Темы */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Темы *</label>
          <MultiSelect
            options={themeOptions}
            selected={themes}
            onChange={setThemes}
            placeholder="Выберите темы квеста..."
          />
        </div>

        {/* Специфичные особенности для выбранного подтипа */}
        {questConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{questConfig.label}</label>
            <MultiSelect
              options={questConfig.options}
              selected={questSpecifics}
              onChange={setQuestSpecifics}
              placeholder="Выберите особенности..."
            />
          </div>
        )}

        {/* Опции */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Подсказки</h3>
              <p className="text-xs text-gray-500 mt-0.5">Доступны во время игры</p>
            </div>
            <button
              type="button"
              onClick={() => setHintsAvailable(!hintsAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hintsAvailable ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hintsAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Актёр в игре</h3>
              <p className="text-xs text-gray-500 mt-0.5">Живой персонаж</p>
            </div>
            <button
              type="button"
              onClick={() => setActorIncluded(!actorIncluded)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                actorIncluded ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  actorIncluded ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Показываем опцию выездного квеста только для типа 'location' */}
          {subtype === 'location' && (
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Выездной формат</h3>
                <p className="text-xs text-gray-500 mt-0.5">Можем провести у клиента</p>
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
          )}
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
          disabled={themes.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

