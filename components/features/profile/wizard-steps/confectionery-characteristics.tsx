'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface ConfectioneryCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function ConfectioneryCharacteristics({ data, onNext, onSkip }: ConfectioneryCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [products, setProducts] = useState<string[]>(data.details?.products || [])
  const [productSpecifics, setProductSpecifics] = useState<string[]>(data.details?.product_specifics || [])
  const [dietaryOptions, setDietaryOptions] = useState<string[]>(data.details?.dietary_options || [])
  const [minOrderDays, setMinOrderDays] = useState(data.details?.min_order_days || 3)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Object.entries({
      custom_design: data.details?.custom_design,
      delivery: data.details?.delivery,
    })
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const productOptions: Option[] = [
    { value: 'cakes', label: 'Торты' },
    { value: 'cupcakes', label: 'Капкейки' },
    { value: 'cookies', label: 'Печенье' },
    { value: 'macarons', label: 'Макаруны' },
    { value: 'candy_bar', label: 'Кенди-бар' },
    { value: 'cake_pops', label: 'Кейк-попсы' },
    { value: 'donuts', label: 'Пончики' },
    { value: 'candy', label: 'Конфеты ручной работы' },
  ]

  // Специфичные опции в зависимости от подтипа
  const getProductSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'cakes':
        return {
          label: 'Виды тортов',
          options: [
            { value: 'kids_cakes', label: 'Детские торты' },
            { value: 'figure_cakes', label: 'Фигурные торты' },
            { value: 'tiered_cakes', label: 'Многоярусные торты' },
            { value: 'photo_cakes', label: 'Торты с фото' },
            { value: 'themed_cakes', label: 'Тематические торты' },
            { value: 'classic_cakes', label: 'Классические торты' },
          ]
        }
      case 'candy_bar':
        return {
          label: 'Элементы Candy Bar',
          options: [
            { value: 'full_design', label: 'Полное оформление' },
            { value: 'backdrop', label: 'Баннер и декор' },
            { value: 'sweets_variety', label: 'Ассорти сладостей' },
            { value: 'cake_table', label: 'Торт и десерты' },
            { value: 'themed_setup', label: 'Тематическое оформление' },
          ]
        }
      case 'desserts':
        return {
          label: 'Виды десертов',
          options: [
            { value: 'cupcakes', label: 'Капкейки' },
            { value: 'macarons', label: 'Макаруны' },
            { value: 'cookies', label: 'Расписные пряники' },
            { value: 'cake_pops', label: 'Кейк-попсы' },
            { value: 'meringues', label: 'Безе' },
            { value: 'eclairs', label: 'Эклеры' },
          ]
        }
      default:
        return null
    }
  }

  const productConfig = getProductSpecifics()

  const dietaryOptionsList: Option[] = [
    { value: 'sugar_free', label: 'Без сахара' },
    { value: 'gluten_free', label: 'Без глютена' },
    { value: 'lactose_free', label: 'Без лактозы' },
    { value: 'vegan', label: 'Веганское' },
    { value: 'low_calorie', label: 'Низкокалорийное' },
  ]

  const featuresList: Amenity[] = [
    { id: 'custom_design', label: 'Индивидуальный дизайн', icon: '🎨' },
    { id: 'delivery', label: 'Доставка', icon: '🚚' },
  ]

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        products,
        product_specifics: productSpecifics,
        custom_design: selectedFeatures.includes('custom_design'),
        dietary_options: dietaryOptions,
        delivery: selectedFeatures.includes('delivery'),
        min_order_days: minOrderDays,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'cakes': return 'Торты на заказ'
      case 'candy_bar': return 'Candy Bar (Сладкий стол)'
      case 'desserts': return 'Десерты'
      default: return 'Кондитерская'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного направления (можно пропустить)</p>

      <div className="space-y-6">
        {/* Продукты */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Продукция *</label>
          <MultiSelect
            options={productOptions}
            selected={products}
            onChange={setProducts}
            placeholder="Выберите продукцию..."
          />
        </div>

        {/* Специфичные варианты для выбранного подтипа */}
        {productConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{productConfig.label}</label>
            <MultiSelect
              options={productConfig.options}
              selected={productSpecifics}
              onChange={setProductSpecifics}
              placeholder="Выберите варианты..."
            />
          </div>
        )}

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

        {/* Минимальный срок заказа */}
        <NumberInput
          value={minOrderDays}
          onChange={setMinOrderDays}
          min={1}
          max={14}
          step={1}
          label="Минимальный срок заказа (дней)"
          suffix="дн"
        />

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
          disabled={products.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

