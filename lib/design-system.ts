/**
 * Единая система дизайна для форм редактирования профиля
 * Современный, модульный, mobile-first подход
 */

// ============================================
// 🎨 ЦВЕТОВАЯ ПАЛИТРА
// ============================================
export const COLORS = {
  // Основные цвета
  primary: {
    DEFAULT: 'hsl(24, 100%, 50%)', // Оранжевый
    hover: 'hsl(24, 100%, 45%)',
    light: 'hsl(24, 100%, 97%)',
    border: 'hsl(24, 100%, 85%)',
  },
  
  // Нейтральные
  neutral: {
    50: 'hsl(210, 20%, 98%)',
    100: 'hsl(210, 20%, 96%)',
    200: 'hsl(210, 16%, 93%)',
    300: 'hsl(210, 14%, 89%)',
    400: 'hsl(210, 14%, 83%)',
    500: 'hsl(210, 11%, 71%)',
    600: 'hsl(210, 10%, 55%)',
    700: 'hsl(210, 10%, 40%)',
    800: 'hsl(210, 10%, 23%)',
    900: 'hsl(210, 11%, 15%)',
  },
  
  // Состояния
  success: 'hsl(142, 76%, 36%)',
  error: 'hsl(0, 84%, 60%)',
  warning: 'hsl(38, 92%, 50%)',
  info: 'hsl(199, 89%, 48%)',
} as const

// ============================================
// 📏 РАЗМЕРЫ И ОТСТУПЫ
// ============================================
export const SPACING = {
  // Базовая единица: 4px
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  '3xl': '3rem',  // 48px
  '4xl': '4rem',  // 64px
} as const

// ============================================
// 📐 МОДУЛЬНАЯ СЕТКА
// ============================================
export const LAYOUT = {
  // Максимальная ширина контента
  maxWidth: {
    form: '800px',      // Форма
    content: '1200px',  // Общий контент
    text: '65ch',       // Текстовый контент
  },
  
  // Отступы контейнеров
  padding: {
    mobile: '1rem',     // 16px на мобильных
    tablet: '1.5rem',   // 24px на планшетах
    desktop: '2rem',    // 32px на десктопах
  },
  
  // Gap между элементами
  gap: {
    card: '1.5rem',     // 24px между карточками
    section: '2rem',    // 32px между секциями
    field: '1rem',      // 16px между полями
  },
} as const

// ============================================
// 🔤 ТИПОГРАФИКА
// ============================================
export const TYPOGRAPHY = {
  // Размеры шрифтов
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  
  // Высота строки
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  // Вес шрифта
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

// ============================================
// 🎯 КОМПОНЕНТЫ ФОРМ
// ============================================
export const FORM_STYLES = {
  // Карточка секции
  card: {
    // Большие радиусы (24px), мягкая тень — стиль ZumZam/Яндекс
    base: 'rounded-[24px] bg-white border border-neutral-200 shadow-sm',
    hover: 'transition-shadow hover:shadow-md',
    // Mobile-first: компактнее на мобильных
    padding: 'p-4 sm:p-6',
  },
  
  // Заголовок секции
  sectionTitle: {
    base: 'text-2xl font-bold text-neutral-900 mb-1',
    mobile: 'text-xl',
  },
  
  // Описание секции
  sectionDescription: {
    base: 'text-sm text-neutral-600 mb-6',
  },
  
  // Поле ввода
  input: {
    // Инпуты 48px, радиус 16px, мягкий фокус
    base: 'h-12 rounded-[16px] border-neutral-200 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary',
    error: 'border-error focus-visible:border-error focus-visible:ring-error/20',
  },
  
  // Textarea
  textarea: {
    base: 'rounded-[16px] border-neutral-200 text-sm sm:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary resize-none',
    error: 'border-error focus-visible:border-error focus-visible:ring-error/20',
  },
  
  // Label
  label: {
    base: 'text-xs sm:text-sm font-semibold text-neutral-900',
    required: 'after:content-["*"] after:ml-0.5 after:text-error',
  },
  
  // Кнопки
  button: {
    // Кнопки 48px, rounded-full — основной паттерн в формах
    primary: 'h-12 px-6 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold transition-colors',
    secondary: 'h-12 px-6 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 rounded-full font-semibold transition-colors',
    ghost: 'h-12 px-4 hover:bg-neutral-100 text-neutral-700 rounded-full transition-colors',
    danger: 'h-12 px-6 bg-error hover:bg-error/90 text-white rounded-full font-semibold transition-colors',
  },
} as const

// ============================================
// 📱 БРЕЙКПОИНТЫ
// ============================================
export const BREAKPOINTS = {
  mobile: '640px',    // sm
  tablet: '768px',    // md
  desktop: '1024px',  // lg
  wide: '1280px',     // xl
} as const

// ============================================
// ✨ АНИМАЦИИ
// ============================================
export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// ============================================
// 🎨 УТИЛИТАРНЫЕ КЛАССЫ
// ============================================
export const UTILS = {
  // Скрыть на мобильных
  hideMobile: 'hidden sm:block',
  
  // Показать только на мобильных
  showMobile: 'block sm:hidden',
  
  // Контейнер с отступами
  container: 'px-4 sm:px-6 lg:px-8',
  
  // Ограничение ширины
  constrain: 'max-w-[800px] mx-auto',
  
  // Стек элементов
  stack: 'flex flex-col gap-6',
  
  // Сетка
  grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
} as const

// ============================================
// 🔧 ХЕЛПЕРЫ
// ============================================

/**
 * Объединяет классы с учётом условий
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Генерирует классы для карточки секции
 */
export function getCardClasses(interactive = false): string {
  return cn(
    FORM_STYLES.card.base,
    FORM_STYLES.card.padding,
    interactive && FORM_STYLES.card.hover
  )
}

/**
 * Генерирует классы для поля ввода
 */
export function getInputClasses(hasError = false): string {
  return cn(
    FORM_STYLES.input.base,
    hasError && FORM_STYLES.input.error
  )
}

/**
 * Генерирует классы для textarea
 */
export function getTextareaClasses(hasError = false): string {
  return cn(
    FORM_STYLES.textarea.base,
    hasError && FORM_STYLES.textarea.error
  )
}

/**
 * Генерирует классы для label
 */
export function getLabelClasses(required = false): string {
  return cn(
    FORM_STYLES.label.base,
    required && FORM_STYLES.label.required
  )
}




