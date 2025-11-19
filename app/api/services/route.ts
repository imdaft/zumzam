import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

/**
 * GET /api/services - Получить список услуг (с фильтрами)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profile_id = searchParams.get('profile_id')
  const category_id = searchParams.get('category_id')
  const city = searchParams.get('city')
  const active = searchParams.get('active')
  const featured = searchParams.get('featured')
  const q = searchParams.get('q') // Поисковый запрос
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createServerClient()
    
    let query = supabase
      .from('services')
      .select(`
        *,
        profiles:profile_id (
          id,
          slug,
          display_name,
          city,
          rating,
          verified
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Фильтры
    if (profile_id) {
      query = query.eq('profile_id', profile_id)
    }
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    if (active === 'true') {
      query = query.eq('active', true)
    }
    if (featured === 'true') {
      query = query.eq('featured', true)
    }
    
    // Keyword поиск по title, description, tags
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`)
    }
    
    // Фильтр по городу через профиль
    if (city) {
      query = query.eq('profiles.city', city)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      services: data,
      total: count,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get services error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/services - Создать новую услугу
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Проверяем авторизацию
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем, что у пользователя есть профиль
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Create a profile first.' },
        { status: 404 }
      )
    }

    // Получаем данные услуги
    const body = await request.json()
    const {
      title,
      description,
      category_id,
      price,
      price_from,
      price_to,
      currency,
      duration_minutes,
      age_from,
      age_to,
      capacity_min,
      capacity_max,
      tags,
      photos,
      video_url,
      active,
      featured,
    } = body

    // Генерируем embedding для семантического поиска
    const textForEmbedding = `${title}. ${description}. Теги: ${tags?.join(', ') || ''}`
    let embedding: number[] | null = null
    
    try {
      embedding = await generateEmbedding(textForEmbedding)
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError)
    }

    // Создаём услугу
    const serviceData = {
      profile_id: user.id,
      title,
      description,
      category_id: category_id || null,
      price: price || null,
      price_from: price_from || null,
      price_to: price_to || null,
      currency: currency || 'RUB',
      duration_minutes: duration_minutes || null,
      age_from: age_from || null,
      age_to: age_to || null,
      capacity_min: capacity_min || null,
      capacity_max: capacity_max || null,
      tags: tags || [],
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      photos: photos || [],
      video_url: video_url || null,
      active: active !== undefined ? active : true,
      featured: featured || false,
    }

    const { data: service, error: insertError } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(
      { service, message: 'Service created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create service' },
      { status: 500 }
    )
  }
}

