import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/profiles/[slug] - Получить профиль по slug
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Получаем профиль по slug
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        users:id (
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('slug', params.slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/profiles/[slug] - Обновить профиль (только владелец)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

    // Получаем текущий профиль
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь - владелец профиля
    if (currentProfile.id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Получаем данные для обновления
    const body = await request.json()

    // Обновляем профиль
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(body)
      .eq('slug', params.slug)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

