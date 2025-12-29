/**
 * Роли пользователей (НОВАЯ СИСТЕМА)
 */
export type UserRole = 'client' | 'provider' | 'admin'

/**
 * @deprecated Старые роли - используйте UserRole вместо этого
 */
export type UserRoleLegacy = 'parent' | 'animator' | 'studio' | 'admin'

/**
 * Режим просмотра интерфейса (для админа)
 */
export type ViewMode = 'client' | 'service'

/**
 * Статусы бронирования (старая система)
 */
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'dispute'

/**
 * Статусы заказа (новая система)
 */
export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'

/**
 * Статусы оплаты
 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'

/**
 * Категории услуг
 */
export type ServiceCategory = 'animation' | 'show' | 'photo' | 'video' | 'venue' | 'package' | 'other'

/**
 * Тип услуги (основная или дополнительная)
 */
export type ServiceType = 'main' | 'additional'

/**
 * Диапазоны цен
 */
export type PriceRange = '$' | '$$' | '$$$'

// ============================================
// Типы для корзины
// ============================================

/**
 * Элемент корзины
 */
export interface CartItem {
  id: string
  user_id: string
  service_id: string
  profile_id: string
  quantity: number
  price_snapshot: number
  notes?: string
  created_at: string
  updated_at: string
  // Дополнительные поля из JOIN
  service?: {
    id: string
    title: string
    description: string
    price: number
    service_type: ServiceType
    is_package: boolean
    images?: string[]
    profile_id: string
  }
  profile?: {
    id: string
    display_name: string
    slug: string
    city: string
  }
}

/**
 * Результат валидации корзины
 */
export interface CartValidation {
  is_valid: boolean
  error_message?: string
  has_main_or_package: boolean
  has_only_additional: boolean
}

// ============================================
// Типы для заказов
// ============================================

/**
 * Заказ
 */
export interface Order {
  id: string
  order_number?: string
  client_id: string
  provider_id: string
  profile_id: string
  conversation_id?: string | null
  status: OrderStatus
  total_amount: number
  payment_status: PaymentStatus
  event_date: string
  event_time: string
  event_address: string
  child_age?: number
  children_count?: number
  client_name: string
  client_phone: string
  client_email: string
  client_message?: string
  provider_response?: string
  provider_response_at?: string
  created_at: string
  updated_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  // Дополнительные поля из JOIN
  items?: OrderItem[]
  profile?: {
    id: string
    display_name: string
    slug: string
    city: string
    phone?: string
    email?: string
    logo?: string
    main_photo?: string
  }
  client?: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

/**
 * Элемент заказа
 */
export interface OrderItem {
  id: string
  order_id: string
  service_id: string
  service_title: string
  service_description?: string
  service_type: ServiceType
  is_package: boolean
  price: number
  quantity: number
  subtotal: number
  notes?: string
  created_at: string
}

/**
 * Данные для создания заказа
 */
export interface CreateOrderInput {
  profile_id: string
  provider_id: string
  event_date: string
  event_time: string
  event_address: string
  child_age?: number
  children_count?: number
  client_name: string
  client_phone: string
  client_email: string
  client_message?: string
}

/**
 * Данные для добавления в корзину
 */
export interface AddToCartInput {
  service_id: string
  profile_id: string
  quantity?: number
  notes?: string
  custom_price?: number // Для tier-пакетов
}

