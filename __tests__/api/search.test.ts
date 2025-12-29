/**
 * Тесты для API /api/search/semantic
 * 
 * Тестируем логику семантического поиска
 */

import { describe, it, expect } from 'vitest'

// Типы
interface SearchResult {
  id: string
  slug: string
  display_name: string
  city: string
  category: string
  similarity: number
}

// Хелпер-функции которые используются в API
function isValidSearchQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false
  const trimmed = query.trim()
  return trimmed.length >= 3 && trimmed.length <= 500
}

function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function filterResultsByCity(results: SearchResult[], city: string | null): SearchResult[] {
  if (!city) return results
  return results.filter(r => r.city.toLowerCase() === city.toLowerCase())
}

function filterResultsByCategory(results: SearchResult[], category: string | null): SearchResult[] {
  if (!category) return results
  return results.filter(r => r.category === category)
}

function sortBySimilarity(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => b.similarity - a.similarity)
}

function limitResults(results: SearchResult[], limit: number): SearchResult[] {
  return results.slice(0, Math.min(limit, 50))
}

function isAboveThreshold(result: SearchResult, threshold: number): boolean {
  return result.similarity >= threshold
}

function filterByThreshold(results: SearchResult[], threshold: number = 0.5): SearchResult[] {
  return results.filter(r => isAboveThreshold(r, threshold))
}

function extractKeywords(query: string): string[] {
  const stopWords = ['в', 'на', 'для', 'с', 'из', 'по', 'и', 'или', 'но']
  return normalizeSearchQuery(query)
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.includes(word))
}

function highlightMatches(text: string, keywords: string[]): string {
  let result = text
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  })
  return result
}

describe('API Search - Функции обработки данных', () => {
  const mockResults: SearchResult[] = [
    { id: '1', slug: 'super-animator', display_name: 'Супер Аниматор', city: 'Москва', category: 'animator', similarity: 0.92 },
    { id: '2', slug: 'party-studio', display_name: 'Праздничная Студия', city: 'Санкт-Петербург', category: 'venue', similarity: 0.85 },
    { id: '3', slug: 'hero-show', display_name: 'Шоу Супергероев', city: 'Москва', category: 'animator', similarity: 0.78 },
    { id: '4', slug: 'photo-zone', display_name: 'Фотозона Люкс', city: 'Казань', category: 'photographer', similarity: 0.65 },
    { id: '5', slug: 'cake-master', display_name: 'Торт Мастер', city: 'Москва', category: 'catering', similarity: 0.45 },
  ]

  describe('isValidSearchQuery', () => {
    it('принимает валидные запросы', () => {
      expect(isValidSearchQuery('аниматор на день рождения')).toBe(true)
      expect(isValidSearchQuery('abc')).toBe(true)
      expect(isValidSearchQuery('детский праздник в Москве')).toBe(true)
    })

    it('отклоняет слишком короткие запросы', () => {
      expect(isValidSearchQuery('ab')).toBe(false)
      expect(isValidSearchQuery('')).toBe(false)
      expect(isValidSearchQuery('  ')).toBe(false)
    })

    it('отклоняет невалидные типы', () => {
      expect(isValidSearchQuery(null as any)).toBe(false)
      expect(isValidSearchQuery(undefined as any)).toBe(false)
      expect(isValidSearchQuery(123 as any)).toBe(false)
    })
  })

  describe('normalizeSearchQuery', () => {
    it('приводит к нижнему регистру', () => {
      expect(normalizeSearchQuery('ТЕСТ')).toBe('тест')
    })

    it('удаляет лишние пробелы', () => {
      expect(normalizeSearchQuery('  аниматор   на   праздник  ')).toBe('аниматор на праздник')
    })
  })

  describe('filterResultsByCity', () => {
    it('фильтрует по городу', () => {
      const filtered = filterResultsByCity(mockResults, 'Москва')
      expect(filtered).toHaveLength(3)
      expect(filtered.every(r => r.city === 'Москва')).toBe(true)
    })

    it('возвращает все результаты если город не указан', () => {
      expect(filterResultsByCity(mockResults, null)).toHaveLength(5)
    })
  })

  describe('filterResultsByCategory', () => {
    it('фильтрует по категории', () => {
      const filtered = filterResultsByCategory(mockResults, 'animator')
      expect(filtered).toHaveLength(2)
    })

    it('возвращает все результаты если категория не указана', () => {
      expect(filterResultsByCategory(mockResults, null)).toHaveLength(5)
    })
  })

  describe('sortBySimilarity', () => {
    it('сортирует по убыванию similarity', () => {
      const shuffled = [...mockResults].reverse()
      const sorted = sortBySimilarity(shuffled)
      expect(sorted[0].similarity).toBe(0.92)
      expect(sorted[sorted.length - 1].similarity).toBe(0.45)
    })
  })

  describe('limitResults', () => {
    it('ограничивает количество результатов', () => {
      expect(limitResults(mockResults, 2)).toHaveLength(2)
    })

    it('не превышает максимум в 50', () => {
      const manyResults = Array(100).fill(mockResults[0])
      expect(limitResults(manyResults, 100)).toHaveLength(50)
    })

    it('возвращает все если меньше лимита', () => {
      expect(limitResults(mockResults, 100)).toHaveLength(5)
    })
  })

  describe('filterByThreshold', () => {
    it('фильтрует результаты ниже порога', () => {
      const filtered = filterByThreshold(mockResults, 0.7)
      expect(filtered).toHaveLength(3)
      expect(filtered.every(r => r.similarity >= 0.7)).toBe(true)
    })

    it('использует порог по умолчанию 0.5', () => {
      const filtered = filterByThreshold(mockResults)
      expect(filtered).toHaveLength(4)
    })
  })

  describe('extractKeywords', () => {
    it('извлекает ключевые слова', () => {
      const keywords = extractKeywords('аниматор на детский праздник в Москве')
      expect(keywords).toContain('аниматор')
      expect(keywords).toContain('детский')
      expect(keywords).toContain('праздник')
      expect(keywords).toContain('москве')
    })

    it('удаляет стоп-слова', () => {
      const keywords = extractKeywords('праздник в Москве и в Питере')
      expect(keywords).not.toContain('в')
      expect(keywords).not.toContain('и')
    })

    it('удаляет короткие слова', () => {
      const keywords = extractKeywords('я не ты')
      expect(keywords).toHaveLength(0)
    })
  })

  describe('highlightMatches', () => {
    it('оборачивает совпадения в <mark>', () => {
      const result = highlightMatches('Супер Аниматор на праздник', ['аниматор', 'праздник'])
      expect(result).toContain('<mark>Аниматор</mark>')
      expect(result).toContain('<mark>праздник</mark>')
    })

    it('не меняет текст без совпадений', () => {
      const text = 'Тестовый текст'
      expect(highlightMatches(text, ['нет'])).toBe(text)
    })
  })
})
