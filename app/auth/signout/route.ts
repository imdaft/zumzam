import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Sign Out Route
 * Выход пользователя из системы
 */
export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Проверяем, что пользователь авторизован
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Обновляем кэш
  revalidatePath('/', 'layout')

  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}

