import { Home, Star, Layers, ImageIcon, FileText, MessageSquare, MapPin, Sparkles, Search, Palette, Camera, Briefcase, HelpCircle } from 'lucide-react'

/**
 * ⚠️ УСТАРЕВШАЯ СИСТЕМА МЕНЮ
 * 
 * Этот файл поддерживает старую систему классификации на основе category.
 * Для новой системы используйте: lib/utils/dynamic-profile-menu.ts
 * 
 * Оставлен для обратной совместимости с профилями без новой классификации.
 */

export type ProfileCategory = 'venue' | 'animator' | 'show' | 'agency' | 'quest' | 'master_class' | 'photographer'
export type TabValue = 'info' | 'services' | 'characters' | 'show_programs' | 'quest_programs' | 'master_classes' | 'photography_styles' | 'agency_partners' | 'geography' | 'locations' | 'photos' | 'legal' | 'reviews' | 'faq'

export interface MenuItem {
  id: TabValue
  label: string
  icon: React.ElementType
}

/**
 * @deprecated Используйте generateProfileMenu() из lib/utils/dynamic-profile-menu.ts
 * Возвращает динамическое меню в зависимости от категории профиля
 */
export function getMenuItemsByCategory(category: ProfileCategory): MenuItem[] {
  // Общие пункты для всех
  const commonStart: MenuItem[] = [
    { id: 'info', label: 'Основная информация', icon: Home },
  ]

  const commonEnd: MenuItem[] = [
    { id: 'photos', label: 'Фото и видео', icon: ImageIcon },
    { id: 'faq', label: 'Часто задаваемые вопросы', icon: HelpCircle },
    { id: 'reviews', label: 'Настройка отзывов', icon: MessageSquare },
    { id: 'legal', label: 'Юридические документы', icon: FileText },
  ]

  // Специфичные пункты для каждой категории
  const categorySpecific: Record<ProfileCategory, MenuItem[]> = {
    venue: [
      { id: 'locations', label: 'Адреса и локации', icon: MapPin },
      { id: 'services', label: 'Услуги и цены', icon: Layers },
    ],
    
    animator: [
      { id: 'characters', label: 'Персонажи', icon: Star },
      { id: 'geography', label: 'География работы', icon: MapPin },
      { id: 'services', label: 'Программы и цены', icon: Layers },
    ],
    
    show: [
      { id: 'show_programs', label: 'Виды шоу', icon: Sparkles },
      { id: 'geography', label: 'География работы', icon: MapPin },
      { id: 'services', label: 'Программы и цены', icon: Layers },
    ],
    
    agency: [
      { id: 'agency_partners', label: 'Партнеры', icon: Briefcase },
      { id: 'geography', label: 'География работы', icon: MapPin },
      { id: 'services', label: 'Услуги и пакеты', icon: Briefcase },
    ],
    
    quest: [
      { id: 'quest_programs', label: 'Квесты', icon: Search },
      { id: 'geography', label: 'География выезда', icon: MapPin },
      { id: 'services', label: 'Услуги и цены', icon: Layers },
    ],
    
    master_class: [
      { id: 'master_classes', label: 'Мастер-классы', icon: Palette },
      { id: 'geography', label: 'Формат работы', icon: MapPin },
      { id: 'services', label: 'Услуги и цены', icon: Layers },
    ],
    
    photographer: [
      { id: 'photography_styles', label: 'Стили съемки', icon: Camera },
      { id: 'services', label: 'Услуги', icon: Camera },
      { id: 'geography', label: 'География работы', icon: MapPin },
    ],
  }

  return [
    ...commonStart,
    ...categorySpecific[category],
    ...commonEnd,
  ]
}

/**
 * Проверяет, нужен ли раздел "География работы" для категории
 */
export function needsGeography(category: ProfileCategory): boolean {
  return ['animator', 'show', 'agency', 'quest', 'master_class', 'photographer'].includes(category)
}

/**
 * Проверяет, нужен ли раздел "Адреса" для категории
 */
export function needsLocations(category: ProfileCategory): boolean {
  return ['venue'].includes(category)
}

/**
 * Возвращает название раздела "Услуги" в зависимости от категории
 */
export function getServicesLabel(category: ProfileCategory): string {
  const labels: Record<ProfileCategory, string> = {
    venue: 'Услуги и цены',
    animator: 'Программы и цены',
    show: 'Программы и цены',
    agency: 'Услуги и пакеты',
    quest: 'Услуги и цены',
    master_class: 'Услуги и цены',
    photographer: 'Услуги',
  }
  return labels[category]
}

