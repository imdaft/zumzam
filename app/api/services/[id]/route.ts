import { createServerClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { NextResponse } from 'next/server'

/**
 * GET /api/services/[id] - Получить услугу по ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        profiles:profile_id (
          id,
          slug,
          display_name,
          city,
          rating,
          verified,
          phone,
          email
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ service })
  } catch (error: any) {
    console.error('Get service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/services/[id] - Обновить услугу (только владелец)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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

    // Получаем текущую услугу
    const { data: currentService } = await supabase
      .from('services')
      .select('profile_id, title, description, tags')
      .eq('id', params.id)
      .single()

    if (!currentService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь - владелец услуги
    if (currentService.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Получаем данные для обновления
    const body = await request.json()

    // Если изменились title, description или tags, перегенерируем embedding
    let embedding: string | undefined = undefined
    if (
      body.title !== undefined ||
      body.description !== undefined ||
      body.tags !== undefined
    ) {
      const title = body.title || currentService.title
      const description = body.description || currentService.description
      const tags = body.tags || currentService.tags || []
      
      const textForEmbedding = `${title}. ${description}. Теги: ${tags.join(', ')}`
      
      try {
        const embeddingArray = await generateEmbedding(textForEmbedding)
        embedding = `[${embeddingArray.join(',')}]`
      } catch (embeddingError) {
        console.error('Embedding generation error:', embeddingError)
      }
    }

    // Обновляем услугу
    const updateData = {
      ...body,
      ...(embedding && { embedding }),
    }

    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ service: updatedService })
  } catch (error: any) {
    console.error('Update service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update service' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/services/[id] - Удалить услугу (только владелец)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    // Получаем текущую услугу
    const { data: currentService } = await supabase
      .from('services')
      .select('profile_id')
      .eq('id', params.id)
      .single()

    if (!currentService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь - владелец услуги
    if (currentService.profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Удаляем услугу
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error: any) {
    console.error('Delete service error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete service' },
      { status: 500 }
    )
  }
}


