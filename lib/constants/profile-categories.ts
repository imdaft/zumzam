/**
 * Константы и метаданные для категорий профилей
 * Используется в wizard создания профилей и фильтрах
 */

export type ProfileCategory =
  | 'venue'
  | 'animator'
  | 'show'
  | 'agency'
  | 'quest'
  | 'master_class'
  | 'photographer'
  | 'catering'
  | 'confectionery'
  | 'decorator'
  | 'dj_musician'
  | 'host'
  | 'transport'

export type ProfileSubtype = string // Подтипы специфичны для каждой категории

export interface CategoryMetadata {
  id: ProfileCategory
  name: string
  nameRu: string
  icon: string
  description: string
  wizardSteps: number
  subtypes?: SubtypeMetadata[]
  minPhotos: number
  minVideos?: number
  requiresDocuments?: boolean
  documentTypes?: string[]
}

export interface SubtypeMetadata {
  id: string
  name: string
  description?: string
}

/**
 * Метаданные для всех категорий профилей
 */
export const PROFILE_CATEGORIES: Record<ProfileCategory, CategoryMetadata> = {
  // ============================================
  // ТЕКУЩИЕ КАТЕГОРИИ (7)
  // ============================================
  
  venue: {
    id: 'venue',
    name: 'Venue',
    nameRu: 'Площадка',
    icon: '🏢',
    description: 'Площадка: студия, лофт, кафе/ресторан, квест‑комната, мастерская и др.',
    wizardSteps: 6,
    minPhotos: 5,
    subtypes: [
      // Развлекательные центры (8 типов)
      { id: 'entertainment_center', name: 'Детский развлекательный центр', description: 'Игровые зоны, лабиринты, аттракционы (Joki Joya, КидБург, Диво Остров)' },
      { id: 'trampoline_park', name: 'Батутный центр', description: 'Батуты, поролоновая яма, активные игры' },
      { id: 'karting', name: 'Картинг-центр', description: 'Картодром, гонки, соревнования' },
      { id: 'lasertag', name: 'Лазертаг / Пейнтбол', description: 'Командные игры, активные развлечения' },
      { id: 'vr_arena', name: 'VR-арена', description: 'Виртуальная реальность, игры' },
      { id: 'bowling', name: 'Боулинг / Бильярд', description: 'Боулинг, бильярд, игры' },
      { id: 'quest_room', name: 'Квест-комната', description: 'Эскейп-рум, головоломки' },
      { id: 'climbing_park', name: 'Скалодром / Веревочный парк', description: 'Скалолазание, веревочные трассы' },
      
      // Общественные места (2 типа)
      { id: 'cafe', name: 'Кафе / Ресторан', description: 'Детское меню, банкет' },
      { id: 'loft', name: 'Лофт / Event-студия', description: 'Современный интерьер, фотозона' },
      
      // Крупные развлекательные (1 тип)
      { id: 'water_park', name: 'Аквапарк / Бассейн', description: 'Водные горки, бассейны' },
      
      // Загородный отдых (5 типов)
      { id: 'recreation_base', name: 'База отдыха / Загородный клуб', description: 'Отдых на природе, коттеджи' },
      { id: 'farm', name: 'Ферма / Экоферма', description: 'Домашние животные, натуральные продукты' },
      { id: 'horse_club', name: 'Конный клуб', description: 'Катание на лошадях и пони' },
      { id: 'glamping', name: 'Глэмпинг', description: 'Комфортный кемпинг, палатки' },
      { id: 'outdoor', name: 'Открытая площадка', description: 'Парк, набережная, база отдыха' },
      
      // Мастерские (5 типов)
      { id: 'culinary_studio', name: 'Кулинарная студия', description: 'Мастер-классы по готовке' },
      { id: 'pottery_workshop', name: 'Гончарная мастерская', description: 'Керамика, лепка, гончарное дело' },
      { id: 'art_studio', name: 'Художественная студия', description: 'Рисование, живопись, творчество' },
      { id: 'woodworking_workshop', name: 'Столярная мастерская', description: 'Работа с деревом, поделки' },
      { id: 'sewing_workshop', name: 'Швейная мастерская', description: 'Шитье, рукоделие, вязание' },
      
      // Прочее
      { id: 'other', name: 'Другое', description: 'Нестандартная площадка' },
    ],
  },

  animator: {
    id: 'animator',
    name: 'Animator',
    nameRu: 'Аниматор',
    icon: '👤',
    description: 'Персонажи, клоуны, актёры на детские праздники',
    wizardSteps: 6,
    minPhotos: 3, // Минимум 3 фото костюмов
  },

  show: {
    id: 'show',
    name: 'Show',
    nameRu: 'Шоу-программа',
    icon: '🎪',
    description: 'Мыльные пузыри, научное шоу, фокусы, животные',
    wizardSteps: 6,
    minPhotos: 5,
    minVideos: 1, // Обязательно видео
    requiresDocuments: true,
    documentTypes: ['Сертификаты безопасности (для криошоу, животных)', 'Ветеринарные справки (для животных)'],
    subtypes: [
      { id: 'bubbles', name: 'Мыльные пузыри', description: 'Классическое, гигантские, человек в пузыре' },
      { id: 'science', name: 'Научное шоу', description: 'Химические, физические опыты' },
      { id: 'magic', name: 'Фокусы', description: 'Иллюзионист, карточные фокусы' },
      { id: 'animals', name: 'Животные', description: 'Собаки, птицы, рептилии, мини-зоопарк' },
      { id: 'cryo', name: 'Криошоу', description: 'Шоу с жидким азотом' },
      { id: 'light', name: 'Световое шоу', description: 'Неоновое, лазерное, LED' },
      { id: 'foam', name: 'Пенная вечеринка', description: 'Пенная пушка, дискотека' },
    ],
  },

  agency: {
    id: 'agency',
    name: 'Agency',
    nameRu: 'Агентство',
    icon: '🏢',
    description: 'Комплексная организация праздников "под ключ"',
    wizardSteps: 6,
    minPhotos: 10, // Большое портфолио
  },

  quest: {
    id: 'quest',
    name: 'Quest',
    nameRu: 'Выездной квест',
    icon: '🎯',
    description: 'Выездные квест‑игры (без своей локации). Если у вас есть квест‑комната — выбирайте “Площадка”.',
    wizardSteps: 6,
    minPhotos: 5,
    subtypes: [{ id: 'mobile', name: 'Выездной', description: 'Квест-игра с выездом к клиенту' }],
  },

  master_class: {
    id: 'master_class',
    name: 'MasterClass',
    nameRu: 'Выездной мастер-класс',
    icon: '🎨',
    description: 'Выездные творческие занятия и мастер‑классы. Если у вас студия/мастерская — выбирайте “Площадка”.',
    wizardSteps: 6,
    minPhotos: 5, // Фото работ участников
    subtypes: [
      { id: 'creative', name: 'Творческий', description: 'Рисование, лепка, декупаж' },
      { id: 'culinary', name: 'Кулинарный', description: 'Выпечка, украшение тортов, пицца' },
      { id: 'science', name: 'Научный', description: 'Робототехника, программирование, электроника' },
      { id: 'craft', name: 'Ремесленный', description: 'Гончарное дело, столярка, мыловарение' },
    ],
  },

  photographer: {
    id: 'photographer',
    name: 'Photographer',
    nameRu: 'Фото/Видео',
    icon: '📷',
    description: 'Фотосъёмка и видеосъёмка мероприятий',
    wizardSteps: 6,
    minPhotos: 10, // Портфолио
    subtypes: [
      { id: 'photo_only', name: 'Только фото', description: 'Фотосъёмка праздников' },
      { id: 'video_only', name: 'Только видео', description: 'Видеосъёмка и монтаж' },
      { id: 'photo_video', name: 'Фото и видео', description: 'Комплексная съёмка' },
    ],
  },

  // ============================================
  // НОВЫЕ КАТЕГОРИИ (6)
  // ============================================

  catering: {
    id: 'catering',
    name: 'Catering',
    nameRu: 'Кейтеринг',
    icon: '🍽️',
    description: 'Питание на мероприятия, фуршеты, банкеты',
    wizardSteps: 6,
    minPhotos: 10, // Фото блюд
    requiresDocuments: true,
    documentTypes: ['Санитарные книжки', 'Сертификаты качества'],
    subtypes: [
      { id: 'kids_menu', name: 'Детское питание', description: 'Детское меню, сладкий стол' },
      { id: 'buffet', name: 'Фуршет', description: 'Канапе, закуски, мини-блюда' },
      { id: 'banquet', name: 'Банкет', description: 'Полноценное застолье' },
      { id: 'bbq', name: 'Барбекю/Гриль', description: 'Шашлык, мясо на гриле' },
    ],
  },

  confectionery: {
    id: 'confectionery',
    name: 'Confectionery',
    nameRu: 'Кондитерская',
    icon: '🎂',
    description: 'Торты на заказ, капкейки, сладкий стол',
    wizardSteps: 6,
    minPhotos: 15, // Много фото работ
    requiresDocuments: true,
    documentTypes: ['Санитарная книжка', 'Сертификаты качества'],
    subtypes: [
      { id: 'cakes', name: 'Торты на заказ', description: 'Детские, фигурные, многоярусные' },
      { id: 'candy_bar', name: 'Сладкий стол (Candy Bar)', description: 'Комплексное оформление' },
      { id: 'desserts', name: 'Десерты', description: 'Капкейки, макаруны, пряники' },
    ],
  },

  decorator: {
    id: 'decorator',
    name: 'Decorator',
    nameRu: 'Декоратор',
    icon: '🎨',
    description: 'Оформление праздников: шары, текстиль, цветы',
    wizardSteps: 6,
    minPhotos: 15, // Портфолио работ
    subtypes: [
      { id: 'balloons', name: 'Шарами', description: 'Арки, фигуры, букеты из шаров' },
      { id: 'textile_flowers', name: 'Текстиль и цветы', description: 'Драпировки, цветочные композиции' },
      { id: 'full_decor', name: 'Полное оформление', description: 'Дизайн-проект "под ключ"' },
    ],
  },

  dj_musician: {
    id: 'dj_musician',
    name: 'DJ/Musician',
    nameRu: 'Диджей / Музыкант',
    icon: '🎵',
    description: 'Музыкальное сопровождение мероприятий',
    wizardSteps: 6,
    minPhotos: 5,
    minVideos: 1, // Видео/аудио выступлений
    subtypes: [
      { id: 'dj', name: 'Диджей (DJ)', description: 'Музыкальное сопровождение, дискотека' },
      { id: 'musician', name: 'Музыкант', description: 'Живое выступление (гитара, скрипка, вокал)' },
      { id: 'host_music', name: 'Ведущий с музыкой', description: 'Ведение + музыка' },
    ],
  },

  host: {
    id: 'host',
    name: 'Host',
    nameRu: 'Ведущий',
    icon: '🎤',
    description: 'Проведение детских и семейных праздников',
    wizardSteps: 6,
    minPhotos: 5,
    minVideos: 1, // Видео с мероприятий
    subtypes: [
      { id: 'kids', name: 'Детские мероприятия', description: 'Дни рождения, выпускные' },
      { id: 'family_corporate', name: 'Семейные/Корпоративные', description: 'Семейные праздники, корпоративы' },
    ],
  },

  transport: {
    id: 'transport',
    name: 'Transport',
    nameRu: 'Транспорт',
    icon: '🚗',
    description: 'Лимузины, ретро-авто, кареты для праздников',
    wizardSteps: 6,
    minPhotos: 5, // Фото транспорта
    requiresDocuments: true,
    documentTypes: ['Документы на транспорт', 'Лицензия на перевозки', 'Страховка'],
    subtypes: [
      { id: 'kids_transport', name: 'Детский транспорт', description: 'Паровозик, электромобили' },
      { id: 'limousine', name: 'Лимузин', description: 'Праздничный лимузин' },
      { id: 'retro', name: 'Ретро-автомобиль', description: 'Фотосессия у ретро-авто' },
      { id: 'carriage', name: 'Карета', description: 'Сказочная карета с лошадьми' },
    ],
  },
}

/**
 * Список всех категорий (упорядоченный)
 */
export const CATEGORIES_LIST: ProfileCategory[] = [
  'venue',
  'animator',
  'show',
  'agency',
  'quest',
  'master_class',
  'photographer',
  'catering',
  'confectionery',
  'decorator',
  'dj_musician',
  'host',
  'transport',
]

/**
 * Получить метаданные категории
 */
export function getCategoryMetadata(category: ProfileCategory): CategoryMetadata {
  return PROFILE_CATEGORIES[category]
}

/**
 * Получить подтипы для категории
 */
export function getCategorySubtypes(category: ProfileCategory): SubtypeMetadata[] {
  return PROFILE_CATEGORIES[category].subtypes || []
}

/**
 * Проверить, есть ли у категории подтипы
 */
export function hasSubtypes(category: ProfileCategory): boolean {
  const subtypes = PROFILE_CATEGORIES[category].subtypes
  return !!subtypes && subtypes.length > 0
}

/**
 * Alias для hasSubtypes (для обратной совместимости)
 */
export const categoryHasSubtypes = hasSubtypes


/**
 * Получить название категории на русском
 */
export function getCategoryName(category: ProfileCategory): string {
  return PROFILE_CATEGORIES[category].nameRu
}

/**
 * Получить иконку категории
 */
export function getCategoryIcon(category: ProfileCategory): string {
  return PROFILE_CATEGORIES[category].icon
}

/**
 * Проверить, требует ли категория документы
 */
export function requiresDocuments(category: ProfileCategory): boolean {
  return PROFILE_CATEGORIES[category].requiresDocuments || false
}

/**
 * Получить типы документов для категории
 */
export function getDocumentTypes(category: ProfileCategory): string[] {
  return PROFILE_CATEGORIES[category].documentTypes || []
}

/**
 * Получить минимальное количество фото для категории
 */
export function getMinPhotos(category: ProfileCategory): number {
  return PROFILE_CATEGORIES[category].minPhotos
}

/**
 * Получить минимальное количество видео для категории
 */
export function getMinVideos(category: ProfileCategory): number | undefined {
  return PROFILE_CATEGORIES[category].minVideos
}

/**
 * Валидация: достаточно ли фото для публикации
 */
export function hasEnoughPhotos(category: ProfileCategory, photoCount: number): boolean {
  return photoCount >= getMinPhotos(category)
}

/**
 * Валидация: достаточно ли видео для публикации
 */
export function hasEnoughVideos(category: ProfileCategory, videoCount: number): boolean {
  const minVideos = getMinVideos(category)
  if (minVideos === undefined) return true // Видео не обязательны
  return videoCount >= minVideos
}


