/**
 * Утилиты для проверки готовности профиля к верификации
 */

export interface VerificationCheck {
  isReady: boolean
  checklist: {
    hasName: boolean
    hasContacts: boolean
    hasPhotos: boolean
    hasServices: boolean
    hasDescription: boolean
    hasAddress: boolean
  }
  missingItems: string[]
}

/**
 * Проверяет готовность профиля к верификации
 */
export function checkProfileReadiness(profile: any, services: any[] = []): VerificationCheck {
  // Проверяем адрес: либо напрямую в профиле, либо хотя бы одна локация с адресом
  const hasAddressInProfile = Boolean(profile.city && profile.address)
  const hasAddressInLocations = Boolean(
    profile.profile_locations && 
    profile.profile_locations.length > 0 && 
    profile.profile_locations.some((loc: any) => loc.city && loc.address)
  )
  const hasAddress = hasAddressInProfile || hasAddressInLocations

  // Проверяем услуги: старая система (таблица services) ИЛИ новая (primary_services/activities из wizard)
  const hasOldServices = Boolean(services && services.length >= 1)
  const hasNewServices = Boolean(
    (profile.primary_services && profile.primary_services.length >= 1) ||
    (profile.activities && profile.activities.length >= 1)
  )
  const totalServicesCount = (services?.length || 0) + (profile.primary_services?.length || 0) + (profile.activities?.length || 0)

  console.log('[checkProfileReadiness] Checking profile:', {
    display_name: profile.display_name,
    phone: profile.phone,
    email: profile.email,
    photos_count: profile.photos?.length || 0,
    old_services_count: services.length,
    primary_services_count: profile.primary_services?.length || 0,
    activities_count: profile.activities?.length || 0,
    additional_services_count: profile.additional_services?.length || 0,
    total_services: totalServicesCount,
    hasOldServices,
    hasNewServices,
    description_length: profile.description?.length || 0,
    city: profile.city,
    address: profile.address,
    profile_locations_count: profile.profile_locations?.length || 0,
    hasAddressInProfile,
    hasAddressInLocations,
    hasAddress
  })

  const checklist = {
    hasName: Boolean(profile.display_name && profile.display_name.length >= 3),
    hasContacts: Boolean(profile.phone && profile.email),
    hasPhotos: Boolean(
      (profile.photos && profile.photos.length >= 3) || 
      (profile.main_photo && profile.gallery && profile.gallery.length >= 2)
    ),
    hasServices: hasOldServices || hasNewServices,
    hasDescription: Boolean(profile.description && profile.description.length >= 50),
    hasAddress: hasAddress,
  }

  console.log('[checkProfileReadiness] Checklist result:', checklist)

  const missingItems: string[] = []
  
  if (!checklist.hasName) {
    missingItems.push('Название (минимум 3 символа)')
  }
  if (!checklist.hasContacts) {
    missingItems.push('Телефон и email')
  }
  if (!checklist.hasPhotos) {
    missingItems.push('Минимум 3 фотографии')
  }
  if (!checklist.hasServices) {
    missingItems.push('Хотя бы 1 услуга')
  }
  if (!checklist.hasDescription) {
    missingItems.push('Описание (минимум 50 символов)')
  }
  if (!checklist.hasAddress) {
    missingItems.push('Город и адрес')
  }

  const isReady = Object.values(checklist).every(check => check === true)

  return {
    isReady,
    checklist,
    missingItems,
  }
}

/**
 * Получает текст статуса верификации для отображения
 */
export function getVerificationStatusText(status: string): {
  label: string
  description: string
  color: string
  bgColor: string
  icon: string
} {
  switch (status) {
    case 'draft':
      return {
        label: 'Черновик',
        description: 'Профиль не готов к проверке',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '📝',
      }
    case 'pending':
      return {
        label: 'На проверке',
        description: 'Ваш профиль отправлен на модерацию',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '⏳',
      }
    case 'approved':
      return {
        label: 'Верифицирован',
        description: 'Профиль успешно прошёл проверку',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '✅',
      }
    case 'rejected':
      return {
        label: 'Отклонён',
        description: 'Профиль не прошёл проверку',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '❌',
      }
    default:
      return {
        label: 'Неизвестно',
        description: '',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '❓',
      }
  }
}

