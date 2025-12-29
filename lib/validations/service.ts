import { z } from 'zod'

export const ServiceTypeEnum = z.enum([
  'animator',
  'show',
  'venue',
  'quest',
  'master_class',
  'photographer',
  'decoration', // Оформление
  'other',
  'service', // Дополнительная услуга
  'package', // Пакетное предложение
  'turnkey', // Праздник под ключ
])

export type ServiceType = z.infer<typeof ServiceTypeEnum>

// Теги для фильтрации услуг
export const SERVICE_TAGS = [
  'Аниматор',
  'Шоу',
  'Площадка',
  'Квест',
  'Мастер-класс',
  'Фотограф',
  'Оформление',
  'Для малышей',
  'Для школьников',
  'Интерактив',
  'На выезд',
  'В помещении',
  'На улице'
] as const

// Длительности услуг (в минутах)
export const DURATIONS = [
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
  { value: 180, label: '3 часа' },
  { value: 240, label: '4 часа' },
  { value: 300, label: '5 часов' },
] as const

// Возрастные категории
export const AGE_CATEGORIES = [
  { value: '0-3', label: '0-3 года' },
  { value: '3-6', label: '3-6 лет' },
  { value: '6-10', label: '6-10 лет' },
  { value: '10-14', label: '10-14 лет' },
  { value: '14-18', label: '14-18 лет' },
] as const

// --- Base Service Schema ---
export const baseServiceSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100), // Для формы
  name: z.string().optional(), // Для API (автоматически маппится из title)
  description: z.string().min(1, 'Описание обязательно'),
  price: z.coerce.number().min(0),
  price_type: z.enum(['fixed', 'hourly', 'per_person', 'from']),
  duration: z.coerce.number().optional(), // in minutes
  images: z.array(z.string()).default([]), // Убрал .url() - файлы могут быть локальными путями
  service_type: ServiceTypeEnum,
  is_additional: z.boolean().default(false), // Добавлено поле для дополнительных услуг
  is_package: z.boolean().default(false), // Праздник под ключ
  package_includes: z.array(z.string()).default([]), // Что включено в пакет (для одиночного пакета)
})

// --- Details Schemas ---

export const animatorDetailsSchema = z.object({
  characters: z.array(z.string()).default([]), // Список персонажей
  is_costume_included: z.boolean().default(true),
  has_microphone: z.boolean().default(false),
  experience_years: z.coerce.number().optional(),
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    highlighted_includes: z.array(z.string()).optional(), // Пункты, которые нужно выделить как уникальные
    savings: z.number().optional(), // Экономия в рублях (например, 5000 = экономия 5000₽)
    price_options: z.array(z.object({
      condition: z.string(), // "Будни", "Выходные", "Пятница" и т.д.
      price: z.number()
    })).optional() // До 3 вариантов цены
  })).optional(), // Для многоуровневых пакетов
})

export const showDetailsSchema = z.object({
  program_type: z.string().optional(), // e.g. "Мыльное", "Химическое"
  tech_requirements: z.string().optional(),
  safe_area_width: z.coerce.number().optional(),
  safe_area_depth: z.coerce.number().optional(),
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    highlighted_includes: z.array(z.string()).optional(),
    savings: z.number().optional(),
    price_options: z.array(z.object({
      condition: z.string(),
      price: z.number()
    })).optional()
  })).optional(),
})

export const venueDetailsSchema = z.object({
  capacity: z.coerce.number().min(1),
  area_sqm: z.coerce.number().optional(),
  ceiling_height: z.coerce.number().optional(),
  amenities: z.array(z.string()).default([]), // "WiFi", "Parking"
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    highlighted_includes: z.array(z.string()).optional(),
    savings: z.number().optional(),
    price_options: z.array(z.object({
      condition: z.string(),
      price: z.number()
    })).optional()
  })).optional(),
})

export const questDetailsSchema = z.object({
  age_min: z.coerce.number().min(0).default(6),
  age_max: z.coerce.number().min(0).default(16),
  participants_min: z.coerce.number().min(1).default(2),
  participants_max: z.coerce.number().min(1).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    highlighted_includes: z.array(z.string()).optional(),
    savings: z.number().optional(),
    price_options: z.array(z.object({
      condition: z.string(),
      price: z.number()
    })).optional()
  })).optional(),
})

export const masterClassDetailsSchema = z.object({
  age_min: z.coerce.number().default(3),
  materials_included: z.boolean().default(true),
  result_take_home: z.boolean().default(true), // Забирают ли поделку с собой
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    highlighted_includes: z.array(z.string()).optional(),
    savings: z.number().optional(),
    price_options: z.array(z.object({
      condition: z.string(),
      price: z.number()
    })).optional()
  })).optional(),
})

export const photographerDetailsSchema = z.object({
  delivery_days: z.coerce.number().default(7),
  photos_count: z.coerce.number().optional(), // Количество фото
  equipment: z.string().optional(),
  tier_packages: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number().default(60),
    includes: z.array(z.string()),
    price_options: z.array(z.object({
      condition: z.string(),
      price: z.number()
    })).optional()
  })).optional(),
})

// --- Combined Schema ---
// Мы используем discriminated union, чтобы валидировать details в зависимости от service_type
export const serviceSchema = z.discriminatedUnion('service_type', [
  baseServiceSchema.extend({ service_type: z.literal('animator'), details: animatorDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('show'), details: showDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('venue'), details: venueDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('quest'), details: questDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('master_class'), details: masterClassDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('photographer'), details: photographerDetailsSchema }),
  baseServiceSchema.extend({ service_type: z.literal('decoration'), details: z.object({
    tier_packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      includes: z.array(z.string())
    })).optional(),
  }) }),
  baseServiceSchema.extend({ service_type: z.literal('other'), details: z.object({
    tier_packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      includes: z.array(z.string())
    })).optional(),
  }) }),
  // Новые типы для разделения услуг
  baseServiceSchema.extend({ service_type: z.literal('service'), details: z.object({
    tier_packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      includes: z.array(z.string())
    })).optional(),
  }) }),
  baseServiceSchema.extend({ service_type: z.literal('package'), details: z.object({
    tier_packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      duration: z.number().default(60),
      includes: z.array(z.string()),
      highlighted_includes: z.array(z.string()).optional(),
      savings: z.number().optional(),
      price_options: z.array(z.object({
        condition: z.string(),
        price: z.number()
      })).optional()
    })).optional(),
  }) }),
  baseServiceSchema.extend({ service_type: z.literal('turnkey'), details: z.object({
    tier_packages: z.array(z.object({
      name: z.string(),
      price: z.number(),
      duration: z.number().default(60),
      includes: z.array(z.string()),
      highlighted_includes: z.array(z.string()).optional(),
      savings: z.number().optional(),
      price_options: z.array(z.object({
        condition: z.string(),
        price: z.number()
      })).optional()
    })).optional(),
  }) }),
])

export type ServiceFormValues = z.infer<typeof serviceSchema>
