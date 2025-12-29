# Supabase + Next.js 16 App Router - Правильная настройка

## Версии
- Next.js: 16.0.3
- @supabase/ssr: 0.7.0
- @supabase/supabase-js: 2.45.4

---

## 1. Client-side клиент (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

/**
 * ВАЖНО: НЕ сохраняйте этот клиент в глобальной переменной!
 * Всегда создавайте новый клиент внутри каждой функции.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## 2. Server-side клиент (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component - можно игнорировать если есть middleware
          }
        },
      },
    }
  )
}
```

---

## 3. Middleware (`middleware.ts`)

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: Не размещайте код между createServerClient и getUser()
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 4. Client Component - Правильное использование

### ❌ НЕПРАВИЛЬНО (может зависать):

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  useEffect(() => {
    const supabase = createClient()
    // ❌ ЭТО МОЖЕТ ЗАВИСНУТЬ!
    const { data } = await supabase.auth.getUser()
  }, [])
}
```

### ✅ ПРАВИЛЬНО (используем onAuthStateChange):

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  useEffect(() => {
    const supabase = createClient()
    
    // ✅ Используем onAuthStateChange для получения начального состояния
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          const user = session?.user
          // Работаем с пользователем
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
```

---

## 5. Server Component - Правильное использование

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  
  // ✅ На сервере getUser() работает нормально
  const { data: { user } } = await supabase.auth.getUser()
  
  return <div>User: {user?.email}</div>
}
```

---

## 6. Проблема: Запросы к БД зависают в Client Components

### ❌ ПРОБЛЕМА:

```typescript
'use client'
const supabase = createClient()
// ❌ Может зависать из-за RLS политик
const { data } = await supabase.from('users').select('*').eq('id', userId).single()
```

### ✅ РЕШЕНИЕ 1: Использовать API Route (рекомендуется)

```typescript
// app/api/users/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return Response.json({ data, error })
}
```

```typescript
// Client Component
'use client'
const response = await fetch('/api/users')
const { data } = await response.json()
```

### ✅ РЕШЕНИЕ 2: Использовать fallback профиль

Если БД не отвечает, использовать данные из `auth.user`:

```typescript
const fallbackProfile = {
  id: authUser.id,
  email: authUser.email || '',
  full_name: authUser.user_metadata?.full_name || null,
  // ...
}
```

---

## Источники

- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Официальный пример: https://github.com/vercel/next.js/tree/canary/examples/with-supabase

