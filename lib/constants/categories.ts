/**
 * Категории профилей для навигации
 */

export const CATEGORIES = [
  { id: 'venues', name: 'Площадки', icon: '🏰' },
  { id: 'agencies', name: 'Агентства', icon: '🏢' },
  { id: 'animators', name: 'Аниматоры', icon: '🎭' },
  { id: 'shows', name: 'Шоу', icon: '🎪' },
  { id: 'quests', name: 'Квесты', icon: '🗺️' },
  { id: 'master_classes', name: 'Мастер-классы', icon: '🎨' },
  { id: 'photographers', name: 'Фотографы', icon: '📸' },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']




