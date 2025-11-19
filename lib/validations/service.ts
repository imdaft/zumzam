import { z } from 'zod'

/**
 * Схема валидации для создания/обновления услуги
 */
export const serviceSchema = z.object({
  title: z
    .string()
    .min(5, 'Название должно содержать минимум 5 символов')
    .max(200, 'Название слишком длинное'),
  
  description: z
    .string()
    .min(20, 'Описание должно содержать минимум 20 символов')
    .max(3000, 'Описание слишком длинное'),
  
  category_id: z
    .string()
    .uuid('Некорректный ID категории')
    .optional()
    .nullable(),
  
  // Цена может быть фиксированной или диапазоном
  price: z
    .number()
    .min(0, 'Цена не может быть отрицательной')
    .optional()
    .nullable(),
  
  price_from: z
    .number()
    .min(0, 'Цена не может быть отрицательной')
    .optional()
    .nullable(),
  
  price_to: z
    .number()
    .min(0, 'Цена не может быть отрицательной')
    .optional()
    .nullable(),
  
  currency: z
    .string()
    .default('RUB'),
  
  duration_minutes: z
    .number()
    .int('Длительность должна быть целым числом')
    .min(15, 'Минимальная длительность 15 минут')
    .max(1440, 'Максимальная длительность 24 часа')
    .optional()
    .nullable(),
  
  age_from: z
    .number()
    .int('Возраст должен быть целым числом')
    .min(0, 'Возраст не может быть отрицательным')
    .max(18, 'Максимальный возраст 18 лет')
    .optional()
    .nullable(),
  
  age_to: z
    .number()
    .int('Возраст должен быть целым числом')
    .min(0, 'Возраст не может быть отрицательным')
    .max(18, 'Максимальный возраст 18 лет')
    .optional()
    .nullable(),
  
  capacity_min: z
    .number()
    .int('Вместимость должна быть целым числом')
    .min(1, 'Минимальная вместимость 1 человек')
    .optional()
    .nullable(),
  
  capacity_max: z
    .number()
    .int('Вместимость должна быть целым числом')
    .min(1, 'Минимальная вместимость 1 человек')
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string())
    .max(10, 'Максимум 10 тегов')
    .default([]),
  
  active: z
    .boolean()
    .default(true),
  
  featured: z
    .boolean()
    .default(false),
}).refine(
  (data) => {
    // Проверяем, что указана хотя бы одна цена
    return data.price !== null || (data.price_from !== null && data.price_to !== null)
  },
  {
    message: 'Укажите фиксированную цену или диапазон цен',
    path: ['price'],
  }
).refine(
  (data) => {
    // Если указан диапазон цен, price_to должна быть больше price_from
    if (data.price_from !== null && data.price_to !== null) {
      return data.price_to >= data.price_from
    }
    return true
  },
  {
    message: 'Максимальная цена должна быть больше или равна минимальной',
    path: ['price_to'],
  }
).refine(
  (data) => {
    // Если указан возраст, age_to должен быть больше age_from
    if (data.age_from !== null && data.age_to !== null) {
      return data.age_to >= data.age_from
    }
    return true
  },
  {
    message: 'Максимальный возраст должен быть больше или равен минимальному',
    path: ['age_to'],
  }
).refine(
  (data) => {
    // Если указана вместимость, capacity_max должна быть больше capacity_min
    if (data.capacity_min !== null && data.capacity_max !== null) {
      return data.capacity_max >= data.capacity_min
    }
    return true
  },
  {
    message: 'Максимальная вместимость должна быть больше или равна минимальной',
    path: ['capacity_max'],
  }
)

export type ServiceInput = z.infer<typeof serviceSchema>

/**
 * Схема для обновления услуги (все поля опциональны кроме валидации связей)
 */
export const serviceUpdateSchema = serviceSchema.partial()

export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>

/**
 * Популярные теги для услуг
 */
export const SERVICE_TAGS = [
  // Типы мероприятий
  'День рождения',
  'Выпускной',
  'Новый год',
  'Корпоратив',
  '8 марта',
  '23 февраля',
  'Выпускной в саду',
  'Выпускной в школе',
  
  // Форматы
  'Праздник под ключ',
  'Выездное мероприятие',
  'В студии',
  'На природе',
  'Онлайн',
  'Офлайн',
  
  // Направления
  'Аниматоры',
  'Квест',
  'Мастер-класс',
  'Шоу-программа',
  'Научное шоу',
  'Фокусы',
  'Театральное представление',
  'Кукольный театр',
  'Дискотека',
  'Караоке',
  
  // Персонажи и темы
  'Супергерои',
  'Принцессы',
  'Единороги',
  'Пираты',
  'Феи',
  'Роботы',
  'Космос',
  'Динозавры',
  'Гарри Поттер',
  'Холодное сердце',
  'Человек-паук',
  'Minecraft',
  
  // Активности
  'Игры',
  'Конкурсы',
  'Танцы',
  'Песни',
  'Рисование',
  'Лепка',
  'Аквагрим',
  'Твистинг (шарики)',
  'Фотосессия',
  'Подарки',
  
  // Дополнительно
  'С реквизитом',
  'С костюмами',
  'С декорациями',
  'С музыкой',
  'С угощениями',
  'С аниматором',
  'Без аниматора',
]

/**
 * Категории услуг по возрастам
 */
export const AGE_CATEGORIES = [
  { label: '0-3 года', value: { from: 0, to: 3 } },
  { label: '3-6 лет', value: { from: 3, to: 6 } },
  { label: '6-9 лет', value: { from: 6, to: 9 } },
  { label: '9-12 лет', value: { from: 9, to: 12 } },
  { label: '12+ лет', value: { from: 12, to: 18 } },
  { label: 'Любой возраст', value: { from: 0, to: 18 } },
]

/**
 * Популярные длительности
 */
export const DURATIONS = [
  { label: '30 минут', value: 30 },
  { label: '1 час', value: 60 },
  { label: '1.5 часа', value: 90 },
  { label: '2 часа', value: 120 },
  { label: '3 часа', value: 180 },
  { label: '4 часа', value: 240 },
  { label: 'Полдня (6 часов)', value: 360 },
  { label: 'Целый день (8+ часов)', value: 480 },
]


