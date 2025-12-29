/**
 * Маршруты приложения
 */
export const ROUTES = {
  // Публичные
  HOME: '/',
  SEARCH: '/search',
  PROFILE: (slug: string) => `/profiles/${slug}`,
  
  // Авторизация
  LOGIN: '/login',
  SIGNUP: '/register',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  SERVICES: '/dashboard/services',
  BOOKINGS: '/bookings',
  SETTINGS: '/settings',
} as const

/**
 * API endpoints
 */
export const API = {
  PROFILES: '/api/profiles',
  SERVICES: '/api/services',
  BOOKINGS: '/api/bookings',
  SEARCH: '/api/search/semantic',
} as const

/**
 * Конфигурация приложения
 */
export const APP_CONFIG = {
  name: 'ZumZam',
  description: 'Запускаем детей к их мечтам!',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

/**
 * Категории услуг
 */
export const SERVICE_CATEGORIES = [
  { value: 'animation', label: 'Анимация' },
  { value: 'show', label: 'Шоу-программа' },
  { value: 'photo', label: 'Фотосъемка' },
  { value: 'video', label: 'Видеосъемка' },
  { value: 'venue', label: 'Площадка' },
  { value: 'package', label: 'Пакет услуг' },
  { value: 'other', label: 'Другое' },
] as const

/**
 * Города (для MVP)
 */
export const CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
] as const

/**
 * Возрастные группы
 */
export const AGE_GROUPS = [
  { value: '1-3', label: '1-3 года' },
  { value: '4-6', label: '4-6 лет' },
  { value: '7-9', label: '7-9 лет' },
  { value: '10-12', label: '10-12 лет' },
  { value: '13+', label: '13+ лет' },
] as const

/**
 * Маппинг категорий из БД в UI slug
 */
export const CATEGORY_MAP = {
  venue: 'venues',
  animator: 'animators',
  show: 'shows',
  quest: 'quests',
  master_class: 'master_classes',
  photographer: 'photographers',
  agency: 'agencies',
} as const

/**
 * Ценовые диапазоны (fallback когда нет услуг)
 */
export const PRICE_RANGES = {
  '$': 3000,
  '$$': 10000,
  '$$$': 20000,
} as const

/**
 * Типы площадок для фильтрации
 * Обновлено на основе полного анализа рынка детских праздников
 */
export const VENUE_TYPES = {
  // Развлекательные центры
  entertainment_center: 'Детский развлекательный центр',
  
  // Площадки под аренду
  cafe: 'Кафе / Ресторан',
  loft: 'Лофт',
  banquet_hall: 'Банкетный зал',
  
  // Студии и центры
  event_studio: 'Event-студия / Студия праздников',
  
  // Активные развлечения
  trampoline_park: 'Батутный центр',
  karting: 'Картинг-центр',
  lasertag: 'Лазертаг / Пейнтбол',
  climbing_park: 'Скалодром / Веревочный парк',
  bowling: 'Боулинг / Бильярд',
  water_park: 'Аквапарк / Бассейн',
  
  // Квесты и игры
  vr_arena: 'VR-арена',
  quest_room: 'Квест-комната',
  
  // Творческие мастерские
  art_studio: 'Художественная студия',
  pottery_workshop: 'Гончарная мастерская',
  culinary_studio: 'Кулинарная студия',
  woodworking_workshop: 'Столярная мастерская',
  sewing_workshop: 'Швейная мастерская',
  
  // Животные и природа
  horse_club: 'Конный клуб',
  farm: 'Ферма / Экоферма',
  
  // Загородный отдых
  recreation_base: 'База отдыха / Загородный клуб',
  glamping: 'Глэмпинг',
  outdoor: 'Открытая площадка',
  
  // Прочее
  other: 'Другое',
} as const

/**
 * Форматы работы площадок
 */
export const WORK_FORMATS = {
  venue_rental: 'Сдаем площадку в аренду',
  own_programs: 'Проводим свои программы',
  turnkey: 'Организуем праздник под ключ',
  tickets: 'Продажа билетов (свободное посещение)',
} as const

/**
 * Опции сортировки
 */
export const SORT_OPTIONS = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'reviews', label: 'По отзывам' },
  { value: 'distance', label: 'По расстоянию' },
  { value: 'price_asc', label: 'По цене: дешевле' },
  { value: 'price_desc', label: 'По цене: дороже' },
] as const

