/**
 * 🧩 ГЕНЕРАТОР БЛОКОВ ПРОФИЛЯ
 * 
 * Автоматически определяет какие блоки показывать на основе классификации
 * 
 * Принцип: Если есть данные → показываем блок
 */

export interface BlockConfig {
  id: string
  type: BlockType
  order: number
  required: boolean
  data?: any
  mobileOnly?: boolean
  desktopOnly?: boolean
}

export type BlockType =
  | 'hero'                  // Герой-секция (о нас)
  | 'activities'            // Активности (батуты, лазертаг...)
  | 'turnkey-packages'      // Пакеты под ключ
  | 'ticket-pricing'        // Билеты на посещение
  | 'rental-pricing'        // Почасовая аренда
  | 'services'              // Дополнительные услуги
  | 'catering-menu'         // Меню кейтеринга
  | 'gallery'               // Галерея фото
  | 'reviews'               // Отзывы
  | 'contacts'              // Контакты

export interface Profile {
  id: string
  slug: string
  display_name: string
  description?: string
  
  // Новая классификация
  primary_venue_type?: string
  activities?: string[]
  business_models?: string[]
  space_type?: string
  additional_services?: string[]
  
  // Данные для блоков
  turnkey_packages?: any[]
  ticket_pricing?: any
  hourly_rates?: any[]
  catering_menu?: any[]
  
  // Кастомизация
  section_order?: string[]
  hidden_blocks?: string[]
  section_templates?: {
    mobile?: Record<string, string>
    desktop?: Record<string, string>
  }
  
  // Контент
  photos?: string[]
  videos?: string[]
  
  // Новые поля
  working_hours?: any
  metro_stations?: any[]
  parking_info?: any
  age_restrictions?: any
  capacity_info?: any
  payment_methods?: any
  messenger_contacts?: any
}

/**
 * Генерирует список блоков для профиля
 */
export function generateProfileBlocks(profile: Profile): BlockConfig[] {
  const blocks: BlockConfig[] = []
  
  // ========================================
  // 1. ГЕРОЙ-СЕКЦИЯ (всегда показываем)
  // ========================================
  blocks.push({
    id: 'about',
    type: 'hero',
    order: 0,
    required: true,
  })
  
  // ========================================
  // 2. АКТИВНОСТИ (если есть)
  // ========================================
  if (profile.activities && profile.activities.length > 0) {
    blocks.push({
      id: 'activities',
      type: 'activities',
      order: 10,
      required: false,
      data: {
        activities: profile.activities,
        primaryType: profile.primary_venue_type,
      },
    })
  }
  
  // ========================================
  // 3. ПАКЕТЫ ПОД КЛЮЧ (если есть бизнес-модель)
  // ========================================
  if (profile.business_models?.includes('packages_turnkey')) {
    blocks.push({
      id: 'turnkey',
      type: 'turnkey-packages',
      order: 20,
      required: false,
      data: {
        packages: profile.turnkey_packages || [],
      },
    })
  }
  
  // ========================================
  // 4. БИЛЕТЫ (если есть бизнес-модель)
  // ========================================
  if (profile.business_models?.includes('tickets_freeplay') && profile.ticket_pricing) {
    blocks.push({
      id: 'tickets',
      type: 'ticket-pricing',
      order: 25,
      required: false,
      data: {
        pricing: profile.ticket_pricing,
      },
    })
  }
  
  // ========================================
  // 5. АРЕНДА (если есть бизнес-модель)
  // ========================================
  if (
    (profile.business_models?.includes('rental_only') || 
     profile.business_models?.includes('hybrid')) &&
    profile.hourly_rates &&
    profile.hourly_rates.length > 0
  ) {
    blocks.push({
      id: 'rental',
      type: 'rental-pricing',
      order: 30,
      required: false,
      data: {
        pricing: profile.hourly_rates,
      },
    })
  }
  
  // ========================================
  // 6. ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ (если есть)
  // ========================================
  if (profile.additional_services && profile.additional_services.length > 0) {
    // Фильтруем catering - он будет отдельным блоком
    const servicesWithoutCatering = profile.additional_services.filter(s => s !== 'catering')
    
    if (servicesWithoutCatering.length > 0) {
      blocks.push({
        id: 'services',
        type: 'services',
        order: 40,
        required: false,
        data: {
          services: servicesWithoutCatering,
        },
      })
    }
  }
  
  // ========================================
  // 7. МЕНЮ КЕЙТЕРИНГА (если есть услуга)
  // ========================================
  if (
    profile.additional_services?.includes('catering') &&
    profile.catering_menu &&
    profile.catering_menu.length > 0
  ) {
    blocks.push({
      id: 'catering_menu',
      type: 'catering-menu',
      order: 45,
      required: false,
      data: {
        menu: profile.catering_menu,
      },
    })
  }
  
  // ========================================
  // 8. ГАЛЕРЕЯ (всегда показываем)
  // ========================================
  blocks.push({
    id: 'gallery',
    type: 'gallery',
    order: 50,
    required: true,
    data: {
      photos: profile.photos || [],
      videos: profile.videos || [],
    },
  })
  
  // ========================================
  // 9. ОТЗЫВЫ (всегда показываем)
  // ========================================
  blocks.push({
    id: 'reviews',
    type: 'reviews',
    order: 60,
    required: true,
  })
  
  // ========================================
  // 10. КОНТАКТЫ (всегда показываем)
  // ========================================
  blocks.push({
    id: 'contacts',
    type: 'contacts',
    order: 70,
    required: true,
    data: {
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      messenger_contacts: profile.messenger_contacts,
      working_hours: profile.working_hours,
      metro_stations: profile.metro_stations,
      parking_info: profile.parking_info,
    },
  })
  
  // ========================================
  // ФИЛЬТРУЕМ СКРЫТЫЕ БЛОКИ
  // ========================================
  let visibleBlocks = blocks.filter(block => 
    !profile.hidden_blocks?.includes(block.id)
  )
  
  // ========================================
  // ПРИМЕНЯЕМ CUSTOM ПОРЯДОК (если задан)
  // ========================================
  if (profile.section_order && profile.section_order.length > 0) {
    visibleBlocks = reorderBlocks(visibleBlocks, profile.section_order)
  } else {
    // Сортируем по умолчанию
    visibleBlocks.sort((a, b) => a.order - b.order)
  }
  
  return visibleBlocks
}

/**
 * Переупорядочивает блоки согласно custom порядку
 */
function reorderBlocks(blocks: BlockConfig[], order: string[]): BlockConfig[] {
  const blockMap = new Map(blocks.map(b => [b.id, b]))
  const reordered: BlockConfig[] = []
  
  // Добавляем блоки в порядке из order
  for (const id of order) {
    const block = blockMap.get(id)
    if (block) {
      reordered.push(block)
      blockMap.delete(id)
    }
  }
  
  // Добавляем оставшиеся блоки в конец (новые блоки, которых не было в order)
  for (const block of blockMap.values()) {
    reordered.push(block)
  }
  
  return reordered
}

/**
 * Проверяет есть ли у блока данные для показа
 */
export function hasBlockData(block: BlockConfig, profile: Profile): boolean {
  // Required блоки показываем всегда
  if (block.required) return true
  
  switch (block.type) {
    case 'activities':
      return Boolean(profile.activities && profile.activities.length > 0)
    
    case 'turnkey-packages':
      return Boolean(profile.turnkey_packages && profile.turnkey_packages.length > 0)
    
    case 'ticket-pricing':
      return Boolean(profile.ticket_pricing)
    
    case 'rental-pricing':
      return Boolean(profile.hourly_rates && profile.hourly_rates.length > 0)
    
    case 'services':
      return Boolean(profile.additional_services && profile.additional_services.length > 0)
    
    case 'catering-menu':
      return Boolean(profile.catering_menu && profile.catering_menu.length > 0)
    
    default:
      return true
  }
}

/**
 * Получает шаблон (вариант дизайна) для блока
 */
export function getBlockTemplate(
  block: BlockConfig,
  profile: Profile,
  variant: 'mobile' | 'desktop'
): string {
  const templates = profile.section_templates?.[variant]
  if (!templates) return 'standard'
  
  return templates[block.id] || 'standard'
}





