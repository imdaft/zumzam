import * as z from 'zod'

/**
 * Схема валидации для создания бронирования
 */
export const createBookingSchema = z.object({
  service_id: z.string().uuid('Некорректный ID услуги'),
  profile_id: z.string().uuid('Некорректный ID профиля'),
  
  // Дата и время
  event_date: z.string().refine(
    (date) => {
      const eventDate = new Date(date)
      const now = new Date()
      return eventDate > now
    },
    { message: 'Дата мероприятия должна быть в будущем' }
  ),
  event_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Некорректный формат времени (HH:MM)'),
  
  // Детали мероприятия
  child_age: z.coerce.number().min(1, 'Возраст от 1 года').max(18, 'Возраст до 18 лет'),
  children_count: z.coerce.number().min(1, 'Минимум 1 ребенок').max(100, 'Максимум 100 детей'),
  
  // Адрес
  event_address: z.string().min(10, 'Укажите полный адрес (минимум 10 символов)'),
  
  // Пожелания и детали
  client_message: z.string().max(1000, 'Максимум 1000 символов').optional(),
  
  // Контактные данные (на случай если не авторизован)
  client_name: z.string().min(2, 'Минимум 2 символа').optional(),
  client_phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, 'Некорректный номер телефона').optional(),
  client_email: z.string().email('Некорректный email').optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

/**
 * Схема валидации для обновления статуса бронирования
 */
export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
})

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>

/**
 * Схема для фильтрации бронирований
 */
export const bookingFiltersSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'rejected']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  profile_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
})

export type BookingFilters = z.infer<typeof bookingFiltersSchema>

