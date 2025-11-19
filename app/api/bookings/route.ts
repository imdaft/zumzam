import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/bookings - Получить список бронирований
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const profile_id = searchParams.get('profile_id')
  const client_id = searchParams.get('client_id')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  try {
    const supabase = await createServerClient()
    
    // Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('bookings')
      .select(`
        *,
        services:service_id (
          id,
          title,
          price,
          duration_minutes,
          photos
        ),
        profiles:profile_id (
          id,
          slug,
          display_name,
          city,
          phone,
          email
        ),
        clients:client_id (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    // Фильтры
    if (status) {
      query = query.eq('status', status)
    }
    if (profile_id) {
      query = query.eq('profile_id', profile_id)
    }
    if (client_id) {
      query = query.eq('client_id', client_id)
    }
    if (date_from) {
      query = query.gte('event_date', date_from)
    }
    if (date_to) {
      query = query.lte('event_date', date_to)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Get bookings error:', error)
      throw error
    }

    return NextResponse.json({ bookings, total: bookings?.length || 0 })
  } catch (error: any) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings - Создать новое бронирование
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
      service_id,
      profile_id,
      event_date,
      event_time,
      child_age,
      children_count,
      event_address,
      client_message,
    } = body

    // Валидация обязательных полей
    if (!service_id || !profile_id || !event_date || !event_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Проверка что услуга существует и активна
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, profile_id, active')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.active) {
      return NextResponse.json(
        { error: 'Service is not active' },
        { status: 400 }
      )
    }

    // Проверка что profile_id совпадает с service.profile_id
    if (service.profile_id !== profile_id) {
      return NextResponse.json(
        { error: 'Invalid profile_id' },
        { status: 400 }
      )
    }

    // Создание бронирования
    const { data: booking, error: createError } = await supabase
      .from('bookings')
      .insert({
        service_id,
        profile_id,
        client_id: user.id,
        event_date,
        event_time,
        child_age,
        children_count,
        event_address,
        client_message,
        status: 'pending',
      })
      .select(`
        *,
        services:service_id (
          id,
          title,
          price
        ),
        profiles:profile_id (
          id,
          slug,
          display_name,
          phone,
          email
        )
      `)
      .single()

    if (createError) {
      console.error('Create booking error:', createError)
      throw createError
    }

    // TODO: День 24 - Отправить уведомление студии

    return NextResponse.json({
      booking,
      message: 'Booking created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}


