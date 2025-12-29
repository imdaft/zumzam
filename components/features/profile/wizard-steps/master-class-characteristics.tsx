'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { RangeSlider } from '@/components/ui/range-slider'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import { ChevronRight } from 'lucide-react'

interface MasterClassCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function MasterClassCharacteristics({ data, onNext, onSkip }: MasterClassCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [durationMin, setDurationMin] = useState(data.details?.duration_min || 60)
  const [ageRange, setAgeRange] = useState<[number, number]>(
    data.details?.age_min && data.details?.age_max
      ? [data.details.age_min, data.details.age_max]
      : [3, 12]
  )
  const [participantsRange, setParticipantsRange] = useState<[number, number]>(
    data.details?.participants_min && data.details?.participants_max
      ? [data.details.participants_min, data.details.participants_max]
      : [5, 15]
  )
  const [specifics, setSpecifics] = useState<string[]>(data.details?.specifics || [])
  const [customSpecific, setCustomSpecific] = useState('')
  const [materialsIncluded, setMaterialsIncluded] = useState(data.details?.materials_included !== false)
  const [mobile, setMobile] = useState(data.details?.mobile || true)

  // Специфичные опции в зависимости от подтипа
  const getSubtypeOptions = (): { options: Option[], label: string, placeholder: string } => {
    switch (subtype) {
      case 'creative':
        return {
          label: 'Творческие техники',
          placeholder: 'Выберите техники...',
          options: [
            { value: 'painting', label: 'Рисование (акварель, гуашь)' },
            { value: 'drawing', label: 'Графика (карандаш, маркеры)' },
            { value: 'sculpting', label: 'Лепка (пластилин, глина)' },
            { value: 'decoupage', label: 'Декупаж' },
            { value: 'origami', label: 'Оригами' },
            { value: 'applique', label: 'Аппликация' },
            { value: 'beading', label: 'Бисероплетение' },
            { value: 'embroidery', label: 'Вышивка' },
          ]
        }
      case 'culinary':
        return {
          label: 'Кулинарные направления',
          placeholder: 'Выберите направления...',
          options: [
            { value: 'baking_cookies', label: 'Выпечка печенья' },
            { value: 'baking_cakes', label: 'Выпечка тортов' },
            { value: 'pizza', label: 'Приготовление пиццы' },
            { value: 'cake_decorating', label: 'Украшение тортов' },
            { value: 'candy_making', label: 'Конфеты и сладости' },
            { value: 'cooking', label: 'Готовка блюд' },
            { value: 'pastry', label: 'Кондитерское дело' },
            { value: 'chocolate', label: 'Шоколадные изделия' },
          ]
        }
      case 'science':
        return {
          label: 'Научные направления',
          placeholder: 'Выберите направления...',
          options: [
            { value: 'robotics', label: 'Робототехника' },
            { value: 'programming', label: 'Программирование' },
            { value: 'electronics', label: 'Электроника и схемотехника' },
            { value: 'chemistry', label: 'Химические эксперименты' },
            { value: 'physics', label: 'Физические опыты' },
            { value: '3d_modeling', label: '3D-моделирование' },
            { value: 'game_dev', label: 'Разработка игр' },
          ]
        }
      case 'craft':
        return {
          label: 'Ремесленные направления',
          placeholder: 'Выберите направления...',
          options: [
            { value: 'pottery', label: 'Гончарное дело' },
            { value: 'woodworking', label: 'Столярное дело' },
            { value: 'soap_making', label: 'Мыловарение' },
            { value: 'candle_making', label: 'Изготовление свечей' },
            { value: 'leathercraft', label: 'Работа с кожей' },
            { value: 'weaving', label: 'Ткачество' },
            { value: 'metalwork', label: 'Работа с металлом' },
          ]
        }
      default:
        return {
          label: 'Направления мастер-класса',
          placeholder: 'Выберите направления...',
          options: []
        }
    }
  }

  const subtypeConfig = getSubtypeOptions()

  const addCustomSpecific = () => {
    if (customSpecific.trim() && !specifics.includes(customSpecific)) {
      setSpecifics([...specifics, customSpecific.trim()])
      setCustomSpecific('')
    }
  }

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        duration_min: durationMin,
        age_min: ageRange[0],
        age_max: ageRange[1],
        participants_min: participantsRange[0],
        participants_max: participantsRange[1],
        materials_included: materialsIncluded,
        mobile,
        specifics,
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {subtype === 'creative' && 'Творческий мастер-класс'}
        {subtype === 'culinary' && 'Кулинарный мастер-класс'}
        {subtype === 'science' && 'Научный мастер-класс'}
        {subtype === 'craft' && 'Ремесленный мастер-класс'}
        {!subtype && 'Мастер-класс'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного направления (можно пропустить)</p>

      <div className="space-y-6">
        {/* Длительность */}
        <NumberInput
          value={durationMin}
          onChange={setDurationMin}
          min={30}
          max={240}
          step={15}
          label="Длительность (мин)"
          suffix="мин"
        />

        {/* Возраст участников */}
        <RangeSlider
          min={3}
          max={18}
          step={1}
          value={ageRange}
          onChange={setAgeRange}
          label="Возраст участников"
          formatValue={(v) => `${v} лет`}
        />

        {/* Количество участников */}
        <RangeSlider
          min={1}
          max={30}
          step={1}
          value={participantsRange}
          onChange={setParticipantsRange}
          label="Количество участников"
          formatValue={(v) => `${v} чел`}
        />

        {/* Специфичные направления для выбранного подтипа */}
        {subtypeConfig.options.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{subtypeConfig.label} *</label>
            <MultiSelect
              options={subtypeConfig.options}
              selected={specifics}
              onChange={setSpecifics}
              placeholder={subtypeConfig.placeholder}
            />
            
            <div className="mt-2 flex gap-2">
              <Input
                value={customSpecific}
                onChange={(e) => setCustomSpecific(e.target.value)}
                placeholder="Или добавьте своё направление"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSpecific())}
              />
              <Button type="button" onClick={addCustomSpecific} variant="outline">
                Добавить
              </Button>
            </div>
          </div>
        )}

        {/* Опции */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Материалы включены</h3>
              <p className="text-xs text-gray-500 mt-0.5">Все необходимое для занятия</p>
            </div>
            <button
              type="button"
              onClick={() => setMaterialsIncluded(!materialsIncluded)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                materialsIncluded ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  materialsIncluded ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Выездной формат</h3>
              <p className="text-xs text-gray-500 mt-0.5">Проведение у клиента</p>
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
          disabled={subtypeConfig.options.length > 0 && specifics.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

