/**
 * Общие моки для Supabase клиента
 * 
 * Эти моки используются в тестах для изоляции от реальной базы данных
 */

import { vi } from 'vitest'

// Мок данные - базовые сущности
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

export const mockProfile = {
  id: 'test-profile-id-123',
  user_id: mockUser.id,
  slug: 'test-studio',
  display_name: 'Тестовая студия',
  bio: 'Описание студии',
  description: 'Полное описание студии',
  city: 'Москва',
  address: 'ул. Тестовая, 1',
  category: 'venue',
  rating: 4.5,
  reviews_count: 10,
  is_published: true,
  verified: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockOrder = {
  id: 'test-order-id-123',
  client_id: mockUser.id,
  provider_id: 'provider-user-id',
  profile_id: mockProfile.id,
  status: 'pending',
  total_amount: 5000,
  payment_status: 'unpaid',
  event_date: '2025-01-15',
  event_time: '14:00',
  event_address: 'ул. Праздничная, 5',
  client_name: 'Иван Тестов',
  client_phone: '+79991234567',
  client_email: 'client@test.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

/**
 * Создание универсального мок query builder
 */
export const createQueryBuilder = (data: any = null, error: any = null) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn().mockImplementation((callback) => 
      Promise.resolve({ 
        data, 
        error, 
        count: Array.isArray(data) ? data.length : 0 
      }).then(callback)
    ),
  }
  return builder
}

/**
 * Создание мок Supabase клиента
 */
export const createMockSupabaseClient = (options: {
  user?: typeof mockUser | null
  authError?: any
  queryData?: any
  queryError?: any
} = {}) => {
  const { 
    user = mockUser, 
    authError = null, 
    queryData = null, 
    queryError = null 
  } = options

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: authError,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: user ? { user } : null },
        error: authError,
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => createQueryBuilder(queryData, queryError)),
    rpc: vi.fn().mockResolvedValue({ data: queryData, error: queryError }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      }),
    },
  }
}

// Глобальный мок для createClient
export const mockCreateClient = vi.fn()

/**
 * Хелпер для быстрой настройки мока
 */
export const setupSupabaseMock = (options: Parameters<typeof createMockSupabaseClient>[0] = {}) => {
  const mockClient = createMockSupabaseClient(options)
  mockCreateClient.mockResolvedValue(mockClient)
  return mockClient
}
