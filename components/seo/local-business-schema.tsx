/**
 * JSON-LD Schema для локального бизнеса (страницы профилей)
 * Schema.org LocalBusiness для студий и аниматоров
 */

interface LocalBusinessSchemaProps {
  profile: {
    id: string
    display_name: string
    description?: string
    bio?: string
    category: string
    main_photo?: string
    cover_photo?: string
    rating?: number
    reviews_count?: number
    website?: string
    social_links?: {
      instagram?: string
      vk?: string
      telegram?: string
    }
  }
  location?: {
    city: string
    address: string
    latitude?: number
    longitude?: number
    phone?: string
    working_hours?: string
  }
  services?: Array<{
    title: string
    price: number
    description?: string
  }>
}

export function LocalBusinessSchema({ profile, location, services }: LocalBusinessSchemaProps) {
  // Определяем тип бизнеса по категории
  const getSchemaType = (category: string) => {
    switch (category) {
      case 'venue':
        return 'ChildCareService'
      case 'animator':
        return 'LocalBusiness'
      case 'show':
        return 'PerformingGroup'
      default:
        return 'LocalBusiness'
    }
  }

  // Минимальная и максимальная цена из услуг
  const prices = services?.map(s => s.price).filter(Boolean) || []
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined
  const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined

  const schema: any = {
    "@context": "https://schema.org",
    "@type": getSchemaType(profile.category),
    "name": profile.display_name,
    "description": profile.description || profile.bio,
    "image": profile.main_photo || profile.cover_photo,
    "url": `https://zumzam.ru/profiles/${profile.id}`,
  }

  // Добавляем адрес если есть
  if (location) {
    schema.address = {
      "@type": "PostalAddress",
      "streetAddress": location.address,
      "addressLocality": location.city,
      "addressCountry": "RU"
    }

    // Добавляем геокоординаты если есть
    if (location.latitude && location.longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": location.latitude,
        "longitude": location.longitude
      }
    }

    // Телефон
    if (location.phone) {
      schema.telephone = location.phone
    }

    // Часы работы
    if (location.working_hours) {
      schema.openingHours = location.working_hours
    }
  }

  // Добавляем рейтинг если есть
  if (profile.rating && profile.reviews_count) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": profile.rating,
      "reviewCount": profile.reviews_count,
      "bestRating": "5",
      "worstRating": "1"
    }
  }

  // Диапазон цен
  if (minPrice && maxPrice) {
    schema.priceRange = minPrice === maxPrice 
      ? `${minPrice}₽` 
      : `${minPrice}₽ - ${maxPrice}₽`
  }

  // Услуги как offers
  if (services && services.length > 0) {
    schema.makesOffer = services.slice(0, 5).map(service => ({
      "@type": "Offer",
      "name": service.title,
      "price": service.price,
      "priceCurrency": "RUB",
      "description": service.description
    }))
  }

  // Социальные сети
  const socialLinks = []
  if (profile.website) socialLinks.push(profile.website)
  if (profile.social_links?.instagram) socialLinks.push(profile.social_links.instagram)
  if (profile.social_links?.vk) socialLinks.push(profile.social_links.vk)
  if (profile.social_links?.telegram) socialLinks.push(profile.social_links.telegram)
  
  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

