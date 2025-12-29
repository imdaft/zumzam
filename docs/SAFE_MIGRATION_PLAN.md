# 🛡️ ПЛАН БЕЗОПАСНОЙ МИГРАЦИИ НА НОВУЮ СИСТЕМУ ПРОФИЛЕЙ

**Дата:** 20 декабря 2025  
**Цель:** Перейти на новую многомерную классификацию без поломок  
**Стратегия:** Постепенная замена с сохранением работоспособности

---

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ

### ✅ Что УЖЕ работает (старая система):
- `category` → старое плоское поле (animator, venue, show, etc.)
- `details.venue_type` → старая классификация площадок
- `CategoryVisualSelector` → выбор категории (ШАГ 1)
- `VenueTypeGroupedSelector` → выбор типа площадки (ШАГ 2)
- Страница просмотра → рендерит по старым полям
- Главная страница → фильтры по старым полям
- ~30+ существующих профилей в БД

### ✅ Что УЖЕ создано (новая система):
- ✅ БД: `primary_venue_type`, `activities`, `business_models`, `space_type`, `additional_services`
- ✅ Каталоги: `activity_catalog`, `service_catalog`
- ✅ `ClassificationWizard` (5 шагов) - **НЕ интегрирован**
- ✅ `generateProfileBlocks()` - **НЕ используется**
- ✅ Новые блоки (Activities, Pricing, etc.) - **НЕ рендерятся**
- ✅ 10 тестовых профилей с новой структурой

### ⚠️ Проблемы:
- **Дублирование:** Старые и новые поля существуют одновременно
- **Не синхронизировано:** Визард создан, но не используется
- **Риск:** Удаление старого кода сломает существующие профили

---

## 🎯 СТРАТЕГИЯ МИГРАЦИИ

### Принципы:
1. **Постепенность:** Шаг за шагом, с проверкой после каждого
2. **Обратная совместимость:** Старые профили продолжают работать
3. **Дублирование → Миграция → Удаление:** Классический паттерн
4. **Тестирование:** После каждого шага проверяем работоспособность

### Этапы:
```
ЭТАП 1: Интеграция визарда (новое + старое работают)
↓
ЭТАП 2: Двойная запись (сохраняем в оба формата)
↓
ЭТАП 3: Обновление чтения (читаем из нового, fallback на старое)
↓
ЭТАП 4: Миграция данных (переносим старые → новые поля)
↓
ЭТАП 5: Переключение (используем только новое)
↓
ЭТАП 6: Очистка (удаляем старый код)
```

---

## 📋 ДЕТАЛЬНЫЙ ПЛАН (6 ЭТАПОВ)

---

## 🔧 ЭТАП 1: ИНТЕГРАЦИЯ ВИЗАРДА (1-2 часа)

**Цель:** Добавить визард в форму редактирования, НЕ трогая старый код

### ШАГ 1.1: Добавить визард в CreateProfileForm
**Файл:** `components/features/profile/create-profile-form.tsx`

```tsx
// ДОБАВИТЬ новую секцию ДО существующих CategoryVisualSelector
<Card id="section-classification">
  <CardHeader>
    <CardTitle>🎯 Новая классификация (бета)</CardTitle>
    <CardDescription>
      Опробуйте новую систему. Старая останется ниже для совместимости.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <ClassificationWizard
      profileId={profileId}
      initialData={{
        primary_venue_type: initialData?.primary_venue_type,
        activities: initialData?.activities || [],
        business_models: initialData?.business_models || [],
        space_type: initialData?.space_type,
        additional_services: initialData?.additional_services || [],
      }}
      onComplete={(data) => {
        // Сохраняем в новые поля
        form.setValue('primary_venue_type', data.primary_venue_type)
        form.setValue('activities', data.activities)
        // ... остальные поля
      }}
    />
  </CardContent>
</Card>

<Separator className="my-8" />

{/* СТАРАЯ СИСТЕМА (временно, для совместимости) */}
<div className="opacity-60">
  <p className="text-sm text-muted-foreground mb-4">
    ⚠️ Старая система (скоро будет удалена):
  </p>
  <CategoryVisualSelector ... />
  <VenueTypeGroupedSelector ... />
</div>
```

**Результат:** Пользователь видит ОБЕ системы, может попробовать новую

---

### ШАГ 1.2: Обновить схему сохранения
**Файл:** `lib/validations/profile.ts`

```typescript
export const profileSchema = z.object({
  // Старые поля (обязательны для совместимости)
  category: z.string(),
  
  // Новые поля (опциональны на переходном этапе)
  primary_venue_type: z.enum([...]).optional(),
  activities: z.array(z.string()).optional(),
  business_models: z.array(z.enum([...])).optional(),
  space_type: z.enum([...]).optional(),
  additional_services: z.array(z.string()).optional(),
  
  // ... остальные поля
})
```

**Результат:** Можно сохранять и старые, и новые поля

---

### ШАГ 1.3: Двойная запись при сохранении
**Файл:** `app/api/profiles/[id]/route.ts`

```typescript
// PATCH /api/profiles/[id]
export async function PATCH(req: Request) {
  const data = await req.json()
  
  // Если есть новые поля, сохраняем их
  const updateData: any = { ...data }
  
  // ДВОЙНАЯ ЗАПИСЬ: если заполнили новую систему, копируем в старую
  if (data.primary_venue_type) {
    // Маппинг: новое → старое (для обратной совместимости)
    updateData.category = mapPrimaryTypeToCategory(data.primary_venue_type)
    if (data.primary_venue_type === 'active_entertainment' || ...) {
      updateData.details = {
        ...updateData.details,
        venue_type: mapToOldVenueType(data.primary_venue_type, data.space_type)
      }
    }
  }
  
  await supabase.from('profiles').update(updateData).eq('id', profileId)
}
```

**Результат:** Новые данные дублируются в старые поля → старая система работает

---

### ШАГ 1.4: Тестирование
- [ ] Открыть `/profiles/kidspoint/edit`
- [ ] Увидеть визард вверху + старые селекторы внизу
- [ ] Заполнить визард
- [ ] Сохранить
- [ ] Проверить, что **оба** набора полей заполнились в БД
- [ ] Открыть профиль публично → должен отображаться корректно

**Время:** 1-2 часа  
**Риск:** 🟢 Низкий (не трогаем старый код)

---

## 🔄 ЭТАП 2: ОБНОВЛЕНИЕ РЕНДЕРИНГА (2-3 часа)

**Цель:** Страница профиля читает из новых полей, fallback на старые

### ШАГ 2.1: Обновить `app/(public)/profiles/[slug]/page.tsx`
**Файл:** `app/(public)/profiles/[slug]/page.tsx`

```tsx
import { generateProfileBlocks } from '@/lib/profile-blocks/generator'

export default async function ProfilePage({ params }: PageProps) {
  const profile = await fetchProfile(params.slug)
  
  // НОВАЯ СИСТЕМА: Если есть новые поля, генерируем блоки
  if (profile.primary_venue_type || profile.activities?.length > 0) {
    const blocks = generateProfileBlocks(profile)
    
    return (
      <div>
        <ProfileHeader profile={profile} />
        
        {blocks.map(block => {
          switch (block.type) {
            case 'activities':
              return <ActivitiesBlock key={block.id} {...block.data} />
            case 'ticket_pricing':
              return <TicketPricingBlock key={block.id} {...block.data} />
            // ... остальные блоки
          }
        })}
      </div>
    )
  }
  
  // СТАРАЯ СИСТЕМА (fallback для старых профилей)
  return (
    <div>
      {/* Текущий рендеринг по старым полям */}
      {profile.category === 'venue' && (
        <LocationsTabs locations={profile.profile_locations} />
      )}
      // ... старая логика
    </div>
  )
}
```

**Результат:** 
- Новые профили → красивый модульный вид
- Старые профили → работают как раньше

---

### ШАГ 2.2: Тестирование
- [ ] Открыть `/profiles/mazapark-spb` (новый тестовый) → новый вид
- [ ] Открыть `/profiles/kidspoint` (старый) → старый вид работает
- [ ] Проверить мобильную версию (85% пользователей)
- [ ] Проверить все типы блоков

**Время:** 2-3 часа  
**Риск:** 🟡 Средний (меняем рендеринг, но с fallback)

---

## 🔀 ЭТАП 3: МИГРАЦИЯ СУЩЕСТВУЮЩИХ ДАННЫХ (1-2 часа)

**Цель:** Переписать старые профили в новый формат

### ШАГ 3.1: Создать SQL функцию миграции
**Файл:** `supabase/migrations/YYYYMMDD_migrate_old_profiles.sql`

```sql
-- Функция миграции category + venue_type → новая структура
CREATE OR REPLACE FUNCTION migrate_profile_to_new_classification(
  p_profile_id UUID
) RETURNS VOID AS $$
DECLARE
  v_category TEXT;
  v_venue_type TEXT;
BEGIN
  SELECT category, details->>'venue_type' 
  INTO v_category, v_venue_type
  FROM profiles 
  WHERE id = p_profile_id;
  
  -- Маппинг category → primary_venue_type
  UPDATE profiles SET
    primary_venue_type = CASE
      WHEN v_category = 'venue' AND v_venue_type = 'event_studio' THEN 'event_space'
      WHEN v_category = 'venue' AND v_venue_type = 'entertainment_center' THEN 'active_entertainment'
      WHEN v_category = 'animator' THEN NULL -- Аниматоры не area-based
      -- ... остальные маппинги
    END,
    
    activities = CASE
      WHEN v_venue_type = 'entertainment_center' THEN ARRAY['arcade', 'active_games']::TEXT[]
      WHEN v_category = 'animator' THEN ARRAY['character_animation']::TEXT[]
      -- ... остальные
    END,
    
    business_models = CASE
      WHEN v_category = 'venue' AND (details->>'has_packages')::BOOLEAN THEN ARRAY['packages_turnkey']::business_model_enum[]
      WHEN v_category = 'venue' THEN ARRAY['rental']::business_model_enum[]
      WHEN v_category = 'animator' THEN ARRAY['mobile_service']::business_model_enum[]
      -- ... остальные
    END,
    
    space_type = CASE
      WHEN v_venue_type = 'event_studio' THEN 'dedicated_venue'
      WHEN v_venue_type = 'entertainment_center' THEN 'mall_venue'
      -- ... остальные
    END
    
  WHERE id = p_profile_id;
  
  -- Обновляем search_vector (триггер сработает автоматически)
END;
$$ LANGUAGE plpgsql;

-- Мигрировать ВСЕ профили
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id FROM profiles WHERE primary_venue_type IS NULL
  LOOP
    PERFORM migrate_profile_to_new_classification(profile_record.id);
  END LOOP;
END $$;
```

---

### ШАГ 3.2: Применить миграцию
```bash
# Через Supabase MCP
apply_migration(
  name="migrate_old_profiles_to_new_classification",
  query="..." # SQL выше
)
```

---

### ШАГ 3.3: Проверка
```sql
-- Проверить, что все профили мигрировали
SELECT 
  id, 
  display_name,
  category AS old_category,
  primary_venue_type AS new_type,
  activities,
  business_models
FROM profiles
WHERE created_at < '2025-12-20' -- Старые профили
ORDER BY created_at;
```

**Результат:** Все старые профили теперь имеют новую структуру

**Время:** 1-2 часа  
**Риск:** 🟡 Средний (меняем данные, но читаем из обоих полей)

---

## 🎯 ЭТАП 4: ОБНОВЛЕНИЕ ГЛАВНОЙ СТРАНИЦЫ (1-2 часа)

**Цель:** Фильтры и карточки используют новую классификацию

### ШАГ 4.1: Обновить фильтры
**Файл:** `app/(public)/page.tsx`

```tsx
// Вместо фильтра по category
<FilterSelect
  label="Тип площадки"
  options={[
    { value: 'active_entertainment', label: 'Активные развлечения' },
    { value: 'creative_space', label: 'Творческие мастерские' },
    // ... из primary_venue_type_enum
  ]}
  value={filters.primary_venue_type}
  onChange={(value) => setFilters({ ...filters, primary_venue_type: value })}
/>

<FilterSelect
  label="Активности"
  options={activityCatalog} // Из БД
  multiple
  value={filters.activities}
  onChange={(value) => setFilters({ ...filters, activities: value })}
/>
```

---

### ШАГ 4.2: Обновить карточки профилей
**Файл:** `components/features/profile/profile-card.tsx`

```tsx
export function ProfileCard({ profile }: { profile: Profile }) {
  // Новая система: показываем активности
  const displayActivities = profile.activities?.slice(0, 3) || []
  
  return (
    <div>
      {/* Теги активностей вместо старого venueType */}
      <div className="flex flex-wrap gap-1">
        {displayActivities.map(activity => (
          <Badge key={activity}>
            {getActivityLabel(activity)}
          </Badge>
        ))}
      </div>
      
      {/* Бизнес-модель */}
      {profile.business_models?.includes('tickets_freeplay') && (
        <Badge variant="outline">Входные билеты</Badge>
      )}
    </div>
  )
}
```

---

### ШАГ 4.3: Обновить API `/api/profiles/public`
**Файл:** `app/api/profiles/public/route.ts`

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const primary_venue_type = searchParams.get('primary_venue_type')
  const activities = searchParams.getAll('activities')
  
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_published', true)
  
  // Фильтр по новым полям
  if (primary_venue_type) {
    query = query.eq('primary_venue_type', primary_venue_type)
  }
  
  if (activities.length > 0) {
    query = query.contains('activities', activities)
  }
  
  // ... остальные фильтры
}
```

**Время:** 1-2 часа  
**Риск:** 🟢 Низкий (UI изменения)

---

## 🧹 ЭТАП 5: ОЧИСТКА СТАРОГО КОДА (1 час)

**Цель:** Удалить старые селекторы и дублирующий код

### ШАГ 5.1: Удалить старые компоненты
```bash
# Удалить файлы
❌ components/features/profile/category-visual-selector.tsx
❌ components/features/profile/venue-type-grouped-selector.tsx
❌ components/features/profile/category-selection-step.tsx
```

---

### ШАГ 5.2: Удалить из CreateProfileForm
**Файл:** `components/features/profile/create-profile-form.tsx`

```tsx
// УДАЛИТЬ импорты
- import { CategoryVisualSelector } from './category-visual-selector'
- import { VenueTypeGroupedSelector } from './venue-type-grouped-selector'

// УДАЛИТЬ рендеринг старых селекторов
- <CategoryVisualSelector ... />
- <VenueTypeGroupedSelector ... />

// УДАЛИТЬ условную логику по старым полям
- if (category === 'venue') { ... }
```

---

### ШАГ 5.3: Сделать новые поля обязательными
**Файл:** `lib/validations/profile.ts`

```typescript
export const profileSchema = z.object({
  // Старые поля теперь опциональны (для истории)
  category: z.string().optional(),
  
  // Новые поля ОБЯЗАТЕЛЬНЫ
  primary_venue_type: z.enum([...]).nullable(), // null для выездных
  activities: z.array(z.string()).min(1, 'Выберите хотя бы 1 активность'),
  business_models: z.array(z.enum([...])).min(1, 'Выберите модель'),
  // ...
})
```

---

### ШАГ 5.4: Удалить fallback в рендеринге
**Файл:** `app/(public)/profiles/[slug]/page.tsx`

```tsx
// УДАЛИТЬ старую ветку
- if (profile.primary_venue_type || profile.activities?.length > 0) {
-   // новый рендеринг
- } else {
-   // УДАЛИТЬ ЭТО ↓
-   // старый рендеринг
- }

// Оставить только:
const blocks = generateProfileBlocks(profile)
return <ProfileView blocks={blocks} />
```

**Время:** 1 час  
**Риск:** 🟢 Низкий (все уже мигрировано)

---

## ✅ ЭТАП 6: ФИНАЛЬНАЯ ПРОВЕРКА (30 мин)

### Чек-лист:
- [ ] Все старые профили отображаются корректно
- [ ] Новые профили создаются только через визард
- [ ] Главная страница фильтрует по новым полям
- [ ] Поиск работает (search_vector обновляется)
- [ ] Мобильная версия работает
- [ ] Нет ошибок в консоли
- [ ] Нет SQL ошибок в логах Supabase

---

## 📊 ИТОГОВАЯ ТАБЛИЦА

| Этап | Время | Риск | Откат |
|------|-------|------|-------|
| 1. Интеграция визарда | 1-2ч | 🟢 Низкий | Скрыть визард |
| 2. Обновление рендеринга | 2-3ч | 🟡 Средний | Вернуть старый рендер |
| 3. Миграция данных | 1-2ч | 🟡 Средний | SQL rollback |
| 4. Главная страница | 1-2ч | 🟢 Низкий | Откат фильтров |
| 5. Очистка | 1ч | 🟢 Низкий | Git revert |
| 6. Проверка | 30мин | - | - |
| **ИТОГО** | **7-11ч** | | |

---

## 🎯 СЛЕДУЮЩИЙ ШАГ

**Начинаем с ЭТАП 1, ШАГ 1.1:**
Интегрировать `ClassificationWizard` в `CreateProfileForm`

**Готов начать?** 🚀





