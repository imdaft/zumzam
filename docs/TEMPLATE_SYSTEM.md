# Система шаблонов для секций профиля

## Описание

Система позволяет пользователям выбирать разные варианты отображения (шаблоны) для каждой секции их профиля. Это дает возможность персонализировать внешний вид профиля без необходимости знаний в программировании или дизайне.

## Реализовано

### ✅ Секция "О нас" (About)

Доступны 3 шаблона:

1. **Classic (Классический)** - `classic`
   - Обложка сверху
   - Логотип и название внизу
   - Традиционный формат
   - Подходит для: большинства профилей

2. **Modern (Современный)** - `modern`
   - Обложка слева (50%)
   - Контент справа (50%)
   - Акцент на визуальной составляющей
   - Подходит для: профилей с яркими фото

3. **Minimal (Минималистичный)** - `minimal`
   - Обложка на весь блок
   - Текст поверх с градиентом
   - Лаконичный и стильный
   - Подходит для: современных брендов

## Архитектура

### База данных

```sql
-- Поле в таблице profiles
section_templates JSONB DEFAULT '{
  "about": "classic",
  "packages": "grid",
  "services": "list",
  ...
}'
```

### Типы TypeScript

```typescript
// lib/types/templates.ts
export type AboutTemplateId = 'classic' | 'modern' | 'minimal'

export interface SectionTemplates {
  about?: AboutTemplateId
  packages?: PackagesTemplateId
  // ...
}
```

### Конфигурация

```typescript
// lib/constants/template-configs.tsx
export const ABOUT_SECTION_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'about',
  sectionName: 'О нас',
  defaultTemplate: 'classic',
  templates: [
    { id: 'classic', name: 'Классический', ... },
    { id: 'modern', name: 'Современный', ... },
    { id: 'minimal', name: 'Минималистичный', ... },
  ],
}
```

### Компоненты

1. **AboutSection** (`components/features/profile/templates/about-section.tsx`)
   - Рендерит выбранный шаблон
   - Содержит 3 подкомпонента для разных шаблонов

2. **AboutSectionClient** (`components/features/profile/templates/about-section-client.tsx`)
   - Клиентский wrapper с состоянием
   - Показывает UI переключения (только владельцу)

3. **TemplateSwitcher** (`components/features/profile/templates/template-switcher.tsx`)
   - UI для выбора шаблона
   - Компактная и полная версии
   - Стрелки лево-право + popup с описанием

### API

**Endpoint:** `/api/profiles/[id]/templates`

**PATCH** - Обновить шаблон секции
```typescript
Request: { sectionId: 'about', templateId: 'modern' }
Response: { success: true, section_templates: {...} }
```

**GET** - Получить текущие шаблоны
```typescript
Response: { section_templates: {...} }
```

### Хук

```typescript
// hooks/use-profile-templates.ts
const { getTemplate, updateTemplate, isUpdating } = useProfileTemplates({
  profileId,
  initialTemplates,
})

// Использование
const currentTemplate = getTemplate('about')
await updateTemplate('about', 'modern')
```

## Использование

### В ProfilePage

```tsx
import { AboutSectionClient } from '@/components/features/profile/templates/about-section-client'

<AboutSectionClient
  data={{
    profileSlug,
    profileUserId,
    coverPhoto,
    displayName,
    // ... остальные данные
  }}
  profileId={profile.id}
  initialTemplate={profile.section_templates?.about || 'classic'}
  isOwner={isOwner}
/>
```

### Для пользователя

1. Открыть свой профиль
2. Нажать "Изменить дизайн" (справа сверху)
3. Листать шаблоны стрелками или выбрать из списка
4. Изменения сохраняются автоматически

**Мобильная версия:** компактный переключатель внизу секции

## Расширение системы

### Добавление нового шаблона для существующей секции

1. **Добавить тип:**
```typescript
// lib/types/templates.ts
export type AboutTemplateId = 'classic' | 'modern' | 'minimal' | 'новый'
```

2. **Добавить в конфигурацию:**
```typescript
// lib/constants/template-configs.tsx
templates: [
  // ... существующие
  { id: 'новый', name: 'Название', description: '...', icon: Icon }
]
```

3. **Создать компонент:**
```typescript
// components/features/profile/templates/about-section.tsx
function AboutSectionНовый({ data }: Props) {
  return (/* JSX */)
}

// Добавить в switch
switch (template) {
  case 'новый': return <AboutSectionНовый data={data} />
  // ...
}
```

### Добавление шаблонов для новой секции

1. **Добавить типы:**
```typescript
// lib/types/templates.ts
export type НоваяСекцияTemplateId = 'вариант1' | 'вариант2'

export interface SectionTemplates {
  // ...
  новая_секция?: НоваяСекцияTemplateId
}
```

2. **Создать конфигурацию:**
```typescript
// lib/constants/template-configs.tsx
export const НОВАЯ_СЕКЦИЯ_TEMPLATES: SectionTemplateConfig = {
  sectionId: 'новая_секция',
  sectionName: 'Название',
  defaultTemplate: 'вариант1',
  templates: [...]
}

// Добавить в маппинг
export const SECTION_TEMPLATE_CONFIGS: Record<string, SectionTemplateConfig> = {
  // ...
  новая_секция: НОВАЯ_СЕКЦИЯ_TEMPLATES,
}
```

3. **Создать компоненты:**
```typescript
// components/features/profile/templates/новая-секция.tsx
export function НоваяСекция({ data, template }: Props) {
  switch (template) {
    case 'вариант1': return <Вариант1 data={data} />
    case 'вариант2': return <Вариант2 data={data} />
  }
}

// Wrapper
export function НоваяСекцияClient({ data, profileId, initialTemplate, isOwner }: Props) {
  const { getTemplate, updateTemplate } = useProfileTemplates({ profileId })
  // ...
}
```

4. **Использовать в ProfilePage:**
```tsx
<НоваяСекцияClient
  data={...}
  profileId={profile.id}
  initialTemplate={profile.section_templates?.новая_секция}
  isOwner={isOwner}
/>
```

## Технические детали

### Производительность

- **Нагрузка на БД:** Минимальная (1 JSONB поле)
- **Нагрузка на клиент:** Только выбранный шаблон рендерится
- **Скорость:** Оптимистичное обновление UI
- **Кэширование:** Next.js ISR кэширует готовые страницы

### Совместимость

- ✅ Мобильные устройства (адаптивный дизайн)
- ✅ Все современные браузеры
- ✅ Доступность (A11y)

### Безопасность

- ✅ Только владелец может менять шаблоны
- ✅ Валидация на сервере
- ✅ Проверка прав доступа в API

## Roadmap

### Планируется добавить шаблоны для:

- [ ] Секция "Пакеты" (packages)
  - Grid (сетка)
  - Carousel (карусель)
  - List (список с деталями)

- [ ] Секция "Услуги" (services)
  - List (компактный список)
  - Cards (карточки)
  - Table (таблица с фильтрами)

- [ ] Секция "Портфолио" (portfolio)
  - Masonry (кирпичная кладка)
  - Grid (ровная сетка)
  - Carousel (слайдер)

- [ ] Секция "Контакты" (contacts)
  - Standard (карта + инфо)
  - Map-first (акцент на карту)
  - Split (50/50)

- [ ] Секция "FAQ" (faq)
  - Accordion (аккордеон)
  - Cards (карточки)
  - List (простой список)

### Дополнительные функции

- [ ] Предпросмотр шаблона перед применением
- [ ] Сохранение любимых комбинаций шаблонов
- [ ] Рекомендации шаблонов по категории профиля
- [ ] Аналитика: какие шаблоны популярнее
- [ ] Премиум шаблоны (платные)
- [ ] Кастомизация цветов шаблона
- [ ] Импорт/экспорт настроек дизайна

## FAQ

**Q: Как это влияет на SEO?**
A: Никак. Контент остается тем же, меняется только визуальное представление.

**Q: Что если пользователь выбрал шаблон, а затем его удалили?**
A: Система автоматически вернется к дефолтному шаблону секции.

**Q: Можно ли добавить свой шаблон?**
A: Да, см. раздел "Расширение системы" выше.

**Q: Сохраняются ли шаблоны при клонировании профиля?**
A: Да, поле `section_templates` копируется вместе с профилем.

## Техническая поддержка

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Проверьте логи сервера
3. Убедитесь, что миграция БД применена
4. Проверьте права доступа пользователя

## Вклад

При добавлении новых шаблонов, пожалуйста:
- Следуйте существующей структуре кода
- Добавляйте комментарии на русском
- Тестируйте на мобильных устройствах
- Обновляйте эту документацию















