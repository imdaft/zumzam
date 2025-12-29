'use client'

import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SimpleCheckbox } from '@/components/ui/simple-checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HelpTooltip } from '@/components/ui/help-tooltip'

interface SpecificVenueFieldsProps {
  prefix: string
  control: any
}

export function SpecificVenueFields({ prefix, control }: SpecificVenueFieldsProps) {
  const { watch } = useFormContext()
  const venueType = watch(`${prefix}.venue_type`)

  if (!venueType) return null

  // ==================== БАТУТНЫЙ ЦЕНТР ====================
  if (venueType === 'trampoline_park') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.trampoline_count`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество батутов
                  <HelpTooltip content="Общее количество батутных секций в вашем центре" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для посещения" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст до (лет)
                  <HelpTooltip content="Максимальный возраст или возраст до которого комфортно заниматься" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
            { id: 'foam_pit', label: 'Поролоновая яма', tooltip: 'Яма с мягкими кубиками для безопасных прыжков' },
            { id: 'ninja_track', label: 'Ниндзя-трасса', tooltip: 'Полоса препятствий с различными снарядами' },
            { id: 'separate_zone_adults', label: 'Зона для взрослых', tooltip: 'Отдельная батутная зона для взрослых' },
            { id: 'separate_zone_kids', label: 'Зона для малышей', tooltip: 'Безопасная зона для самых маленьких (до 5 лет)' },
            { id: 'birthday_room', label: 'Комната для праздника', tooltip: 'Отдельное помещение для празднования дня рождения' },
            { id: 'cafe_onsite', label: 'Кафе на территории', tooltip: 'Кафе или фудкорт в батутном центре' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== КАФЕ / РЕСТОРАН ====================
  if (venueType === 'cafe') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.cuisine_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип кухни
                  <HelpTooltip content="Основное направление кухни в вашем заведении" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Средний чек (₽)
                  <HelpTooltip content="Средний чек на одного человека" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
            { id: 'kids_menu', label: 'Детское меню', tooltip: 'Специальное меню для детей' },
            { id: 'kids_zone', label: 'Детская зона', tooltip: 'Игровая зона для детей в кафе' },
            { id: 'highchairs', label: 'Детские стульчики', tooltip: 'Высокие стульчики для малышей' },
            { id: 'animation', label: 'Аниматоры', tooltip: 'Возможность заказать аниматора' },
            { id: 'separate_room', label: 'Отдельный зал', tooltip: 'Можно забронировать отдельный зал' },
            { id: 'music_system', label: 'Музыкальная система', tooltip: 'Можно включить свою музыку' },
            { id: 'projector', label: 'Проектор/экран', tooltip: 'Для показа фото и видео' },
            { id: 'own_cake', label: 'Свой торт разрешен', tooltip: 'Можно принести свой торт' },
            { id: 'deposit_required', label: 'Требуется депозит', tooltip: 'Необходим депозит при бронировании' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ЛОФТ ====================
  if (venueType === 'loft') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.ceiling_height`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Высота потолков (м)
                  <HelpTooltip content="Высота потолков важна для оформления и шоу-программ" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Естественное освещение
                  <HelpTooltip content="Наличие окон и дневного света" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Стиль интерьера
                  <HelpTooltip content="Общий стиль оформления пространства" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
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
            { id: 'has_stage', label: 'Есть сцена', tooltip: 'Отдельная сцена для выступлений' },
            { id: 'sound_system', label: 'Звуковая система', tooltip: 'Профессиональная акустика' },
            { id: 'light_equipment', label: 'Световое оборудование', tooltip: 'Профессиональный свет' },
            { id: 'projector', label: 'Проектор', tooltip: 'Проектор и экран для презентаций' },
            { id: 'free_decoration', label: 'Свободное оформление', tooltip: 'Можно оформлять по своему желанию' },
            { id: 'catering_allowed', label: 'Свой кейтеринг', tooltip: 'Можно привести своего кейтера' },
            { id: 'kitchen_access', label: 'Доступ к кухне', tooltip: 'Есть кухня для подогрева еды' },
            { id: 'dressing_room', label: 'Гримерная', tooltip: 'Отдельная комната для переодевания' },
            { id: 'separate_entrance', label: 'Отдельный вход', tooltip: 'Собственный вход с улицы' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== БАНКЕТНЫЙ ЗАЛ ====================
  if (venueType === 'banquet_hall') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.table_arrangement`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Расстановка столов
                  <HelpTooltip content="Как расставлены столы в зале" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="banquet">Банкетная (длинные столы)</SelectItem>
                    <SelectItem value="round_tables">Круглые столы</SelectItem>
                    <SelectItem value="flexible">Гибкая (можно менять)</SelectItem>
                    <SelectItem value="buffet">Фуршет (стоя)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.cuisine_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип кухни
                  <HelpTooltip content="Кухня банкетного зала или кейтеринг" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="european">Европейская</SelectItem>
                    <SelectItem value="russian">Русская</SelectItem>
                    <SelectItem value="mixed">Смешанная</SelectItem>
                    <SelectItem value="custom">Индивидуальное меню</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'kids_menu', label: 'Детское меню', tooltip: 'Специальное детское меню' },
            { id: 'dance_floor', label: 'Танцпол', tooltip: 'Отдельная зона для танцев' },
            { id: 'stage', label: 'Сцена', tooltip: 'Сцена для выступлений и поздравлений' },
            { id: 'sound_system', label: 'Звуковая система', tooltip: 'Микрофоны и колонки' },
            { id: 'projector', label: 'Проектор', tooltip: 'Для показа фото и видео' },
            { id: 'decorations', label: 'Оформление включено', tooltip: 'Украшение зала входит в стоимость' },
            { id: 'own_cake', label: 'Свой торт разрешен', tooltip: 'Можно принести свой торт' },
            { id: 'deposit_required', label: 'Требуется депозит', tooltip: 'Необходим залог при бронировании' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== EVENT-СТУДИЯ / СТУДИЯ ПРАЗДНИКОВ ====================
  if (venueType === 'event_studio') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.program_theme`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тематика программ
                  <HelpTooltip content="Основная тематика ваших готовых программ" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="creative">Творческая</SelectItem>
                    <SelectItem value="scientific">Научная</SelectItem>
                    <SelectItem value="adventure">Приключенческая</SelectItem>
                    <SelectItem value="sports">Спортивная</SelectItem>
                    <SelectItem value="universal">Универсальная</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_groups`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возрастные группы
                  <HelpTooltip content="На какие возрасты рассчитаны программы" />
                </FormLabel>
                <FormControl>
                  <Input 
                    className="h-11 rounded-xl"
                    placeholder="3-7, 7-10, 10-14"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'ready_programs', label: 'Готовые программы', tooltip: 'Есть готовые сценарии праздников' },
            { id: 'custom_programs', label: 'Программы на заказ', tooltip: 'Разрабатываем индивидуальные программы' },
            { id: 'venue_rental', label: 'Аренда площадки', tooltip: 'Можно арендовать без программы' },
            { id: 'animator_included', label: 'Аниматор в стоимости', tooltip: 'Аниматор входит в пакет' },
            { id: 'decorations', label: 'Оформление', tooltip: 'Декор и украшение площадки' },
            { id: 'photo_zone', label: 'Фотозона', tooltip: 'Специальная зона для фото' },
            { id: 'catering', label: 'Кейтеринг', tooltip: 'Организация питания' },
            { id: 'equipment', label: 'Оборудование', tooltip: 'Звук, свет, проектор' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ДЕТСКИЙ РАЗВЛЕКАТЕЛЬНЫЙ ЦЕНТР ====================
  if (venueType === 'entertainment_center') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для посещения" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст до (лет)
                  <HelpTooltip content="Максимальный возраст посетителей" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Входной билет (₽)
                  <HelpTooltip content="Стоимость входного билета на 1 час" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
            { id: 'labyrinth', label: 'Лабиринт', tooltip: 'Многоуровневый игровой лабиринт' },
            { id: 'dry_pool', label: 'Сухой бассейн', tooltip: 'Бассейн с шариками' },
            { id: 'slides', label: 'Горки', tooltip: 'Детские горки' },
            { id: 'trampolines', label: 'Батутная зона', tooltip: 'Батуты' },
            { id: 'soft_modules', label: 'Мягкие модули', tooltip: 'Конструкторы из мягких блоков' },
            { id: 'attractions', label: 'Аттракционы', tooltip: 'Карусели, качели и др.' },
            { id: 'game_machines', label: 'Игровые автоматы', tooltip: 'Автоматы с играми' },
            { id: 'birthday_room', label: 'Комната для праздника', tooltip: 'Отдельная комната для празднования' },
            { id: 'cafe', label: 'Кафе', tooltip: 'Кафе на территории' },
            { id: 'animator', label: 'Аниматоры', tooltip: 'Услуги аниматоров' },
            { id: 'adult_supervision', label: 'Наблюдение за детьми', tooltip: 'Персонал следит за безопасностью' },
            { id: 'free_wifi', label: 'Wi-Fi для родителей', tooltip: 'Бесплатный Wi-Fi' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== КАРТИНГ ====================
  if (venueType === 'karting') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.track_length`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Длина трассы (м)
                  <HelpTooltip content="Общая протяженность гоночной трассы" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="200-500"
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
            name={`${prefix}.karts_count`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество картов
                  <HelpTooltip content="Сколько машин доступно одновременно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="5-15"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для катания" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="6-10"
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
            { id: 'kids_karts', label: 'Детские карты', tooltip: 'Специальные карты для детей' },
            { id: 'electric_karts', label: 'Электрокарты', tooltip: 'Экологичные электрические карты' },
            { id: 'indoor_track', label: 'Крытая трасса', tooltip: 'Картинг в помещении' },
            { id: 'outdoor_track', label: 'Открытая трасса', tooltip: 'Картинг на улице' },
            { id: 'timing_system', label: 'Система хронометража', tooltip: 'Электронный учет времени и места' },
            { id: 'spectator_area', label: 'Зона для зрителей', tooltip: 'Место для наблюдения за гонками' },
            { id: 'cafe', label: 'Кафе', tooltip: 'Кафе на территории' },
            { id: 'locker_room', label: 'Раздевалка', tooltip: 'Место для переодевания' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ЛАЗЕРТАГ / ПЕЙНТБОЛ ====================
  if (venueType === 'lasertag') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.arena_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип арены
                  <HelpTooltip content="Крытая или открытая площадка" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indoor">Крытая</SelectItem>
                    <SelectItem value="outdoor">Открытая</SelectItem>
                    <SelectItem value="both">Есть обе</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.max_players`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Макс. игроков
                  <HelpTooltip content="Максимальное количество игроков одновременно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="10-30"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для игры" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="6-8"
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
            { id: 'lasertag', label: 'Лазертаг', tooltip: 'Игра с лазерными автоматами' },
            { id: 'paintball', label: 'Пейнтбол', tooltip: 'Игра с маркерами и шариками с краской' },
            { id: 'airsoft', label: 'Страйкбол', tooltip: 'Игра с пневматическим оружием' },
            { id: 'scenarios', label: 'Сценарии игр', tooltip: 'Готовые сценарии и миссии' },
            { id: 'equipment_rental', label: 'Аренда снаряжения', tooltip: 'Полный комплект снаряжения' },
            { id: 'instructor', label: 'Инструктор', tooltip: 'Профессиональный инструктор' },
            { id: 'locker_room', label: 'Раздевалка', tooltip: 'Место для переодевания' },
            { id: 'cafe', label: 'Кафе/зона отдыха', tooltip: 'Место для отдыха после игры' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== СКАЛОДРОМ / ВЕРЕВОЧНЫЙ ПАРК ====================
  if (venueType === 'climbing_park') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.wall_height`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Высота стены (м)
                  <HelpTooltip content="Максимальная высота для скалолазания" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-xl"
                    placeholder="5-15"
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
            name={`${prefix}.routes_count`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество трасс
                  <HelpTooltip content="Количество маршрутов разной сложности" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для прохождения трасс" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="4-6"
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
            { id: 'climbing_wall', label: 'Скалодром', tooltip: 'Стена для скалолазания' },
            { id: 'rope_park', label: 'Веревочный парк', tooltip: 'Трассы на высоте с препятствиями' },
            { id: 'kids_routes', label: 'Детские трассы', tooltip: 'Специальные маршруты для детей' },
            { id: 'easy_routes', label: 'Легкие маршруты', tooltip: 'Трассы для начинающих' },
            { id: 'hard_routes', label: 'Сложные маршруты', tooltip: 'Трассы для опытных' },
            { id: 'equipment_rental', label: 'Аренда снаряжения', tooltip: 'Страховка, каска, обувь' },
            { id: 'instructor', label: 'Инструктор', tooltip: 'Обучение и страховка' },
            { id: 'photo_service', label: 'Фотосъемка', tooltip: 'Профессиональная съемка на трассе' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== БОУЛИНГ / БИЛЬЯРД ====================
  if (venueType === 'bowling') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.bowling_lanes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество дорожек боулинга
                  <HelpTooltip content="Число боулинг-дорожек" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="2-10"
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
            name={`${prefix}.billiard_tables`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество бильярдных столов
                  <HelpTooltip content="Число бильярдных столов" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="0-5"
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
            { id: 'kids_balls', label: 'Детские шары', tooltip: 'Облегченные шары для детей' },
            { id: 'bumpers', label: 'Бортики', tooltip: 'Защитные бортики на дорожках' },
            { id: 'shoe_rental', label: 'Прокат обуви', tooltip: 'Специальная обувь для боулинга' },
            { id: 'cafe', label: 'Кафе', tooltip: 'Кафе на территории' },
            { id: 'music', label: 'Музыка', tooltip: 'Можно включить свою музыку' },
            { id: 'karaoke', label: 'Караоке', tooltip: 'Караоке-система' },
            { id: 'vip_zone', label: 'VIP-зона', tooltip: 'Отдельная приватная зона' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== АКВАПАРК / БАССЕЙН ====================
  if (venueType === 'water_park') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.pool_depth_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Глубина бассейна от (м)
                  <HelpTooltip content="Минимальная глубина бассейна" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-xl"
                    placeholder="0.5"
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
            name={`${prefix}.pool_depth_max`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Глубина бассейна до (м)
                  <HelpTooltip content="Максимальная глубина бассейна" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-xl"
                    placeholder="2.0"
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
            name={`${prefix}.water_temp`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Температура воды (°C)
                  <HelpTooltip content="Средняя температура воды в бассейне" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="28-32"
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
            { id: 'kids_pool', label: 'Детский бассейн', tooltip: 'Отдельный мелкий бассейн для малышей' },
            { id: 'water_slides', label: 'Водные горки', tooltip: 'Горки разной сложности' },
            { id: 'wave_pool', label: 'Бассейн с волнами', tooltip: 'Искусственные волны' },
            { id: 'jacuzzi', label: 'Джакузи', tooltip: 'Гидромассажная ванна' },
            { id: 'sauna', label: 'Сауна', tooltip: 'Сауна или баня' },
            { id: 'locker_room', label: 'Раздевалка', tooltip: 'Раздевалки и душевые' },
            { id: 'cafe', label: 'Кафе', tooltip: 'Кафе на территории' },
            { id: 'party_room', label: 'Банкетный зал', tooltip: 'Зал для празднования' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== КВЕСТ-КОМНАТА ====================
  if (venueType === 'quest_room') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.max_players`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Макс. игроков
                  <HelpTooltip content="Максимальное количество игроков в команде" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="2-8"
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
            name={`${prefix}.difficulty_level`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Уровень сложности
                  <HelpTooltip content="Сложность головоломок и загадок" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Легкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="hard">Сложный</SelectItem>
                    <SelectItem value="various">Разный</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Рекомендуемый минимальный возраст" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="8-12"
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
            { id: 'escape_room', label: 'Escape room', tooltip: 'Классический квест на выход из комнаты' },
            { id: 'horror', label: 'Хоррор', tooltip: 'Квест с элементами ужасов' },
            { id: 'adventure', label: 'Приключенческий', tooltip: 'Приключенческий сюжет' },
            { id: 'detective', label: 'Детективный', tooltip: 'Расследование и поиск улик' },
            { id: 'family_friendly', label: 'Для всей семьи', tooltip: 'Подходит для детей и взрослых' },
            { id: 'actor_involved', label: 'С актерами', tooltip: 'Участвуют живые актеры' },
            { id: 'multiple_rooms', label: 'Несколько комнат', tooltip: 'Квест из нескольких помещений' },
            { id: 'photo_service', label: 'Фотосъемка', tooltip: 'Фото в процессе игры' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== VR-АРЕНА ====================
  if (venueType === 'vr_arena') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.vr_headsets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество VR-шлемов
                  <HelpTooltip content="Сколько игроков могут играть одновременно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="2-10"
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
            name={`${prefix}.arena_size`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Размер арены (м²)
                  <HelpTooltip content="Площадь игровой зоны для VR" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="50-200"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для VR" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="8-10"
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
            { id: 'free_roam', label: 'Free Roam VR', tooltip: 'Свободное передвижение по большой арене' },
            { id: 'stationary_vr', label: 'Стационарный VR', tooltip: 'VR на месте (сидя/стоя)' },
            { id: 'multiplayer', label: 'Мультиплеер', tooltip: 'Игра с друзьями в одном мире' },
            { id: 'kids_games', label: 'Детские игры', tooltip: 'Игры специально для детей' },
            { id: 'shooters', label: 'Шутеры', tooltip: 'Стрелялки и экшн-игры' },
            { id: 'quests', label: 'Квесты', tooltip: 'Приключенческие квесты' },
            { id: 'simulators', label: 'Симуляторы', tooltip: 'Симуляторы вождения, полетов и др.' },
            { id: 'cafe', label: 'Кафе/зона отдыха', tooltip: 'Место для отдыха между сеансами' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ХУДОЖЕСТВЕННАЯ СТУДИЯ ====================
  if (venueType === 'art_studio') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.studio_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Специализация студии
                  <HelpTooltip content="Основное направление творчества" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="painting">Живопись</SelectItem>
                    <SelectItem value="drawing">Рисование</SelectItem>
                    <SelectItem value="watercolor">Акварель</SelectItem>
                    <SelectItem value="mixed">Смешанные техники</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_groups`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возрастные группы
                  <HelpTooltip content="Для каких возрастов подходит" />
                </FormLabel>
                <FormControl>
                  <Input 
                    className="h-11 rounded-xl"
                    placeholder="3-7, 7-12, 12+"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'materials_included', label: 'Материалы в стоимости', tooltip: 'Краски, кисти, холсты включены' },
            { id: 'master_class', label: 'Мастер-классы', tooltip: 'Проводим мастер-классы' },
            { id: 'party_programs', label: 'Программы для ДР', tooltip: 'Специальные программы для дней рождения' },
            { id: 'instructor', label: 'Преподаватель', tooltip: 'Профессиональный художник-преподаватель' },
            { id: 'easels', label: 'Мольберты', tooltip: 'Мольберты для каждого участника' },
            { id: 'aprons', label: 'Фартуки', tooltip: 'Защитные фартуки' },
            { id: 'take_home', label: 'Работы с собой', tooltip: 'Готовые работы можно забрать' },
            { id: 'photo_zone', label: 'Фотозона', tooltip: 'Зона для фото с работами' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ГОНЧАРНАЯ МАСТЕРСКАЯ ====================
  if (venueType === 'pottery_workshop') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.pottery_wheels`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество гончарных кругов
                  <HelpTooltip content="Сколько человек могут работать одновременно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="3-10"
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
            name={`${prefix}.kiln_available`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Наличие печи для обжига
                  <HelpTooltip content="Есть ли печь для обжига готовых изделий" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Да, есть</SelectItem>
                    <SelectItem value="no">Нет</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="С какого возраста можно посещать" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="5-7"
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
            { id: 'pottery_wheel', label: 'Работа на круге', tooltip: 'Лепка на гончарном круге' },
            { id: 'hand_modeling', label: 'Ручная лепка', tooltip: 'Лепка руками без круга' },
            { id: 'painting', label: 'Роспись изделий', tooltip: 'Роспись готовой керамики' },
            { id: 'glazing', label: 'Глазурование', tooltip: 'Покрытие глазурью' },
            { id: 'firing_included', label: 'Обжиг в стоимости', tooltip: 'Обжиг включен в цену' },
            { id: 'materials_included', label: 'Глина в стоимости', tooltip: 'Глина и инструменты включены' },
            { id: 'take_home', label: 'Изделия с собой', tooltip: 'Готовые работы забираете домой' },
            { id: 'aprons', label: 'Фартуки', tooltip: 'Защитные фартуки предоставляются' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== КУЛИНАРНАЯ СТУДИЯ ====================
  if (venueType === 'culinary_studio') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.workstations`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество рабочих мест
                  <HelpTooltip content="Сколько детей могут готовить одновременно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="5-12"
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
            name={`${prefix}.cuisine_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Кухня
                  <HelpTooltip content="Какую кухню готовите на МК" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="desserts">Десерты и выпечка</SelectItem>
                    <SelectItem value="pizza">Пицца и паста</SelectItem>
                    <SelectItem value="sushi">Суши</SelectItem>
                    <SelectItem value="international">Международная</SelectItem>
                    <SelectItem value="various">Различная</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="С какого возраста можно участвовать" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="4-6"
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
            { id: 'ingredients_included', label: 'Продукты в стоимости', tooltip: 'Все ингредиенты включены' },
            { id: 'chef_instructor', label: 'Шеф-повар', tooltip: 'Профессиональный шеф ведет МК' },
            { id: 'aprons', label: 'Фартуки и колпаки', tooltip: 'Униформа для юных поваров' },
            { id: 'take_home_food', label: 'Еда с собой', tooltip: 'Приготовленное можно забрать' },
            { id: 'eat_onsite', label: 'Дегустация на месте', tooltip: 'Можно съесть приготовленное' },
            { id: 'party_programs', label: 'Программы для ДР', tooltip: 'Специальные праздничные программы' },
            { id: 'photo_in_chef_hat', label: 'Фото в колпаке', tooltip: 'Фотосессия в форме повара' },
            { id: 'certificates', label: 'Сертификат юного повара', tooltip: 'Памятный сертификат' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== СТОЛЯРНАЯ МАСТЕРСКАЯ ====================
  if (venueType === 'woodworking_workshop') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.workbenches`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество верстаков
                  <HelpTooltip content="Рабочих мест для работы с деревом" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="3-8"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для безопасной работы" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="7-10"
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
            { id: 'hand_tools', label: 'Ручные инструменты', tooltip: 'Работа с безопасными ручными инструментами' },
            { id: 'power_tools', label: 'Электроинструменты', tooltip: 'Работа с электроинструментами под надзором' },
            { id: 'woodcarving', label: 'Резьба по дереву', tooltip: 'Обучение резьбе' },
            { id: 'materials_included', label: 'Материалы в стоимости', tooltip: 'Дерево и расходники включены' },
            { id: 'instructor', label: 'Мастер-инструктор', tooltip: 'Опытный столяр-преподаватель' },
            { id: 'take_home', label: 'Изделия с собой', tooltip: 'Готовые работы забираете' },
            { id: 'safety_equipment', label: 'Защита', tooltip: 'Очки, перчатки, фартуки' },
            { id: 'party_programs', label: 'Программы для ДР', tooltip: 'Специальные праздничные мастер-классы' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ШВЕЙНАЯ МАСТЕРСКАЯ ====================
  if (venueType === 'sewing_workshop') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.sewing_machines`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество швейных машин
                  <HelpTooltip content="Рабочих мест с машинками" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="4-10"
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="Минимальный возраст для работы на машинке" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="7-10"
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
            { id: 'machine_sewing', label: 'Шитье на машинке', tooltip: 'Работа на швейной машине' },
            { id: 'hand_sewing', label: 'Ручное шитье', tooltip: 'Шитье вручную' },
            { id: 'embroidery', label: 'Вышивка', tooltip: 'Вышивание' },
            { id: 'knitting', label: 'Вязание', tooltip: 'Вязание спицами/крючком' },
            { id: 'toy_making', label: 'Изготовление игрушек', tooltip: 'Шьем мягкие игрушки' },
            { id: 'materials_included', label: 'Ткани в стоимости', tooltip: 'Ткани и нитки включены' },
            { id: 'take_home', label: 'Изделия с собой', tooltip: 'Готовые работы забираете' },
            { id: 'party_programs', label: 'Программы для ДР', tooltip: 'Специальные праздничные МК' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== КОННЫЙ КЛУБ ====================
  if (venueType === 'horse_club') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name={`${prefix}.horses_count`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество лошадей/пони
                  <HelpTooltip content="Сколько лошадей и пони доступно" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="3-15"
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
            name={`${prefix}.arena_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип манежа
                  <HelpTooltip content="Крытый или открытый манеж для катания" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="indoor">Крытый манеж</SelectItem>
                    <SelectItem value="outdoor">Открытый манеж</SelectItem>
                    <SelectItem value="both">Оба варианта</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.age_limit_min`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="С какого возраста можно кататься" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="3-5"
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
            { id: 'ponies', label: 'Пони для малышей', tooltip: 'Маленькие пони для детей до 7 лет' },
            { id: 'horses', label: 'Лошади', tooltip: 'Полноразмерные лошади' },
            { id: 'riding_lessons', label: 'Обучение верховой езде', tooltip: 'Уроки верховой езды' },
            { id: 'trail_rides', label: 'Прогулки по маршруту', tooltip: 'Конные прогулки по территории' },
            { id: 'instructor', label: 'Инструктор', tooltip: 'Профессиональный тренер' },
            { id: 'equipment_rental', label: 'Аренда экипировки', tooltip: 'Шлемы и защита' },
            { id: 'feeding', label: 'Кормление животных', tooltip: 'Можно покормить лошадей' },
            { id: 'photo_service', label: 'Фотосессия', tooltip: 'Фото с лошадями' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ФЕРМА / ЭКОФЕРМА ====================
  if (venueType === 'farm') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.animals_types`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Виды животных
                  <HelpTooltip content="Какие животные есть на ферме" />
                </FormLabel>
                <FormControl>
                  <Input 
                    className="h-11 rounded-xl"
                    placeholder="Козы, кролики, куры, пони..."
                    {...field}
                    value={field.value ?? ''}
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
                <FormLabel className="text-sm flex items-center gap-2">
                  Возраст от (лет)
                  <HelpTooltip content="С какого возраста можно посещать" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="0-3"
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
            { id: 'animal_feeding', label: 'Кормление животных', tooltip: 'Можно покормить животных' },
            { id: 'petting_zoo', label: 'Контактный зоопарк', tooltip: 'Можно погладить животных' },
            { id: 'pony_rides', label: 'Катание на пони', tooltip: 'Прогулки верхом на пони' },
            { id: 'farm_tours', label: 'Экскурсии по ферме', tooltip: 'Познавательная экскурсия' },
            { id: 'workshops', label: 'Мастер-классы', tooltip: 'Творческие и познавательные МК' },
            { id: 'picnic_area', label: 'Зона для пикника', tooltip: 'Место для отдыха и еды' },
            { id: 'playground', label: 'Детская площадка', tooltip: 'Игровая площадка' },
            { id: 'eco_products', label: 'Эко-продукты', tooltip: 'Можно купить фермерские продукты' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== БАЗА ОТДЫХА / ЗАГОРОДНЫЙ КЛУБ ====================
  if (venueType === 'recreation_base') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.territory_size`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Площадь территории (га)
                  <HelpTooltip content="Размер всей территории базы отдыха" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.1"
                    className="h-11 rounded-xl"
                    placeholder="1-10"
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
            name={`${prefix}.accommodation_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип размещения
                  <HelpTooltip content="Варианты размещения гостей" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cottages">Коттеджи</SelectItem>
                    <SelectItem value="houses">Дома</SelectItem>
                    <SelectItem value="hotel">Гостиничные номера</SelectItem>
                    <SelectItem value="no_accommodation">Без размещения</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'banquet_hall', label: 'Банкетный зал', tooltip: 'Зал для празднования' },
            { id: 'outdoor_area', label: 'Открытая площадка', tooltip: 'Зона на свежем воздухе' },
            { id: 'gazebo', label: 'Беседки', tooltip: 'Крытые беседки' },
            { id: 'bbq', label: 'Мангальная зона', tooltip: 'Место для барбекю' },
            { id: 'playground', label: 'Детская площадка', tooltip: 'Игровая площадка' },
            { id: 'sports_facilities', label: 'Спортплощадки', tooltip: 'Волейбол, футбол и др.' },
            { id: 'pond', label: 'Водоем', tooltip: 'Пруд или озеро' },
            { id: 'parking', label: 'Парковка', tooltip: 'Бесплатная парковка' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ГЛЭМПИНГ ====================
  if (venueType === 'glamping') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.accommodation_units`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Количество домиков/шатров
                  <HelpTooltip content="Число мест для размещения" />
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    className="h-11 rounded-xl"
                    placeholder="3-15"
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
            name={`${prefix}.glamping_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип глэмпинга
                  <HelpTooltip content="Вид размещения" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="domes">Купольные шатры</SelectItem>
                    <SelectItem value="treehouses">Домики на деревьях</SelectItem>
                    <SelectItem value="cabins">Эко-домики</SelectItem>
                    <SelectItem value="yurts">Юрты</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'heating', label: 'Отопление', tooltip: 'Возможность обогрева в холодное время' },
            { id: 'electricity', label: 'Электричество', tooltip: 'Есть розетки и освещение' },
            { id: 'private_bathroom', label: 'Санузел', tooltip: 'Индивидуальный санузел' },
            { id: 'kitchen', label: 'Кухня/чайник', tooltip: 'Возможность приготовить чай/кофе' },
            { id: 'bbq_area', label: 'Место для барбекю', tooltip: 'Мангал или гриль' },
            { id: 'campfire', label: 'Костровое место', tooltip: 'Можно развести костер' },
            { id: 'playground', label: 'Детская площадка', tooltip: 'Игровая зона' },
            { id: 'event_area', label: 'Площадка для мероприятий', tooltip: 'Место для праздника' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== ОТКРЫТАЯ ПЛОЩАДКА ====================
  if (venueType === 'outdoor') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.location_type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Тип локации
                  <HelpTooltip content="Где находится площадка" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="park">Парк</SelectItem>
                    <SelectItem value="forest">Лес/поляна</SelectItem>
                    <SelectItem value="beach">Пляж</SelectItem>
                    <SelectItem value="rooftop">Крыша/терраса</SelectItem>
                    <SelectItem value="garden">Сад</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.covered_area`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center gap-2">
                  Наличие навеса
                  <HelpTooltip content="Есть ли защита от дождя/солнца" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Есть навес</SelectItem>
                    <SelectItem value="partial">Частично</SelectItem>
                    <SelectItem value="no">Полностью открыта</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: 'tent_available', label: 'Возможность установки шатра', tooltip: 'Можно поставить шатер' },
            { id: 'tables_chairs', label: 'Столы и стулья', tooltip: 'Мебель предоставляется' },
            { id: 'electricity', label: 'Электричество', tooltip: 'Есть доступ к розеткам' },
            { id: 'water_access', label: 'Вода', tooltip: 'Доступ к воде' },
            { id: 'bbq', label: 'Место для барбекю', tooltip: 'Можно жарить шашлык' },
            { id: 'playground', label: 'Детская площадка рядом', tooltip: 'Игровая площадка поблизости' },
            { id: 'parking', label: 'Парковка', tooltip: 'Есть место для парковки' },
            { id: 'restrooms', label: 'Санузлы', tooltip: 'Туалеты на территории' },
          ].map((item) => (
            <FormField
              key={item.id}
              control={control}
              name={`${prefix}.${item.id}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <SimpleCheckbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                  <div className="flex items-center gap-1.5">
                    <FormLabel className="text-sm font-medium cursor-pointer">{item.label}</FormLabel>
                    <HelpTooltip content={item.tooltip} />
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ==================== Для всех остальных типов (OTHER) - заглушка ====================
  return (
    <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <p className="text-sm text-gray-500 text-center">
        Для этого типа площадки пока нет специфичных характеристик. Используйте блок "Удобства и оборудование" ниже.
      </p>
    </div>
  )
}

