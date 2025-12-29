/**
 * Zod схемы валидации для заказов
 */

import * as z from 'zod'

/**
 * Схема для создания заказа
 */
export const createOrderSchema = z.object({
  // ID профиля и поставщика
  profile_id: z.string().uuid('Некорректный ID профиля'),
  provider_id: z.string().uuid('Некорректный ID поставщика'),
  
  // Информация о мероприятии
  event_date: z.string().refine(
    (date) => {
      const eventDate = new Date(date)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return eventDate >= now
    },
    { message: 'Дата мероприятия не может быть в прошлом' }
  ),
  event_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Некорректный формат времени (HH:MM)'),
  event_address: z.string().min(10, 'Укажите полный адрес (минимум 10 символов)'),
  
  // Опциональная информация
  child_age: z.coerce.number().min(1, 'Возраст от 1 года').max(18, 'Возраст до 18 лет').optional(),
  children_count: z.coerce.number().min(1, 'Минимум 1 ребенок').max(100, 'Максимум 100 детей').optional(),
  
  // Контактная информация клиента
  client_name: z.string().min(2, 'Минимум 2 символа'),
  client_phone: z.string().regex(/^\+?[0-9\s\-()]{10,}$/, 'Некорректный номер телефона'),
  client_email: z.string().email('Некорректный email'),
  client_message: z.string().max(1000, 'Максимум 1000 символов').optional(),
  
  // Согласие с условиями исполнителя
  agree_with_terms: z.boolean().refine(val => val === true, {
    message: 'Необходимо согласиться с условиями исполнителя',
  }),
})

export type CreateOrderFormData = z.infer<typeof createOrderSchema>

/**
 * Схема для обновления статуса заказа (поставщик)
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected']),
  provider_response: z.string().max(1000, 'Максимум 1000 символов').optional(),
})

export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>

