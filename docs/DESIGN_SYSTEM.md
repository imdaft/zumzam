# Дизайн-система ZumZam (стиль Яндекса)

## 📐 Общая философия

Дизайн-система ZumZam основана на визуальном языке Яндекс.Услуг — современном, дружелюбном и функциональном подходе к интерфейсам.

### Ключевые принципы

1. **Большие радиусы скругления** — создают мягкий, дружелюбный интерфейс
2. **Глубокие мягкие тени** — добавляют объём без агрессивности
3. **Увеличенные отступы** — делают интерфейс просторным и удобным
4. **Плавные переходы** — все изменения состояний анимированы
5. **Чёткая типографика** — крупные заголовки, читаемый текст

---

## 🎨 Цветовая палитра

### Основные цвета

```css
/* Акцентный цвет - оранжевый */
--primary: #F97316;        /* orange-500 */
--primary-hover: #EA580C;  /* orange-600 */
--primary-light: #FFF7ED;  /* orange-50 */
--primary-text: #C2410C;   /* orange-700 */

/* Текст */
--text-primary: #0F172A;   /* slate-900 */
--text-secondary: #475569; /* slate-600 */
--text-hint: #64748B;      /* slate-500 */
--text-disabled: #CBD5E1;  /* slate-300 */

/* Фоны */
--bg-page: #F8FAFC;        /* slate-50 */
--bg-card: #FFFFFF;        /* white */
--bg-hover: #F1F5F9;       /* slate-100 */
--bg-active: #FFF7ED;      /* orange-50 */

/* Границы */
--border: #E2E8F0;         /* slate-200 */
--border-hover: #CBD5E1;   /* slate-300 */
```

### Семантические цвета

```css
/* Успех */
--success: #22C55E;        /* green-500 */
--success-light: #F0FDF4;  /* green-50 */

/* Ошибка */
--error: #EF4444;          /* red-500 */
--error-light: #FEF2F2;    /* red-50 */

/* Предупреждение */
--warning: #F59E0B;        /* amber-500 */
--warning-light: #FFFBEB;  /* amber-50 */

/* Информация */
--info: #3B82F6;           /* blue-500 */
--info-light: #EFF6FF;     /* blue-50 */
```

---

## 📦 Компоненты

### Кнопки

#### Primary (основная)
```tsx
<Button variant="default" className="rounded-full px-6 py-3">
  Кнопка
</Button>
```
- **Цвет**: оранжевый `bg-orange-500`
- **Hover**: `bg-orange-600`
- **Скругление**: `rounded-full` (полностью круглая)
- **Отступы**: `px-6 py-3` (средняя), `px-8 py-4` (большая)

#### Secondary (вторичная)
```tsx
<Button variant="outline" className="rounded-full px-6 py-3">
  Кнопка
</Button>
```
- **Цвет**: белый фон с серой обводкой
- **Hover**: `bg-gray-50`

#### Ghost (призрачная)
```tsx
<Button variant="ghost" className="rounded-full">
  Кнопка
</Button>
```
- **Цвет**: прозрачный фон
- **Hover**: `bg-gray-50`

### Карточки

```tsx
<Card className="rounded-[24px] border-none shadow-sm">
  <CardHeader>
    <CardTitle className="text-xl font-bold">Заголовок</CardTitle>
    <CardDescription>Описание</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Контент */}
  </CardContent>
</Card>
```

**Стилизация:**
- **Скругление**: `rounded-[24px]` для больших карточек, `rounded-[16px]` для маленьких
- **Тень**: `shadow-sm` или `shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]`
- **Граница**: обычно `border-none` (тень вместо границы)
- **Фон**: `bg-white`
- **Отступы**: `p-6` или `p-8`

### Dropdown меню

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="rounded-full">
      <Settings className="w-5 h-5" />
    </button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuItem>
      <Icon className="w-4 h-4 mr-3" />
      <span>Пункт меню</span>
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    <DropdownMenuItem className="text-red-600">
      Удалить
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Стилизация:**
- **Скругление**: `rounded-[24px]`
- **Тень**: `shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]`
- **Отступы элементов**: `px-5 py-3.5`
- **Hover**: `hover:bg-gray-50`
- **Активный элемент**: `bg-orange-50 text-orange-700`

### Select (выпадающий список)

```tsx
<Select>
  <SelectTrigger className="rounded-[16px]">
    <SelectValue placeholder="Выберите..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Вариант 1</SelectItem>
    <SelectItem value="2">Вариант 2</SelectItem>
  </SelectContent>
</Select>
```

### Input (поле ввода)

```tsx
<Input 
  type="text" 
  placeholder="Введите текст..."
  className="rounded-[16px] border-slate-200 focus:border-orange-500"
/>
```

**Стилизация:**
- **Скругление**: `rounded-[16px]`
- **Граница**: `border-slate-200`
- **Focus**: `focus:border-orange-500 focus:ring-orange-200`
- **Отступы**: `px-4 py-3`

### Dialog (модальное окно)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px] rounded-[24px]">
    <DialogHeader>
      <DialogTitle>Заголовок</DialogTitle>
      <DialogDescription>Описание</DialogDescription>
    </DialogHeader>
    
    {/* Контент */}
    
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Отмена</Button>
      <Button variant="default" onClick={onSave}>Сохранить</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📏 Отступы и размеры

### Spacing Scale

```
xs:  4px   (1)
sm:  8px   (2)
md:  16px  (4)
lg:  24px  (6)
xl:  32px  (8)
2xl: 48px  (12)
3xl: 64px  (16)
```

### Внутренние отступы (padding)

- **Кнопки**: `px-6 py-3` (средние), `px-8 py-4` (большие)
- **Карточки**: `p-6` (средние), `p-8` (большие)
- **Элементы меню**: `px-5 py-3.5`
- **Input/Select**: `px-4 py-3`

### Внешние отступы (margin/gap)

- **Между элементами формы**: `space-y-4` или `gap-4`
- **Между секциями**: `space-y-8` или `gap-8`
- **Между блоками**: `space-y-12` или `gap-12`

---

## 🔤 Типографика

### Заголовки

```tsx
// h1 - главный заголовок страницы
<h1 className="text-4xl md:text-5xl font-bold text-slate-900">
  Заголовок H1
</h1>

// h2 - заголовок секции
<h2 className="text-3xl font-bold text-slate-900">
  Заголовок H2
</h2>

// h3 - заголовок подсекции
<h3 className="text-xl font-bold text-slate-900">
  Заголовок H3
</h3>

// h4 - заголовок карточки
<h4 className="text-lg font-semibold text-slate-900">
  Заголовок H4
</h4>
```

### Текст

```tsx
// Основной текст
<p className="text-[15px] text-slate-700 leading-relaxed">
  Основной текст
</p>

// Вторичный текст
<p className="text-sm text-slate-600">
  Вторичный текст
</p>

// Hint/подсказка
<span className="text-xs text-slate-500">
  Подсказка
</span>
```

### Веса шрифта

- `font-normal` (400) — обычный текст
- `font-medium` (500) — акцент в тексте
- `font-semibold` (600) — заголовки карточек
- `font-bold` (700) — основные заголовки

---

## 🎭 Анимации и переходы

### Стандартные переходы

```tsx
// Универсальный переход для интерактивных элементов
className="transition-all duration-300 ease-out"

// Только цвет
className="transition-colors duration-200"

// Только трансформация
className="transition-transform duration-300"
```

### Hover эффекты

```tsx
// Кнопка
className="hover:bg-orange-600 hover:shadow-lg transition-all"

// Карточка
className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300"

// Элемент меню
className="hover:bg-gray-50 transition-colors"
```

### Анимации меню (Sliding Indicator) ⭐

**Концепция:** Плавно перемещающаяся капсула-индикатор активного элемента меню.

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'

export function AnimatedMenu({ items }: { items: Array<{ id: string; label: string }> }) {
  const [activeItem, setActiveItem] = useState(items[0]?.id)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Обновляем позицию индикатора при смене активного элемента
  useEffect(() => {
    const activeButton = buttonRefs.current[activeItem]
    if (activeButton && containerRef.current) {
      const buttonRect = activeButton.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: buttonRect.width,
      })
    }
  }, [activeItem])

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 px-3 py-3 overflow-x-auto">
      {/* Плавно перемещающаяся капсула-индикатор */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[40px] bg-orange-500 rounded-full transition-all duration-300 ease-out shadow-sm"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />
      
      {/* Элементы меню */}
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => { buttonRefs.current[item.id] = el }}
          onClick={() => setActiveItem(item.id)}
          className={`
            relative z-10 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium
            transition-colors duration-200 flex-shrink-0
            ${activeItem === item.id ? 'text-white' : 'text-slate-600 hover:text-slate-900'}
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
```

**Ключевые моменты:**
- Индикатор использует `transition-all duration-300 ease-out` для плавного движения
- Позиция рассчитывается динамически через `getBoundingClientRect()`
- `z-10` на кнопках чтобы текст был поверх индикатора
- Активный текст белый, неактивный серый

### Debounced Scroll Updates (для меню)

```tsx
useEffect(() => {
  let timeoutRef: NodeJS.Timeout | null = null
  
  const handleScroll = () => {
    // Очищаем предыдущий таймер
    if (timeoutRef) {
      clearTimeout(timeoutRef)
    }
    
    // Задержка перед обновлением (сглаживание)
    timeoutRef = setTimeout(() => {
      // Логика обновления активного элемента
      updateActiveSection()
    }, 100) // 100ms задержка для плавности
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  return () => {
    window.removeEventListener('scroll', handleScroll)
    if (timeoutRef) clearTimeout(timeoutRef)
  }
}, [])
```

**Зачем:** Предотвращает "дергание" индикатора при быстром скролле.

### Анимации появления (Framer Motion)

```tsx
import { motion } from 'framer-motion'

// Fade in с движением снизу
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Контент
</motion.div>

// Fade in с масштабированием
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
>
  Модальное окно
</motion.div>

// Последовательная анимация списка
<motion.div>
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: i * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Bottom Sheet / Drawer анимация

```tsx
<div 
  className={`
    fixed left-0 right-0 bottom-0 bg-white z-[70]
    rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)]
    transition-transform duration-300 ease-out
  `}
  style={{ 
    transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
  }}
>
  {/* Контент */}
</div>

{/* Затемнение фона */}
<div 
  className={`
    fixed inset-0 bg-black/50 z-[60]
    transition-opacity duration-300
    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
  `}
  onClick={onClose}
/>
```

### Карусель с плавной прокруткой

```tsx
const scrollToCard = (index: number) => {
  if (!trackRef.current) return
  
  const cardWidth = 300 // ширина карточки
  const gap = 12       // отступ между карточками
  const targetScroll = index * (cardWidth + gap)
  
  // Плавная прокрутка через CSS
  trackRef.current.style.scrollBehavior = 'smooth'
  trackRef.current.scrollLeft = targetScroll
  
  // Или через requestAnimationFrame для большего контроля
  const startScroll = trackRef.current.scrollLeft
  const distance = targetScroll - startScroll
  const duration = 800
  const startTime = performance.now()
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3) // cubic ease-out
    
    trackRef.current!.scrollLeft = startScroll + distance * easeOut
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}
```

---

## 📐 Скругления (Border Radius)

### Размеры

```
sm:   8px   (rounded-lg)        ← НЕ используй
md:   12px  (rounded-xl)        ← НЕ используй
lg:   16px  (rounded-[16px])    ← для input, малых карточек
xl:   24px  (rounded-[24px])    ← для карточек, dropdown
full: 9999px (rounded-full)     ← для кнопок, аватаров
```

### Правила использования

- **Кнопки**: всегда `rounded-full`
- **Карточки**: `rounded-[24px]` (большие), `rounded-[16px]` (маленькие)
- **Dropdown/Modal**: `rounded-[24px]`
- **Input/Select**: `rounded-[16px]`
- **Изображения**: `rounded-[16px]` или `rounded-full`
- **Badges/Tags**: `rounded-full`

---

## 🌑 Тени (Shadows)

### Уровни глубины

```css
/* Лёгкая тень (карточки) */
shadow-sm
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);

/* Средняя тень (hover карточек) */
shadow-md
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

/* Глубокая мягкая тень (dropdown, modal) */
shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]

/* Очень глубокая тень (модальные окна) */
shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
```

### Правила использования

- **Карточки**: `shadow-sm` обычно, `shadow-md` при hover
- **Dropdown меню**: `shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]`
- **Модальные окна**: `shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]`
- **Кнопки**: `shadow-md` обычно, `shadow-lg` при hover

---

## 📱 Адаптивность

### Брейкпоинты

```
sm:  640px  (планшеты вертикально)
md:  768px  (планшеты горизонтально)
lg:  1024px (десктоп малый)
xl:  1280px (десктоп большой)
2xl: 1536px (широкий десктоп)
```

### Стратегия Mobile-First

```tsx
// Базовый стиль - для мобильных
<div className="p-4 text-sm">
  
// Планшет
<div className="md:p-6 md:text-base">
  
// Десктоп
<div className="lg:p-8 lg:text-lg">
```

### Скрытие элементов

```tsx
// Показывать только на десктопе
<div className="hidden md:block">

// Показывать только на мобильных
<div className="block md:hidden">

// Показывать на планшете и выше
<div className="hidden sm:block">
```

---

## ✅ Чеклист при создании компонента

- [ ] Используются компоненты из `components/ui/`
- [ ] Скругления ≥ 16px (`rounded-[16px]` или больше)
- [ ] Отступы увеличены (`px-5 py-3.5` для меню, `p-6` для карточек)
- [ ] Добавлены плавные переходы `transition-all duration-300`
- [ ] Hover состояния реализованы с мягкими цветами `hover:bg-gray-50`
- [ ] Активные элементы оранжевые `bg-orange-50 text-orange-700`
- [ ] Тени мягкие и глубокие (кастомные, не стандартные)
- [ ] Типографика соответствует гайдам (размеры, веса)
- [ ] Адаптивность работает (проверены мобильная и десктоп версии)
- [ ] Используются иконки из `lucide-react`

---

## 📚 Примеры хороших компонентов

Изучи эти файлы перед созданием нового UI:

### Dropdown меню
- `components/shared/user-menu.tsx` ⭐
- `components/features/profile/templates/about-section-client.tsx`
- `components/ui/dropdown-menu.tsx`

### Карточки
- `components/features/profile/profile-preview.tsx`
- `components/features/board/subscription-card.tsx`

### Формы
- `components/features/profile/create-profile-form.tsx`
- `components/features/auth/login-form.tsx`

### Модальные окна
- `components/features/profile/cover-crop-editor.tsx`
- `components/shared/image-cropper.tsx`

---

## 🚫 Антипаттерны (так НЕ делай)

### ❌ Самописные dropdown'ы

```tsx
// ПЛОХО
<div className="absolute bg-white rounded-xl">
  <button onClick={...}>Item</button>
</div>

// ХОРОШО
<DropdownMenu>
  <DropdownMenuTrigger>...</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### ❌ Маленькие скругления

```tsx
// ПЛОХО
<Card className="rounded-lg"> {/* 12px */}

// ХОРОШО
<Card className="rounded-[24px]"> {/* 24px */}
```

### ❌ Стандартные тени

```tsx
// ПЛОХО
<div className="shadow-md">

// ХОРОШО
<div className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]">
```

### ❌ Резкие переходы

```tsx
// ПЛОХО
<button className="hover:bg-blue-500">

// ХОРОШО
<button className="transition-all duration-300 hover:bg-orange-500">
```

### ❌ Мелкие отступы

```tsx
// ПЛОХО
<DropdownMenuItem className="px-2 py-1">

// ХОРОШО
<DropdownMenuItem className="px-5 py-3.5">
```

---

## 🎯 Итоговая памятка

1. ✅ **Всегда используй UI компоненты** из `components/ui/`
2. ✅ **Большие скругления** (`rounded-[16px]` и выше)
3. ✅ **Увеличенные отступы** (минимум `px-4 py-3`)
4. ✅ **Плавные переходы** (`transition-all duration-300`)
5. ✅ **Мягкие hover** (`hover:bg-gray-50`)
6. ✅ **Оранжевый акцент** (`bg-orange-500`, `text-orange-700`)
7. ✅ **Кастомные тени** (глубокие и мягкие)
8. ✅ **Mobile-first** подход к адаптивности

---

**Создано:** 9 декабря 2024  
**Последнее обновление:** 9 декабря 2024

