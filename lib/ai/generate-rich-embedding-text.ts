/**
 * Генерация "богатого" текста для создания embeddings из структурированных данных профиля
 * 
 * Эта функция преобразует всю структурированную информацию профиля
 * в подробный текст, который затем используется для создания векторного embedding.
 * 
 * Обновлено: поддержка 30+ типов площадок на основе полного анализа рынка
 */

import { Database } from '@/types/supabase'
import { getVenueTypeName } from '@/lib/constants/venue-types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileCategory = Profile['category']

interface ProfileWithDetails extends Omit<Profile, 'details'> {
  details: Record<string, any>
}

/**
 * Маппинг категорий для красивого текста
 */
const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Площадка',
  animator: 'Аниматор',
  show: 'Шоу-программа',
  agency: 'Агентство',
  quest: 'Квест',
  master_class: 'Мастер-класс',
  photographer: 'Фотограф/Видеограф',
  dj_musician: 'DJ / Музыкант',
  decorator: 'Декоратор',
  catering: 'Кейтеринг',
  confectionery: 'Кондитерская',
  host: 'Ведущий',
  transport: 'Транспорт',
}

/**
 * Генерирует детальный текст для embedding на основе структурированных данных профиля
 */
export function generateRichEmbeddingText(profile: ProfileWithDetails): string {
  const parts: string[] = []
  
  // 1. БАЗОВАЯ ИНФОРМАЦИЯ
  parts.push(profile.display_name || '')
  
  if (profile.bio) {
    parts.push(`Описание: ${profile.bio}`)
  }
  
  if (profile.description) {
    parts.push(profile.description)
  }
  
  // 2. КАТЕГОРИЯ
  const categoryLabel = CATEGORY_LABELS[profile.category] || profile.category
  parts.push(`Категория: ${categoryLabel}`)
  
  // 3. ЛОКАЦИЯ
  parts.push(`Город: ${profile.city}`)
  if (profile.address) {
    parts.push(`Адрес: ${profile.address}`)
  }
  
  // 4. СПЕЦИФИЧНЫЕ ХАРАКТЕРИСТИКИ ПО КАТЕГОРИИ
  const categorySpecificText = generateCategorySpecificText(profile.category, profile.details)
  if (categorySpecificText) {
    parts.push(categorySpecificText)
  }
  
  // 5. ТЕГИ
  if (profile.tags && profile.tags.length > 0) {
    parts.push(`Теги: ${profile.tags.join(', ')}`)
  }
  
  // 6. ЦЕНОВОЙ ДИАПАЗОН
  if (profile.price_range) {
    parts.push(`Ценовой диапазон: ${profile.price_range}`)
  }
  
  return parts.filter(Boolean).join('. ').trim()
}

/**
 * Генерирует категориально-специфичный текст
 */
function generateCategorySpecificText(
  category: ProfileCategory,
  details: Record<string, any>
): string {
  const parts: string[] = []
  
  switch (category) {
    case 'venue':
      parts.push(...generateVenueText(details))
      break
      
    case 'animator':
      parts.push(...generateAnimatorText(details))
      break
      
    case 'show':
      parts.push(...generateShowText(details))
      break
      
    case 'quest':
      parts.push(...generateQuestText(details))
      break
      
    case 'master_class':
      parts.push(...generateMasterClassText(details))
      break
      
    case 'photographer':
      parts.push(...generatePhotographerText(details))
      break
      
    case 'dj_musician':
      parts.push(...generateDJMusicianText(details))
      break
      
    case 'decorator':
      parts.push(...generateDecoratorText(details))
      break
      
    case 'catering':
      parts.push(...generateCateringText(details))
      break
      
    case 'confectionery':
      parts.push(...generateConfectioneryText(details))
      break
      
    case 'host':
      parts.push(...generateHostText(details))
      break
      
    case 'transport':
      parts.push(...generateTransportText(details))
      break
  }
  
  return parts.filter(Boolean).join('. ')
}

/**
 * Генерация текста для площадок (VENUE) - расширенная версия
 */
function generateVenueText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  // Подтип площадки
  if (details.subtype) {
    const venueTypeLabel = getVenueTypeName(details.subtype)
    if (venueTypeLabel) {
      parts.push(`Тип площадки: ${venueTypeLabel}`)
    }
  }
  
  // Базовые параметры
  if (details.capacity_min && details.capacity_max) {
    parts.push(`Вместимость: от ${details.capacity_min} до ${details.capacity_max} человек`)
  } else if (details.capacity_max) {
    parts.push(`Вместимость: до ${details.capacity_max} человек`)
  }
  
  if (details.area_sqm) {
    parts.push(`Площадь: ${details.area_sqm} м²`)
  }
  
  // Возрастные группы
  if (details.age_groups && Array.isArray(details.age_groups)) {
    parts.push(`Возрастные группы: ${details.age_groups.join(', ')}`)
  }
  
  // Кухня
  if (details.kitchen) {
    const kitchenType = details.kitchen_type ? ` (${details.kitchen_type})` : ''
    parts.push(`Кухня${kitchenType}`)
  }
  
  if (details.cafe) {
    parts.push('Кафе на территории')
  }
  
  // Парковка
  if (details.parking) {
    const spots = details.parking_spots ? ` (${details.parking_spots} мест)` : ''
    parts.push(`Парковка${spots}`)
  }
  
  // Оборудование
  const equipment: string[] = []
  if (details.projector) equipment.push('проектор')
  if (details.sound_system) equipment.push('звуковая система')
  if (details.microphone) equipment.push('микрофон')
  if (details.lighting) equipment.push('освещение')
  if (details.wifi) equipment.push('Wi-Fi')
  
  if (equipment.length > 0) {
    parts.push(`Оборудование: ${equipment.join(', ')}`)
  }
  
  // Специфика подтипа (батутный центр, картинг и т.д.)
  parts.push(...generateVenueSubtypeSpecificText(details))
  
  return parts
}

/**
 * Генерация специфичного текста для подтипов площадок
 */
function generateVenueSubtypeSpecificText(details: Record<string, any>): string[] {
  const parts: string[] = []
  const subtype = details.subtype
  
  switch (subtype) {
    case 'trampoline_park':
      if (details.trampoline_zones_count) parts.push(`Батутных зон: ${details.trampoline_zones_count}`)
      if (details.foam_pit) parts.push('Поролоновая яма')
      if (details.climbing_wall) parts.push('Скалодром')
      if (details.ninja_course) parts.push('Ниндзя-курс')
      if (details.coaches_available) parts.push('Инструкторы')
      break
      
    case 'karting':
      if (details.track_type) parts.push(`Трасса: ${details.track_type}`)
      if (details.track_length) parts.push(`Длина трассы: ${details.track_length} м`)
      if (details.kart_types && Array.isArray(details.kart_types)) {
        parts.push(`Типы картов: ${details.kart_types.join(', ')}`)
      }
      if (details.championship_available) parts.push('Чемпионаты')
      break
      
    case 'water_park':
      if (details.facility_type) parts.push(`Тип: ${details.facility_type}`)
      if (details.slides?.count) parts.push(`Горок: ${details.slides.count}`)
      if (details.wave_pool) parts.push('Бассейн с волнами')
      if (details.lazy_river) parts.push('Ленивая река')
      if (details.lifeguards) parts.push('Спасатели')
      break
      
    case 'museum':
      if (details.museum_type) parts.push(`Тип музея: ${details.museum_type}`)
      if (details.interactive_exhibits) parts.push('Интерактивные экспонаты')
      if (details.programs?.guided_tours) parts.push('Экскурсии')
      if (details.programs?.master_classes) parts.push('Мастер-классы')
      if (details.programs?.quests) parts.push('Квесты')
      break
      
    case 'planetarium':
      if (details.dome_size) parts.push(`Купол: ${details.dome_size} м`)
      if (details.shows?.kids_shows) parts.push('Детские программы')
      if (details.telescope_observation) parts.push('Наблюдения в телескоп')
      break
      
    case 'theater':
      if (details.theater_type) parts.push(`Тип театра: ${details.theater_type}`)
      if (details.hall_capacity) parts.push(`Зал: ${details.hall_capacity} мест`)
      if (details.private_shows) parts.push('Частные показы')
      if (details.backstage_tour) parts.push('Экскурсии за кулисы')
      break
      
    case 'culinary_studio':
      if (details.studio_type) parts.push(`Направление: ${details.studio_type}`)
      if (details.cuisine_types && Array.isArray(details.cuisine_types)) {
        parts.push(`Кухни: ${details.cuisine_types.join(', ')}`)
      }
      if (details.workstations) parts.push(`Рабочих мест: ${details.workstations}`)
      if (details.ingredients_included) parts.push('Продукты включены')
      if (details.chef_supervision) parts.push('Шеф-повар')
      break
      
    case 'zoo':
      if (details.zoo_type) parts.push(`Тип: ${details.zoo_type}`)
      if (details.animals_count) parts.push(`Животных: ${details.animals_count}`)
      if (details.interaction?.contact_allowed) parts.push('Контактная зона')
      if (details.interaction?.feeding_allowed) parts.push('Можно кормить')
      if (details.interaction?.pony_rides) parts.push('Катание на пони')
      break
      
    case 'aquarium':
      if (details.facility_type) parts.push(`Тип: ${details.facility_type}`)
      if (details.species_count) parts.push(`Видов: ${details.species_count}`)
      if (details.exhibitions?.sharks) parts.push('Акулы')
      if (details.exhibitions?.touch_pool) parts.push('Контактный бассейн')
      if (details.exhibitions?.dolphinarium) parts.push('Дельфинарий')
      if (details.underwater_tunnel) parts.push('Подводный туннель')
      break
      
    case 'horse_club':
      if (details.horses_count) parts.push(`Лошадей: ${details.horses_count}`)
      if (details.ponies_count) parts.push(`Пони: ${details.ponies_count}`)
      if (details.programs?.pony_rides) parts.push('Катание на пони')
      if (details.programs?.horse_riding_lessons) parts.push('Уроки верховой езды')
      if (details.programs?.stable_tour) parts.push('Экскурсия по конюшне')
      break
      
    case 'vr_arena':
      if (details.vr_sets_count) parts.push(`VR-шлемов: ${details.vr_sets_count}`)
      if (details.games_count) parts.push(`Игр: ${details.games_count}`)
      if (details.multiplayer_support) parts.push('Мультиплеер')
      if (details.game_categories && Array.isArray(details.game_categories)) {
        parts.push(`Категории: ${details.game_categories.join(', ')}`)
      }
      break
      
    case 'quest_room':
      if (details.quest_type) parts.push(`Тип: ${details.quest_type}`)
      if (details.themes && Array.isArray(details.themes)) {
        parts.push(`Темы: ${details.themes.join(', ')}`)
      }
      if (details.difficulty) parts.push(`Сложность: ${details.difficulty}`)
      if (details.team_size_optimal) parts.push(`Команда: ${details.team_size_optimal} чел`)
      if (details.scary_level) parts.push(`Уровень страха: ${details.scary_level}/5`)
      break
      
    case 'cinema':
      if (details.hall_capacity) parts.push(`Мест: ${details.hall_capacity}`)
      if (details.viewing_options?.private_screening) parts.push('Частный показ')
      if (details.viewing_options?.film_choice) parts.push('Выбор фильма')
      if (details.seating_type) parts.push(`Места: ${details.seating_type}`)
      break
  }
  
  return parts
}

/**
 * Генерация текста для аниматоров
 */
function generateAnimatorText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  if (details.character_name) {
    parts.push(`Персонаж: ${details.character_name}`)
  }
  
  if (details.age_range) {
    parts.push(`Возраст детей: ${details.age_range}`)
  }
  
  if (details.program_type) {
    parts.push(`Программа: ${details.program_type}`)
  }
  
  if (details.experience_years) {
    parts.push(`Опыт: ${details.experience_years} лет`)
  }
  
  const services: string[] = []
  if (details.services?.face_painting) services.push('аквагрим')
  if (details.services?.balloon_twisting) services.push('твистинг')
  if (details.services?.magic_tricks) services.push('фокусы')
  if (services.length > 0) {
    parts.push(`Услуги: ${services.join(', ')}`)
  }
  
  return parts
}

/**
 * Генерация текста для шоу
 */
function generateShowText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  if (details.show_type) {
    const showTypes: Record<string, string> = {
      bubbles: 'Мыльные пузыри',
      science: 'Научное шоу',
      magic: 'Фокусы',
      animals: 'Шоу животных',
      cryo: 'Криошоу',
      light: 'Световое шоу',
      foam: 'Пенная вечеринка',
    }
    parts.push(`Тип шоу: ${showTypes[details.show_type] || details.show_type}`)
  }
  
  if (details.interactive) {
    parts.push('Интерактивное')
  }
  
  if (details.duration) {
    parts.push(`Длительность: ${details.duration} минут`)
  }
  
  if (details.effects) {
    parts.push(`Эффекты: ${details.effects}`)
  }
  
  return parts
}

/**
 * Генерация текста для квестов
 */
function generateQuestText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  if (details.quest_type === 'location') {
    parts.push('Квест на локации')
  } else if (details.quest_type === 'mobile') {
    parts.push('Выездной квест')
  }
  
  if (details.difficulty) {
    parts.push(`Сложность: ${details.difficulty}`)
  }
  
  if (details.duration_minutes) {
    parts.push(`Длительность: ${details.duration_minutes} минут`)
  }
  
  return parts
}

/**
 * Генерация текста для мастер-классов
 */
function generateMasterClassText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const mkTypes: Record<string, string> = {
    creative: 'Творческий',
    culinary: 'Кулинарный',
    science: 'Научный',
    craft: 'Ремесленный',
  }
  
  if (details.mk_type) {
    parts.push(`Тип: ${mkTypes[details.mk_type] || details.mk_type}`)
  }
  
  if (details.materials && Array.isArray(details.materials)) {
    parts.push(`Материалы: ${details.materials.join(', ')}`)
  }
  
  if (details.age_from && details.age_to) {
    parts.push(`Возраст: ${details.age_from}-${details.age_to} лет`)
  }
  
  return parts
}

/**
 * Генерация текста для фотографов
 */
function generatePhotographerText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const photoTypes: Record<string, string> = {
    photo_only: 'Фотография',
    video_only: 'Видеосъемка',
    photo_video: 'Фото + видео',
  }
  
  if (details.photo_type) {
    parts.push(photoTypes[details.photo_type] || details.photo_type)
  }
  
  if (details.shooting_style) {
    parts.push(`Стиль: ${details.shooting_style}`)
  }
  
  if (details.has_drone) {
    parts.push('Аэросъемка с дрона')
  }
  
  return parts
}

/**
 * Генерация текста для DJ/музыкантов
 */
function generateDJMusicianText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  if (details.subtype === 'dj') {
    parts.push('DJ диджей')
  } else if (details.subtype === 'musician') {
    parts.push('Живая музыка')
    if (details.instruments && Array.isArray(details.instruments)) {
      parts.push(`Инструменты: ${details.instruments.join(', ')}`)
    }
  } else if (details.subtype === 'host_music') {
    parts.push('Ведущий с музыкой')
  }
  
  if (details.genres && Array.isArray(details.genres)) {
    parts.push(`Жанры: ${details.genres.join(', ')}`)
  }
  
  return parts
}

/**
 * Генерация текста для декораторов
 */
function generateDecoratorText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const decorTypes: Record<string, string> = {
    balloons: 'Воздушные шары',
    textile_flowers: 'Текстиль и цветы',
    full_decor: 'Полное оформление',
  }
  
  if (details.subtype) {
    parts.push(`Тип: ${decorTypes[details.subtype] || details.subtype}`)
  }
  
  if (details.themes && Array.isArray(details.themes)) {
    parts.push(`Темы: ${details.themes.join(', ')}`)
  }
  
  return parts
}

/**
 * Генерация текста для кейтеринга
 */
function generateCateringText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const cateringTypes: Record<string, string> = {
    kids_menu: 'Детское питание',
    buffet: 'Фуршет',
    banquet: 'Банкет',
    bbq: 'Барбекю',
  }
  
  if (details.subtype) {
    parts.push(`Тип: ${cateringTypes[details.subtype] || details.subtype}`)
  }
  
  return parts
}

/**
 * Генерация текста для кондитерских
 */
function generateConfectioneryText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const confectioneryTypes: Record<string, string> = {
    cakes: 'Торты на заказ',
    candy_bar: 'Сладкий стол',
    desserts: 'Десерты',
  }
  
  if (details.subtype) {
    parts.push(`Тип: ${confectioneryTypes[details.subtype] || details.subtype}`)
  }
  
  return parts
}

/**
 * Генерация текста для ведущих
 */
function generateHostText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const hostTypes: Record<string, string> = {
    kids: 'Детские мероприятия',
    family_corporate: 'Семейные/Корпоративные',
  }
  
  if (details.subtype) {
    parts.push(`Специализация: ${hostTypes[details.subtype] || details.subtype}`)
  }
  
  if (details.experience_years) {
    parts.push(`Опыт: ${details.experience_years} лет`)
  }
  
  return parts
}

/**
 * Генерация текста для транспорта
 */
function generateTransportText(details: Record<string, any>): string[] {
  const parts: string[] = []
  
  const transportTypes: Record<string, string> = {
    kids_transport: 'Детский транспорт',
    limousine: 'Лимузин',
    retro: 'Ретро-автомобиль',
    carriage: 'Карета',
  }
  
  if (details.subtype) {
    parts.push(`Тип: ${transportTypes[details.subtype] || details.subtype}`)
  }
  
  return parts
}

/**
 * Улучшенная версия: экспорт для использования в других местах
 */
export function createEmbeddingTextFromProfile(profile: ProfileWithDetails): string {
  return generateRichEmbeddingText(profile)
}
