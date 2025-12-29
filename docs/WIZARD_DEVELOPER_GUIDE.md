# 🚀 Quick Start: Profile Creation Wizard

## Быстрый старт для разработчиков

### 📝 Добавление новой категории профиля

#### 1. Добавьте категорию в enum (если ещё нет)

**Файл**: `types/supabase.ts`

```typescript
profile_category:
  | 'venue'
  | 'animator'
  // ... другие категории
  | 'your_new_category' // ← добавьте сюда
```

#### 2. Создайте метаданные категории

**Файл**: `lib/constants/profile-categories.ts`

```typescript
{
  id: 'your_new_category',
  name: 'Название категории',
  description: 'Описание',
  icon: <YourIcon />,
  subtypes: [], // опционально
  minPhotos: 3,
  minVideos: 0,
  requiresDocuments: false,
}
```

#### 3. Создайте компонент characteristics

**Файл**: `components/features/profile/wizard-steps/your-category-characteristics.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { ChevronRight } from 'lucide-react'

interface YourCategoryCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function YourCategoryCharacteristics({ data, onNext, onSkip }: YourCategoryCharacteristicsProps) {
  const [yourField, setYourField] = useState(data.details?.your_field || '')

  const handleNext = () => {
    onNext({
      details: {
        your_field: yourField,
        // ... другие поля
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        Название категории
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Описание (можно пропустить)
      </p>

      <div className="space-y-6">
        {/* Ваши поля */}
      </div>

      {/* Кнопки */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-6">
        <Button onClick={onSkip} variant="outline" className="flex-1 h-11 sm:h-12 rounded-full font-semibold text-sm">
          Пропустить
        </Button>
        <Button onClick={handleNext} className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm">
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
```

#### 4. Добавьте экспорт

**Файл**: `components/features/profile/wizard-steps/index.ts`

```typescript
export { YourCategoryCharacteristics } from './your-category-characteristics'
```

#### 5. Добавьте маршрут

**Файл**: `components/features/profile/wizard-steps/characteristics.tsx`

```typescript
import { YourCategoryCharacteristics } from './index'

// В switch блоке:
case 'your_new_category':
  return <YourCategoryCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
```

#### 6. Создайте схему валидации

**Файл**: `lib/validation/profile-schemas.ts`

```typescript
const yourCategoryDetailsSchema = z.object({
  your_field: z.string().min(1, 'Обязательное поле'),
  // ... другие поля
})

export const yourCategoryProfileSchema = baseProfileSchema.extend({
  category: z.literal('your_new_category'),
  details: yourCategoryDetailsSchema,
})

// В функции getProfileValidationSchema:
case 'your_new_category':
  return yourCategoryProfileSchema
```

---

## 🎨 Доступные UI компоненты

### NumberInput
```typescript
<NumberInput
  value={count}
  onChange={setCount}
  min={0}
  max={100}
  step={5}
  label="Количество"
  suffix="шт"
/>
```

### MultiSelect
```typescript
<MultiSelect
  options={[
    { value: 'opt1', label: 'Опция 1' },
    { value: 'opt2', label: 'Опция 2' },
  ]}
  selected={selected}
  onChange={setSelected}
  placeholder="Выберите..."
/>
```

### RangeSlider
```typescript
<RangeSlider
  min={0}
  max={100}
  step={5}
  value={[min, max]}
  onChange={setRange}
  label="Диапазон"
  formatValue={(v) => `${v} ₽`}
/>
```

### AmenitiesSelector
```typescript
<AmenitiesSelector
  amenities={[
    { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
    { id: 'parking', label: 'Парковка', icon: '🚗', category: 'Инфраструктура' },
  ]}
  selected={selected}
  onChange={setSelected}
  label="Удобства"
  columns={2}
/>
```

### AddressInput
```typescript
<AddressInput
  value={address}
  onChange={(address, coordinates) => {
    setAddress(address)
    setCoordinates(coordinates)
  }}
  label="Адрес"
  city="Санкт-Петербург"
/>
```

---

## 🔧 Советы и best practices

### 1. Мобильная адаптация
- Всегда используйте `sm:` префиксы для десктопа
- Кнопки: `h-11 sm:h-12`
- Текст: `text-sm sm:text-base`
- Сетки: `grid-cols-1 sm:grid-cols-2`

### 2. Валидация
- Обязательные поля помечайте `*` в label
- Блокируйте кнопку "Далее" если не заполнены required поля:
  ```typescript
  disabled={!requiredField || array.length === 0}
  ```

### 3. Состояние
- Инициализируйте из `data.details?.field_name`
- Это позволит загружать сохранённые черновики

### 4. Типизация
- Используйте `any` для `data` (т.к. структура динамическая)
- Создавайте интерфейсы для Props
- Используйте TypeScript типы из `lib/validation/profile-schemas.ts`

---

## 🐛 Дебаггинг

### Wizard не переходит на следующий шаг
- Проверьте, что `onNext()` вызывается с правильной структурой данных
- Убедитесь, что `details` объект передаётся корректно

### Данные не сохраняются в черновик
- Проверьте, что `category` установлен
- Убедитесь, что localStorage доступен

### Компонент не рендерится
- Проверьте экспорт в `index.ts`
- Проверьте case в `characteristics.tsx`
- Проверьте консоль браузера на ошибки импорта

---

## 📚 Полезные ссылки

- [Документация Zod](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Dadata API](https://dadata.ru/api/)

---

**Нужна помощь?** Проверьте существующие компоненты в `wizard-steps/` для примеров! 🚀

















