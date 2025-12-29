# Инструкция по обновлению компонентов блоков для v2.0

## Общий паттерн изменений

Все компоненты блоков профиля должны быть обновлены по единому паттерну:

### 1. Добавить проп `variant` (опционально)

```typescript
// До:
interface ServicesBlockProps {
  profileId: string
  initialTemplates?: SectionTemplates
  isOwner?: boolean
  // ...
}

// После:
interface ServicesBlockProps {
  profileId: string
  initialTemplates?: SectionTemplates
  variant?: TemplateVariant // НОВЫЙ проп (опционально)
  isOwner?: boolean
  // ...
}
```

### 2. Передать `variant` в хук

```typescript
// До:
const { getTemplate, updateTemplate, isUpdating } = useProfileTemplates({
  profileId,
  initialTemplates,
})

// После:
const { getTemplate, updateTemplate, isUpdating, variant } = useProfileTemplates({
  profileId,
  initialTemplates,
  variant, // Передаем variant (может быть undefined)
})
```

### 3. UI селектора вариантов (опционально)

Добавить индикатор текущего варианта:

```typescript
{showOwnerControls && (
  <div className="space-y-2">
    {/* Индикатор варианта */}
    <div className="text-xs text-gray-500">
      {variant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
    </div>
    
    {/* Селектор вариантов */}
    <div className="flex gap-2">
      {/* ... */}
    </div>
  </div>
)}
```

## Список компонентов для обновления

### ✅ Критичные (обязательно)
1. `components/features/profile/services/services-block.tsx`
2. `components/features/profile/photo-gallery-client.tsx`
3. `components/features/packages/package-tiers-display.tsx`

### 🔶 Важные (желательно)
4. `components/features/profile/turnkey/turnkey-packages-block.tsx`
5. `components/features/profile/contacts-block.tsx`
6. `components/features/profile/profile-faq.tsx`

### ⚪ Дополнительные (можно отложить)
7. `components/features/profile/venue/locations-tabs.tsx`
8. `components/features/animator/animator-characters-section.tsx`

## Пример обновления: ServicesBlock

Полный пример изменений в `services-block.tsx`:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import type { 
  SectionTemplates, 
  ServicesTemplateId,
  TemplateVariant 
} from '@/lib/types/templates'
// ... другие импорты

export interface ServicesBlockProps {
  profileId: string
  initialTemplates?: SectionTemplates
  variant?: TemplateVariant // НОВЫЙ проп
  groups: ServiceGroup[]
  title: string
  description?: string
  isOwner?: boolean
  sectionId?: string
}

export function ServicesBlock({
  profileId,
  initialTemplates,
  variant, // НОВЫЙ проп
  groups,
  title,
  description,
  isOwner = false,
  sectionId = 'services',
}: ServicesBlockProps) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  
  // Передаем variant в хук
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant, // Передаем variant (может быть undefined - хук определит сам)
    onTemplateChange: (sectionId, templateId, variant) => {
      console.log(`Шаблон ${sectionId} обновлен на ${templateId} для ${variant}`)
    },
  })

  const currentTemplate = getTemplate(sectionId) as ServicesTemplateId

  // ... остальная логика компонента

  return (
    <div>
      {showOwnerControls && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
          </div>
          
          <div className="flex gap-2">
            {['list', 'cards', 'table'].map((templateId) => (
              <button
                key={templateId}
                onClick={() => updateTemplate(sectionId, templateId as ServicesTemplateId)}
                disabled={isUpdating}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  currentTemplate === templateId
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {templateId === 'list' && 'Список'}
                {templateId === 'cards' && 'Карточки'}
                {templateId === 'table' && 'Таблица'}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Рендер по выбранному шаблону */}
      {currentTemplate === 'list' && <ServicesList groups={groups} />}
      {currentTemplate === 'cards' && <ServicesCards groups={groups} />}
      {currentTemplate === 'table' && <ServicesTable groups={groups} />}
    </div>
  )
}
```

## Автоматический variant

Если `variant` не передан в компонент, хук `useProfileTemplates` автоматически определит его через media query:

- **Мобильная** (< 768px): `variant = 'mobile'`
- **Десктопная** (≥ 768px): `variant = 'desktop'`

## Обратная совместимость

Хук автоматически обрабатывает legacy формат (`section_templates`):

```typescript
// Legacy формат (старый)
{ "services": "list" }

// Автоматически конвертируется в:
{ "services": { "mobile": "list", "desktop": "list" } }
```

## Тестирование

После обновления компонента проверьте:

1. ✅ Отображается правильный вариант на mobile/desktop
2. ✅ Селектор вариантов работает
3. ✅ Изменения сохраняются
4. ✅ Индикатор показывает текущий variant
5. ✅ Legacy профили продолжают работать

## Примечания

- Компонент может НЕ получать `variant` - хук определит сам
- UI индикатор варианта показывается только владельцу
- Изменения сохраняются раздельно для mobile/desktop
- Toast уведомления показывают, какой variant был изменен

## Следующие шаги

1. Обновить критичные компоненты (1-3)
2. Протестировать на реальном профиле
3. Обновить остальные компоненты
4. Выполнить миграцию БД в production





