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
  SIGNUP: '/signup',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  SERVICES: '/my-services',
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
  name: 'DetiNaRakete',
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

