import prisma from '@/lib/prisma'
import { generateEmbedding } from './embeddings'

/**
 * Генерирует ПОЛНЫЙ embedding для профиля включая ВСЕ данные
 */
export async function generateProfileEmbedding(profileId: string): Promise<number[] | null> {
  try {
    // Загружаем профиль со ВСЕМИ полями
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      include: {
        profile_locations: {
          where: { active: true }
        },
        services: {
          where: { 
            is_active: true,
            is_package: false
          }
        },
        animator_characters: {
          where: { is_active: true }
        },
        show_programs: {
          where: { is_active: true }
        },
        quest_programs: {
          where: { is_active: true }
        },
        master_class_programs: {
          where: { is_active: true }
        }
      }
    })

    if (!profile) {
      console.error('[generateProfileEmbedding] Profile not found:', profileId)
      return null
    }

    const locations = profile.profile_locations
    const services = profile.services
    
    // Загружаем пакеты отдельно
    const packages = await prisma.services.findMany({
      where: {
        profile_id: profileId,
        is_active: true,
        is_package: true
      }
    })

    // FAQ хранится в профиле как JSON
    const faq = (profile.faq as any) || []

    // Загружаем внутренние отзывы
    const reviews = await prisma.reviews.findMany({
      where: {
        profile_id: profileId,
        visible: true
      },
      select: {
        rating: true,
        comment: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    })

    // Загружаем отзывы с Яндекс.Карт (если есть локации)
    const yandexReviews = locations && locations.length > 0
      ? await prisma.yandex_reviews_cache.findFirst({
          where: {
            profile_location_id: locations[0].id
          },
          select: {
            reviews: true,
            rating: true,
            review_count: true
          }
        })
      : null

    // Формируем ПОЛНЫЙ текст для embedding
    let text = `
=== ОСНОВНАЯ ИНФОРМАЦИЯ ===
Название: ${profile.display_name}
Категория: ${profile.category}${profile.secondary_categories?.length ? ` + ${profile.secondary_categories.join(', ')}` : ''}
Город: ${profile.city}

Описание:
${profile.bio || ''}
${profile.description || ''}

Теги: ${profile.tags?.join(', ') || 'нет'}

=== ХАРАКТЕРИСТИКИ И ОСОБЕННОСТИ ПРОФИЛЯ ===
`
    // Добавляем details профиля (если есть)
    if (profile.details && typeof profile.details === 'object') {
      const details: any = profile.details
      
      // Форматы работы
      if (details.work_formats && Array.isArray(details.work_formats)) {
        text += `Форматы работы: ${details.work_formats.join(', ')}\n`
      }
      
      // Удобства и оборудование
      if (details.facilities && Array.isArray(details.facilities)) {
        text += `Удобства: ${details.facilities.join(', ')}\n`
      }
      if (details.equipment && Array.isArray(details.equipment)) {
        text += `Оборудование: ${details.equipment.join(', ')}\n`
      }
      
      // Особенности
      if (details.specific_features && Array.isArray(details.specific_features)) {
        text += `Особенности: ${details.specific_features.join(', ')}\n`
      }
      
      // Дополнительные характеристики
      if (details.additional_info) {
        text += `Доп. информация: ${details.additional_info}\n`
      }
    }

    text += `
=== КОНТАКТЫ ===
Телефон: ${profile.phone || 'не указан'}
Email: ${profile.email || 'не указан'}
Сайт: ${profile.website || 'нет'}

Социальные сети:
${profile.social_links ? Object.entries(profile.social_links).map(([key, val]) => `- ${key}: ${val}`).join('\n') : 'не указаны'}

=== ЛОКАЦИИ И ПЛОЩАДКИ ===
`

    // Добавляем локации с полной информацией
    if (locations && locations.length > 0) {
      locations.forEach((loc: any, idx: number) => {
        text += `
Площадка ${idx + 1}: ${loc.name || 'Основная'}
Адрес: ${loc.city}, ${loc.street_name} ${loc.building_number}${loc.entrance ? `, подъезд ${loc.entrance}` : ''}
Телефон: ${loc.phone || 'не указан'}
Метро: ${loc.subway_station || 'не указано'}${loc.subway_distance ? ` (${loc.subway_distance} мин)` : ''}
`
        
        // Характеристики площадки
        if (loc.characteristics) {
          const char = loc.characteristics
          
          if (char.area) text += `Площадь: ${char.area} м²\n`
          if (char.capacity_min && char.capacity_max) {
            text += `Вместимость: ${char.capacity_min}-${char.capacity_max} человек\n`
          }
          if (char.rooms && char.rooms.length > 0) {
            text += `Помещения: ${char.rooms.map((r: any) => `${r.name} (${r.area}м²)`).join(', ')}\n`
          }
          
          // Форматы работы
          if (char.work_formats && char.work_formats.length > 0) {
            text += `Форматы работы: ${char.work_formats.join(', ')}\n`
          }
          
          // Удобства
          if (char.facilities && char.facilities.length > 0) {
            text += `Удобства: ${char.facilities.join(', ')}\n`
          }
          
          // Оборудование
          if (char.equipment && char.equipment.length > 0) {
            text += `Оборудование: ${char.equipment.join(', ')}\n`
          }
          
          // Специфические характеристики
          if (char.specific_features && char.specific_features.length > 0) {
            text += `Особенности: ${char.specific_features.join(', ')}\n`
          }
          
          // Правила и условия
          if (char.rules) {
            text += `Правила:\n`
            if (char.rules.can_bring_food) text += `- Можно приносить свою еду\n`
            if (char.rules.can_bring_drinks) text += `- Можно приносить свои напитки\n`
            if (char.rules.can_bring_cake) text += `- Можно приносить свой торт\n`
            if (char.rules.can_decorate) text += `- Можно украшать помещение\n`
            if (char.rules.smoking_allowed) text += `- Разрешено курение\n`
            if (char.rules.pets_allowed) text += `- Можно с животными\n`
            if (char.rules.additional_rules) {
              text += `- Дополнительно: ${char.rules.additional_rules}\n`
            }
          }
          
          // Условия аренды
          if (char.rental_conditions) {
            const rental = char.rental_conditions
            if (rental.min_rental_hours) text += `Минимум аренды: ${rental.min_rental_hours} часов\n`
            if (rental.price_per_hour) text += `Цена: ${rental.price_per_hour}₽/час\n`
            if (rental.deposit) text += `Депозит: ${rental.deposit}₽\n`
            if (rental.cancellation_policy) text += `Отмена: ${rental.cancellation_policy}\n`
          }
        }
      })
    }

    text += `
=== УСЛУГИ И ПРОГРАММЫ ===
`

    // Добавляем обычные услуги
    if (services && services.length > 0) {
      services.forEach((s: any) => {
        text += `
• ${s.title}
  Описание: ${s.description || 'нет'}
  Цена: ${s.price ? `${s.price}₽` : s.price_from ? `от ${s.price_from}₽` : 'договорная'}
  Длительность: ${s.duration || 'не указана'} мин
  Возраст: ${s.age_from && s.age_to ? `${s.age_from}-${s.age_to} лет` : 'любой'}
  Количество детей: ${s.participants_min && s.participants_max ? `${s.participants_min}-${s.participants_max}` : 'не указано'}
`
        // Дополнительные детали услуги
        if (s.details) {
          if (s.details.program) text += `  Программа: ${s.details.program}\n`
          if (s.details.included) text += `  Включено: ${s.details.included}\n`
          if (s.details.not_included) text += `  Не включено: ${s.details.not_included}\n`
          if (s.details.additional_options) text += `  Доп. услуги: ${s.details.additional_options}\n`
        }
      })
    }

    text += `
=== ПАКЕТНЫЕ ПРЕДЛОЖЕНИЯ ===
`

    // Добавляем пакеты
    if (packages && packages.length > 0) {
      packages.forEach((pkg: any) => {
        text += `
• ${pkg.title}
  ${pkg.description || ''}
`
        if (pkg.details?.tier_packages && Array.isArray(pkg.details.tier_packages)) {
          pkg.details.tier_packages.forEach((tier: any) => {
            text += `
  Тариф "${tier.name}":
    - Цена: ${tier.price}₽
    - Длительность: ${tier.duration} мин
    - Детей: ${tier.participants_min}-${tier.participants_max}
    - Включено: ${tier.includes?.join(', ') || 'не указано'}
    ${tier.description ? `- Описание: ${tier.description}` : ''}
`
          })
        }
      })
    }

    text += `
=== ПРАЗДНИКИ ПОД КЛЮЧ ===
`
    // Если есть услуги с "под ключ" в названии (не пакеты!)
    const turnkeyServices = services?.filter((s: any) => 
      !s.is_package && 
      (s.title?.toLowerCase().includes('под ключ') || 
       (s.tags && Array.isArray(s.tags) && s.tags.some((tag: string) => tag.toLowerCase().includes('под ключ'))))
    )
    if (turnkeyServices && turnkeyServices.length > 0) {
      turnkeyServices.forEach((s: any) => {
        text += `
• ${s.title}
  ${s.description || ''}
  Цена: ${s.price ? `${s.price}₽` : s.price_from ? `от ${s.price_from}₽` : 'договорная'}
  Что включено: ${s.details?.included || s.details?.includes || 'не указано'}
`
      })
    } else {
      text += `(Праздники под ключ пока не добавлены)\n`
    }

    text += `
=== ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ ===
`

    // Добавляем FAQ
    if (faq?.faq && Array.isArray(faq.faq)) {
      faq.faq.forEach((item: any, idx: number) => {
        text += `
${idx + 1}. Вопрос: ${item.question}
   Ответ: ${item.answer}
`
      })
    } else {
      text += `(FAQ пока не добавлены)\n`
    }

    text += `
=== ОТЗЫВЫ КЛИЕНТОВ (внутренние) ===
`

    // Добавляем внутренние отзывы
    if (reviews && reviews.length > 0) {
      reviews.forEach((r: any, idx: number) => {
        text += `
${idx + 1}. ⭐ ${r.rating}/5 (${new Date(r.created_at).toLocaleDateString('ru-RU')})
   "${r.comment?.substring(0, 300) || 'Без комментария'}"
`
      })
    } else {
      text += `(Внутренних отзывов пока нет)\n`
    }

    text += `
=== ОТЗЫВЫ С ЯНДЕКС.КАРТ ===
`

    // Добавляем отзывы с Яндекс.Карт
    if (yandexReviews?.reviews && Array.isArray(yandexReviews.reviews)) {
      text += `Рейтинг на Яндекс.Картах: ${yandexReviews.rating || 'нет'} (${yandexReviews.review_count || 0} отзывов)\n\n`
      yandexReviews.reviews.slice(0, 10).forEach((r: any, idx: number) => {
        text += `
${idx + 1}. ⭐ ${r.rating}/5${r.author ? ` - ${r.author}` : ''}
   "${r.text?.substring(0, 300) || 'Без текста'}"
`
      })
    } else {
      text += `(Отзывов с Яндекс.Карт пока нет)\n`
    }

    // Подсчёт статистики
    const stats = {
      services: services?.length || 0,
      packages: packages?.length || 0,
      locations: locations?.length || 0,
      faq: faq?.faq?.length || 0,
      reviews: reviews?.length || 0,
      yandexReviews: yandexReviews?.reviews?.length || 0,
      totalChars: text.length
    }

    console.log(`[generateProfileEmbedding] Generating for "${profile.display_name}":`, stats)
    
    // Генерируем embedding
    const embedding = await generateEmbedding(text.trim())
    
    if (embedding) {
      // Сохраняем в базу
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ embedding })
        .eq('id', profileId)

      if (updateError) {
        console.error('[generateProfileEmbedding] Failed to save:', updateError)
        return null
      }

      console.log(`[generateProfileEmbedding] ✅ Saved for "${profile.display_name}" (${stats.totalChars} chars)`)
      return embedding
    }

    return null
  } catch (error) {
    console.error('[generateProfileEmbedding] Error:', error)
    return null
  }
}

