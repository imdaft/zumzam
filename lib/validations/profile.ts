import { z } from 'zod'

/**
 * Схема валидации для создания/обновления профиля студии/аниматора
 */
export const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название слишком длинное'),
  
  slug: z
    .string()
    .min(2, 'URL-адрес должен содержать минимум 2 символа')
    .max(50, 'URL-адрес слишком длинный')
    .regex(
      /^[a-z0-9-]+$/,
      'URL-адрес может содержать только латинские буквы, цифры и дефисы'
    ),
  
  bio: z
    .string()
    .max(500, 'Краткое описание слишком длинное')
    .optional(),
  
  description: z
    .string()
    .min(50, 'Подробное описание должно содержать минимум 50 символов')
    .max(5000, 'Описание слишком длинное'),
  
  city: z
    .string()
    .optional(), // Сделали опциональным, так как берем из locations
  
  address: z
    .string()
    .max(200, 'Адрес слишком длинный')
    .optional(),

  category: z.enum([
    'venue', 
    'animator', 
    'agency', 
    'show', 
    'quest', 
    'master_class', 
    'photographer'
  ], {
    required_error: 'Выберите категорию профиля',
  }),

  secondary_categories: z
    .array(
      z.enum([
        'venue', 
        'animator', 
        'agency', 
        'show', 
        'quest', 
        'master_class', 
        'photographer'
      ])
    )
    .optional()
    .default([]),

  // 🎯 НОВАЯ СИСТЕМА КЛАССИФИКАЦИИ
  primary_venue_type: z
    .string()
    .optional(),
  
  activities: z
    .array(z.string())
    .optional()
    .default([]),
  
  primary_services: z
    .array(z.string())
    .optional()
    .default([]),
  
  additional_services: z
    .array(z.string())
    .optional()
    .default([]),
  
  business_models: z
    .array(z.enum(['rental_only', 'tickets_freeplay', 'packages_turnkey', 'hybrid']))
    .optional()
    .default([]),
  
  services: z
    .array(z.string())
    .optional()
    .default([]),

  details: z.any().optional(),
  
  price_range: z
    .enum(['$', '$$', '$$$'], {
      required_error: 'Выберите ценовой диапазон',
    })
    .optional(),
  
  email: z
    .string()
    .email('Некорректный email')
    .optional(),
  
  phone: z
    .string()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true
        return /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(val)
      },
      {
        message: 'Некорректный формат телефона',
      }
    )
    .optional(),
  
  website: z
    .string()
    .url('Некорректный URL сайта')
    .optional()
    .or(z.literal('')),
  
    social_links: z
      .object({
        vk: z.string().url('Некорректная ссылка VK').optional().or(z.literal('')),
        instagram: z.string().url('Некорректная ссылка Instagram').optional().or(z.literal('')),
        tiktok: z.string().url('Некорректная ссылка TikTok').optional().or(z.literal('')),
        telegram: z.string().optional().or(z.literal('')),
        youtube: z.string().url('Некорректная ссылка YouTube').optional().or(z.literal('')),
      })
      .optional(),
  
  locations_menu_label: z
    .string()
    .max(50, 'Название слишком длинное')
    .optional()
    .or(z.literal('')),
  
  portfolio_url: z
    .string()
    .url('Некорректный URL портфолио')
    .optional()
    .or(z.literal('')),
  
  is_published: z
    .boolean()
    .default(false)
    .optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

/**
 * Схема для обновления профиля (все поля опциональны)
 */
export const profileUpdateSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  bio: z.string().max(500).optional(),
  description: z.string().min(50).max(5000).optional(),
  city: z.string().min(1).optional(),
  address: z.string().max(200).optional(),
  price_range: z.enum(['$', '$$', '$$$']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  social_links: z.object({
    vk: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    tiktok: z.string().url().optional().or(z.literal('')),
    telegram: z.string().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
  }).optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

/**
 * Генерация slug из названия
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Транслитерация русских букв
    .replace(/а/g, 'a')
    .replace(/б/g, 'b')
    .replace(/в/g, 'v')
    .replace(/г/g, 'g')
    .replace(/д/g, 'd')
    .replace(/е/g, 'e')
    .replace(/ё/g, 'yo')
    .replace(/ж/g, 'zh')
    .replace(/з/g, 'z')
    .replace(/и/g, 'i')
    .replace(/й/g, 'y')
    .replace(/к/g, 'k')
    .replace(/л/g, 'l')
    .replace(/м/g, 'm')
    .replace(/н/g, 'n')
    .replace(/о/g, 'o')
    .replace(/п/g, 'p')
    .replace(/р/g, 'r')
    .replace(/с/g, 's')
    .replace(/т/g, 't')
    .replace(/у/g, 'u')
    .replace(/ф/g, 'f')
    .replace(/х/g, 'h')
    .replace(/ц/g, 'ts')
    .replace(/ч/g, 'ch')
    .replace(/ш/g, 'sh')
    .replace(/щ/g, 'sch')
    .replace(/ъ/g, '')
    .replace(/ы/g, 'y')
    .replace(/ь/g, '')
    .replace(/э/g, 'e')
    .replace(/ю/g, 'yu')
    .replace(/я/g, 'ya')
    // Убираем все, кроме латиницы, цифр и дефисов
    .replace(/[^a-z0-9-\s]/g, '')
    // Заменяем пробелы на дефисы
    .replace(/\s+/g, '-')
    // Убираем повторяющиеся дефисы
    .replace(/-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-|-$/g, '')
}

