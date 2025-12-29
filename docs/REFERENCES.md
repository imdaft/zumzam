# 📚 Ссылки на официальную документацию

## Версии пакетов в проекте

- **Next.js**: 16.0.3
- **React**: 19.2.0
- **@supabase/ssr**: 0.7.0
- **@supabase/supabase-js**: 2.45.4

---

## 🔗 Официальная документация

### Next.js 16
- **Главная**: https://nextjs.org/docs
- **App Router**: https://nextjs.org/docs/app
- **Authentication**: https://nextjs.org/docs/app/building-your-application/authentication
- **Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Server Components**: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- **Client Components**: https://nextjs.org/docs/app/building-your-application/rendering/client-components

### React 19
- **Главная**: https://react.dev
- **Hooks**: https://react.dev/reference/react
- **useEffect**: https://react.dev/reference/react/useEffect
- **Server Components**: https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components

### Supabase
- **Главная**: https://supabase.com/docs
- **Next.js Integration**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Auth with Next.js**: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- **SSR Setup**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **Creating SSR Client**: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- **@supabase/ssr Package**: https://github.com/supabase/ssr

---

## 🎯 Ключевые концепции для нашего проекта

### Supabase + Next.js 16 App Router

1. **Client-side клиент** (`lib/supabase/client.ts`):
   - Использует `createBrowserClient` из `@supabase/ssr`
   - НЕ сохранять в глобальной переменной
   - Создавать новый клиент в каждой функции

2. **Server-side клиент** (`lib/supabase/server.ts`):
   - Использует `createServerClient` из `@supabase/ssr`
   - Требует `cookies()` из `next/headers`
   - Использует `getAll()` и `setAll()` для cookies

3. **Middleware** (`middleware.ts`):
   - Обновляет сессию на каждом запросе
   - Использует `getUser()` или `getClaims()` для валидации
   - КРИТИЧНО для работы SSR auth

4. **Client Components**:
   - Используют `createBrowserClient`
   - Могут использовать `onAuthStateChange` для получения начального состояния
   - НЕ использовать `getUser()`/`getSession()` напрямую (может зависать)

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **НЕ использовать `getUser()`/`getSession()` в Client Components** - может зависать
2. **Использовать `onAuthStateChange` с событием `INITIAL_SESSION`** для получения начального состояния
3. **Middleware ДОЛЖЕН обновлять сессию** перед каждым запросом
4. **Всегда использовать `await cookies()`** в Server Components
5. **НЕ сохранять Supabase клиенты в глобальных переменных**

---

## 📖 Примеры кода из официальной документации

См. файлы в папке `docs/examples/`

