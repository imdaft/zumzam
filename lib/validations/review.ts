import * as z from 'zod'

/**
 * Схема валидации для создания отзыва
 */
export const createReviewSchema = z.object({
  profile_id: z.string().uuid('Некорректный ID профиля'),
  booking_id: z.string().uuid('Некорректный ID бронирования').optional(),
  
  // Рейтинг (1-5 звёзд)
  rating: z.coerce.number().min(1, 'Минимум 1 звезда').max(5, 'Максимум 5 звёзд'),
  
  // Текст отзыва
  comment: z.string()
    .min(10, 'Минимум 10 символов')
    .max(1000, 'Максимум 1000 символов'),
  
  // Фотографии отзыва (опционально)
  photos: z.array(z.string().url()).max(5, 'Максимум 5 фотографий').optional(),
  
  // Детальные оценки (опционально)
  quality_rating: z.coerce.number().min(1).max(5).optional(),
  service_rating: z.coerce.number().min(1).max(5).optional(),
  value_rating: z.coerce.number().min(1).max(5).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

/**
 * Схема валидации для обновления отзыва
 */
export const updateReviewSchema = z.object({
  comment: z.string()
    .min(10, 'Минимум 10 символов')
    .max(1000, 'Максимум 1000 символов')
    .optional(),
  
  photos: z.array(z.string().url()).max(5, 'Максимум 5 фотографий').optional(),
  
  // Статус модерации (только для админа)
  is_approved: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
})

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>

/**
 * Схема для фильтрации отзывов
 */
export const reviewFiltersSchema = z.object({
  profile_id: z.string().uuid().optional(),
  author_id: z.string().uuid().optional(),
  rating_min: z.coerce.number().min(1).max(5).optional(),
  rating_max: z.coerce.number().min(1).max(5).optional(),
  is_approved: z.enum(['true', 'false']).optional(),
  is_hidden: z.enum(['true', 'false']).optional(),
  sort: z.enum(['recent', 'rating_high', 'rating_low', 'helpful']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
})

export type ReviewFilters = z.infer<typeof reviewFiltersSchema>

/**
 * Схема для реакции на отзыв (лайк "полезно")
 */
export const reviewReactionSchema = z.object({
  review_id: z.string().uuid('Некорректный ID отзыва'),
  is_helpful: z.boolean(),
})

export type ReviewReactionInput = z.infer<typeof reviewReactionSchema>


