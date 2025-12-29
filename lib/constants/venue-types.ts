/**
 * Единый справочник типов площадок для всего приложения
 * Используется везде: в формах, фильтрах, отображении профилей
 */

export interface VenueType {
  id: string
  name: string
  description?: string
  group: string
}

// Все типы площадок с единым названием
export const VENUE_TYPES: Record<string, VenueType> = {
  // Площадки под аренду
  cafe: {
    id: 'cafe',
    name: 'Кафе / Ресторан',
    description: 'Аренда зала для праздника',
    group: 'rental',
  },
  loft: {
    id: 'loft',
    name: 'Лофт',
    description: 'Стильное пространство для мероприятий',
    group: 'rental',
  },
  banquet_hall: {
    id: 'banquet_hall',
    name: 'Банкетный зал',
    description: 'Специализированный зал для банкетов',
    group: 'rental',
  },

  // Студии и центры
  event_studio: {
    id: 'event_studio',
    name: 'Event-студия / Студия праздников',
    description: 'Готовые программы или аренда',
    group: 'studios',
  },
  entertainment_center: {
    id: 'entertainment_center',
    name: 'Детский развлекательный центр',
    description: 'Билеты, игровые зоны, город профессий',
    group: 'studios',
  },

  // Активные развлечения
  trampoline_park: {
    id: 'trampoline_park',
    name: 'Батутный центр',
    description: 'Батуты, поролоновая яма',
    group: 'active',
  },
  karting: {
    id: 'karting',
    name: 'Картинг-центр',
    description: 'Гоночная трасса, карты',
    group: 'active',
  },
  lasertag: {
    id: 'lasertag',
    name: 'Лазертаг / Пейнтбол',
    description: 'Тактические игры',
    group: 'active',
  },
  climbing_park: {
    id: 'climbing_park',
    name: 'Скалодром / Веревочный парк',
    description: 'Высотные трассы',
    group: 'active',
  },
  bowling: {
    id: 'bowling',
    name: 'Боулинг / Бильярд',
    description: 'Дорожки, столы',
    group: 'active',
  },
  water_park: {
    id: 'water_park',
    name: 'Аквапарк / Бассейн',
    description: 'Водные горки, бассейны',
    group: 'active',
  },

  // Квесты и игры
  quest_room: {
    id: 'quest_room',
    name: 'Квест‑комната / квест‑локация',
    description: 'Эскейп‑румы, комнаты, локации с играми',
    group: 'quest',
  },
  vr_arena: {
    id: 'vr_arena',
    name: 'VR-арена',
    description: 'Большие залы с VR',
    group: 'quest',
  },

  // Творческие мастерские
  art_studio: {
    id: 'art_studio',
    name: 'Художественная студия',
    description: 'Рисование, живопись',
    group: 'creative',
  },
  pottery_workshop: {
    id: 'pottery_workshop',
    name: 'Гончарная мастерская',
    description: 'Лепка из глины',
    group: 'creative',
  },
  culinary_studio: {
    id: 'culinary_studio',
    name: 'Кулинарная студия',
    description: 'Приготовление блюд',
    group: 'creative',
  },
  woodworking_workshop: {
    id: 'woodworking_workshop',
    name: 'Столярная мастерская',
    description: 'Работа с деревом',
    group: 'creative',
  },
  sewing_workshop: {
    id: 'sewing_workshop',
    name: 'Швейная мастерская',
    description: 'Шитье, рукоделие',
    group: 'creative',
  },

  // С животными и природой
  horse_club: {
    id: 'horse_club',
    name: 'Конный клуб',
    description: 'Катание на лошадях и пони',
    group: 'nature',
  },
  farm: {
    id: 'farm',
    name: 'Ферма / Экоферма',
    description: 'Домашние животные, кормление',
    group: 'nature',
  },

  // Загородные и открытые
  recreation_base: {
    id: 'recreation_base',
    name: 'База отдыха / Загородный клуб',
    description: 'Коттеджи, большая территория',
    group: 'outdoor',
  },
  glamping: {
    id: 'glamping',
    name: 'Глэмпинг',
    description: 'Комфортный отдых на природе',
    group: 'outdoor',
  },
  outdoor: {
    id: 'outdoor',
    name: 'Открытая площадка',
    description: 'Парк, поляна, терраса',
    group: 'outdoor',
  },

  // Другое
  other: {
    id: 'other',
    name: 'Другое',
    description: 'Нестандартная площадка',
    group: 'other',
  },
}

// Группы типов площадок
export const VENUE_GROUPS = [
  { id: 'rental', name: 'Площадки под аренду' },
  { id: 'studios', name: 'Студии и центры' },
  { id: 'active', name: 'Активные развлечения' },
  { id: 'quest', name: 'Квесты и игры' },
  { id: 'creative', name: 'Творческие мастерские' },
  { id: 'nature', name: 'С животными и природой' },
  { id: 'outdoor', name: 'Загородные и открытые' },
  { id: 'other', name: 'Другое' },
] as const

// Маппинг групп к типам (автоматически из VENUE_TYPES)
export const VENUE_GROUP_MAPPING: Record<string, string[]> = Object.values(VENUE_TYPES).reduce(
  (acc, type) => {
    if (!acc[type.group]) {
      acc[type.group] = []
    }
    acc[type.group].push(type.id)
    return acc
  },
  {} as Record<string, string[]>
)

// Функция получения названия типа площадки по ID
export function getVenueTypeName(venueTypeId?: string | null): string {
  if (!venueTypeId) return ''
  return VENUE_TYPES[venueTypeId]?.name || venueTypeId
}

// Функция получения группы по типу площадки
export function getVenueGroup(venueTypeId?: string | null): string | null {
  if (!venueTypeId) return null
  return VENUE_TYPES[venueTypeId]?.group || null
}





