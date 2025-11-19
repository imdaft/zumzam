import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Insert']

/**
 * GET /api/profiles - Получить все профили (с фильтрами)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const verified = searchParams.get('verified')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createServerClient()
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Фильтры
    if (city) {
      query = query.eq('city', city)
    }
    if (verified === 'true') {
      query = query.eq('verified', true)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      profiles: data,
      total: count,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get profiles error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/profiles - Создать новый профиль
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

    // Получаем данные из тела запроса
    const body = await request.json()
    const {
      display_name,
      slug,
      bio,
      description,
      city,
      address,
      tags,
      price_range,
      email,
      phone,
      website,
      social_links,
      portfolio_url,
      photos,
      videos,
      cover_photo,
    } = body

    // Проверяем, что у пользователя ещё нет профиля
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Проверяем уникальность slug
    const { data: existingSlug } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      )
    }

    // Генерируем embedding для семантического поиска
    // Комбинируем название, описание и теги для более качественного embedding
    const textForEmbedding = `${display_name}. ${bio || ''}. ${description}. Теги: ${tags.join(', ')}`
    let embedding: number[] | null = null
    
    try {
      embedding = await generateEmbedding(textForEmbedding)
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError)
      // Не блокируем создание профиля из-за ошибки embedding
    }

    // Создаём профиль
    const profileData: Profile = {
      id: user.id,
      slug,
      display_name,
      bio: bio || null,
      description,
      city,
      address: address || null,
      tags: tags || [],
      price_range: price_range || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      social_links: social_links || {},
      portfolio_url: portfolio_url || null,
      photos: photos || [],
      videos: videos || [],
      cover_photo: cover_photo || null,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      rating: 0,
      reviews_count: 0,
      bookings_completed: 0,
      verified: false,
    }

    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(
      { profile, message: 'Profile created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    )
  }
}


