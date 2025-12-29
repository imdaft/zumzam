# 🔍 Проблема: Client-Side Supabase зависает в React Query

## ✅ UPDATE (исправлено)

**Текущее состояние:** проблема “вечного pending” устранена без API‑костылей.

- **Root cause (практически):** в приложении создавалось много экземпляров Supabase browser client (`createClient()` возвращал новый client на каждый вызов). В сложных местах (wizard/формы) это приводило к зависаниям/локам/ожиданию session и, как следствие, к бесконечному спиннеру.
- **Фикс:** `lib/supabase/client.ts` переведён на **singleton** (один Supabase client на вкладку) + в шагах wizard добавлены **таймауты** на запросы, чтобы UI физически не мог “крутиться вечно”.
- **Workaround endpoints удалены:** `app/api/activity-catalog/*` и `app/api/test-activity-catalog/*` удалены (они были временными для диагностики).

Связанный фикс‑док: `docs/SUPABASE_CLIENT_FIX.md`.

## ❌ ПРОБЛЕМА

**Симптомы:**
- Client-side Supabase запрос `await supabase.from('activity_catalog').select(...)` зависает навсегда
- Промис никогда не resolve
- Query builder создаётся успешно, но запрос не выполняется
- React Query остаётся в состоянии `pending`

**Логи:**
```
🔍 [Step 2] ✅ queryFn ЗАПУЩЕН!
🔍 [Supabase Client] Client created successfully
🔍 [Step 2] Supabase client создан, начинаем запрос...
🔍 [Step 2] Создаём query builder...
🔍 [Step 2] Query builder создан, выполняем запрос...
🔍 [Step 2] Query object: PostgrestFilterBuilder {...}
// ⚠️ ЗАВИСАЕТ ЗДЕСЬ - никогда не доходит до resolve
```

## ✅ РАБОТАЕТ

**Что работает нормально:**
1. **Server-side Supabase** (`/api/activity-catalog`) - работает идеально (135ms)
2. **useEffect + Supabase** (`activity-filters.tsx`) - работает нормально
3. **Прямой SQL запрос** через Supabase MCP - работает идеально

**Пример рабочего кода:**
```tsx
// components/features/home/activity-filters.tsx - РАБОТАЕТ
useEffect(() => {
  async function loadActivities() {
    const supabase = createClient()
    const { data } = await supabase
      .from('activity_catalog')
      .select('id, name_ru, icon, category')
      .order('name_ru', { ascending: true })
      .limit(12)
    if (data) setActivities(data)
  }
  loadActivities()
}, [])
```

## 🔬 ГИПОТЕЗЫ

### 1. React Query + Supabase конфликт
- React Query может как-то блокировать или перехватывать промис Supabase
- Возможно, проблема с `refetchOnMount: 'always'` в QueryProvider

### 2. Navigator Lock проблема
- В `lib/supabase/client.ts` используется кастомный `lockNoOp`
- Может быть проблема с async/await и lock механизмом

### 3. Auth session блокировка
- Supabase client может ждать auth session перед запросом
- В wizard мы не авторизованы (anon доступ)

### 4. RLS политики (маловероятно)
- RLS разрешает `anon` доступ к `activity_catalog`
- Server-side работает, значит RLS не блокирует

## 🔧 ВРЕМЕННОЕ РЕШЕНИЕ (Workaround)

**Текущее решение:** Использовать API endpoint вместо прямого client-side Supabase

```tsx
// components/features/profile/wizard/step-2-activities.tsx
const { data } = useQuery({
  queryKey: ['activity-catalog'],
  queryFn: async () => {
    const response = await fetch('/api/activity-catalog')
    const json = await response.json()
    return json.data || []
  }
})
```

**Проблемы workaround:**
- ⚠️ Дополнительный HTTP round-trip (медленнее)
- ⚠️ Дополнительная нагрузка на сервер
- ⚠️ Не использует преимущества React Query кэширования с Supabase realtime

## ✅ РЕШЕНИЕ

**Root Cause:** Прямой client-side Supabase запрос **НЕ ОТПРАВЛЯЕТ HTTP-запрос** в контексте wizard компонента. Промис создаётся, но никогда не resolve, и в Network tab отсутствует запрос к `*.supabase.co/rest/v1/activity_catalog`.

**Диагностика показала:**
- Прямой `supabase.from().select()` зависает на 5+ секунд, **но HTTP-запрос не отправляется**
- API endpoint `/api/activity-catalog` работает идеально (~400-500ms)
- В `activity-filters.tsx` тот же код работает (возможно, из-за другого контекста монтирования)

**Решение:** Использовать API endpoint вместо прямого client-side Supabase запроса.

**Изменения:**
- ❌ Убрано: Прямой client-side Supabase запрос
- ✅ Используется: API endpoint `/api/activity-catalog` (server-side Supabase)

**Код после исправления:**
```tsx
const [activities, setActivities] = useState<Activity[]>([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
  let cancelled = false
  
  async function loadActivities() {
    try {
      const response = await fetch('/api/activity-catalog')
      
      if (cancelled) return
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const json = await response.json()
      
      if (json.error) {
        throw new Error(json.error)
      }
      
      if (!cancelled) {
        setActivities(json.data || [])
        setIsLoading(false)
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setIsLoading(false)
      }
    }
  }
  
  loadActivities()
  
  return () => {
    cancelled = true
  }
}, [])
```

## 🤔 ПОЧЕМУ ПРЯМОЙ ЗАПРОС НЕ РАБОТАЕТ?

**Проблема:** Промис Supabase создаётся, но HTTP-запрос **не отправляется вообще** (нет в Network tab).

**Возможные причины:**
1. **Navigator Lock блокировка** - `lockNoOp` может не работать правильно в этом контексте
2. **Auth session ожидание** - Supabase может ждать session перед запросом, но session не приходит
3. **React Strict Mode** - двойной рендер может создавать конфликты промисов
4. **Контекст монтирования** - wizard компонент может монтироваться в особом контексте, где Supabase client работает иначе

**Доказательства:**
- ❌ Прямой запрос: timeout 5+ секунд, **нет HTTP-запроса в Network tab**
- ✅ API endpoint: работает идеально (~400-500ms)
- ✅ `activity-filters.tsx`: тот же код работает (разный контекст монтирования?)

## 📝 TODO (Опционально)

Если в будущем понадобится использовать React Query:
- [ ] Исследовать, почему React Query блокирует Supabase промисы
- [ ] Попробовать разные настройки QueryProvider
- [ ] Проверить совместимость версий @tanstack/react-query и @supabase/ssr

## 🔗 СВЯЗАННЫЕ ФАЙЛЫ

- `components/features/profile/wizard/step-2-activities.tsx` - проблемный компонент
- `components/features/home/activity-filters.tsx` - рабочий пример
- `lib/supabase/client.ts` - Supabase client config
- `components/providers/query-provider.tsx` - React Query config
- `app/api/activity-catalog/route.ts` - временный workaround endpoint




