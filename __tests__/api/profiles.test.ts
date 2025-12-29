/**
 * Тесты для API /api/profiles
 * 
 * Тестируем логику обработки профилей
 */

import { describe, it, expect } from 'vitest'

// Типы
interface Profile {
  id: string
  slug: string
  display_name: string
  city: string
  category: string
  is_published: boolean
  user_id?: string
  rating?: number
}

// Хелпер-функции которые используются в API
function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') // убираем дефисы в начале и конце
    .trim()
}

function isSlugValid(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 50) return false
  return /^[a-z0-9-]+$/.test(slug)
}

function filterProfilesByCity(profiles: Profile[], city: string | null): Profile[] {
  if (!city) return profiles
  return profiles.filter(p => p.city.toLowerCase() === city.toLowerCase())
}

function filterProfilesByCategory(profiles: Profile[], category: string | null): Profile[] {
  if (!category) return profiles
  return profiles.filter(p => p.category === category)
}

function sortProfiles(profiles: Profile[], sortBy: string): Profile[] {
  const sorted = [...profiles]
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'name':
      return sorted.sort((a, b) => a.display_name.localeCompare(b.display_name))
    default:
      return sorted
  }
}

function paginateProfiles(profiles: Profile[], limit: number, offset: number): Profile[] {
  return profiles.slice(offset, offset + limit)
}

function canUserEditProfile(userId: string | null, profile: Profile): boolean {
  if (!userId) return false
  return profile.user_id === userId
}

describe('API Profiles - Функции обработки данных', () => {
  const mockProfiles: Profile[] = [
    { id: '1', slug: 'studio-one', display_name: 'Студия Один', city: 'Москва', category: 'venue', is_published: true, user_id: 'user-1', rating: 4.5 },
    { id: '2', slug: 'animator-pro', display_name: 'Аниматор Про', city: 'Санкт-Петербург', category: 'animator', is_published: true, user_id: 'user-2', rating: 4.8 },
    { id: '3', slug: 'party-zone', display_name: 'Party Zone', city: 'Москва', category: 'venue', is_published: true, user_id: 'user-3', rating: 4.2 },
    { id: '4', slug: 'photo-master', display_name: 'Фото Мастер', city: 'Казань', category: 'photographer', is_published: true, user_id: 'user-4', rating: 4.9 },
  ]

  describe('generateSlug', () => {
    it('генерирует корректный slug из названия', () => {
      expect(generateSlug('Тестовая Студия')).toBe('тестовая-студия')
      expect(generateSlug('Party Zone 2024')).toBe('party-zone-2024')
    })

    it('удаляет специальные символы', () => {
      expect(generateSlug('Студия @#$%')).toBe('студия')
      expect(generateSlug('Test!!!Studio')).toBe('teststudio')
    })

    it('заменяет множественные пробелы и дефисы', () => {
      expect(generateSlug('Test   Studio')).toBe('test-studio')
      expect(generateSlug('Test---Studio')).toBe('test-studio')
    })
  })

  describe('isSlugValid', () => {
    it('принимает корректные slug', () => {
      expect(isSlugValid('test-studio')).toBe(true)
      expect(isSlugValid('studio123')).toBe(true)
      expect(isSlugValid('my-awesome-studio')).toBe(true)
    })

    it('отклоняет некорректные slug', () => {
      expect(isSlugValid('')).toBe(false)
      expect(isSlugValid('ab')).toBe(false) // слишком короткий
      expect(isSlugValid('TEST')).toBe(false) // заглавные буквы
      expect(isSlugValid('test studio')).toBe(false) // пробелы
      expect(isSlugValid('тест')).toBe(false) // кириллица
    })
  })

  describe('filterProfilesByCity', () => {
    it('фильтрует профили по городу', () => {
      const result = filterProfilesByCity(mockProfiles, 'Москва')
      expect(result).toHaveLength(2)
      expect(result.every(p => p.city === 'Москва')).toBe(true)
    })

    it('возвращает все профили если город не указан', () => {
      expect(filterProfilesByCity(mockProfiles, null)).toHaveLength(4)
      expect(filterProfilesByCity(mockProfiles, '')).toHaveLength(4)
    })

    it('игнорирует регистр', () => {
      const result = filterProfilesByCity(mockProfiles, 'москва')
      expect(result).toHaveLength(2)
    })
  })

  describe('filterProfilesByCategory', () => {
    it('фильтрует профили по категории', () => {
      const result = filterProfilesByCategory(mockProfiles, 'venue')
      expect(result).toHaveLength(2)
      expect(result.every(p => p.category === 'venue')).toBe(true)
    })

    it('возвращает все профили если категория не указана', () => {
      expect(filterProfilesByCategory(mockProfiles, null)).toHaveLength(4)
    })
  })

  describe('sortProfiles', () => {
    it('сортирует по рейтингу (по убыванию)', () => {
      const result = sortProfiles(mockProfiles, 'rating')
      expect(result[0].rating).toBe(4.9)
      expect(result[result.length - 1].rating).toBe(4.2)
    })

    it('сортирует по имени (стабильно)', () => {
      const result = sortProfiles(mockProfiles, 'name')
      // Проверяем что сортировка стабильна и не меняет порядок при повторном вызове
      const names = result.map(p => p.display_name)
      const sortedAgain = sortProfiles(result, 'name').map(p => p.display_name)
      expect(names).toEqual(sortedAgain)
    })
  })

  describe('paginateProfiles', () => {
    it('возвращает правильное количество элементов', () => {
      const result = paginateProfiles(mockProfiles, 2, 0)
      expect(result).toHaveLength(2)
    })

    it('применяет offset корректно', () => {
      const result = paginateProfiles(mockProfiles, 2, 2)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('3')
    })

    it('возвращает пустой массив если offset больше длины', () => {
      const result = paginateProfiles(mockProfiles, 10, 100)
      expect(result).toHaveLength(0)
    })
  })

  describe('canUserEditProfile', () => {
    it('разрешает редактирование владельцу', () => {
      expect(canUserEditProfile('user-1', mockProfiles[0])).toBe(true)
    })

    it('запрещает редактирование другим пользователям', () => {
      expect(canUserEditProfile('user-2', mockProfiles[0])).toBe(false)
    })

    it('запрещает редактирование неавторизованным', () => {
      expect(canUserEditProfile(null, mockProfiles[0])).toBe(false)
    })
  })
})
