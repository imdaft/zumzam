/**
 * 🔥 ОБНОВЛЕННЫЕ ТИПЫ ДЛЯ ПРОФИЛЕЙ
 * С поддержкой новой многомерной классификации
 */

// ========================================
// ЕНАМЫ (соответствуют БД)
// ========================================

export type PrimaryVenueType =
  | 'active_entertainment'
  | 'quest_escape'
  | 'creative_studio'
  | 'event_space'
  | 'vr_digital'
  | 'animal_interaction'
  | 'outdoor_recreation'

export type BusinessModel =
  | 'rental_only'
  | 'tickets_freeplay'
  | 'packages_turnkey'
  | 'mobile_services'
  | 'hybrid'

export type SpaceType =
  | 'loft_studio'
  | 'mall_venue'
  | 'closed_arena'
  | 'outdoor'
  | 'country_base'
  | 'mobile'

// ========================================
// НОВЫЕ ПОЛЯ (из MISSING_DB_FIELDS_ANALYSIS)
// ========================================

export interface WorkingHours {
  format: '24/7' | 'by_appointment' | 'schedule'
  schedule?: {
    monday?: { open: string; close: string }
    tuesday?: { open: string; close: string }
    wednesday?: { open: string; close: string }
    thursday?: { open: string; close: string }
    friday?: { open: string; close: string }
    saturday?: { open: string; close: string }
    sunday?: { open: string; close: string }
  }
  breaks?: string[]
  notes?: string
}

export interface MetroStation {
  name: string
  line: string
  distance_meters: number
  walk_time_minutes: number
}

export interface ParkingInfo {
  available: boolean
  type?: 'free' | 'paid' | 'street' | 'underground'
  capacity?: number
  notes?: string
}

export interface AgeRestrictions {
  min_age?: number
  max_age?: number
  unaccompanied_age?: number
  notes?: string
}

export interface CapacityInfo {
  max_children?: number
  max_adults?: number
  recommended_children?: number
  notes?: string
}

export interface PaymentMethods {
  cash: boolean
  card: boolean
  online: boolean
  installment: boolean
  sbp: boolean
}

export interface MessengerContacts {
  whatsapp?: string
  telegram?: string
  viber?: string
}

export interface Accessibility {
  wheelchair_accessible: boolean
  elevator: boolean
  ramp: boolean
  stroller_friendly: boolean
  restroom_accessible: boolean
}

export interface Amenities {
  wifi: boolean
  air_conditioning: boolean
  heating: boolean
  wardrobe: boolean
  restrooms: boolean
  parent_lounge: boolean
  cafe: boolean
  changing_room: boolean
}

export interface PrepaymentPolicy {
  required: boolean
  amount_type?: 'percent' | 'fixed'
  amount_value?: number
  refund_policy?: string
  deadline_hours?: number
}

export interface AreaInfo {
  total_sqm?: number
  play_area_sqm?: number
  banquet_area_sqm?: number
}

export interface StructuredAddress {
  country?: string
  city?: string
  district?: string
  street?: string
  building?: string
  floor?: string
  office?: string
  postal_code?: string
}

// ========================================
// ОСНОВНОЙ ТИП ПРОФИЛЯ
// ========================================

export interface Profile {
  // Идентификация
  id: string
  slug: string
  display_name: string
  bio?: string
  description?: string
  
  // Новая классификация
  primary_venue_type?: PrimaryVenueType
  activities?: string[]
  business_models?: BusinessModel[]
  space_type?: SpaceType
  additional_services?: string[]
  
  // Поиск и теги
  search_vector?: unknown
  tags?: string[]
  
  // Местоположение
  city?: string
  address?: string
  structured_address?: StructuredAddress
  geo_location?: {
    type: 'Point'
    coordinates: [number, number]
  }
  
  // Критичные поля
  working_hours?: WorkingHours
  metro_stations?: MetroStation[]
  parking_info?: ParkingInfo
  
  // Важные поля
  age_restrictions?: AgeRestrictions
  capacity_info?: CapacityInfo
  payment_methods?: PaymentMethods
  messenger_contacts?: MessengerContacts
  
  // Желательные поля
  accessibility?: Accessibility
  amenities?: Amenities
  prepayment_policy?: PrepaymentPolicy
  area_info?: AreaInfo
  
  // Контакты
  email?: string
  phone?: string
  website?: string
  social_links?: Record<string, string>
  
  // Медиа
  photos?: string[]
  videos?: string[]
  cover_photo?: string
  main_photo?: string
  
  // Контент для блоков
  turnkey_packages?: TurnkeyPackage[]
  ticket_pricing?: TicketPricing
  hourly_rates?: HourlyRate[]
  catering_menu?: CateringMenuItem[]
  
  // Настройки отображения
  section_order?: string[]
  hidden_blocks?: string[]
  section_templates?: {
    mobile?: Record<string, string>
    desktop?: Record<string, string>
  }
  
  // Рейтинг и отзывы
  rating?: number
  reviews_count?: number
  bookings_completed?: number
  response_time_minutes?: number
  
  // Прочее
  price_range?: string
  verified?: boolean
  verification_date?: string
  is_published?: boolean
  category?: string
  details?: Record<string, any>
  
  // Временные метки
  created_at: string
  updated_at: string
}

// ========================================
// ТИПЫ ДЛЯ БЛОКОВ
// ========================================

export interface TurnkeyPackage {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  max_children: number
  includes: string[]
  image?: string
}

export interface TicketPricing {
  weekday_price: number
  weekend_price: number
  unlimited_price?: number
  notes?: string
}

export interface HourlyRate {
  item: string
  price: number
  unit: string
  description?: string
}

export interface CateringMenuItem {
  id: string
  name: string
  category: string
  price: number
  description?: string
  allergens?: string[]
  vegetarian?: boolean
  image?: string
}

// ========================================
// КАТАЛОГИ
// ========================================

export interface Activity {
  id: string
  name_ru: string
  name_en: string
  category: 'active' | 'creative' | 'entertainment' | 'other'
  icon: string
  description?: string
  created_at: string
}

export interface Service {
  id: string
  name_ru: string
  name_en: string
  category: 'event' | 'food' | 'media' | 'other'
  icon: string
  description?: string
  created_at: string
}





