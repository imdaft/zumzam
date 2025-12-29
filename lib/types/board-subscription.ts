/**
 * Типы для системы подписок на объявления доски
 */

import { RequestCategory, ClientType, VenueType } from './order-request'

// === ФИЛЬТРЫ ПОДПИСКИ ===

export interface BoardSubscriptionFilters {
  categories?: RequestCategory[]          // Категории услуг
  clientTypes?: ClientType[]              // Типы заказчиков
  city?: string                           // Город
  districts?: string[]                    // Районы
  venueTypes?: VenueType[]                // Типы площадок
  budgetMin?: number                      // Минимальный бюджет
  budgetMax?: number                      // Максимальный бюджет
  ageFrom?: number                        // Возраст детей от
  ageTo?: number                          // Возраст детей до
  urgentOnly?: boolean                    // Только срочные
  dateFrom?: string                       // Дата события от (ISO)
  dateTo?: string                         // Дата события до (ISO)
  keywords?: string[]                     // Ключевые слова
}

// Частота email уведомлений
export type EmailFrequency = 'instant' | 'daily' | 'weekly'

// === ПОДПИСКА ===

export interface BoardSubscription {
  id: string
  user_id: string
  name?: string                           // Название подписки
  
  filters: BoardSubscriptionFilters
  
  // Каналы уведомлений
  notify_internal: boolean
  notify_email: boolean
  notify_telegram: boolean
  notify_push: boolean
  
  email_frequency: EmailFrequency
  
  // Статистика
  matches_count: number
  last_matched_at?: string
  
  is_active: boolean
  created_at: string
  updated_at: string
}

// Форма создания/редактирования подписки
export interface BoardSubscriptionInput {
  name?: string
  filters: BoardSubscriptionFilters
  notify_internal?: boolean
  notify_email?: boolean
  notify_telegram?: boolean
  notify_push?: boolean
  email_frequency?: EmailFrequency
  is_active?: boolean
}

// === ТАРИФЫ РАЗМЕЩЕНИЯ ===

export interface BoardListingPlan {
  id: string
  slug: string                            // 'basic', 'standard', 'premium', 'vip'
  name: string
  description?: string
  price: number
  currency: string
  
  // Параметры
  duration_days: number                   // Срок размещения
  pin_days: number                        // Закрепление наверху
  highlight_color?: string                // Цвет выделения
  priority_boost: number                  // Приоритет (0-100)
  
  // Опции
  publish_to_telegram: boolean            // Публикация в Telegram
  send_to_subscribers: boolean            // Рассылка подписчикам
  show_contact_immediately: boolean       // Показать контакт сразу
  featured_badge: boolean                 // Значок "Рекомендовано"
  
  is_active: boolean
  display_order: number
  created_at: string
}

// === УВЕДОМЛЕНИЯ ===

export interface BoardSubscriptionNotification {
  id: string
  subscription_id: string
  request_id: string
  
  internal_sent_at?: string
  email_sent_at?: string
  telegram_sent_at?: string
  push_sent_at?: string
  
  error_message?: string
  created_at: string
}

// === КОНСТАНТЫ ДЛЯ UI ===

export const EMAIL_FREQUENCY_OPTIONS: { id: EmailFrequency; label: string }[] = [
  { id: 'instant', label: 'Мгновенно' },
  { id: 'daily', label: 'Раз в день (дайджест)' },
  { id: 'weekly', label: 'Раз в неделю' },
]

export const NOTIFICATION_CHANNELS = [
  { id: 'notify_internal', label: 'В личный кабинет', icon: 'Bell', description: 'Уведомления на сайте' },
  { id: 'notify_push', label: 'Push-уведомления', icon: 'Smartphone', description: 'В браузер' },
  { id: 'notify_email', label: 'На email', icon: 'Mail', description: 'Письмо на почту' },
  { id: 'notify_telegram', label: 'В Telegram', icon: 'Send', description: 'Через бота ZumZam' },
] as const

// Предустановленные фильтры
export const PRESET_FILTERS = {
  animators_spb: {
    name: 'Аниматоры СПб',
    filters: {
      categories: ['animator'] as RequestCategory[],
      city: 'Санкт-Петербург',
    }
  },
  all_shows: {
    name: 'Все шоу-программы',
    filters: {
      categories: ['show'] as RequestCategory[],
    }
  },
  urgent_only: {
    name: 'Только срочные',
    filters: {
      urgentOnly: true,
    }
  },
  high_budget: {
    name: 'Высокий бюджет (от 15000₽)',
    filters: {
      budgetMin: 15000,
    }
  },
  colleagues: {
    name: 'Подмена коллегам',
    filters: {
      clientTypes: ['colleague'] as ClientType[],
    }
  },
}

// === TELEGRAM ФОРМАТИРОВАНИЕ ===

// Хештеги для категорий в Telegram
export const TELEGRAM_CATEGORY_HASHTAGS: Record<RequestCategory, string> = {
  animator: '#аниматор',
  show: '#шоу',
  quest: '#квест',
  masterclass: '#мастеркласс',
  host: '#ведущий',
  photo_video: '#фотовидео',
  santa: '#дедмороз',
  face_painting: '#аквагрим',
  costume: '#ростоваякукла',
  other: '#услуга',
}

// Хештеги для городов
export const TELEGRAM_CITY_HASHTAGS: Record<string, string> = {
  'Санкт-Петербург': '#СПб',
  'Москва': '#Москва',
  'Ленинградская область': '#ЛО',
}

/**
 * Форматирование объявления для Telegram с хештегами
 */
export function formatRequestHashtags(request: {
  category: RequestCategory
  city: string
  is_urgent?: boolean
  client_type?: ClientType
  listing_plan_id?: string
}): string[] {
  const tags: string[] = []
  
  // Категория
  tags.push(TELEGRAM_CATEGORY_HASHTAGS[request.category] || '#услуга')
  
  // Город
  const cityTag = TELEGRAM_CITY_HASHTAGS[request.city]
  if (cityTag) tags.push(cityTag)
  
  // Срочность
  if (request.is_urgent) tags.push('#срочно')
  
  // Подмена
  if (request.client_type === 'colleague') tags.push('#подмена')
  
  // VIP (премиум тариф)
  if (request.listing_plan_id) tags.push('#vip')
  
  return tags
}






