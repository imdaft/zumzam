import { z } from 'zod'

// Общие схемы
const checkboxSchema = z.boolean().default(false)
const multiSelectSchema = z.array(z.string()).default([])

// 1. Аниматоры (Частные)
export const AnimatorDetailsSchema = z.object({
  age: z.coerce.number().min(14, 'Минимальный возраст 14 лет').max(99).optional(),
  experience_years: z.coerce.number().min(0).optional(),
  has_med_book: checkboxSchema,
  has_car: checkboxSchema,
  has_music_equipment: checkboxSchema,
  characters: multiSelectSchema, // Человек-паук, Эльза...
  programs: multiSelectSchema,   // Экспресс, Шоу мыльных пузырей...
})

// 2. Шоу
export const ShowDetailsSchema = z.object({
  show_type: z.enum(['bubble', 'science', 'paper', 'tesla', 'animals', 'magic', 'fire', 'other']).optional(),
  duration_options: z.array(z.number()).default([]), // [30, 60, 90] минут
  requirements: z.object({
    electricity: checkboxSchema,
    darkness: checkboxSchema,
    space_min_sqm: z.coerce.number().optional(),
    cleanup_required: checkboxSchema,
  }).optional(),
})

// 3. Площадки (Venues)
export const VenueDetailsSchema = z.object({
  capacity_max: z.coerce.number().min(1).optional(),
  area_sqm: z.coerce.number().min(1).optional(),
  amenities: z.object({
    parking: checkboxSchema,
    kitchen: checkboxSchema,
    own_food_allowed: checkboxSchema,
    parents_area: checkboxSchema,
    wifi: checkboxSchema,
  }).optional(),
})

// 4. Агентства
export const AgencyDetailsSchema = z.object({
  animators_count: z.coerce.number().min(0).optional(),
  own_costumes: checkboxSchema,
  services: z.object({
    animators: checkboxSchema,
    shows: checkboxSchema,
    catering: checkboxSchema,
    decor: checkboxSchema,
    cakes: checkboxSchema,
  }).optional(),
  website_url: z.string().url().optional().or(z.literal('')),
})

// 5. Квесты
export const QuestDetailsSchema = z.object({
  min_age: z.coerce.number().min(0).optional(),
  genre: z.enum(['scary', 'logical', 'active', 'performance', 'other']).optional(),
  format: z.enum(['on_site', 'studio']).optional(), // Выездной или в студии
  duration_minutes: z.coerce.number().optional(),
})

// 6. Мастер-классы
export const MasterClassDetailsSchema = z.object({
  type: z.enum(['cooking', 'art', 'slime', 'craft', 'science', 'other']).optional(),
  result_type: z.enum(['take_away', 'eat', 'digital', 'experience']).optional(), // Забрать, Съесть...
  materials_included: checkboxSchema,
})

// 7. Фотографы
export const PhotographerDetailsSchema = z.object({
  specialization: multiSelectSchema, // Репортаж, Постановка...
  delivery_days: z.coerce.number().optional(),
  has_extra_light: checkboxSchema,
  has_video: checkboxSchema,
})

export type AnimatorDetails = z.infer<typeof AnimatorDetailsSchema>
export type ShowDetails = z.infer<typeof ShowDetailsSchema>
export type VenueDetails = z.infer<typeof VenueDetailsSchema>
export type AgencyDetails = z.infer<typeof AgencyDetailsSchema>
export type QuestDetails = z.infer<typeof QuestDetailsSchema>
export type MasterClassDetails = z.infer<typeof MasterClassDetailsSchema>
export type PhotographerDetails = z.infer<typeof PhotographerDetailsSchema>

