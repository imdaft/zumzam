# Шпаргалка по дизайн-системе ZumZam

## 🎨 Быстрый старт

### Цвета
```tsx
bg-orange-500     // Акцент (кнопки, активные элементы)
bg-orange-50      // Светлый акцент (hover, фон активных элементов)
text-orange-700   // Текст на светлом оранжевом

bg-gray-50        // Hover фон
text-slate-900    // Основной текст
text-slate-600    // Вторичный текст
text-slate-500    // Hint/подсказка
```

### Скругления
```tsx
rounded-full      // Кнопки, аватары (9999px)
rounded-[24px]    // Карточки, dropdown, modal
rounded-[16px]    // Input, select, маленькие карточки
```

### Отступы
```tsx
px-6 py-3        // Кнопки (средние)
px-8 py-4        // Кнопки (большие)
px-5 py-3.5      // Элементы dropdown меню
px-4 py-3        // Input, select
p-6              // Карточки (средние)
p-8              // Карточки (большие)
```

### Тени
```tsx
shadow-sm                                      // Карточки
shadow-md                                      // Hover карточек
shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]   // Dropdown
shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]   // Modal
```

### Переходы
```tsx
transition-all duration-300 ease-out    // Универсальный
transition-colors duration-200          // Только цвета
transition-transform duration-300       // Только transform
```

---

## 📦 Компоненты (копируй и вставляй)

### Dropdown меню ⭐

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="w-10 h-10 bg-white border border-slate-200 rounded-full shadow-md hover:bg-slate-50 transition-all">
      <Settings className="w-5 h-5 text-slate-600" />
    </button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuItem>
      <Icon className="w-4 h-4 mr-3 text-slate-500" />
      <span>Пункт 1</span>
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    <DropdownMenuItem className="bg-orange-50 text-orange-700">
      <span>Активный пункт</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Карточка

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card className="rounded-[24px] border-none shadow-sm">
  <CardHeader>
    <CardTitle className="text-xl font-bold">Заголовок</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Контент */}
  </CardContent>
</Card>
```

### Кнопка

```tsx
import { Button } from '@/components/ui/button'

{/* Primary */}
<Button variant="default" className="rounded-full px-6 py-3">
  Основная кнопка
</Button>

{/* Secondary */}
<Button variant="outline" className="rounded-full px-6 py-3">
  Вторичная кнопка
</Button>

{/* Ghost */}
<Button variant="ghost" className="rounded-full">
  Призрачная
</Button>
```

### Input

```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="text" 
  placeholder="Введите текст..."
  className="rounded-[16px] border-slate-200 focus:border-orange-500"
/>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select>
  <SelectTrigger className="rounded-[16px]">
    <SelectValue placeholder="Выберите вариант" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Вариант 1</SelectItem>
    <SelectItem value="2">Вариант 2</SelectItem>
  </SelectContent>
</Select>
```

### Dialog (модальное окно)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px] rounded-[24px]">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold">Заголовок</DialogTitle>
      <DialogDescription className="text-slate-600">
        Описание модального окна
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-6">
      {/* Контент */}
    </div>
    
    <DialogFooter className="flex gap-3">
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Отмена
      </Button>
      <Button variant="default" onClick={handleSave}>
        Сохранить
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎯 Типографика (копируй классы)

```tsx
{/* H1 - главный заголовок страницы */}
<h1 className="text-4xl md:text-5xl font-bold text-slate-900">
  Заголовок H1
</h1>

{/* H2 - заголовок секции */}
<h2 className="text-3xl font-bold text-slate-900">
  Заголовок H2
</h2>

{/* H3 - заголовок подсекции */}
<h3 className="text-xl font-bold text-slate-900">
  Заголовок H3
</h3>

{/* Основной текст */}
<p className="text-[15px] text-slate-700 leading-relaxed">
  Основной текст
</p>

{/* Вторичный текст */}
<p className="text-sm text-slate-600">
  Вторичный текст
</p>

{/* Hint/подсказка */}
<span className="text-xs text-slate-500">
  Подсказка
</span>
```

---

## 📱 Адаптивность (mobile-first)

```tsx
{/* Показывать только на десктопе */}
<div className="hidden md:block">
  Десктоп контент
</div>

{/* Показывать только на мобильных */}
<div className="block md:hidden">
  Мобильный контент
</div>

{/* Разные размеры */}
<div className="p-4 md:p-6 lg:p-8">
  Адаптивные отступы
</div>

{/* Разная типографика */}
<h1 className="text-2xl md:text-4xl lg:text-5xl">
  Адаптивный заголовок
</h1>
```

---

## ✅ Чеклист перед commit'ом

- [ ] Используешь компоненты из `components/ui/`?
- [ ] Скругления ≥ 16px?
- [ ] Добавлены `transition-all duration-300`?
- [ ] Hover с `hover:bg-gray-50` (не `gray-100`)?
- [ ] Активные элементы оранжевые?
- [ ] Отступы увеличенные (`px-5 py-3.5` и больше)?
- [ ] Тени кастомные (не `shadow-md` для dropdown)?
- [ ] Проверена адаптивность?

---

## 🚨 Типичные ошибки

### ❌ НЕ ДЕЛАЙ ТАК:

```tsx
// Самописный dropdown
<div className="absolute bg-white">
  <button>Item</button>
</div>

// Маленькие скругления
<Card className="rounded-lg">

// Стандартные тени для dropdown
<div className="shadow-md">

// Мелкие отступы
<button className="px-2 py-1">

// Без transition
<button className="hover:bg-blue-500">
```

### ✅ ДЕЛАЙ ТАК:

```tsx
// UI компонент из библиотеки
<DropdownMenu>...</DropdownMenu>

// Большие скругления
<Card className="rounded-[24px]">

// Кастомные тени
<div className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)]">

// Увеличенные отступы
<button className="px-6 py-3">

// Плавные переходы
<button className="transition-all duration-300 hover:bg-orange-500">
```

---

**💡 Если сомневаешься** — посмотри на:
- `components/shared/user-menu.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/features/profile/templates/about-section-client.tsx`

---

## 🎬 Анимации меню (копируй код)

### Sliding Indicator (плавно движущаяся капсула) ⭐

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'

export function AnimatedMenu() {
  const [activeItem, setActiveItem] = useState('item1')
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Обновляем позицию индикатора
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
    <div ref={containerRef} className="relative flex items-center gap-1.5 px-3 py-3">
      {/* Капсула-индикатор */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[40px] bg-orange-500 rounded-full transition-all duration-300 ease-out shadow-sm"
        style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
      />
      
      {/* Кнопки меню */}
      <button
        ref={(el) => { buttonRefs.current['item1'] = el }}
        onClick={() => setActiveItem('item1')}
        className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          activeItem === 'item1' ? 'text-white' : 'text-slate-600'
        }`}
      >
        Пункт 1
      </button>
      {/* ... другие кнопки */}
    </div>
  )
}
```

**Пример из проекта:** `components/features/profile/mobile-profile-nav.tsx`

### Debounced Scroll (сглаживание скролла)

```tsx
useEffect(() => {
  let timeoutRef: NodeJS.Timeout | null = null
  
  const handleScroll = () => {
    if (timeoutRef) clearTimeout(timeoutRef)
    
    timeoutRef = setTimeout(() => {
      // Обновляем активный элемент
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

**Зачем:** Предотвращает "дергание" индикатора при быстром скролле страницы.

### Bottom Sheet (модалка снизу)

```tsx
{/* Затемнение фона */}
<div 
  className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
  onClick={onClose}
/>

{/* Bottom Sheet */}
<div 
  className="fixed left-0 right-0 bottom-0 bg-white z-[70] rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out"
  style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
>
  {/* Ручка для свайпа */}
  <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-4" />
  {/* Контент */}
</div>
```

### Framer Motion анимации

```tsx
import { motion } from 'framer-motion'

{/* Fade in с движением снизу */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Контент
</motion.div>

{/* Fade in с масштабированием (для модалок) */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
>
  Модальное окно
</motion.div>

{/* Список с задержкой (stagger) */}
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
```

### Плавная прокрутка карусели (requestAnimationFrame)

```tsx
const scrollToCard = (targetIndex: number) => {
  if (!trackRef.current) return
  
  const cardWidth = 300
  const gap = 12
  const targetScroll = targetIndex * (cardWidth + gap)
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

## 🎯 Easing функции

```tsx
// Linear (прямая)
easing = progress

// Ease Out (быстро в начале, медленно в конце) ⭐ РЕКОМЕНДУЕТСЯ
easing = 1 - Math.pow(1 - progress, 3)  // cubic
easing = 1 - Math.pow(1 - progress, 2)  // quadratic

// Ease In (медленно в начале, быстро в конце)
easing = Math.pow(progress, 3)

// Ease In-Out (медленно на краях, быстро в середине)
easing = progress < 0.5 
  ? 4 * Math.pow(progress, 3) 
  : 1 - Math.pow(-2 * progress + 2, 3) / 2
```

**Используй `ease-out` для большинства UI анимаций!**

---

