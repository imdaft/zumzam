'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Input } from '@/components/ui/input'
import { AmenitiesSelector, type Amenity } from '@/components/ui/amenities-selector'
import { ChevronRight } from 'lucide-react'

interface TransportCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function TransportCharacteristics({ data, onNext, onSkip }: TransportCharacteristicsProps) {
  const subtype = data.details?.subtype
  const [capacity, setCapacity] = useState(data.details?.capacity || 4)
  const [vehicles, setVehicles] = useState<string[]>(data.details?.vehicles || [])
  const [customVehicle, setCustomVehicle] = useState('')
  const [vehicleSpecifics, setVehicleSpecifics] = useState<string[]>(data.details?.vehicle_specifics || [])
  const [rentalMinHours, setRentalMinHours] = useState(data.details?.rental_min_hours || 2)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Object.entries({
      driver_included: data.details?.driver_included,
      decoration_included: data.details?.decoration_included,
    })
      .filter(([_, value]) => value)
      .map(([key]) => key)
  )

  const vehicleOptions: Option[] = [
    { value: 'limo', label: 'Лимузин' },
    { value: 'retro', label: 'Ретро-автомобиль' },
    { value: 'carriage', label: 'Карета' },
    { value: 'party_bus', label: 'Party Bus' },
    { value: 'minibus', label: 'Микроавтобус' },
    { value: 'convertible', label: 'Кабриолет' },
    { value: 'kids_car', label: 'Детский автомобиль' },
    { value: 'bike', label: 'Мотоцикл' },
  ]

  // Специфичные особенности в зависимости от подтипа
  const getVehicleSpecifics = (): { options: Option[], label: string } | null => {
    switch (subtype) {
      case 'kids_transport':
        return {
          label: 'Детский транспорт',
          options: [
            { value: 'electric_train', label: 'Детский паровозик' },
            { value: 'electric_cars', label: 'Электромобили' },
            { value: 'carousel', label: 'Карусель' },
            { value: 'pony_cart', label: 'Повозка с пони' },
          ]
        }
      case 'limousine':
        return {
          label: 'Типы лимузинов',
          options: [
            { value: 'classic_limo', label: 'Классический лимузин' },
            { value: 'stretch_limo', label: 'Лимузин стретч' },
            { value: 'hummer_limo', label: 'Хаммер-лимузин' },
            { value: 'party_limo', label: 'Лимузин для вечеринок' },
          ]
        }
      case 'retro':
        return {
          label: 'Ретро-автомобили',
          options: [
            { value: 'vintage_cars', label: 'Винтажные авто' },
            { value: 'classic_cars', label: 'Классические авто' },
            { value: 'soviet_cars', label: 'Советские авто' },
            { value: 'american_cars', label: 'Американские авто' },
          ]
        }
      case 'carriage':
        return {
          label: 'Типы карет',
          options: [
            { value: 'wedding_carriage', label: 'Свадебная карета' },
            { value: 'fairytale_carriage', label: 'Сказочная карета' },
            { value: 'horse_drawn', label: 'Конная повозка' },
            { value: 'decorated_carriage', label: 'Украшенная карета' },
          ]
        }
      default:
        return null
    }
  }

  const vehicleConfig = getVehicleSpecifics()

  const featuresList: Amenity[] = [
    { id: 'driver_included', label: 'Водитель включён', icon: '👨‍✈️' },
    { id: 'decoration_included', label: 'Украшение включено', icon: '🎀' },
  ]

  const addCustomVehicle = () => {
    if (customVehicle.trim() && !vehicles.includes(customVehicle)) {
      setVehicles([...vehicles, customVehicle.trim()])
      setCustomVehicle('')
    }
  }

  const handleNext = () => {
    onNext({
      details: {
        subtype,
        capacity,
        vehicles,
        vehicle_specifics: vehicleSpecifics,
        driver_included: selectedFeatures.includes('driver_included'),
        decoration_included: selectedFeatures.includes('decoration_included'),
        rental_min_hours: rentalMinHours,
      },
    })
  }

  // Определяем название услуги для заголовка
  const getServiceTitle = () => {
    switch (subtype) {
      case 'kids_transport': return 'Детский транспорт'
      case 'limousine': return 'Лимузин'
      case 'retro': return 'Ретро-автомобиль'
      case 'carriage': return 'Карета'
      default: return 'Транспорт'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{getServiceTitle()}</h1>
      <p className="text-sm text-gray-500 mb-6">Детали выбранного транспорта (можно пропустить)</p>

      <div className="space-y-6">
        {/* Транспортные средства */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Транспортные средства *</label>
          <MultiSelect
            options={vehicleOptions}
            selected={vehicles}
            onChange={setVehicles}
            placeholder="Выберите транспорт..."
          />
          
          <div className="mt-2 flex gap-2">
            <Input
              value={customVehicle}
              onChange={(e) => setCustomVehicle(e.target.value)}
              placeholder="Или добавьте своё транспортное средство"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomVehicle())}
            />
            <Button type="button" onClick={addCustomVehicle} variant="outline">
              Добавить
            </Button>
          </div>
        </div>

        {/* Специфичные варианты для выбранного подтипа */}
        {vehicleConfig && (
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">{vehicleConfig.label}</label>
            <MultiSelect
              options={vehicleConfig.options}
              selected={vehicleSpecifics}
              onChange={setVehicleSpecifics}
              placeholder="Выберите варианты..."
            />
          </div>
        )}

        {/* Вместимость */}
        <NumberInput
          value={capacity}
          onChange={setCapacity}
          min={1}
          max={50}
          step={1}
          label="Вместимость (пассажиров)"
          suffix="чел"
        />

        {/* Минимальная аренда */}
        <NumberInput
          value={rentalMinHours}
          onChange={setRentalMinHours}
          min={1}
          max={24}
          step={1}
          label="Минимальная аренда (часов)"
          suffix="ч"
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
          disabled={vehicles.length === 0}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm disabled:opacity-50"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

