/**
 * Типы цен для услуг
 */
export type PriceType = 'fixed' | 'from' | 'hourly' | 'per_person' | 'negotiable'

/**
 * Форматирование цены услуги с учётом типа
 * @param price - цена в рублях
 * @param priceType - тип цены
 * @returns отформатированная строка цены
 */
export function formatServicePrice(price: number, priceType?: PriceType | string): string {
  // Договорная цена — без числа
  if (priceType === 'negotiable') {
    return 'Договорная'
  }

  // Если цена = 0, показываем "По запросу"
  if (!price || price === 0) {
    return 'По запросу'
  }

  // Форматируем число с пробелами
  const formattedPrice = price.toLocaleString('ru-RU')

  // Добавляем префикс/суффикс в зависимости от типа
  switch (priceType) {
    case 'from':
      return `от ${formattedPrice} ₽`
    case 'hourly':
      return `${formattedPrice} ₽/час`
    case 'per_person':
      return `${formattedPrice} ₽/чел`
    case 'fixed':
    default:
      return `${formattedPrice} ₽`
  }
}

/**
 * Краткое описание типа цены (для тултипов/подсказок)
 */
export function getPriceTypeLabel(priceType?: PriceType | string): string {
  switch (priceType) {
    case 'fixed':
      return 'Фиксированная цена'
    case 'from':
      return 'Минимальная цена (может быть выше)'
    case 'hourly':
      return 'Оплата за час'
    case 'per_person':
      return 'Оплата за человека'
    case 'negotiable':
      return 'Цена обсуждается индивидуально'
    default:
      return ''
  }
}

