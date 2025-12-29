'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronRight } from 'lucide-react'

interface BaseVenueCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

/**
 * Универсальная форма для базовых характеристик площадки
 * Используется для новых типов площадок, у которых еще нет специфичной формы
 */
export function BaseVenueCharacteristics({ data, onNext, onSkip }: BaseVenueCharacteristicsProps) {
  const [capacityMax, setCapacityMax] = useState(data.details?.capacity_max || '')
  const [area, setArea] = useState(data.details?.area_sqm || '')
  const [ageMin, setAgeMin] = useState(data.details?.age_min || '')
  const [ageMax, setAgeMax] = useState(data.details?.age_max || '')
  
  // Удобства
  const [parking, setParking] = useState(data.details?.parking || false)
  const [parkingSpots, setParkingSpots] = useState(data.details?.parking_spots || '')
  const [kitchen, setKitchen] = useState(data.details?.kitchen || false)
  const [kitchenType, setKitchenType] = useState(data.details?.kitchen_type || '')
  const [cafe, setCafe] = useState(data.details?.cafe || false)
  const [wifi, setWifi] = useState(data.details?.wifi || false)
  const [projector, setProjector] = useState(data.details?.projector || false)
  const [soundSystem, setSoundSystem] = useState(data.details?.sound_system || false)
  const [microphone, setMicrophone] = useState(data.details?.microphone || false)
  const [lighting, setLighting] = useState(data.details?.lighting || false)
  const [airConditioning, setAirConditioning] = useState(data.details?.air_conditioning || false)
  const [heating, setHeating] = useState(data.details?.heating || false)
  
  // Доступность
  const [disabledAccess, setDisabledAccess] = useState(data.details?.disabled_access || false)
  const [elevator, setElevator] = useState(data.details?.elevator || false)
  
  // Санитарные
  const [toilets, setToilets] = useState(data.details?.toilets || false)
  const [toiletsCount, setToiletsCount] = useState(data.details?.toilets_count || '')
  const [changingRooms, setChangingRooms] = useState(data.details?.changing_rooms || false)
  
  // Мебель
  const [tables, setTables] = useState(data.details?.tables || '')
  const [chairs, setChairs] = useState(data.details?.chairs || '')
  
  const handleNext = () => {
    onNext({
      details: {
        ...data.details,
        // Вместимость
        capacity_max: capacityMax ? parseInt(capacityMax) : undefined,
        area_sqm: area ? parseInt(area) : undefined,
        
        // Возраст
        age_min: ageMin ? parseInt(ageMin) : undefined,
        age_max: ageMax ? parseInt(ageMax) : undefined,
        
        // Парковка
        parking,
        parking_spots: parkingSpots ? parseInt(parkingSpots) : undefined,
        
        // Кухня
        kitchen,
        kitchen_type: kitchenType || undefined,
        cafe,
        
        // Техническое оборудование
        wifi,
        projector,
        sound_system: soundSystem,
        microphone,
        lighting,
        air_conditioning: airConditioning,
        heating,
        
        // Доступность
        disabled_access: disabledAccess,
        elevator,
        
        // Санитарные
        toilets,
        toilets_count: toiletsCount ? parseInt(toiletsCount) : undefined,
        changing_rooms: changingRooms,
        
        // Мебель
        tables: tables ? parseInt(tables) : undefined,
        chairs: chairs ? parseInt(chairs) : undefined,
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Характеристики площадки
      </h1>
      <p className="text-gray-500 mb-6">
        Заполните основные характеристики вашей площадки
      </p>

      <div className="space-y-6">
        {/* Вместимость и площадь */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Основные параметры</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Максимальная вместимость (человек)</Label>
              <Input
                type="number"
                placeholder="50"
                value={capacityMax}
                onChange={(e) => setCapacityMax(e.target.value)}
                className="rounded-[16px]"
              />
              <p className="text-xs text-gray-500 mt-1">Сколько гостей можно разместить</p>
            </div>
            <div>
              <Label>Площадь (м²)</Label>
              <Input
                type="number"
                placeholder="100"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Минимальный возраст</Label>
              <Input
                type="number"
                placeholder="3"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
            <div>
              <Label>Максимальный возраст</Label>
              <Input
                type="number"
                placeholder="12"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
          </div>
        </div>

        {/* Парковка */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Парковка</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="parking"
              checked={parking}
              onCheckedChange={(checked) => setParking(!!checked)}
            />
            <label htmlFor="parking" className="text-sm cursor-pointer">
              Есть парковка
            </label>
          </div>

          {parking && (
            <div>
              <Label>Количество мест</Label>
              <Input
                type="number"
                placeholder="10"
                value={parkingSpots}
                onChange={(e) => setParkingSpots(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
          )}
        </div>

        {/* Кухня и питание */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Кухня и питание</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="kitchen"
              checked={kitchen}
              onCheckedChange={(checked) => setKitchen(!!checked)}
            />
            <label htmlFor="kitchen" className="text-sm cursor-pointer">
              Есть кухня
            </label>
          </div>

          {kitchen && (
            <div>
              <Label>Тип кухни</Label>
              <select
                value={kitchenType}
                onChange={(e) => setKitchenType(e.target.value)}
                className="flex h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <option value="">Выберите тип</option>
                <option value="full">Полноценная кухня</option>
                <option value="mini">Мини-кухня</option>
                <option value="warming">Зона подогрева</option>
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="cafe"
              checked={cafe}
              onCheckedChange={(checked) => setCafe(!!checked)}
            />
            <label htmlFor="cafe" className="text-sm cursor-pointer">
              Кафе на территории
            </label>
          </div>
        </div>

        {/* Техническое оборудование */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Техническое оборудование</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wifi"
                checked={wifi}
                onCheckedChange={(checked) => setWifi(!!checked)}
              />
              <label htmlFor="wifi" className="text-sm cursor-pointer">Wi-Fi</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="projector"
                checked={projector}
                onCheckedChange={(checked) => setProjector(!!checked)}
              />
              <label htmlFor="projector" className="text-sm cursor-pointer">Проектор</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sound_system"
                checked={soundSystem}
                onCheckedChange={(checked) => setSoundSystem(!!checked)}
              />
              <label htmlFor="sound_system" className="text-sm cursor-pointer">Звуковая система</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="microphone"
                checked={microphone}
                onCheckedChange={(checked) => setMicrophone(!!checked)}
              />
              <label htmlFor="microphone" className="text-sm cursor-pointer">Микрофон</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lighting"
                checked={lighting}
                onCheckedChange={(checked) => setLighting(!!checked)}
              />
              <label htmlFor="lighting" className="text-sm cursor-pointer">Освещение</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="air_conditioning"
                checked={airConditioning}
                onCheckedChange={(checked) => setAirConditioning(!!checked)}
              />
              <label htmlFor="air_conditioning" className="text-sm cursor-pointer">Кондиционер</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="heating"
                checked={heating}
                onCheckedChange={(checked) => setHeating(!!checked)}
              />
              <label htmlFor="heating" className="text-sm cursor-pointer">Отопление</label>
            </div>
          </div>
        </div>

        {/* Доступность */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Доступность</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="disabled_access"
              checked={disabledAccess}
              onCheckedChange={(checked) => setDisabledAccess(!!checked)}
            />
            <label htmlFor="disabled_access" className="text-sm cursor-pointer">
              Доступ для маломобильных
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="elevator"
              checked={elevator}
              onCheckedChange={(checked) => setElevator(!!checked)}
            />
            <label htmlFor="elevator" className="text-sm cursor-pointer">
              Лифт
            </label>
          </div>
        </div>

        {/* Санитарные условия */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Санитарные условия</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="toilets"
              checked={toilets}
              onCheckedChange={(checked) => setToilets(!!checked)}
            />
            <label htmlFor="toilets" className="text-sm cursor-pointer">
              Туалеты
            </label>
          </div>

          {toilets && (
            <div>
              <Label>Количество туалетов</Label>
              <Input
                type="number"
                placeholder="2"
                value={toiletsCount}
                onChange={(e) => setToiletsCount(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="changing_rooms"
              checked={changingRooms}
              onCheckedChange={(checked) => setChangingRooms(!!checked)}
            />
            <label htmlFor="changing_rooms" className="text-sm cursor-pointer">
              Раздевалки
            </label>
          </div>
        </div>

        {/* Мебель */}
        <div className="bg-white rounded-[16px] border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Мебель</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Количество столов</Label>
              <Input
                type="number"
                placeholder="10"
                value={tables}
                onChange={(e) => setTables(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
            <div>
              <Label>Количество стульев</Label>
              <Input
                type="number"
                placeholder="40"
                value={chairs}
                onChange={(e) => setChairs(e.target.value)}
                className="rounded-[16px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className="flex gap-4 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="flex-1 rounded-[16px]"
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-[16px]"
        >
          Далее
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

