/**
 * JSON-LD Schema для организации (главная страница)
 * Schema.org Organization для ZumZam
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZumZam",
    "alternateName": "ЗумЗам",
    "url": "https://zumzam.ru",
    "logo": "https://zumzam.ru/logo.png",
    "description": "Агрегатор детских праздников в Санкт-Петербурге. Найдём идеальный праздник за 5 минут",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Санкт-Петербург",
      "addressCountry": "RU"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": "RU",
      "availableLanguage": "Russian"
    },
    "sameAs": [
      // Добавить после создания соцсетей
      // "https://vk.com/zumzam",
      // "https://t.me/zumzam",
      // "https://instagram.com/zumzam"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

