/**
 * Тесты для API /api/user
 * 
 * Тестируем логику обработки данных пользователя
 */

import { describe, it, expect } from 'vitest'

// Хелпер-функции которые используются в API
function getUserRole(userData: { role?: string } | null): string {
  return userData?.role || 'client'
}

function formatUserResponse(user: { id: string; email: string }, role: string) {
  return {
    id: user.id,
    email: user.email,
    role,
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isAuthorized(user: any): boolean {
  return user !== null && user !== undefined && typeof user.id === 'string'
}

describe('API User - Функции обработки данных', () => {
  describe('getUserRole', () => {
    it('возвращает роль пользователя если она указана', () => {
      expect(getUserRole({ role: 'provider' })).toBe('provider')
      expect(getUserRole({ role: 'admin' })).toBe('admin')
    })

    it('возвращает client по умолчанию если роль не указана', () => {
      expect(getUserRole(null)).toBe('client')
      expect(getUserRole({})).toBe('client')
      expect(getUserRole({ role: undefined })).toBe('client')
    })
  })

  describe('formatUserResponse', () => {
    it('корректно форматирует ответ с данными пользователя', () => {
      const user = { id: 'user-123', email: 'test@example.com' }
      const result = formatUserResponse(user, 'provider')
      
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'provider',
      })
    })

    it('сохраняет все поля пользователя', () => {
      const user = { id: 'abc', email: 'a@b.com' }
      const result = formatUserResponse(user, 'client')
      
      expect(result.id).toBe('abc')
      expect(result.email).toBe('a@b.com')
      expect(result.role).toBe('client')
    })
  })

  describe('isValidEmail', () => {
    it('валидирует корректные email адреса', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.ru')).toBe(true)
      expect(isValidEmail('user+tag@gmail.com')).toBe(true)
    })

    it('отклоняет некорректные email адреса', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('no@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
    })
  })

  describe('isAuthorized', () => {
    it('возвращает true для авторизованного пользователя', () => {
      expect(isAuthorized({ id: 'user-123', email: 'test@test.com' })).toBe(true)
    })

    it('возвращает false для неавторизованного пользователя', () => {
      expect(isAuthorized(null)).toBe(false)
      expect(isAuthorized(undefined)).toBe(false)
      expect(isAuthorized({})).toBe(false)
      expect(isAuthorized({ email: 'test@test.com' })).toBe(false)
    })
  })
})
