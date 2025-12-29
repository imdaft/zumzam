/**
 * Настройка тестового окружения
 */

import { vi } from 'vitest'

// Мокаем переменные окружения
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key')

// Мокаем window.matchMedia (для компонентов с медиа-запросами)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Мокаем ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Мокаем IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Подавляем console в тестах (опционально)
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})

