/**
 * Словарь переводов категорий профилей на русский язык
 */
export const CATEGORY_LABELS: Record<string, string> = {
  venue: 'Площадка',
  animator: 'Аниматор',
  agency: 'Агентство',
  show: 'Шоу',
  quest: 'Квест',
  master_class: 'Мастер-класс',
  photographer: 'Фотограф',
}

/**
 * Получить русское название категории
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Неизвестно'
  return CATEGORY_LABELS[category] || category
}

/**
 * Получить все категории с переводами
 */
export function getAllCategoryLabels() {
  return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    id: key,
    name: label,
  }))
}

