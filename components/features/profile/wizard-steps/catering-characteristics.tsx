'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface CateringCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function CateringCharacteristics({ data, onNext, onSkip }: CateringCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(data.details?.cuisine_types || [])
  const [menuSpecifics, setMenuSpecifics] = useState<string[]>(data.details?.menu_specifics || [])
  const [minOrder, setMinOrder] = useState(data.details?.min_order || 10)
  const [dietaryOptions, setDietaryOptions] = useState<string[]>(data.details?.dietary_options || [])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Object.entries({
      delivery: data.details?.delivery,
      staff_included: data.details?.staff_included,
      equipment_included: data.details?.equipment_included,
      custom_menu: data.details?.custom_menu,
    })
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const cuisineOptions: Option[] = [
    { value: 'russian', label: 'Русская' },
    { value: 'european', label: 'Европейская' },
    { value: 'italian', label: 'Итальянская' },
    { value: 'asian', label: 'Азиатская' },
    { value: 'kids', label: 'Детская' },
    { value: 'healthy', label: 'Здоровое питание' },
    { value: 'bbq', label: 'Барбекю' },
    { value: 'vegetarian', label: 'Вегетарианская' },
  ]

  // Специфичные меню в зависимости от подтипа
  const getMenuSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'kids_menu':
        return {
          label: 'Детские меню',
          options: [
            { value: 'kids_buffet', label: 'Детский сладкий стол' },
            { value: 'healthy_kids', label: 'Здоровое детское питание' },
            { value: 'fun_food', label: 'Весёлое оформление блюд' },
            { value: 'finger_food', label: 'Фингер-фуд для детей' },
            { value: 'birthday_menu', label: 'Меню для дня рождения' },
          ]
        }
      case 'buffet':
        return {
          label: 'Форматы фуршета',
          options: [
            { value: 'classic_buffet', label: 'Классический фуршет' },
            { value: 'canapes', label: 'Канапе' },
            { value: 'mini_dishes', label: 'Мини-блюда' },
            { value: 'finger_food', label: 'Фингер-фуд' },
            { value: 'cheese_wine', label: 'Сырно-винная тарелка' },
          ]
        }
      case 'banquet':
        return {
          label: 'Виды банкетов',
          options: [
            { value: 'seated_banquet', label: 'Банкет за столами' },
            { value: 'standing_banquet', label: 'Банкет-коктейль' },
            { value: 'buffet_style', label: 'Шведский стол' },
            { value: 'family_style', label: 'Семейный стиль' },
          ]
        }
      case 'bbq':
        return {
          label: 'Форматы барбекю',
          options: [
            { value: 'shashlik', label: 'Шашлык' },
            { value: 'steaks', label: 'Стейки' },
            { value: 'burgers', label: 'Бургеры' },
            { value: 'vegetables', label: 'Овощи на гриле' },
            { value: 'seafood', label: 'Морепродукты на гриле' },
          ]
        }
      default:
        return null
    }
  }

  const menuConfig = getMenuSpecifics()

  const dietaryOptionsList: Option[] = [
    { value: 'vegetarian', label: 'Вегетарианское' },
    { value: 'vegan', label: 'Веганское' },
    { value: 'gluten_free', label: 'Без глютена' },
    { value: 'lactose_free', label: 'Без лактозы' },
    { value: 'halal', label: 'Халяль' },
    { value: 'kosher', label: 'Кошерное' },
  ]

  const featuresList: Amenity[] = [
    { id: 'delivery', label: 'Доставка', icon: '🚚' },
    { id: 'staff_included', label: 'Персонал включён', icon: '👨‍🍳' },
    { id: 'equipment_included', label: 'Оборудование включено', icon: '🍽️' },
    { id: 'custom_menu', label: 'Индивидуальное меню', icon: '📋' },
  ]

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        cuisine_types: cuisineTypes,
        menu_specifics: menuSpecifics,
        min_order: minOrder,
        dietary_options: dietaryOptions,
        delivery: selectedFeatures.includes('delivery'),
        staff_included: selectedFeatures.includes('staff_included'),
        equipment_included: selectedFeatures.includes('equipment_included'),
        custom_menu: selectedFeatures.includes('custom_menu'),
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'kids_menu': return 'Детское питание'
      case 'buffet': return 'Фуршет'
      case 'banquet': return 'Банкет'
      case 'bbq': return 'Барбекю / Гриль'
      default: return 'Кейтеринг'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного формата (можно пропустить)</p>

      <div className="space-y-6">
        {/* Типы кухни */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Типы кухни *</label>
          <MultiSelect
            options={cuisineOptions}
            selected={cuisineTypes}
            onChange={setCuisineTypes}
            placeholder="Выберите типы кухни..."
          />
        </div>

        {/* Специфичные меню для выбранного подтипа */}
        {menuConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{menuConfig.label}</label>
            <MultiSelect
              options={menuConfig.options}
              selected={menuSpecifics}
              onChange={setMenuSpecifics}
              placeholder="Выберите форматы..."
            />
          </div>
        )}

        {/* Минимальный заказ */}
        <NumberInput
          value={minOrder}
          onChange={setMinOrder}
          min={5}
          max={200}
          step={5}
          label="Минимальный заказ (порций)"
          suffix="порций"
        />

        {/* Диетические опции */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Диетические опции</label>
          <MultiSelect
            options={dietaryOptionsList}
            selected={dietaryOptions}
            onChange={setDietaryOptions}
            placeholder="Выберите опции..."
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
          disabled={cuisineTypes.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

