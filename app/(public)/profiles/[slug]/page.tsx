import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import prisma from '@/lib/prisma'
import { type Section } from '@/components/features/profile/lavka-style/profile-sidebar-left'
import { ProfilePageClient } from '@/components/features/profile/profile-page-client'
import { ProfileCart } from '@/components/features/profile/lavka-style/profile-cart'
import { ServiceCard } from '@/components/features/profile/lavka-style/service-card'
import { ProfileMap } from '@/components/features/profile/profile-map'
import { ChatWidget } from '@/components/features/ai/chat-widget'
import { Star, MapPin, Clock, Image as ImageIcon, Play, Home as HomeIcon, Globe, Instagram, Send } from 'lucide-react'
import Image from 'next/image'
import { ReviewList } from '@/components/features/review/review-list'
import { YandexReviewsWidget } from '@/components/features/yandex-reviews/yandex-reviews-widget'
import { VenueCharacteristics } from '@/components/features/profile/venue/venue-characteristics'
import { LocationsTabs } from '@/components/features/profile/venue/locations-tabs'
import { AnimatorCharacteristics } from '@/components/features/profile/animator/animator-characteristics'
import { AnimatorCharactersSection } from '@/components/features/animator/animator-characters-section'
import { ProfileSettingsButton } from '@/components/features/profile/profile-settings-button'
import { PhotoGalleryClient } from '@/components/features/profile/photo-gallery-client'
import { AboutSectionClient } from '@/components/features/profile/templates/about-section-client'
import { PackageTiersDisplay } from '@/components/features/packages/package-tiers-display'
import { ProfileFAQ } from '@/components/features/profile/profile-faq'
import { TurnkeyPackagesBlock } from '@/components/features/profile/turnkey/turnkey-packages-block'
import { LocalBusinessSchema } from '@/components/seo/local-business-schema'
import { Breadcrumbs } from '@/components/seo/breadcrumb-schema'
import { FAQSchema } from '@/components/seo/faq-schema'
import { ClaimProfileBanner } from '@/components/features/profile/claim-profile-banner'
import { ContactsBlock } from '@/components/features/profile/contacts/contacts-block'
import { ServicesBlock } from '@/components/features/profile/services/services-block'
import { ProfileActivitiesServices } from '@/components/features/profile/profile-activities-services'
import { ShowProgramsSection } from '@/components/features/show/show-programs-section'
import { QuestProgramsSection } from '@/components/features/quest/quest-programs-section'
import { MasterClassProgramsSection } from '@/components/features/master-class/master-class-programs-section'
import { getVenueTypeName } from '@/lib/constants/venue-types'
import { PhotographyStylesSection } from '@/components/features/photographer/photography-styles-section'
import { AgencyPartnersSection } from '@/components/features/agency/agency-partners-section'
import { AgencyCasesSection } from '@/components/features/agency/agency-cases-section'
import { ProfileAnalyticsTracker } from '@/components/features/profile/profile-analytics-tracker'

// Страница использует cookies (getCurrentUser), поэтому должна быть динамической
export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

// Маппинг типов услуг на русские названия
const SERVICE_TYPE_LABELS: Record<string, string> = {
  animator: 'Аниматоры',
  show: 'Шоу-программы',
  venue: 'Аренда площадок',
  quest: 'Квесты',
  master_class: 'Мастер-классы',
  photographer: 'Фотографы',
  decoration: 'Оформление',
  other: 'Другое'
}

async function getProfile(slug: string) {
  try {
    console.log('[getProfile] prisma:', typeof prisma, prisma ? 'defined' : 'undefined')
    const profile = await prisma.profiles.findFirst({
      where: {
        slug: slug,
        is_published: true,
      },
      include: {
        profile_locations: {
          select: {
            id: true,
            city: true,
            address: true,
            name: true,
            phone: true,
            email: true,
            active: true,
            is_main: true,
            details: true,
            yandex_url: true,
            yandex_rating: true,
            yandex_review_count: true,
            photos: true,
            video_url: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    })

    return profile
  } catch (error) {
    console.error('[getProfile] Error:', error)
    return null
  }
}

async function getProfileServices(profileId: string) {
  try {
    const services = await prisma.services.findMany({
      where: {
        profile_id: profileId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    // Конвертируем Decimal в number для клиентских компонентов
    return services.map((service: any) => ({
      ...service,
      price: service.price ? Number(service.price) : null,
      price_from: service.price_from ? Number(service.price_from) : null,
      price_to: service.price_to ? Number(service.price_to) : null,
    }))
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

async function getWorkGeography(profileId: string) {
  try {
    const areas = await prisma.work_geography.findMany({
      where: {
        profile_id: profileId,
      },
      select: {
        area_name: true,
        price_modifier: true,
        travel_time: true,
      },
      orderBy: {
        area_name: 'asc',
      },
    })

    return areas || []
  } catch (error) {
    return []
  }
}

// Получает данные Yandex отзывов для всех локаций профиля
async function getYandexReviewsData(profileId: string, locationIds: string[]) {
  try {
    if (!locationIds || locationIds.length === 0) {
      return { totalRating: null, totalCount: 0 }
    }

    const caches = await prisma.yandex_reviews_cache.findMany({
      where: {
        profile_location_id: {
          in: locationIds,
        },
      },
      select: {
        rating: true,
        review_count: true,
      },
    })

    if (!caches || caches.length === 0) {
      return { totalRating: null, totalCount: 0 }
    }

    // Суммируем количество отзывов
    const totalCount = caches.reduce((sum, cache) => sum + (cache.review_count || 0), 0)
    
    // Вычисляем средний рейтинг (взвешенный)
    let totalRating = 0
    let totalReviews = 0
    caches.forEach(cache => {
      if (cache.rating && cache.review_count) {
        totalRating += cache.rating * cache.review_count
        totalReviews += cache.review_count
      }
    })
    
    const avgRating = totalReviews > 0 ? totalRating / totalReviews : null

    return {
      totalRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      totalCount
    }
  } catch (error) {
    console.error('Error fetching Yandex reviews data:', error)
    return { totalRating: null, totalCount: 0 }
  }
}

// Получает данные внутренних отзывов
async function getInternalReviewsData(profileId: string) {
  try {
    const reviews = await prisma.reviews.findMany({
      where: {
        profile_id: profileId,
        // moderated и visible не существуют в схеме
      },
      select: {
        rating: true,
      },
    })

    if (!reviews || reviews.length === 0) {
      return { rating: null, count: 0 }
    }

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length

    return {
      rating: Number(avgRating.toFixed(1)),
      count: reviews.length
    }
  } catch (error) {
    console.error('Error fetching internal reviews:', error)
    return { rating: null, count: 0 }
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params
  
  // ОПТИМИЗАЦИЯ: Параллельные запросы вместо последовательных
  
  
  // 1. Параллельно: профиль + пользователь
  const [profileResult, userResult] = await Promise.all([
    getProfile(slug),
    getCurrentUser()
  ])
  
  const profile = profileResult
  if (!profile) {
    notFound()
  }

  const user = userResult
  const isOwner = user?.id === profile.user_id
  const isAdmin = user?.role === 'admin'
  const canEdit = isOwner || isAdmin

  // Получаем активные локации (нужны для следующих запросов)
  const activeLocations = profile.profile_locations?.filter((loc: any) => loc.active !== false) || []
  const reviewsSource = (profile.details as any)?.reviews_source || 'internal'
  const locationIds = activeLocations
    .filter((loc: any) => loc.yandex_url)
    .map((loc: any) => loc.id)

  // 2. ПАРАЛЛЕЛЬНО: все остальные данные
  const [allServices, reviewsData, workAreas] = await Promise.all([
    // Услуги
    getProfileServices(profile.id),
    
    // Пакетные предложения (пока отключено - таблица не мигрирована)
    // TODO: Восстановить после миграции package_tiers
    
    // Отзывы (выбираем источник)
    reviewsSource === 'yandex' && locationIds.length > 0
      ? getYandexReviewsData(profile.id, locationIds)
      : getInternalReviewsData(profile.id)
    ,
    // География работы (районы/города)
    getWorkGeography(profile.id),
  ])

  const packageTiersData = [] // TODO: Восстановить после миграции package_tiers
  
  // Разделяем услуги на основные и дополнительные
  const mainServices = allServices.filter((s: any) => !s.is_additional)
  const additionalServices = allServices.filter((s: any) => s.is_additional)

  // Обрабатываем данные отзывов
  let displayRating = profile.rating
  let displayReviewsCount = profile.reviews_count || 0
  
  if (reviewsSource === 'yandex' && locationIds.length > 0) {
    const yandexData = reviewsData as { totalRating: number | null; totalCount: number }
      if (yandexData.totalRating !== null) {
        displayRating = yandexData.totalRating
      }
      displayReviewsCount = yandexData.totalCount
    } else {
    const internalData = reviewsData as { rating: number | null; count: number }
    if (internalData.rating !== null) {
      displayRating = internalData.rating
    }
    displayReviewsCount = internalData.count
  }

  // Разделяем пакетные услуги и обычные
  const packageServices = mainServices.filter((s: any) => s.is_package)
  const regularMainServices = mainServices.filter((s: any) => !s.is_package)

  // Многоуровневые пакеты (tier_packages)
  const tierPackageService = packageServices.find((s: any) => s.details?.tier_packages && s.details.tier_packages.length > 0)
  
  // Простые пакеты (без tier_packages)
  const simplePackages = packageServices.filter((s: any) => !s.details?.tier_packages || s.details.tier_packages.length === 0)
  
  // Простые пакетные предложения
  const packagesList = simplePackages.map((s: any) => ({
    id: s.id,
    profile_id: profile.id, // Добавляем для корзины
    title: s.title,
    price: s.price,
    price_type: s.price_type,
    duration: s.duration ? `${s.duration} мин` : undefined,
    image: s.images && s.images.length > 0 ? s.images : null,
    description: s.description,
    is_package: true,
    package_includes: s.details?.package_includes || []
  }))

  // Группировка ОСНОВНЫХ услуг по категориям (без пакетов)
  const groupedMainServices = regularMainServices.reduce((acc: any, service: any) => {
    const type = service.service_type || 'other'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(service)
    return acc
  }, {})

  const mainServicesList = Object.keys(groupedMainServices).map(type => ({
    category: SERVICE_TYPE_LABELS[type] || 'Услуги',
    items: groupedMainServices[type].map((s: any) => ({
      id: s.id,
      profile_id: profile.id, // Добавляем для корзины
      title: s.title,
      price: s.price,
      price_type: s.price_type, // Передаем price_type
      duration: s.duration ? `${s.duration} мин` : undefined,
      image: s.images && s.images.length > 0 ? s.images : null,
      description: s.description,
      is_package: false,
      package_includes: []
    }))
  }))

  // Дополнительные услуги (без группировки по типам)
  const additionalServicesList = additionalServices.map((s: any) => ({
    id: s.id,
    profile_id: profile.id, // Добавляем для корзины
    title: s.title,
    price: s.price,
    price_type: s.price_type, // Передаем price_type
    duration: s.duration ? `${s.duration} мин` : undefined,
    image: s.images && s.images.length > 0 ? s.images : null,
    description: s.description,
    is_package: s.details?.is_package || false,
    package_includes: s.details?.package_includes || []
  }))

  const coverPhoto = profile.cover_photo || 'https://images.unsplash.com/photo-1530103862676-de3c9da59af7?auto=format&fit=crop&q=80&w=1200&h=400'

  const hasPortfolio = (profile.photos && profile.photos.length > 0) || (profile.videos && profile.videos.length > 0)

  // Динамически формируем меню на основе наличия контента
  const menuSections: Section[] = [
    { id: 'about', label: 'О нас', iconName: 'User' }
  ]

  // Добавляем пункт меню для локаций (если есть адреса)
  // Используем кастомное название или дефолтное
  const locationsLabel = activeLocations.length > 0 
    ? (profile.locations_menu_label || (activeLocations.length === 1 ? 'Наш адрес' : 'Наши адреса'))
    : ''
  
  if (activeLocations.length > 0) {
    menuSections.push({ id: 'locations', label: locationsLabel, iconName: 'MapPin' })
  }

  // Аниматоры: отдельный блок персонажей/программ
  if (profile.category === 'animator') {
    menuSections.push({ id: 'characters', label: 'Персонажи', iconName: 'Sparkles' })
  }

  // Добавляем "Пакеты" только если есть многоуровневые пакеты
  if (profile.category !== 'animator' && tierPackageService && tierPackageService.details?.tier_packages && tierPackageService.details.tier_packages.length > 0) {
    menuSections.push({ id: 'packages', label: 'Пакеты', iconName: 'Package' })
  }

  // Добавляем "Праздники под ключ" только если есть простые пакеты
  if (profile.category !== 'animator' && packagesList.length > 0) {
    menuSections.push({ id: 'turnkey', label: 'Праздники под ключ', iconName: 'Gift' })
  }

  // Добавляем "Услуги" если есть основные услуги, иначе если есть дополнительные - привязываем к ним
  if (profile.category === 'animator') {
    // Для аниматоров показываем оба пункта, если есть данные
    if (mainServicesList.length > 0) {
      menuSections.push({ id: 'services', label: 'Программы', iconName: 'Sparkles' })
    }
    if (additionalServicesList.length > 0) {
      menuSections.push({ id: 'additional-services', label: 'Доп. услуги', iconName: 'Sparkles' })
    }
  } else {
    // Для остальных (venue, show и т.д.) - тоже показываем оба пункта
    if (mainServicesList.length > 0) {
      menuSections.push({ id: 'services', label: 'Услуги', iconName: 'Sparkles' })
    }
    if (additionalServicesList.length > 0) {
      menuSections.push({ id: 'additional-services', label: 'Доп. услуги', iconName: 'Sparkles' })
    }
  }

  // Добавляем "Фото и видео" если есть портфолио
  if (hasPortfolio) {
    menuSections.push({ id: 'portfolio', label: 'Фото и видео', iconName: 'ImageIcon' })
  }

  // Добавляем "Отзывы" только для не-venue (для venue отзывы в локациях)
  if (profile.category !== 'venue') {
    menuSections.push({ id: 'reviews', label: 'Отзывы', iconName: 'Star' })
  }

  // Добавляем "FAQ" если есть вопросы
  if (profile.faq && Array.isArray(profile.faq) && profile.faq.length > 0) {
    menuSections.push({ id: 'faq', label: 'Вопросы и ответы', iconName: 'HelpCircle' })
  }

  // Добавляем "Контакты" (карта)
  menuSections.push({
    id: 'contacts',
    label: profile.category === 'animator' ? 'Контакты' : 'Как нас найти',
    iconName: 'MapPin',
  })

  // Применяем сохранённый порядок секций
  const savedOrder = profile.section_order as string[] | null
  let orderedSections = menuSections
  
  if (savedOrder && Array.isArray(savedOrder)) {
    // Исключаем "about" из сохраненного порядка (он всегда первый)
    const savedOrderWithoutAbout: string[] = []
    for (const id of savedOrder) {
      if (id === 'about') continue
      if (savedOrderWithoutAbout.includes(id)) continue
      savedOrderWithoutAbout.push(id)
    }
    
    // Сортируем остальные секции по сохранённому порядку
    const restSections = savedOrderWithoutAbout
      .map(id => menuSections.find(s => s.id === id && s.id !== 'about'))
      .filter((s): s is Section => s !== undefined)
    
    // Добавляем секции, которые есть в menuSections, но нет в savedOrder (кроме about)
    menuSections.forEach(section => {
      if (section.id !== 'about' && !restSections.find(s => s.id === section.id)) {
        restSections.push(section)
      }
    })
    
    // "О нас" всегда первый, затем остальные в нужном порядке
    orderedSections = [
      menuSections.find(s => s.id === 'about')!,
      ...restSections
    ]
  }

  // Безопасный order: если секции нет в меню, не даём ей order=-1 (иначе улетит наверх)
  const orderFor = (id: string) => {
    const idx = orderedSections.findIndex((s) => s.id === id)
    return idx === -1 ? 9999 : idx
  }

  // Подготовка данных для Schema
  const mainLocation = activeLocations[0]
  const schemaLocation = mainLocation ? {
    city: mainLocation.city,
    address: mainLocation.address,
    phone: mainLocation.phone,
    working_hours: mainLocation.working_hours,
    latitude: mainLocation.geo_location?.coordinates?.[1],
    longitude: mainLocation.geo_location?.coordinates?.[0],
  } : undefined

  // Категория для хлебных крошек
  const getCategoryName = (cat: string) => {
    const map: Record<string, string> = {
      'venue': 'Студии',
      'animator': 'Аниматоры',
      'show': 'Шоу-программы',
      'quest': 'Квесты',
      'master_class': 'Мастер-классы',
      'photographer': 'Фотографы',
      'agency': 'Агентства',
    }
    return map[cat] || 'Услуги'
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-12 sm:pb-20">
      <ProfileAnalyticsTracker
        profileId={profile.id}
        profileSlug={profile.slug}
        profileName={profile.display_name}
      />
      {/* JSON-LD Schema */}
      <LocalBusinessSchema 
        profile={profile}
        location={schemaLocation}
        services={allServices.slice(0, 10)}
      />
      
      {/* FAQ Schema если есть */}
      {profile.faq && Array.isArray(profile.faq) && profile.faq.length > 0 && (
        <FAQSchema faq={profile.faq as Array<{ question: string; answer: string }>} />
      )}

      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Хлебные крошки */}
        <Breadcrumbs items={[
          { label: 'Главная', href: '/' },
          { label: getCategoryName(profile.category), href: `/search?category=${profile.category}` },
          { label: profile.display_name, href: `/profiles/${profile.slug}` }
        ]} />

        {/* Mobile Navigation (sticky) */}
        <ProfilePageClient
          initialSections={orderedSections}
          isOwner={isOwner}
          profileId={profile.id}
          profileSlug={profile.slug}
          canEditOverride={isAdmin}
          variant="mobile"
        />

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] 2xl:grid-cols-[240px_1fr_320px] gap-3 sm:gap-6 items-start">
          
          {/* Left Sidebar (Navigation) - Desktop only */}
          <aside className="hidden md:block sticky top-24">
            <ProfilePageClient
              initialSections={orderedSections}
              isOwner={isOwner}
              profileId={profile.id}
              profileSlug={profile.slug}
              canEditOverride={isAdmin}
              variant="desktop"
            />
          </aside>

          {/* Main Content */}
          <main className="flex flex-col gap-3 sm:gap-6 min-w-0">
            
            {/* Profile Header / Cover */}
            <div 
              id="about"
              style={{ order: orderFor('about') }}
            >
              <AboutSectionClient
                data={{
                  profileSlug: profile.slug,
                  profileUserId: profile.user_id,
                  coverPhoto,
                  logo: profile.logo || undefined,
                  displayName: profile.display_name,
                  verified: profile.verified,
                  category: profile.category,
                  venueType: profile.category === 'venue' && activeLocations[0]?.details?.venue_type
                    ? activeLocations[0].details.venue_type
                    : undefined,
                  rating: typeof displayRating === 'number' ? displayRating : Number(displayRating) || 0,
                  reviewsCount: displayReviewsCount,
                  description: profile.description || profile.bio || undefined,
                  website: profile.website || undefined,
                  socialLinks: profile.social_links as any || undefined,
                }}
                profileId={profile.id}
                initialTemplate={(profile.section_templates as any)?.about || 'classic'}
                allCrops={(profile.details as any)?.cover_crops || undefined}
                isOwner={canEdit}
                variant="desktop"
              />
            </div>

            {/* Баннер "Это ваш бизнес?" для unclaimed профилей */}
            <ClaimProfileBanner
              profileSlug={profile.slug}
              claimStatus={profile.claim_status}
              userId={profile.user_id}
            />

            {/* Locations Section (Наши адреса) - ДЛЯ ПЛОЩАДОК */}
            {profile.category === 'venue' && activeLocations.length > 0 && (
              <div 
                id="locations" 
                className="scroll-mt-24"
                style={{ order: orderFor('locations') }}
              >
                <LocationsTabs
                  profileId={profile.id}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  locations={activeLocations}
                  title={locationsLabel}
                  isOwner={canEdit}
                />
              </div>
            )}

            {/* Characters Section (Персонажи и программы) - ДЛЯ АНИМАТОРОВ */}
            {profile.category === 'animator' && (
              <div
                className="scroll-mt-24"
                style={{ order: orderFor('characters') }}
              >
                <AnimatorCharactersSection
                  profileId={profile.id}
                  details={profile.details}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  isOwner={canEdit}
                />
              </div>
            )}

            {/* Show Programs Section (Номера и программы) - ДЛЯ ШОУ-ПРОГРАММ */}
            {profile.category === 'show' && (
              <div
                className="scroll-mt-24"
                style={{ order: orderFor('programs') }}
              >
                <ShowProgramsSection profileId={profile.id} profileName={profile.name} />
              </div>
            )}

            {/* Quest Programs Section (Наши квесты) - ДЛЯ КВЕСТОВ */}
            {profile.category === 'quest' && (
              <div
                className="scroll-mt-24"
                style={{ order: orderFor('programs') }}
              >
                <QuestProgramsSection profileId={profile.id} />
              </div>
            )}

            {/* Master Class Programs Section (Виды мастер-классов) - ДЛЯ МАСТЕР-КЛАССОВ */}
            {profile.category === 'master_class' && (
              <div
                className="scroll-mt-24"
                style={{ order: orderFor('programs') }}
              >
                <MasterClassProgramsSection profileId={profile.id} />
              </div>
            )}

            {/* Photography Styles Section (Стили съемки) - ДЛЯ ФОТОГРАФОВ */}
            {profile.category === 'photographer' && (
              <div
                className="scroll-mt-24"
                style={{ order: orderFor('styles') }}
              >
                <PhotographyStylesSection profileId={profile.id} />
              </div>
            )}

            {/* Agency Partners & Cases Section - ДЛЯ АГЕНТСТВ */}
            {profile.category === 'agency' && (
              <>
                <div
                  className="scroll-mt-24"
                  style={{ order: orderFor('partners') }}
                >
                  <AgencyPartnersSection profileId={profile.id} />
                </div>
                <div
                  className="scroll-mt-24"
                  style={{ order: orderFor('cases') }}
                >
                  <AgencyCasesSection profileId={profile.id} />
                </div>
              </>
            )}

            {/* Package Tiers Section (Пакетные предложения с уровнями из услуги) */}
            {tierPackageService && tierPackageService.details?.tier_packages && (
              <section 
                id="packages" 
                className="scroll-mt-24"
                style={{ order: orderFor('packages') }}
              >
                <PackageTiersDisplay
                  title={tierPackageService.title || 'Выберите свой пакет'}
                  description={tierPackageService.description}
                  images={tierPackageService.images}
                  tiers={tierPackageService.details.tier_packages.map((tier: any) => ({
                    ...tier,
                    id: tierPackageService.id, // Добавляем ID услуги к каждому tier
                  }))}
                  profileId={profile.id}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  isOwner={canEdit}
                />
              </section>
            )}

            {/* Package Services Section (Праздники под ключ) */}
            {packagesList.length > 0 && (
              <section 
                id="turnkey" 
                className="scroll-mt-24"
                style={{ order: orderFor('turnkey') }}
              >
                <TurnkeyPackagesBlock
                  profileId={profile.id}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  packages={packagesList}
                  title="Праздники под ключ"
                  description="Готовые решения для вашего праздника — всё включено!"
                  isOwner={canEdit}
                />
              </section>
            )}

            {/* Activities & Services from Catalog - NEW! */}
            <section 
              id="activities-services"
              style={{ order: orderFor('services') - 0.5 }}
            >
              <ProfileActivitiesServices profileId={profile.id} />
            </section>

            {/* Main Services Section (Основные услуги) - скрываем если пусто */}
            {mainServicesList.length > 0 && (
              <section 
                id="services"
                style={{ order: orderFor('services') }}
              >
                <ServicesBlock
                  profileId={profile.id}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  isOwner={canEdit}
                  sectionId="services"
                  title={profile.category === 'animator' ? 'Программы' : 'Услуги'}
                  description={profile.category === 'animator' ? 'Основные программы и сценарии' : undefined}
                  groups={mainServicesList.map((g: any) => ({ category: g.category, items: g.items }))}
                />
              </section>
            )}

            {/* Additional Services Section (Дополнительные услуги) */}
            {additionalServicesList.length > 0 && (
              <section 
                id="additional-services" 
                style={{ order: orderFor('additional-services') }}
              >
                <ServicesBlock
                  profileId={profile.id}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  isOwner={canEdit}
                  sectionId="additional-services"
                  title={profile.category === 'animator' ? 'Доп. услуги' : 'Дополнительные услуги'}
                  description={profile.category === 'animator' ? 'Аквагрим, шоу, мини‑мастер‑классы и т.п.' : undefined}
                  groups={[{ items: additionalServicesList as any }]}
                />
              </section>
            )}

            {/* Portfolio Section (Фото и видео) */}
            {hasPortfolio && (
              <div style={{ order: orderFor('portfolio') }}>
                <PhotoGalleryClient
                  profileId={profile.id}
                  profileSlug={profile.slug}
                  isOwner={canEdit}
                  initialTemplates={(profile.section_templates as any) || undefined}
                  photos={(profile.photos as any) || []}
                  videos={(profile.videos as any) || []}
                  videoCover={(profile as any).video_cover || null}
                />
              </div>
            )}

             {/* Reviews Section */}
             {/* Для площадок отзывы показываются в блоке адресов (внутри вкладок) */}
             {profile.category !== 'venue' && (
             <section 
               id="reviews" 
               className="scroll-mt-24 space-y-6"
               style={{ order: orderFor('reviews') }}
             >
                {reviewsSource === 'yandex' ? (
                  <>
                    {profile.profile_locations && profile.profile_locations.some((loc: any) => 
                      loc.details?.rating_widget_code
                    ) && (
                      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Рейтинг на Яндекс.Картах</h3>
                        <div className="flex flex-wrap gap-4">
                          {profile.profile_locations
                            .filter((loc: any) => loc.details?.rating_widget_code)
                            .map((loc: any, index: number) => (
                              <div key={loc.id || index} className="yandex-rating-widget">
                                {profile.profile_locations.length > 1 && (
                                  <p className="text-sm text-slate-600 mb-2">
                                    {loc.name || loc.address || loc.city}
                                  </p>
                                )}
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: loc.details.rating_widget_code 
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.profile_locations && profile.profile_locations.filter((loc: any) => loc.yandex_url && loc.active !== false).length > 0 ? (
                      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                          Отзывы с{' '}
                          {(() => {
                            const firstLocWithUrl = profile.profile_locations.find((loc: any) => loc.yandex_url && loc.active !== false)
                            const yandexUrl = firstLocWithUrl?.yandex_url
                            
                            if (yandexUrl) {
                              return (
                                <>
                                  <a 
                                    href={yandexUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-bold text-slate-900 hover:text-amber-600 transition-colors underline decoration-1 underline-offset-2"
                                  >
                                    Яндекс.Карт
                                  </a>
                                </>
                              )
                            }
                            return <span className="font-bold">Яндекс.Карт</span>
                          })()}
                        </h3>
                        {profile.profile_locations
                          .filter((loc: any) => loc.yandex_url && loc.active !== false)
                          .map((loc: any, index: number) => (
                            <div key={loc.id || index}>
                              {profile.profile_locations.filter((l: any) => l.yandex_url && l.active !== false).length > 1 && (
                                <h4 className="text-md font-medium text-slate-600 mb-3">
                                  {loc.name || loc.address || loc.city}
                                </h4>
                              )}
                              <YandexReviewsWidget 
                                locationId={loc.id} 
                                layout="cards"
                                maxReviews={150}
                              />
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm text-center text-slate-500">
                        <p>Отзывы с Яндекс.Карт не добавлены. Добавьте ссылку на Яндекс.Карты в настройках профиля и загрузите отзывы.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Отзывы</h3>
                    <ReviewList profileId={profile.id} />
                  </div>
                )}
             </section>
             )}

             {/* FAQ Section */}
             {profile.faq && Array.isArray(profile.faq) && profile.faq.length > 0 && (
               <div 
                 id="faq"
                 className="scroll-mt-24"
                 style={{ order: orderFor('faq') }}
               >
                <ProfileFAQ 
                  faq={profile.faq as Array<{ question: string; answer: string }>} 
                  profileId={profile.id}
                  isOwner={canEdit}
                  variant="desktop"
                />
               </div>
             )}

             {/* Contacts Section */}
             <section
               id="contacts"
               className="scroll-mt-24"
               style={{ order: orderFor('contacts') }}
             >
               <ContactsBlock
                 profileId={profile.id}
                 initialTemplates={(profile.section_templates as any) || undefined}
                 isOwner={canEdit}
                 title={profile.category === 'animator' ? 'Контакты' : 'Как нас найти'}
                 profileName={profile.display_name}
                 locations={profile.category === 'animator' ? [] : activeLocations}
                 phone={profile.phone || null}
                 email={profile.email || null}
                 website={profile.website || null}
                 socialLinks={(profile.social_links as any) || null}
                 hideMap={profile.category === 'animator'}
                 hideBranches={profile.category === 'animator'}
                 workAreas={profile.category === 'animator' ? (workAreas || []).map((a: any) => a.area_name).filter(Boolean) : undefined}
               />
             </section>

          </main>

          {/* Right Sidebar (Cart) */}
          {/* Desktop корзина показывается только на 2xl (>=1536px). Ниже — используем мобильный Sheet через FloatingCartButton */}
          <aside className="hidden 2xl:block sticky top-24 self-start">
             <ProfileCart />
          </aside>

        </div>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget />

      {/* Floating Cart Button (Mobile only) */}
      <ProfilePageClient
        initialSections={orderedSections}
        isOwner={isOwner}
        profileId={profile.id}
        variant="floating-cart"
      />
    </div>
  )
}

// =====================================================
// SSG: Генерация статических страниц при билде
// =====================================================

// Ревалидация каждые 5 минут (ISR - Incremental Static Regeneration)
export const revalidate = 300

// Генерируем статические страницы для всех опубликованных профилей
export async function generateStaticParams() {
  try {
    const profiles = await prisma.profiles.findMany({
      where: {
        is_published: true,
      },
      select: {
        slug: true,
      },
      take: 1000, // Ограничиваем для билда
    })
    
    return (profiles || []).map((profile) => ({
      slug: profile.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { slug } = await params
  const profile = await getProfile(slug)

  if (!profile) return { title: 'Профиль не найден' }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
  
  // Определяем категорию для title
  const categoryMap: Record<string, string> = {
    'venue': 'Студия детских праздников',
    'animator': 'Аниматор',
    'show': 'Шоу-программа',
    'quest': 'Квест',
    'master_class': 'Мастер-классы',
    'photographer': 'Фотограф',
    'agency': 'Агентство',
  }
  const categoryLabel = categoryMap[profile.category] || 'Услуги'

  const city = profile.city || 'Санкт-Петербург'
  const description = profile.bio || profile.description || `${profile.display_name} - ${categoryLabel} в ${city}. Отзывы, фото, цены. Бронирование онлайн на ZumZam.`

  return {
    title: `${profile.display_name} — ${categoryLabel} в ${city} | ZumZam`,
    description: description.substring(0, 160),
    alternates: {
      canonical: `${baseUrl}/profiles/${profile.slug}`,
    },
    openGraph: {
      title: profile.display_name,
      description: description.substring(0, 160),
      url: `${baseUrl}/profiles/${profile.slug}`,
      images: [
        {
          url: profile.cover_photo || profile.main_photo || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: profile.display_name
        }
      ],
      type: 'website',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: profile.display_name,
      description: description.substring(0, 160),
      images: [profile.cover_photo || profile.main_photo || `${baseUrl}/og-image.png`],
    },
  }
}
