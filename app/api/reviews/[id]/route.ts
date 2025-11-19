import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/reviews/[id] - Получить один отзыв
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()

    const { data: review, error } = await supabase
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
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Get review error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reviews/[id] - Обновить отзыв
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    
    // Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { comment, photos, is_approved, is_hidden } = body

    // Получаем текущий отзыв
    const { data: currentReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, author_id, profile_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    // Автор может редактировать текст и фото
    // Админ может модерировать (is_approved, is_hidden)
    const isAuthor = currentReview.author_id === user.id
    const isAdmin = false // TODO: добавить проверку роли админа

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Формируем данные для обновления
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (isAuthor) {
      if (comment !== undefined) {
        updateData.comment = comment
      }
      if (photos !== undefined) {
        updateData.photos = photos
      }
    }

    if (isAdmin) {
      if (is_approved !== undefined) {
        updateData.is_approved = is_approved
      }
      if (is_hidden !== undefined) {
        updateData.is_hidden = is_hidden
      }
    }

    // Обновление отзыва
    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        profiles:profile_id (
          id,
          slug,
          display_name
        ),
        authors:author_id (
          id,
          email,
          full_name
        )
      `)
      .single()

    if (updateError) {
      console.error('Update review error:', updateError)
      throw updateError
    }

    // Если изменился статус одобрения, обновляем рейтинг профиля
    if (is_approved !== undefined || is_hidden !== undefined) {
      await updateProfileRating(supabase, currentReview.profile_id)
    }

    return NextResponse.json({
      review,
      message: 'Review updated successfully',
    })
  } catch (error: any) {
    console.error('Update review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[id] - Удалить отзыв
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient()
    
    // Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем текущий отзыв
    const { data: currentReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, author_id, profile_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Только автор или админ может удалить
    const isAuthor = currentReview.author_id === user.id
    const isAdmin = false // TODO: добавить проверку роли админа

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Удаление
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Delete review error:', deleteError)
      throw deleteError
    }

    // Обновляем рейтинг профиля
    await updateProfileRating(supabase, currentReview.profile_id)

    return NextResponse.json({
      message: 'Review deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    )
  }
}

/**
 * Обновление рейтинга профиля
 */
async function updateProfileRating(supabase: any, profileId: string) {
  try {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('profile_id', profileId)
      .eq('is_approved', true)
      .eq('is_hidden', false)

    if (!reviews || reviews.length === 0) {
      await supabase
        .from('profiles')
        .update({ rating: 0, reviews_count: 0 })
        .eq('id', profileId)
      return
    }

    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
    const avgRating = totalRating / reviews.length

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

