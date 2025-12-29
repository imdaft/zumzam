/**
 * Утилиты для генерации SEO-дружественного контента
 */

interface Profile {
  display_name: string
  category: string
  city?: string
  rating?: number
  reviews_count?: number
  price_from?: number
}

/**
 * Генерирует SEO-оптимизированный title для профиля
 */
export function generateProfileTitle(profile: Profile): string {
  const categoryNames: Record<string, string> = {
    venue: 'Студия детских праздников',
    animator: 'Аниматор',
    show: 'Шоу-программа',
    quest: 'Квест',
    master_class: 'Мастер-классы',
    photographer: 'Фотограф детских праздников',
    agency: 'Агентство детских праздников',
  }

  const category = categoryNames[profile.category] || 'Услуги'
  const city = profile.city || 'Санкт-Петербург'
  
  let title = `${profile.display_name} — ${category} в ${city}`
  
  // Добавляем цену если есть
  if (profile.price_from) {
    title += ` | От ${profile.price_from}₽`
  }
  
  title += ' | ZumZam'
  
  return title
}

/**
 * Генерирует SEO-оптимизированное description для профиля
 */
export function generateProfileDescription(profile: Profile): string {
  const city = profile.city || 'Санкт-Петербург'
  
  let description = `${profile.display_name} в ${city}.`
  
  // Добавляем рейтинг если есть
  if (profile.rating && profile.reviews_count) {
    description += ` Рейтинг ${profile.rating.toFixed(1)} (${profile.reviews_count} ${pluralizeReviews(profile.reviews_count)}).`
  }
  
  // Добавляем цену если есть
  if (profile.price_from) {
    description += ` Цены от ${profile.price_from}₽.`
  }
  
  description += ` Фото, отзывы, бронирование онлайн на ZumZam ⚡`
  
  return description.substring(0, 160)
}

/**
 * Генерирует alt текст для изображения профиля
 */
export function generateImageAlt(profile: Profile, imageType: 'cover' | 'main' | 'gallery' = 'main'): string {
  const categoryNames: Record<string, string> = {
    venue: 'студия детских праздников',
    animator: 'аниматор',
    show: 'шоу-программа',
    quest: 'квест',
    master_class: 'мастер-класс',
    photographer: 'фотограф',
    agency: 'агентство',
  }

  const category = categoryNames[profile.category] || 'услуга'
  const city = profile.city || 'Санкт-Петербург'
  
  switch (imageType) {
    case 'cover':
      return `${profile.display_name} - ${category} в ${city} - обложка`
    case 'main':
      return `${profile.display_name} - ${category} в ${city}`
    case 'gallery':
      return `${profile.display_name} - ${category} - фото`
    default:
      return profile.display_name
  }
}

/**
 * Склонение слова "отзыв"
 */
function pluralizeReviews(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'отзывов'
  }

  switch (lastDigit) {
    case 1:
      return 'отзыв'
    case 2:
    case 3:
    case 4:
      return 'отзыва'
    default:
      return 'отзывов'
  }
}

/**
 * Генерирует SEO-текст для категории
 */
export function generateCategoryDescription(category: string, city: string = 'Санкт-Петербург'): string {
  const descriptions: Record<string, string> = {
    venues: `Студии и площадки для детских праздников в ${city}. Аренда помещений для дня рождения ребенка. Сравните цены, посмотрите фото и отзывы. Бронируйте онлайн на ZumZam.`,
    animators: `Аниматоры на детский праздник в ${city}. Более 100 проверенных артистов. Популярные персонажи, игры, конкурсы. Цены от 3000₽. Отзывы и рейтинги.`,
    quests: `Квесты для детей в ${city}. Увлекательные приключения для детских праздников. Разные тематики и сложность. Бронирование онлайн.`,
    shows: `Шоу-программы для детских праздников в ${city}. Фокусники, жонглёры, научные шоу. Сделайте праздник незабываемым с ZumZam.`,
    master_classes: `Мастер-классы для детей в ${city}. Творческие занятия на день рождения. Рисование, лепка, кулинария и многое другое.`,
    photographers: `Фотографы детских праздников в ${city}. Профессиональная фотосъёмка дня рождения. Портфолио, цены, отзывы.`,
  }

  return descriptions[category] || `Услуги для детских праздников в ${city} на ZumZam.`
}

/**
 * Генерирует keywords для страницы
 */
export function generateKeywords(category: string, city: string = 'спб'): string[] {
  const baseKeywords = [
    `детские праздники ${city}`,
    `день рождения ребенка ${city}`,
    `организация детского праздника ${city}`,
  ]

  const categoryKeywords: Record<string, string[]> = {
    venues: [
      `студия детских праздников ${city}`,
      `где отметить день рождения ${city}`,
      `аренда площадки ${city}`,
    ],
    animators: [
      `аниматоры ${city}`,
      `заказать аниматора ${city}`,
      `аниматор на день рождения ${city}`,
    ],
    quests: [
      `квесты для детей ${city}`,
      `детский квест ${city}`,
      `квест на день рождения ${city}`,
    ],
    shows: [
      `шоу программы детские ${city}`,
      `фокусник на праздник ${city}`,
      `научное шоу ${city}`,
    ],
  }

  return [...baseKeywords, ...(categoryKeywords[category] || [])]
}

