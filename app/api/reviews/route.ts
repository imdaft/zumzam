import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

/**
 * GET /api/reviews - Получить список отзывов
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const profile_id = searchParams.get('profile_id')
  const author_id = searchParams.get('author_id')
  const rating_min = searchParams.get('rating_min')
  const rating_max = searchParams.get('rating_max')
  const is_approved = searchParams.get('is_approved')
  const sort = searchParams.get('sort') || 'recent'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createServerClient()
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles:profile_id (
          id,
          slug,
          display_name,
          avatar_url
        ),
        authors:author_id (
          id,
          email,
          full_name
        )
      `)
      .range(offset, offset + limit - 1)

    // Фильтры
    if (profile_id) {
      query = query.eq('profile_id', profile_id)
    }
    if (author_id) {
      query = query.eq('author_id', author_id)
    }
    if (rating_min) {
      query = query.gte('rating', parseInt(rating_min))
    }
    if (rating_max) {
      query = query.lte('rating', parseInt(rating_max))
    }
    if (is_approved === 'true') {
      query = query.eq('is_approved', true)
    } else if (is_approved === 'false') {
      query = query.eq('is_approved', false)
    }

    // По умолчанию показываем только одобренные и не скрытые
    if (!author_id) {
      query = query.eq('is_approved', true).eq('is_hidden', false)
    }

    // Сортировка
    switch (sort) {
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'rating_high':
        query = query.order('rating', { ascending: false })
        break
      case 'rating_low':
        query = query.order('rating', { ascending: true })
        break
      case 'helpful':
        query = query.order('helpful_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error('Get reviews error:', error)
      throw error
    }

    // Подсчёт общего количества
    let countQuery = supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })

    if (profile_id) {
      countQuery = countQuery.eq('profile_id', profile_id)
    }
    if (!author_id) {
      countQuery = countQuery.eq('is_approved', true).eq('is_hidden', false)
    }

    const { count } = await countQuery

    return NextResponse.json({ 
      reviews, 
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews - Создать новый отзыв
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      profile_id,
      booking_id,
      rating,
      comment,
      photos,
      quality_rating,
      service_rating,
      value_rating,
    } = body

    // Валидация
    if (!profile_id || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Проверка что профиль существует
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profile_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Нельзя оставлять отзыв самому себе
    if (profile.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot review your own profile' },
        { status: 400 }
      )
    }

    // Проверка что пользователь ещё не оставлял отзыв на этот профиль
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('author_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this profile' },
        { status: 400 }
      )
    }

    // Генерация embedding для семантического поиска отзывов
    const reviewText = `${comment} Рейтинг: ${rating}/5`
    const embedding = await generateEmbedding(reviewText)

    // Создание отзыва
    const { data: review, error: createError } = await supabase
      .from('reviews')
      .insert({
        profile_id,
        author_id: user.id,
        booking_id,
        rating,
        comment,
        photos: photos || [],
        quality_rating,
        service_rating,
        value_rating,
        embedding,
        is_approved: false, // Требует модерации
        is_hidden: false,
        helpful_count: 0,
      })
      .select(`
        *,
        profiles:profile_id (
          id,
          slug,
          display_name
        )
      `)
      .single()

    if (createError) {
      console.error('Create review error:', createError)
      throw createError
    }

    // Обновление рейтинга профиля (триггер сделает это автоматически)
    // Но можем вызвать вручную для немедленного обновления
    await updateProfileRating(supabase, profile_id)

    return NextResponse.json({
      review,
      message: 'Review created successfully. It will be published after moderation.',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    )
  }
}

/**
 * Обновление рейтинга профиля на основе отзывов
 */
async function updateProfileRating(supabase: any, profileId: string) {
  try {
    // Получаем все одобренные отзывы профиля
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, quality_rating, service_rating, value_rating')
      .eq('profile_id', profileId)
      .eq('is_approved', true)
      .eq('is_hidden', false)

    if (!reviews || reviews.length === 0) {
      return
    }

    // Вычисляем средний рейтинг
    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
    const avgRating = totalRating / reviews.length

    // Обновляем профиль
    await supabase
      .from('profiles')
      .update({
        rating: Number(avgRating.toFixed(1)),
        reviews_count: reviews.length,
      })
      .eq('id', profileId)
  } catch (error) {
    console.error('Update profile rating error:', error)
  }
}

