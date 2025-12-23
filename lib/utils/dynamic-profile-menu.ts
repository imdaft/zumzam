import { Home, Star, Layers, ImageIcon, FileText, MessageSquare, MapPin, Sparkles, Search, Palette, Camera, Briefcase, HelpCircle } from 'lucide-react'

/**
 * НОВАЯ СИСТЕМА МЕНЮ НА ОСНОВЕ КЛАССИФИКАЦИИ
 * 
 * Генерирует динамическое меню настроек профиля в зависимости от:
 * - primary_venue_type (основной тип профиля)
 * - activities (активности на площадке)
 * - services (дополнительные услуги)
 */

export type TabValue = 'info' | 'services' | 'characters' | 'show_programs' | 'quest_programs' | 'master_classes' | 'photography_styles' | 'agency_partners' | 'geography' | 'locations' | 'photos' | 'legal' | 'reviews' | 'faq'

export interface MenuItem {
  id: TabValue
  label: string
  icon: React.ElementType
}

export interface ProfileClassification {
  category: string
  primary_venue_type?: string
  activities?: string[]
  business_models?: string[]
  additional_services?: string[]
  space_type?: string
}

/**
 * Генерирует меню профиля на основе новой классификации
 */
export function generateProfileMenu(classification: ProfileClassification): MenuItem[] {
  // Общие пункты для всех профилей (начало)
  const commonStart: MenuItem[] = [
    { id: 'info', label: 'Основная информация', icon: Home },
  ]

  // Общие пункты для всех профилей (конец)
  const commonEnd: MenuItem[] = [
    { id: 'photos', label: 'Фото и видео', icon: ImageIcon },
    { id: 'faq', label: 'Часто задаваемые вопросы', icon: HelpCircle },
    { id: 'reviews', label: 'Настройка отзывов', icon: MessageSquare },
    { id: 'legal', label: 'Юридические документы', icon: FileText },
  ]

  // Динамические пункты в зависимости от классификации
  const dynamicItems: MenuItem[] = []

  // Определяем нужны ли разделы на основе primary_venue_type
  const primaryType = classification.primary_venue_type || ''
  const category = classification.category || 'venue'

  // Для площадок (event_space, entertainment_center, edu_center)
  if (['event_space', 'entertainment_center', 'edu_center'].includes(primaryType) || category === 'venue') {
    dynamicItems.push({ id: 'locations', label: 'Адреса и локации', icon: MapPin })
  }

  // Для аниматоров, шоу, агентств и т.д. - география работы
  if (['animator', 'show', 'agency', 'quest', 'master_class', 'photographer'].includes(category) || 
      ['service_provider'].includes(primaryType)) {
    dynamicItems.push({ id: 'geography', label: 'География работы', icon: MapPin })
  }

  // Персонажи для аниматоров
  if (category === 'animator') {
    dynamicItems.push({ id: 'characters', label: 'Персонажи', icon: Star })
  }

  // Виды шоу
  if (category === 'show') {
    dynamicItems.push({ id: 'show_programs', label: 'Виды шоу', icon: Sparkles })
  }

  // Квесты
  if (category === 'quest') {
    dynamicItems.push({ id: 'quest_programs', label: 'Квесты', icon: Search })
  }

  // Мастер-классы
  if (category === 'master_class') {
    dynamicItems.push({ id: 'master_classes', label: 'Мастер-классы', icon: Palette })
  }

  // Стили съемки для фотографов
  if (category === 'photographer') {
    dynamicItems.push({ id: 'photography_styles', label: 'Стили съемки', icon: Camera })
  }

  // Партнеры для агентств
  if (category === 'agency') {
    dynamicItems.push({ id: 'agency_partners', label: 'Партнеры', icon: Briefcase })
  }

  // Услуги и цены - всегда в конце специфичных пунктов
  const servicesLabel = getServicesLabel(category, primaryType)
  dynamicItems.push({ id: 'services', label: servicesLabel, icon: Layers })

  return [
    ...commonStart,
    ...dynamicItems,
    ...commonEnd,
  ]
}

/**
 * Возвращает название раздела "Услуги" в зависимости от категории и типа
 */
function getServicesLabel(category: string, primaryType: string): string {
  // По категории
  const categoryLabels: Record<string, string> = {
    venue: 'Услуги и цены',
    animator: 'Программы и цены',
    show: 'Программы и цены',
    agency: 'Услуги и пакеты',
    quest: 'Услуги и цены',
    master_class: 'Услуги и цены',
    photographer: 'Услуги',
  }

  // По типу (приоритет)
  const typeLabels: Record<string, string> = {
    event_space: 'Услуги и цены',
    entertainment_center: 'Активности и цены',
    edu_center: 'Программы и цены',
    service_provider: 'Услуги',
  }

  return typeLabels[primaryType] || categoryLabels[category] || 'Услуги и цены'
}

/**
 * Проверяет, нужен ли раздел "География работы"
 */
export function needsGeography(classification: ProfileClassification): boolean {
  const category = classification.category || ''
  const primaryType = classification.primary_venue_type || ''
  
  return ['animator', 'show', 'agency', 'quest', 'master_class', 'photographer'].includes(category) ||
         ['service_provider'].includes(primaryType)
}

/**
 * Проверяет, нужен ли раздел "Адреса"
 */
export function needsLocations(classification: ProfileClassification): boolean {
  const category = classification.category || ''
  const primaryType = classification.primary_venue_type || ''
  
  return ['venue'].includes(category) ||
         ['event_space', 'entertainment_center', 'edu_center'].includes(primaryType)
}
