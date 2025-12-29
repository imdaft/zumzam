import { z } from 'zod'
import { ProfileCategory } from '@/lib/constants/profile-categories'

// ===== БАЗОВАЯ СХЕМА ДЛЯ ВСЕХ ПРОФИЛЕЙ =====

export const baseProfileSchema = z.object({
  category: z.enum([
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
  ] as const),
  display_name: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  bio: z.string().min(50, 'Минимум 50 символов').max(500, 'Максимум 500 символов'),
  city: z.string().min(2, 'Укажите город'),
  address: z.string().optional(),
  logo: z.string().url('Некорректный URL').nullable().optional(),
  cover_photo: z.string().url('Некорректный URL').nullable().optional(),
  photos: z.array(z.string().url()).min(3, 'Минимум 3 фото').max(50, 'Максимум 50 фото'),
  videos: z.array(z.string().url()).max(10, 'Максимум 10 видео'),
})

// ===== ПЛОЩАДКА (VENUE) =====

const venueSubtypeSchema = z.enum([
  'kids_center',
  'loft',
  'cafe',
  'park',
  'outdoor',
  'other',
])

const venueDetailsSchema = z.object({
  subtype: venueSubtypeSchema,
  capacity_min: z.number().int().min(1).optional(),
  capacity_max: z.number().int().min(1).optional(),
  area_sqm: z.number().int().min(10).optional(),
  age_groups: z.array(z.string()).optional(),
  
  // Специфично для детского центра
  play_zones: z.array(z.string()).optional(),
  animator_included: z.boolean().optional(),
  
  // Специфично для лофта
  interior_style: z.string().optional(),
  decor: z.record(z.boolean()).optional(),
  
  // Специфично для кафе
  menu_type: z.array(z.string()).optional(),
  own_food_allowed: z.boolean().optional(),
  
  // Общее
  amenities: z.record(z.boolean()).optional(),
  rules: z.record(z.boolean()).optional(),
})

export const venueProfileSchema = baseProfileSchema.extend({
  category: z.literal('venue'),
  details: venueDetailsSchema,
})

// ===== АНИМАТОР (ANIMATOR) =====

const animatorSubtypeSchema = z.enum([
  'character',
  'face_painting',
  'balloon_artist',
  'magician',
  'clown',
])

const animatorDetailsSchema = z.object({
  subtype: animatorSubtypeSchema.optional(),
  characters: z.array(z.string()).min(1, 'Укажите хотя бы одного персонажа'),
  experience_years: z.number().int().min(0).max(50),
  age_groups: z.array(z.string()).min(1),
  program_duration_min: z.number().int().min(15).optional(),
  program_duration_max: z.number().int().min(15).optional(),
  team_size: z.number().int().min(1).optional(),
  mobile: z.boolean().optional(),
})

export const animatorProfileSchema = baseProfileSchema.extend({
  category: z.literal('animator'),
  details: animatorDetailsSchema,
})

// ===== ШОУ-ПРОГРАММА (SHOW) =====

const showSubtypeSchema = z.enum([
  'bubbles',
  'science',
  'magic',
  'animals',
  'fire_show',
  'dance',
  'acrobatics',
])

const showDetailsSchema = z.object({
  subtype: showSubtypeSchema,
  duration_min: z.number().int().min(10),
  duration_max: z.number().int().optional(),
  age_groups: z.array(z.string()).min(1),
  participants_max: z.number().int().min(1).optional(),
  equipment_included: z.boolean().optional(),
  space_requirements: z.string().optional(),
  indoor: z.boolean().optional(),
  outdoor: z.boolean().optional(),
  safety_docs: z.boolean().optional(),
})

export const showProfileSchema = baseProfileSchema.extend({
  category: z.literal('show'),
  details: showDetailsSchema,
})

// ===== АГЕНТСТВО (AGENCY) =====

const agencyDetailsSchema = z.object({
  services: z.array(z.string()).min(1, 'Укажите хотя бы одну услугу'),
  experience_years: z.number().int().min(0).max(50),
  events_per_year: z.number().int().min(0).optional(),
  team_size: z.number().int().min(1).optional(),
  full_package: z.boolean().optional(),
  consultation: z.boolean().optional(),
  budget_min: z.number().int().min(0).optional(),
  budget_max: z.number().int().min(0).optional(),
})

export const agencyProfileSchema = baseProfileSchema.extend({
  category: z.literal('agency'),
  details: agencyDetailsSchema,
})

// ===== КВЕСТ (QUEST) =====

const questSubtypeSchema = z.enum([
  'escape_room',
  'mobile_quest',
  'outdoor_quest',
  'vr_quest',
])

const questDetailsSchema = z.object({
  subtype: questSubtypeSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration_min: z.number().int().min(30),
  participants_min: z.number().int().min(1),
  participants_max: z.number().int().min(1),
  age_min: z.number().int().min(6).max(18),
  theme: z.array(z.string()).min(1),
  hints_available: z.boolean().optional(),
  actor_included: z.boolean().optional(),
  mobile: z.boolean().optional(),
})

export const questProfileSchema = baseProfileSchema.extend({
  category: z.literal('quest'),
  details: questDetailsSchema,
})

// ===== МАСТЕР-КЛАСС (MASTER_CLASS) =====

const masterClassSubtypeSchema = z.enum([
  'creative',
  'cooking',
  'science',
  'craft',
])

const masterClassDetailsSchema = z.object({
  subtype: masterClassSubtypeSchema,
  duration_min: z.number().int().min(30),
  age_min: z.number().int().min(3),
  age_max: z.number().int().max(18).optional(),
  participants_min: z.number().int().min(1),
  participants_max: z.number().int().min(1),
  materials_included: z.boolean().optional(),
  mobile: z.boolean().optional(),
  topics: z.array(z.string()).min(1),
})

export const masterClassProfileSchema = baseProfileSchema.extend({
  category: z.literal('master_class'),
  details: masterClassDetailsSchema,
})

// ===== ФОТОГРАФ/ВИДЕОГРАФ (PHOTOGRAPHER) =====

const photographerSubtypeSchema = z.enum([
  'photographer',
  'videographer',
  'combo',
])

const photographerDetailsSchema = z.object({
  subtype: photographerSubtypeSchema,
  experience_years: z.number().int().min(0).max(50),
  event_types: z.array(z.string()).min(1),
  editing_included: z.boolean().optional(),
  delivery_days: z.number().int().min(1).max(90).optional(),
  equipment: z.array(z.string()).optional(),
  additional_services: z.array(z.string()).optional(),
})

export const photographerProfileSchema = baseProfileSchema.extend({
  category: z.literal('photographer'),
  details: photographerDetailsSchema,
})

// ===== КЕЙТЕРИНГ (CATERING) =====

const cateringSubtypeSchema = z.enum([
  'kids_menu',
  'buffet',
  'banquet',
  'bbq',
])

const cateringDetailsSchema = z.object({
  subtype: cateringSubtypeSchema,
  cuisine_types: z.array(z.string()).min(1),
  min_order: z.number().int().min(0).optional(),
  delivery: z.boolean().optional(),
  staff_included: z.boolean().optional(),
  equipment_included: z.boolean().optional(),
  custom_menu: z.boolean().optional(),
  dietary_options: z.array(z.string()).optional(),
})

export const cateringProfileSchema = baseProfileSchema.extend({
  category: z.literal('catering'),
  details: cateringDetailsSchema,
})

// ===== КОНДИТЕРСКАЯ (CONFECTIONERY) =====

const confectionerySubtypeSchema = z.enum([
  'cakes',
  'desserts',
  'candy_bar',
])

const confectioneryDetailsSchema = z.object({
  subtype: confectionerySubtypeSchema,
  products: z.array(z.string()).min(1),
  custom_design: z.boolean().optional(),
  dietary_options: z.array(z.string()).optional(),
  delivery: z.boolean().optional(),
  min_order_days: z.number().int().min(1).optional(),
})

export const confectioneryProfileSchema = baseProfileSchema.extend({
  category: z.literal('confectionery'),
  details: confectioneryDetailsSchema,
})

// ===== ДЕКОРАТОР (DECORATOR) =====

const decoratorSubtypeSchema = z.enum([
  'balloons',
  'flowers_textiles',
  'full_decor',
])

const decoratorDetailsSchema = z.object({
  subtype: decoratorSubtypeSchema,
  services: z.array(z.string()).min(1),
  themes: z.array(z.string()).optional(),
  delivery: z.boolean().optional(),
  setup_included: z.boolean().optional(),
  takedown_included: z.boolean().optional(),
  rental_available: z.boolean().optional(),
})

export const decoratorProfileSchema = baseProfileSchema.extend({
  category: z.literal('decorator'),
  details: decoratorDetailsSchema,
})

// ===== ДИДЖЕЙ/МУЗЫКАНТ (DJ_MUSICIAN) =====

const djMusicianSubtypeSchema = z.enum([
  'dj',
  'musician',
  'live_band',
])

const djMusicianDetailsSchema = z.object({
  subtype: djMusicianSubtypeSchema,
  genres: z.array(z.string()).min(1),
  equipment_included: z.boolean().optional(),
  experience_years: z.number().int().min(0).max(50),
  event_types: z.array(z.string()).min(1),
  duration_min: z.number().int().min(60).optional(),
  additional_services: z.array(z.string()).optional(),
})

export const djMusicianProfileSchema = baseProfileSchema.extend({
  category: z.literal('dj_musician'),
  details: djMusicianDetailsSchema,
})

// ===== ВЕДУЩИЙ (HOST) =====

const hostSubtypeSchema = z.enum([
  'kids',
  'family_corporate',
])

const hostDetailsSchema = z.object({
  subtype: hostSubtypeSchema,
  experience_years: z.number().int().min(0).max(50),
  age_groups: z.array(z.string()).min(1),
  program_types: z.array(z.string()).min(1),
  duration_min: z.number().int().min(60).optional(),
  bilingual: z.boolean().optional(),
  additional_services: z.array(z.string()).optional(),
})

export const hostProfileSchema = baseProfileSchema.extend({
  category: z.literal('host'),
  details: hostDetailsSchema,
})

// ===== ТРАНСПОРТ (TRANSPORT) =====

const transportSubtypeSchema = z.enum([
  'kids_transport',
  'limousine',
  'retro',
  'carriage',
])

const transportDetailsSchema = z.object({
  subtype: transportSubtypeSchema,
  capacity: z.number().int().min(1),
  vehicles: z.array(z.string()).min(1),
  driver_included: z.boolean().optional(),
  decoration_included: z.boolean().optional(),
  rental_min_hours: z.number().int().min(1).optional(),
  services: z.array(z.string()).optional(),
})

export const transportProfileSchema = baseProfileSchema.extend({
  category: z.literal('transport'),
  details: transportDetailsSchema,
})

// ===== УНИВЕРСАЛЬНАЯ ВАЛИДАЦИЯ =====

export const getProfileValidationSchema = (category: ProfileCategory) => {
  switch (category) {
    case 'venue':
      return venueProfileSchema
    case 'animator':
      return animatorProfileSchema
    case 'show':
      return showProfileSchema
    case 'agency':
      return agencyProfileSchema
    case 'quest':
      return questProfileSchema
    case 'master_class':
      return masterClassProfileSchema
    case 'photographer':
      return photographerProfileSchema
    case 'catering':
      return cateringProfileSchema
    case 'confectionery':
      return confectioneryProfileSchema
    case 'decorator':
      return decoratorProfileSchema
    case 'dj_musician':
      return djMusicianProfileSchema
    case 'host':
      return hostProfileSchema
    case 'transport':
      return transportProfileSchema
    default:
      return baseProfileSchema
  }
}

// ===== ТИПЫ =====

export type VenueProfile = z.infer<typeof venueProfileSchema>
export type AnimatorProfile = z.infer<typeof animatorProfileSchema>
export type ShowProfile = z.infer<typeof showProfileSchema>
export type AgencyProfile = z.infer<typeof agencyProfileSchema>
export type QuestProfile = z.infer<typeof questProfileSchema>
export type MasterClassProfile = z.infer<typeof masterClassProfileSchema>
export type PhotographerProfile = z.infer<typeof photographerProfileSchema>
export type CateringProfile = z.infer<typeof cateringProfileSchema>
export type ConfectioneryProfile = z.infer<typeof confectioneryProfileSchema>
export type DecoratorProfile = z.infer<typeof decoratorProfileSchema>
export type DjMusicianProfile = z.infer<typeof djMusicianProfileSchema>
export type HostProfile = z.infer<typeof hostProfileSchema>
export type TransportProfile = z.infer<typeof transportProfileSchema>

















