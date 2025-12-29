# AI расширение изображений обложки

## Обзор

Система AI расширения (outpainting) позволяет пользователям расширять изображения обложки профиля с помощью **Gemini 2.5 Flash Image (Nano Banana)**. Это платная функция, стоимость которой составляет **10 кредитов** за одно расширение.

## Документация API

- **Gemini Image Generation**: https://ai.google.dev/gemini-api/docs/image-generation
- **Модель**: `gemini-2.5-flash-image` (Nano Banana)

## Возможности

### 1. Редактор кропа обложки
- Интерактивный кроп с использованием `react-easy-crop`
- Поддержка zoom, pan, и rotate
- Разные соотношения сторон для разных шаблонов:
  - **Classic**: 16:9 (горизонтальная)
  - **Modern**: 3:4 (вертикальная для левого блока)
  - **Minimal**: 16:9 (горизонтальная)

### 2. AI расширение изображений
- **Направления расширения**:
  - `top` - расширение сверху (30%)
  - `bottom` - расширение снизу (30%)
  - `left` - расширение слева (40%, важно для Modern шаблона)
  - `right` - расширение справа (40%)
  - `all` - расширение со всех сторон (30%)

- **Технология**: Gemini 2.5 Flash Image
- **Качество**: 1024x1024 базовое разрешение
- **Стоимость**: Фиксированная токенизация - 1290 токенов на изображение

### 3. Система кредитов
- Добавлена таблица `credit_transactions` для логирования расходов
- Поле `credits` в таблице `users` для хранения баланса
- Автоматическое списание кредитов при использовании AI

## Структура базы данных

### Таблица `profiles`

```sql
-- Координаты кропа для каждого шаблона
cover_photo_crop JSONB DEFAULT '{
  "modern": {"x": 0, "y": 0, "zoom": 1, "aspect": 0.75},
  "classic": {"x": 0, "y": 0, "zoom": 1, "aspect": 1.78},
  "minimal": {"x": 0, "y": 0, "zoom": 1, "aspect": 1.78}
}'::jsonb

-- URL AI-расширенных версий изображения
cover_photo_ai_expanded JSONB DEFAULT '{}'::jsonb
```

### Таблица `users`

```sql
-- Баланс кредитов пользователя
credits INTEGER DEFAULT 0
```

### Таблица `credit_transactions`

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### 1. Сохранение кропа

**POST** `/api/profiles/[id]/cover-crop`

```typescript
// Request body
{
  templateId: 'modern' | 'classic' | 'minimal',
  crop: {
    x: number,      // -50 до 50 (процент от центра)
    y: number,      // -50 до 50 (процент от центра)
    zoom: number,   // 1 до 3
    aspect: number  // Соотношение сторон
  }
}

// Response
{
  success: true,
  message: 'Кроп обновлен'
}
```

### 2. AI расширение изображения

**POST** `/api/ai/expand-image`

```typescript
// Request body
{
  profileId: string,
  imageUrl: string,
  direction: 'top' | 'bottom' | 'left' | 'right' | 'all',
  templateId: 'modern' | 'classic' | 'minimal'
}

// Response
{
  success: true,
  expandedImageUrl: string,    // URL нового расширенного изображения
  creditsUsed: number,          // 10
  remainingCredits: number,     // Остаток после списания
  message: string
}

// Error (недостаточно кредитов)
{
  error: 'Недостаточно кредитов. Требуется: 10, доступно: 5'
}
// Status: 402 Payment Required
```

## Компоненты

### `CoverCropEditor`
**Путь**: `components/features/profile/cover-crop-editor.tsx`

Интерактивный редактор для кропа изображений с поддержкой AI расширения.

```tsx
<CoverCropEditor
  isOpen={boolean}
  imageUrl={string}
  templateId={'classic' | 'modern' | 'minimal'}
  initialCrop={CropData}
  profileId={string}
  onClose={() => void}
  onSave={(crop: CropData) => void}
/>
```

**Функции**:
- Zoom slider (1x - 3x)
- Drag & Pan изображения
- Кнопки AI расширения для каждого направления
- Сохранение кропа в БД
- Превью результата

### `AboutSectionClient`
**Путь**: `components/features/profile/templates/about-section-client.tsx`

Клиентский компонент для секции "О нас" с поддержкой шаблонов и редактора кропа.

```tsx
<AboutSectionClient
  data={AboutSectionData}
  profileId={string}
  initialTemplate={'classic' | 'modern' | 'minimal'}
  initialCrop={CropData}
  isOwner={boolean}
/>
```

**Функции**:
- Кнопка "Обложка" для открытия редактора кропа (только для владельца)
- Кнопка "Изменить дизайн" для смены шаблона
- Применение кропа к отображению изображения

### `AboutSection`
**Путь**: `components/features/profile/templates/about-section.tsx`

Базовый компонент для рендеринга секции "О нас" с применением кропа.

```tsx
<AboutSection
  data={AboutSectionData}
  template={'classic' | 'modern' | 'minimal'}
  crop={CropData}
  onTemplateChange={(templateId) => void}
/>
```

**Применение кропа**:
```tsx
const coverStyle = crop ? {
  objectPosition: `${crop.x}% ${crop.y}%`,
  transform: `scale(${crop.zoom})`,
} : {}

<Image
  src={coverPhoto}
  fill
  className="object-cover transition-transform duration-300"
  style={coverStyle}
/>
```

## Процесс работы

### 1. Пользователь открывает редактор кропа
1. Нажимает кнопку "Обложка" на странице профиля (только владелец)
2. Открывается диалоговое окно `CoverCropEditor`
3. Загружается изображение с текущими настройками кропа

### 2. Редактирование кропа
1. Пользователь может:
   - Двигать изображение (drag & drop)
   - Масштабировать (zoom slider)
   - Видеть превью в реальном времени
2. Нажимает "Применить"
3. Кроп сохраняется в `profiles.cover_photo_crop[templateId]`
4. Страница обновляется с новым кропом

### 3. AI расширение (опционально)
1. Пользователь нажимает кнопку AI расширения (например, "Влево")
2. Система проверяет баланс кредитов (требуется 10)
3. Если кредитов достаточно:
   - Отправляет запрос в Gemini 2.5 Flash Image API
   - Генерирует расширенное изображение
   - Загружает результат в Supabase Storage
   - Списывает 10 кредитов
   - Сохраняет URL в `profiles.cover_photo_ai_expanded[direction]`
   - Логирует транзакцию в `credit_transactions`
4. Если недостаточно кредитов - показывает ошибку 402

## Примеры промптов для AI

### Left expansion (для Modern шаблона)
```
Expand this image naturally to create a seamless continuation. 
This is a profile cover photo for template "modern". 
Maintain the original style, colors, lighting, composition, and quality.
Do not add any text, watermarks, or logos.

Extend the image to the LEFT by adding 40% more space on the LEFT SIDE.
Continue the background, environment, or side elements naturally to the left.
This is especially important for the "modern" template where the cover is on the left side.
Ensure the expansion looks organic and matches the original perfectly.
```

### Top expansion
```
Expand this image naturally to create a seamless continuation. 
This is a profile cover photo for template "classic". 
Maintain the original style, colors, lighting, composition, and quality.
Do not add any text, watermarks, or logos.

Extend the image UPWARD by adding 30% more space at the TOP.
Continue the background, sky, or architectural elements naturally upward.
Ensure the expansion looks organic and matches the original perfectly.
```

## Безопасность

1. **Авторизация**: Только владелец профиля может редактировать кроп и использовать AI
2. **Валидация**: Все параметры проверяются на сервере
3. **Rate Limiting**: Рекомендуется добавить лимит на количество AI запросов
4. **Кредиты**: Списание происходит только при успешной генерации
5. **Rollback**: При ошибке AI кредиты не списываются

## Требования

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Supabase Storage
- Bucket: `profile-images`
- Public access для чтения
- Upload path: `{profileId}/cover-expanded-{direction}-{timestamp}.png`

### NPM Packages
```json
{
  "@google/generative-ai": "^0.21.0",
  "react-easy-crop": "^5.5.6"
}
```

## Миграции

1. **20251209010000_add_cover_crop_and_ai.sql** - Добавление `cover_photo_crop` и `cover_photo_ai_expanded`
2. **20251209020000_add_credits_system.sql** - Система кредитов и транзакций

## Будущие улучшения

1. **Batch processing** - Расширение в несколько направлений одновременно со скидкой
2. **Preview перед покупкой** - Показывать AI описание того, как будет выглядеть расширение
3. **История версий** - Сохранять все версии расширенных изображений
4. **Автоматическое определение** - AI определяет, в каком направлении лучше расширить
5. **Gemini 3 Pro Image** - Для 4K качества (более дорогая опция)
6. **Кэширование** - Сохранять результаты для повторного использования

## Стоимость

### Gemini API
- **gemini-2.5-flash-image**: $30 per 1M tokens
- **Одно изображение**: 1290 tokens = $0.0387 USD
- **Внутренняя цена**: 10 кредитов
- **1 кредит**: ~$0.00387 USD

### Пример расчета
- Пользователь покупает 1000 кредитов за $5
- Может сделать 100 AI расширений
- Ваша прибыль: $5 - (100 × $0.0387) = $1.13 (22.6% маржа)

## Поддержка

Если возникли проблемы:
1. Проверьте наличие `GEMINI_API_KEY` в environment
2. Убедитесь что Supabase Storage настроен корректно
3. Проверьте баланс кредитов в таблице `users`
4. Посмотрите логи в `credit_transactions`
5. Проверьте формат данных в `cover_photo_crop` и `cover_photo_ai_expanded`















