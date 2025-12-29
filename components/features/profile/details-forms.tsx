'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, Edit2 } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { SpecificVenueFields } from './venue-specific-fields'
import { SimpleCheckbox } from '@/components/ui/simple-checkbox'

// Специфичные поля для разных типов площадок (OLD - DELETE ME)
function OldSpecificVenueFields_ToDelete({ prefix, control }: { prefix: string; control: any }) {
  const { watch } = useFormContext()
  const venueType = watch(`${prefix}.venue_type`)

  if (!venueType) return null

  // Для батутного центра
  if (venueType === 'trampoline_park') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.trampoline_count`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Количество батутов</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="5-20"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Возраст от (лет)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="3"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_max`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Возраст до (лет)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="14"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'foam_pit', label: 'Поролоновая яма' },
            { id: 'ninja_track', label: 'Ниндзя-трасса' },
            { id: 'separate_zone_adults', label: 'Отдельная зона для взрослых' },
            { id: 'separate_zone_kids', label: 'Отдельная зона для малышей' },
            { id: 'birthday_room', label: 'Комната для праздника' },
            { id: 'cafe_onsite', label: 'Кафе на территории' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border-2 border-slate-200 bg-white p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // Для кафе/ресторана
  if (venueType === 'cafe') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.cuisine_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Тип кухни</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-[18px]">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="european">Европейская</SelectItem>
                    <SelectItem value="italian">Итальянская</SelectItem>
                    <SelectItem value="japanese">Японская</SelectItem>
                    <SelectItem value="asian">Азиатская</SelectItem>
                    <SelectItem value="georgian">Грузинская</SelectItem>
                    <SelectItem value="russian">Русская</SelectItem>
                    <SelectItem value="mixed">Смешанная</SelectItem>
                    <SelectItem value="fast_food">Фаст-фуд</SelectItem>
                    <SelectItem value="other">Другая</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.average_check`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Средний чек (₽)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="500-1500"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'kids_menu', label: 'Детское меню' },
            { id: 'kids_zone', label: 'Детская зона' },
            { id: 'highchairs', label: 'Детские стульчики' },
            { id: 'animation', label: 'Аниматоры' },
            { id: 'separate_room', label: 'Отдельный зал' },
            { id: 'music_system', label: 'Музыкальная система' },
            { id: 'projector', label: 'Проектор/экран' },
            { id: 'own_cake', label: 'Свой торт разрешен' },
            { id: 'deposit_required', label: 'Требуется депозит' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border-2 border-slate-200 bg-white p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // Для лофта/студии
  if (venueType === 'loft') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.ceiling_height`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Высота потолков (м)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-[18px]"
                    placeholder="3.0-6.0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.natural_light`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Естественное освещение</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-[18px]">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Есть (большие окна)</SelectItem>
                    <SelectItem value="partial">Частично</SelectItem>
                    <SelectItem value="no">Нет окон</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.interior_style`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Стиль интерьера</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-[18px]">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="loft">Индустриальный лофт</SelectItem>
                    <SelectItem value="modern">Современный</SelectItem>
                    <SelectItem value="minimal">Минимализм</SelectItem>
                    <SelectItem value="classic">Классический</SelectItem>
                    <SelectItem value="eclectic">Эклектика</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'has_stage', label: 'Есть сцена' },
            { id: 'sound_system', label: 'Звуковая система' },
            { id: 'light_equipment', label: 'Световое оборудование' },
            { id: 'projector', label: 'Проектор' },
            { id: 'free_decoration', label: 'Свободное оформление' },
            { id: 'catering_allowed', label: 'Свой кейтеринг' },
            { id: 'kitchen_access', label: 'Доступ к кухне' },
            { id: 'dressing_room', label: 'Гримерная' },
            { id: 'separate_entrance', label: 'Отдельный вход' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border-2 border-slate-200 bg-white p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // Для детского развлекательного центра
  if (venueType === 'entertainment_center') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Возраст от (лет)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_max`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Возраст до (лет)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="12"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.entrance_fee`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Входной билет (₽)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="300-800"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'labyrinth', label: 'Лабиринт' },
            { id: 'dry_pool', label: 'Сухой бассейн' },
            { id: 'slides', label: 'Горки' },
            { id: 'trampolines', label: 'Батутная зона' },
            { id: 'soft_modules', label: 'Мягкие модули' },
            { id: 'attractions', label: 'Аттракционы' },
            { id: 'game_machines', label: 'Игровые автоматы' },
            { id: 'birthday_room', label: 'Комната для праздника' },
            { id: 'cafe', label: 'Кафе' },
            { id: 'animator', label: 'Аниматоры' },
            { id: 'adult_supervision', label: 'Наблюдение за детьми' },
            { id: 'free_wifi', label: 'Wi-Fi для родителей' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-[18px] border-2 border-slate-200 bg-white p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // Для других типов - заглушка
  return (
    <div className="p-4 bg-slate-50 rounded-[18px] border-2 border-dashed border-slate-200">
      <p className="text-sm text-slate-500 text-center">
        Для этого типа площадки пока нет специфичных характеристик. Используйте блок "Удобства и оборудование" ниже.
      </p>
    </div>
  )
}

// Компонент для редактирования удобств
function AmenitiesEditor({ prefix, control }: { prefix: string; control: any }) {
  const { watch, setValue } = useFormContext()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [tempLabel, setTempLabel] = useState('')

  const defaultAmenities = [
    'Парковка',
    'Кухня',
    'Техническое оборудование',
    'Доступность для инвалидов',
    'Санитарные условия',
    'Мебель',
  ]

  // Маппинг технических названий в человекочитаемые (для миграции старого формата)
  const amenityKeyToLabel: Record<string, string> = {
    'parking': 'Парковка',
    'kitchen': 'Кухня',
    'equipment': 'Техническое оборудование',
    'accessibility': 'Доступность для инвалидов',
    'sanitary': 'Санитарные условия',
    'furniture': 'Мебель',
    'wifi': 'Wi-Fi',
    'air_conditioning': 'Кондиционер',
    'heating': 'Отопление',
    'sound_system': 'Звуковая система',
    'projector': 'Проектор',
    'stage': 'Сцена',
  }

  // Функция нормализации данных amenities в массив объектов
  const normalizeAmenities = (data: any): Array<{ label: string; available: boolean }> => {
    // Если данных нет, возвращаем дефолтные значения
    if (!data) {
      return defaultAmenities.map(label => ({ label, available: false }))
    }

    // Если это уже массив объектов нужного формата
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'label' in data[0]) {
      return data as Array<{ label: string; available: boolean }>
    }

    // Если это массив строк
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return data.map((label: string) => ({ label, available: true }))
    }

    // Если это объект с булевыми полями (старый формат) - ИСПРАВЛЕНО
    if (typeof data === 'object' && !Array.isArray(data)) {
      const result: Array<{ label: string; available: boolean }> = []
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'boolean') {
          // Преобразуем технический ключ в человекочитаемый текст
          const humanLabel = amenityKeyToLabel[key] || key
          result.push({ label: humanLabel, available: value })
        }
      }
      // Если объект пустой, возвращаем дефолтные значения
      if (result.length === 0) {
        return defaultAmenities.map(label => ({ label, available: false }))
      }
      return result
    }

    // В любом другом случае возвращаем дефолтные значения
    return defaultAmenities.map(label => ({ label, available: false }))
  }

  const rawAmenities = watch(`${prefix}.amenities`)
  const [amenities, setAmenities] = useState<Array<{ label: string; available: boolean }>>([])
  const hasNormalizedRef = useRef(false)

  // Синхронизация: если данные в старом формате (объект или массив строк), нормализуем и сохраняем
  useEffect(() => {
    // Проверяем, нужно ли нормализовать данные
    const needsNormalization = 
      (rawAmenities && typeof rawAmenities === 'object' && !Array.isArray(rawAmenities)) ||
      (rawAmenities && Array.isArray(rawAmenities) && rawAmenities.length > 0 && typeof rawAmenities[0] === 'string')

    if (needsNormalization && !hasNormalizedRef.current) {
      // Данные в старом формате, нужно нормализовать и сохранить
      const normalized = normalizeAmenities(rawAmenities)
      setValue(`${prefix}.amenities`, normalized, { shouldDirty: false })
      setAmenities(normalized)
      hasNormalizedRef.current = true
    } else if (rawAmenities && Array.isArray(rawAmenities) && rawAmenities.length > 0 && typeof rawAmenities[0] === 'object' && 'label' in rawAmenities[0]) {
      // Данные уже в правильном формате, просто обновляем локальное состояние
      setAmenities(rawAmenities as Array<{ label: string; available: boolean }>)
      hasNormalizedRef.current = true
    } else if (!rawAmenities && !hasNormalizedRef.current) {
      // Данных нет, используем дефолтные значения
      const defaults = normalizeAmenities(null)
      setAmenities(defaults)
      hasNormalizedRef.current = true
    }
  }, [rawAmenities, prefix, setValue])

  const handleToggle = (index: number) => {
    const updated = [...amenities]
    updated[index] = { ...updated[index], available: !updated[index].available }
    setAmenities(updated)
    setValue(`${prefix}.amenities`, updated, { shouldDirty: true, shouldValidate: true })
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setTempLabel(amenities[index].label)
  }

  const handleSaveEdit = (index: number) => {
    const updated = [...amenities]
    updated[index] = { ...updated[index], label: tempLabel }
    setAmenities(updated)
    setValue(`${prefix}.amenities`, updated, { shouldDirty: true })
    setEditingIndex(null)
    setTempLabel('')
  }

  const handleAdd = () => {
    const updated = [...amenities, { label: 'Новое удобство', available: false }]
    setAmenities(updated)
    setValue(`${prefix}.amenities`, updated, { shouldDirty: true })
  }

  const handleDelete = (index: number) => {
    const updated = amenities.filter((_: any, i: number) => i !== index)
    setAmenities(updated)
    setValue(`${prefix}.amenities`, updated, { shouldDirty: true })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {amenities.map((amenity: any, index: number) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-3 rounded-[18px] border-2 transition-all',
              amenity.available 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-white border-slate-200'
            )}
          >
            <SimpleCheckbox
              checked={amenity.available}
              onCheckedChange={() => handleToggle(index)}
            />
            
            {editingIndex === index ? (
              <Input
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={() => handleSaveEdit(index)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(index)}
                className="h-8 text-sm flex-1"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium flex-1">{amenity.label}</span>
            )}

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleEdit(index)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              {amenities.length > 4 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Добавить удобство
      </Button>
    </div>
  )
}

// Компонент для редактирования правил
function RulesEditor({ prefix, control }: { prefix: string; control: any }) {
  const { watch, setValue } = useFormContext()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [tempText, setTempText] = useState('')

  const defaultRules = [
    'Запрет на курение',
    'Запрет на алкоголь',
    'Минимальный заказ',
    'Предоплата',
  ]

  // Маппинг технических названий в человекочитаемые (для миграции старого формата)
  const ruleKeyToText: Record<string, string> = {
    'deposit_required': 'Требуется депозит',
    'own_food_allowed': 'Можно со своей едой',
    'cleaning_included': 'Уборка включена',
    'own_drinks_allowed': 'Можно со своими напитками',
    'smoking_allowed': 'Разрешено курение',
    'alcohol_allowed': 'Разрешен алкоголь',
    'pets_allowed': 'Разрешены животные',
    'minimum_order': 'Минимальный заказ',
    'prepayment': 'Требуется предоплата',
  }

  // Функция нормализации данных rules в массив объектов
  const normalizeRules = (data: any): Array<{ text: string; enabled: boolean }> => {
    // Если данных нет, возвращаем дефолтные значения
    if (!data) {
      return defaultRules.map(text => ({ text, enabled: false }))
    }

    // Если это уже массив объектов нужного формата
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'text' in data[0]) {
      return data as Array<{ text: string; enabled: boolean }>
    }

    // Если это массив строк
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return data.map((text: string) => ({ text, enabled: true }))
    }

    // Если это объект с булевыми полями (старый формат) - ИСПРАВЛЕНО
    if (typeof data === 'object' && !Array.isArray(data)) {
      const result: Array<{ text: string; enabled: boolean }> = []
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'boolean') {
          // Преобразуем технический ключ в человекочитаемый текст
          const humanText = ruleKeyToText[key] || key
          result.push({ text: humanText, enabled: value })
        }
      }
      // Если объект пустой, возвращаем дефолтные значения
      if (result.length === 0) {
        return defaultRules.map(text => ({ text, enabled: false }))
      }
      return result
    }

    // В любом другом случае возвращаем дефолтные значения
    return defaultRules.map(text => ({ text, enabled: false }))
  }

  const rawRules = watch(`${prefix}.rules`)
  const [rules, setRules] = useState<Array<{ text: string; enabled: boolean }>>([])
  const hasNormalizedRulesRef = useRef(false)

  // Синхронизация: если данные в старом формате (объект или массив строк), нормализуем и сохраняем
  useEffect(() => {
    // Проверяем, нужно ли нормализовать данные
    const needsNormalization = 
      (rawRules && typeof rawRules === 'object' && !Array.isArray(rawRules)) ||
      (rawRules && Array.isArray(rawRules) && rawRules.length > 0 && typeof rawRules[0] === 'string')

    if (needsNormalization && !hasNormalizedRulesRef.current) {
      // Данные в старом формате, нужно нормализовать и сохранить
      const normalized = normalizeRules(rawRules)
      setValue(`${prefix}.rules`, normalized, { shouldDirty: false })
      setRules(normalized)
      hasNormalizedRulesRef.current = true
    } else if (rawRules && Array.isArray(rawRules) && rawRules.length > 0 && typeof rawRules[0] === 'object' && 'text' in rawRules[0]) {
      // Данные уже в правильном формате, просто обновляем локальное состояние
      setRules(rawRules as Array<{ text: string; enabled: boolean }>)
      hasNormalizedRulesRef.current = true
    } else if (!rawRules && !hasNormalizedRulesRef.current) {
      // Данных нет, используем дефолтные значения
      const defaults = normalizeRules(null)
      setRules(defaults)
      hasNormalizedRulesRef.current = true
    }
  }, [rawRules, prefix, setValue])

  const handleToggle = (index: number) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    setRules(updated)
    setValue(`${prefix}.rules`, updated, { shouldDirty: true, shouldValidate: true })
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setTempText(rules[index].text)
  }

  const handleSaveEdit = (index: number) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], text: tempText }
    setRules(updated)
    setValue(`${prefix}.rules`, updated, { shouldDirty: true })
    setEditingIndex(null)
    setTempText('')
  }

  const handleAdd = () => {
    const updated = [...rules, { text: 'Новое правило', enabled: false }]
    setRules(updated)
    setValue(`${prefix}.rules`, updated, { shouldDirty: true })
  }

  const handleDelete = (index: number) => {
    const updated = rules.filter((_: any, i: number) => i !== index)
    setRules(updated)
    setValue(`${prefix}.rules`, updated, { shouldDirty: true })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rules.map((rule: any, index: number) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-3 rounded-[18px] border-2 transition-all',
              rule.enabled 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-white border-slate-200'
            )}
          >
            <SimpleCheckbox
              checked={rule.enabled}
              onCheckedChange={() => handleToggle(index)}
            />
            
            {editingIndex === index ? (
              <Input
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={() => handleSaveEdit(index)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(index)}
                className="h-8 text-sm flex-1"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium flex-1">{rule.text}</span>
            )}

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleEdit(index)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              {rules.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Добавить правило
      </Button>
    </div>
  )
}

// Основная форма деталей площадки
interface VenueDetailsProps {
  prefix?: string
  hideCard?: boolean
}

export function VenueDetailsForm({ prefix = 'details', hideCard = false }: VenueDetailsProps) {
  const { control, watch } = useFormContext()
  const venueType = watch(`${prefix}.venue_type`)

  const content = (
    <div className="space-y-8">
      {/* Базовые характеристики */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-900">Базовые характеристики</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.capacity_max`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                  Вместимость (чел) *
                  <HelpTooltip content="Максимальное количество гостей, которое комфортно размещается на площадке" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="Например: 30"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${prefix}.area_sqm`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                  Площадь (кв.м)
                  <HelpTooltip content="Общая площадь помещения в квадратных метрах" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-[18px]"
                    placeholder="Например: 80"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${prefix}.floor`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                  Этаж
                  <HelpTooltip content="На каком этаже здания расположена площадка (0 = цоколь, 1 = первый этаж)" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Например: 3"
                    className="h-11 rounded-[18px]"
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Формат работы */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-900">Формат работы</h4>
          <HelpTooltip content="Укажите, как работает ваша площадка - только аренда, готовые программы или полное обслуживание праздников" />
        </div>
        
        <FormField
          control={control}
          name={`${prefix}.work_format`}
          render={({ field }) => (
            <FormItem>
              <FormDescription className="text-xs text-slate-600 mb-3">
                Выберите все подходящие варианты
              </FormDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries({
                  venue_rental: '🏢 Сдаем площадку в аренду',
                  own_programs: '🎭 Проводим свои программы',
                  turnkey: '🎁 Организуем праздник под ключ',
                  tickets: '🎫 Продажа билетов (свободное посещение)',
                }).map(([value, label]) => {
                  const isChecked = Array.isArray(field.value) && field.value.includes(value)
                  return (
                    <div
                      key={value}
                      onClick={() => {
                        const current = Array.isArray(field.value) ? field.value : []
                        if (isChecked) {
                          field.onChange(current.filter((v: string) => v !== value))
                        } else {
                          field.onChange([...current, value])
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-[18px] border-2 cursor-pointer transition-all',
                        'hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.14)] active:scale-[0.98]',
                        isChecked
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 shrink-0 rounded-[18px] border-2 flex items-center justify-center transition-all',
                        isChecked ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'
                      )}>
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn('text-sm font-medium', isChecked ? 'text-orange-900' : 'text-slate-700')}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Специфичные поля */}
      {venueType && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900">Специфичные характеристики</h4>
          </div>
          <SpecificVenueFields prefix={prefix} control={control} />
        </div>
      )}

      {/* Удобства и оборудование */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-900">Удобства и оборудование</h4>
        </div>
        <AmenitiesEditor prefix={prefix} control={control} />
      </div>

      {/* Правила и условия */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2">
          <h4 className="text-sm font-bold text-slate-900">Правила и условия</h4>
        </div>
        <RulesEditor prefix={prefix} control={control} />
      </div>
    </div>
  )

  if (hideCard) {
    return content
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Характеристики площадки</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

// Остальные формы (заглушки для других категорий)
export function AnimatorDetailsForm({ prefix = 'details', hideHeader = false }: { prefix?: string; hideHeader?: boolean }) {
  const { control, watch, setValue } = useFormContext()

  // Оборудование
  const equipment = [
    { key: 'has_music_equipment', label: 'Музыкальное оборудование' },
    { key: 'has_car', label: 'Свой автомобиль' },
    { key: 'has_med_book', label: 'Медицинская книжка' },
  ]

  return (
    <Card className="rounded-[24px] border-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] scroll-mt-24">
      {!hideHeader && (
        <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-2xl font-bold text-slate-900 leading-tight">
            Характеристики аниматора
          </CardTitle>
          <CardDescription className="text-[11px] sm:text-sm text-slate-600 mt-0.5 sm:mt-2 leading-snug">
            Укажите ваш опыт и доступное оборудование.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn("p-2 sm:p-6 pt-0 space-y-4 sm:space-y-8", hideHeader && "pt-2 sm:pt-6")}>
        {/* Опыт работы */}
        <FormField
          control={control}
          name={`${prefix}.experience_years`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] sm:text-sm font-semibold text-slate-900">
                Опыт работы (лет)
              </FormLabel>
              <FormDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug">
                Сколько лет вы работаете аниматором?
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  className="h-10 sm:h-12 rounded-[18px] text-sm sm:text-base mt-1.5 sm:mt-2"
                  placeholder="5"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Оборудование и возможности */}
        <div>
          <div className="mb-2 sm:mb-4">
            <FormLabel className="text-[13px] sm:text-sm font-semibold text-slate-900">
              Оборудование и возможности
            </FormLabel>
            <FormDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-snug">
              Отметьте, что у вас есть. Это поможет клиентам сделать выбор.
            </FormDescription>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {equipment.map((item) => {
              const fieldPath = `${prefix}.${item.key}`
              const isChecked = watch(fieldPath) ?? false
              return (
                <div
                  key={item.key}
                  onClick={() => setValue(fieldPath, !isChecked, { shouldDirty: true })}
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-[18px] border-2 transition-all cursor-pointer',
                    isChecked
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  )}
                >
                  <SimpleCheckbox checked={isChecked} />
                  <FormLabel className="text-xs sm:text-sm font-medium cursor-pointer flex-1">{item.label}</FormLabel>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ShowDetailsForm({ prefix = 'details' }: { prefix?: string }) {
  return <div className="p-8 text-center text-gray-500">Форма для шоу-программы</div>
}

export function AgencyDetailsForm({ prefix = 'details' }: { prefix?: string }) {
  return <div className="p-8 text-center text-gray-500">Форма для агентства</div>
}
