/**
 * Типы для Telegram-бот интеграции
 * 
 * Концепция:
 * 1. Бот публикует новые заявки в канал @zumzam_orders
 * 2. Исполнители подписываются на бот и настраивают фильтры
 * 3. При появлении подходящей заявки — бот отправляет уведомление
 * 4. Из Telegram можно перейти на сайт для отклика
 * 5. Уведомления о личных сообщениях и статусах заявок
 */

// === TELEGRAM-БОТ ===

export interface TelegramUser {
  id: string
  telegramId: number              // ID в Telegram
  telegramUsername?: string       // @username
  userId: string                  // ID пользователя в нашей БД
  profileIds: string[]            // Привязанные профили (для исполнителей)
  
  // Настройки уведомлений
  notifyNewRequests: boolean      // Уведомлять о новых заявках
  notifyMessages: boolean         // Уведомлять о сообщениях
  notifyOrderStatus: boolean      // Уведомлять об изменении статуса
  
  // Фильтры для заявок
  filters: TelegramFilters
  
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TelegramFilters {
  categories?: string[]           // Категории: animator, show, quest...
  city?: string                   // Город
  districts?: string[]            // Районы
  minBudget?: number              // Минимальный бюджет
  maxBudget?: number              // Максимальный бюджет
  urgentOnly?: boolean            // Только срочные
  clientTypes?: string[]          // Типы заказчиков: parent, venue, organizer, colleague
}

// === СООБЩЕНИЯ В КАНАЛ ===

export interface TelegramRequestPost {
  requestId: string
  messageId?: number              // ID сообщения в Telegram (после публикации)
  channelId: string               // ID канала
  postedAt: string
  updatedAt?: string
}

// === ФОРМАТ СООБЩЕНИЯ ===

/**
 * Пример сообщения в канал:
 * 
 * 📢 НОВАЯ ЗАЯВКА #аниматор #срочно
 * 
 * 👤 Тип: Родитель
 * 📍 СПб, Приморский район
 * 📅 15 декабря, 14:00
 * 👧 10 детей, 5-7 лет
 * 💰 Бюджет: 8000₽
 * 
 * Нужен Человек-паук на 1.5 часа. 
 * ✅ Реквизит свой
 * ✅ Колонка есть
 * 
 * [Откликнуться →] (inline button)
 */

export function formatRequestForTelegram(request: {
  id: string
  clientType: string
  category: string
  title: string
  description?: string
  eventDate: string
  eventTime?: string
  city: string
  district?: string
  childrenCount?: number
  childrenAgeFrom?: number
  childrenAgeTo?: number
  budget?: number
  budgetNegotiable?: boolean
  isUrgent: boolean
  details?: Record<string, any>
}): string {
  const categoryEmoji: Record<string, string> = {
    animator: '🎭',
    show: '🎪',
    quest: '🔍',
    masterclass: '🎨',
    host: '🎤',
    photo_video: '📷',
    santa: '🎅',
    face_painting: '🎨',
    costume: '🧸',
    other: '✨',
  }

  const categoryLabels: Record<string, string> = {
    animator: 'аниматор',
    show: 'шоу',
    quest: 'квест',
    masterclass: 'мастеркласс',
    host: 'ведущий',
    photo_video: 'фотовидео',
    santa: 'дедмороз',
    face_painting: 'аквагрим',
    costume: 'ростоваякукла',
    other: 'услуга',
  }

  const clientTypeLabels: Record<string, string> = {
    parent: '👨‍👩‍👧 Родитель',
    venue: '🏢 Площадка',
    organizer: '📋 Организатор',
    colleague: '🔄 Коллега (подмена)',
  }

  const emoji = categoryEmoji[request.category] || '✨'
  const hashtag = categoryLabels[request.category] || 'услуга'
  
  let message = `📢 НОВАЯ ЗАЯВКА #${hashtag}`
  if (request.isUrgent) {
    message += ' #срочно'
  }
  if (request.clientType === 'colleague') {
    message += ' #подмена'
  }
  message += '\n\n'

  // Тип заказчика
  message += `${clientTypeLabels[request.clientType] || 'Клиент'}\n`

  // Место
  message += `📍 ${request.city}`
  if (request.district) {
    message += `, ${request.district}`
  }
  message += '\n'

  // Дата
  const date = new Date(request.eventDate)
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  message += `📅 ${dateStr}`
  if (request.eventTime) {
    message += `, ${request.eventTime}`
  }
  message += '\n'

  // Дети
  if (request.childrenCount) {
    message += `👧 ${request.childrenCount} детей`
    if (request.childrenAgeFrom && request.childrenAgeTo) {
      message += `, ${request.childrenAgeFrom}-${request.childrenAgeTo} лет`
    }
    message += '\n'
  }

  // Бюджет
  if (request.budget) {
    message += `💰 Бюджет: ${request.budget.toLocaleString('ru-RU')}₽\n`
  } else if (request.budgetNegotiable) {
    message += `💰 Бюджет: договорной\n`
  }

  message += '\n'

  // Описание
  if (request.description) {
    message += request.description.slice(0, 200)
    if (request.description.length > 200) {
      message += '...'
    }
    message += '\n'
  }

  // Детали (реквизит, колонка и т.д.)
  const details = request.details || {}
  if (details.hasOwnCostume) message += '✅ Костюм свой\n'
  if (details.hasOwnProps) message += '✅ Реквизит свой\n'
  if (details.hasOwnSpeaker) message += '✅ Колонка своя\n'
  if (details.speakerProvided) message += '🔊 Колонка будет на месте\n'
  if (details.character) message += `🎭 Персонаж: ${details.character}\n`

  return message.trim()
}

// === КОМАНДЫ БОТА ===

export const BOT_COMMANDS = [
  { command: 'start', description: 'Начать работу с ботом' },
  { command: 'link', description: 'Привязать аккаунт ZumZam' },
  { command: 'unlink', description: 'Отвязать аккаунт' },
  { command: 'filters', description: 'Настроить фильтры заявок' },
  { command: 'notifications', description: 'Настройки уведомлений' },
  { command: 'my_requests', description: 'Мои заявки (для клиентов)' },
  { command: 'my_responses', description: 'Мои отклики (для исполнителей)' },
  { command: 'help', description: 'Помощь' },
]

// === INLINE КНОПКИ ===

export interface TelegramInlineButton {
  text: string
  url?: string                    // Ссылка на сайт
  callback_data?: string          // Для callback query
}

export function getRequestButtons(requestId: string, baseUrl: string): TelegramInlineButton[][] {
  return [
    [
      { text: '📋 Подробнее', url: `${baseUrl}/requests/${requestId}` },
      { text: '✉️ Откликнуться', url: `${baseUrl}/requests/${requestId}/respond` },
    ],
  ]
}

// === УВЕДОМЛЕНИЯ ===

export type TelegramNotificationType = 
  | 'new_request'                 // Новая заявка (для исполнителей)
  | 'new_response'                // Новый отклик (для клиентов)
  | 'response_accepted'           // Отклик принят (для исполнителей)
  | 'response_rejected'           // Отклик отклонён (для исполнителей)
  | 'new_message'                 // Новое сообщение
  | 'request_closed'              // Заявка закрыта

export interface TelegramNotification {
  type: TelegramNotificationType
  recipientTelegramId: number
  payload: Record<string, any>
  sentAt?: string
  error?: string
}

