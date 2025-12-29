'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface DecoratorCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function DecoratorCharacteristics({ data, onNext, onSkip }: DecoratorCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [services, setServices] = useState<string[]>(data.details?.services || [])
  const [customService, setCustomService] = useState('')
  const [decorSpecifics, setDecorSpecifics] = useState<string[]>(data.details?.decor_specifics || [])
  const [themes, setThemes] = useState<string[]>(data.details?.themes || [])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Object.entries({
      delivery: data.details?.delivery,
      setup_included: data.details?.setup_included,
      takedown_included: data.details?.takedown_included,
      rental_available: data.details?.rental_available,
    })
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const serviceOptions: Option[] = [
    { value: 'balloons', label: 'Воздушные шары' },
    { value: 'flowers', label: 'Цветочное оформление' },
    { value: 'textiles', label: 'Текстильное оформление' },
    { value: 'lighting', label: 'Световое оформление' },
    { value: 'candy_bar', label: 'Кенди-бар' },
    { value: 'photo_zone', label: 'Фотозона' },
    { value: 'tables', label: 'Оформление столов' },
    { value: 'full_decor', label: 'Полное оформление' },
  ]

  // Специфичные варианты в зависимости от подтипа
  const getDecorSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'balloons':
        return {
          label: 'Варианты работ с шарами',
          options: [
            { value: 'balloon_arches', label: 'Арки из шаров' },
            { value: 'balloon_figures', label: 'Фигуры из шаров' },
            { value: 'balloon_bouquets', label: 'Букеты из шаров' },
            { value: 'helium_balloons', label: 'Гелиевые шары' },
            { value: 'balloon_walls', label: 'Стены из шаров' },
            { value: 'balloon_columns', label: 'Колонны из шаров' },
          ]
        }
      case 'textile_flowers':
        return {
          label: 'Элементы оформления',
          options: [
            { value: 'draping', label: 'Драпировка тканью' },
            { value: 'flower_arrangements', label: 'Цветочные композиции' },
            { value: 'table_cloths', label: 'Скатерти и чехлы' },
            { value: 'ceiling_decor', label: 'Потолочное оформление' },
            { value: 'backdrop', label: 'Фон для фотозоны' },
          ]
        }
      case 'full_decor':
        return {
          label: 'Включено в полное оформление',
          options: [
            { value: 'design_project', label: 'Дизайн-проект' },
            { value: 'all_decor', label: 'Все элементы декора' },
            { value: 'installation', label: 'Установка и монтаж' },
            { value: 'lighting_design', label: 'Световой дизайн' },
            { value: 'furniture_rental', label: 'Аренда мебели' },
          ]
        }
      default:
        return null
    }
  }

  const decorConfig = getDecorSpecifics()

  const themeOptions: Option[] = [
    { value: 'princess', label: 'Принцессы' },
    { value: 'superheroes', label: 'Супергерои' },
    { value: 'unicorn', label: 'Единороги' },
    { value: 'space', label: 'Космос' },
    { value: 'forest', label: 'Лесная тема' },
    { value: 'sea', label: 'Морская тема' },
    { value: 'vintage', label: 'Винтаж' },
    { value: 'modern', label: 'Современный стиль' },
  ]

  const featuresList: Amenity[] = [
    { id: 'delivery', label: 'Доставка', icon: '🚚' },
    { id: 'setup_included', label: 'Установка включена', icon: '🛠️' },
    { id: 'takedown_included', label: 'Демонтаж включён', icon: '📦' },
    { id: 'rental_available', label: 'Аренда доступна', icon: '🏷️' },
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
        subtype,
        services,
        decor_specifics: decorSpecifics,
        themes,
        delivery: selectedFeatures.includes('delivery'),
        setup_included: selectedFeatures.includes('setup_included'),
        takedown_included: selectedFeatures.includes('takedown_included'),
        rental_available: selectedFeatures.includes('rental_available'),
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'balloons': return 'Оформление шарами'
      case 'textile_flowers': return 'Текстиль и цветы'
      case 'full_decor': return 'Полное оформление'
      default: return 'Декоратор'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного направления (можно пропустить)</p>

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

        {/* Специфичные варианты для выбранного подтипа */}
        {decorConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{decorConfig.label}</label>
            <MultiSelect
              options={decorConfig.options}
              selected={decorSpecifics}
              onChange={setDecorSpecifics}
              placeholder="Выберите варианты..."
            />
          </div>
        )}

        {/* Темы */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Темы оформления</label>
          <MultiSelect
            options={themeOptions}
            selected={themes}
            onChange={setThemes}
            placeholder="Выберите темы..."
          />
        </div>

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

