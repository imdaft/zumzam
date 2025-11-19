import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

/**
 * POST /api/search/semantic - Семантический поиск с использованием Gemini embeddings
 * 
 * Использует vector similarity search для поиска услуг по смыслу запроса,
 * а не только по ключевым словам
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      query, 
      city, 
      priceMin, 
      priceMax, 
      ageFrom, 
      ageTo, 
      tags,
      limit = 20,
      threshold = 0.7, // Минимальная схожесть (0-1)
    } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // 1. Генерируем embedding для запроса пользователя
    console.log('Generating embedding for query:', query)
    const queryEmbedding = await generateEmbedding(query)
    
    // 2. Вызываем RPC функцию match_services() для поиска похожих услуг
    const { data: services, error } = await supabase.rpc('match_services', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit * 2, // Берём больше для фильтрации
    })

    if (error) {
      console.error('Semantic search error:', error)
      throw error
    }

    // 3. Применяем дополнительные фильтры на клиенте
    let filteredServices = services || []

    // Фильтр по городу (через JOIN с profiles)
    if (city) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id')
        .eq('city', city)
      
      const profileIds = profilesData?.map(p => p.id) || []
      filteredServices = filteredServices.filter((s: any) =>
        profileIds.includes(s.profile_id)
      )
    }

    // Фильтр по цене
    if (priceMin !== undefined || priceMax !== undefined) {
      filteredServices = filteredServices.filter((s: any) => {
        const servicePrice = s.price || s.price_from || 0
        if (priceMin !== undefined && servicePrice < priceMin) return false
        if (priceMax !== undefined && servicePrice > priceMax) return false
        return true
      })
    }

    // Фильтр по возрасту
    if (ageFrom !== undefined || ageTo !== undefined) {
      filteredServices = filteredServices.filter((s: any) => {
        if (!s.age_from && !s.age_to) return true // Если возраст не указан, показываем
        if (ageFrom !== undefined && s.age_to && s.age_to < ageFrom) return false
        if (ageTo !== undefined && s.age_from && s.age_from > ageTo) return false
        return true
      })
    }

    // Фильтр по тегам (хотя бы один тег должен совпадать)
    if (tags && tags.length > 0) {
      filteredServices = filteredServices.filter((s: any) => {
        if (!s.tags || s.tags.length === 0) return false
        return tags.some((tag: string) => s.tags.includes(tag))
      })
    }

    // Ограничиваем результат
    filteredServices = filteredServices.slice(0, limit)

    // 4. Загружаем данные профилей для результатов
    const profileIds = [...new Set(filteredServices.map((s: any) => s.profile_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, slug, display_name, city, rating, verified')
      .in('id', profileIds)

    // Объединяем services с profiles
    const servicesWithProfiles = filteredServices.map((service: any) => ({
      ...service,
      profiles: profiles?.find(p => p.id === service.profile_id),
    }))

    return NextResponse.json({
      services: servicesWithProfiles,
      total: servicesWithProfiles.length,
      method: 'semantic', // Индикатор что использовался семантический поиск
    })
  } catch (error: any) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: error.message || 'Semantic search failed' },
      { status: 500 }
    )
  }
}


