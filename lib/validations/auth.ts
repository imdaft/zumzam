import { z } from 'zod'

/**
 * Схема валидации для формы логина
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Схема валидации для формы регистрации
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email'),
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  confirmPassword: z
    .string()
    .min(1, 'Подтверждение пароля обязательно'),
  fullName: z
    .string()
    .min(1, 'Имя обязательно')
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное'),
  role: z.enum(['parent', 'animator', 'studio'], {
    required_error: 'Выберите тип аккаунта',
  }),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        // Если значение пустое, это валидно (optional)
        if (!val || val.length === 0) return true
        // Проверяем формат телефона (базовая проверка для РФ)
        return /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(val)
      },
      {
        message: 'Некорректный формат телефона (пример: +7 900 123 45 67)',
      }
    ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Схема валидации для формы восстановления пароля
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Некорректный email'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Схема валидации для формы обновления пароля
 */
export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(100, 'Пароль слишком длинный'),
  confirmPassword: z
    .string()
    .min(1, 'Подтверждение пароля обязательно'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

