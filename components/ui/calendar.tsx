'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4', className)}
      style={{
        // CSS для переопределения layout
        ['--rdp-accent-color' as string]: '#f97316',
        ['--rdp-accent-background-color' as string]: '#fff7ed',
      }}
      classNames={{
        // Главный контейнер месяца — делаем grid для правильного layout
        months: 'relative',
        month: 'space-y-4',
        // Навигация — позиционируем абсолютно справа сверху
        nav: 'absolute top-0 right-0 flex items-center gap-1 z-10',
        button_previous: cn(
          'h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full',
          'inline-flex items-center justify-center transition-colors',
          'text-gray-600 hover:text-gray-900'
        ),
        button_next: cn(
          'h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full',
          'inline-flex items-center justify-center transition-colors',
          'text-gray-600 hover:text-gray-900'
        ),
        // Шапка месяца
        month_caption: 'flex items-center h-8 mb-4',
        caption_label: 'text-base font-semibold text-gray-900',
        // Таблица
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-gray-500 w-10 font-medium text-xs text-center',
        week: 'flex w-full mt-1',
        day: 'h-10 w-10 text-center text-sm p-0',
        day_button: cn(
          'h-10 w-10 p-0 font-normal rounded-full inline-flex items-center justify-center',
          'hover:bg-orange-100 hover:text-orange-700 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
          'aria-selected:opacity-100'
        ),
        selected: cn(
          'bg-orange-500 text-white rounded-full',
          'hover:bg-orange-600 hover:text-white',
          'focus:bg-orange-500 focus:text-white'
        ),
        today: 'bg-gray-100 text-gray-900 font-semibold rounded-full',
        outside: 'text-gray-300 opacity-50',
        disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
        hidden: 'invisible',
        // Старые классы для совместимости (v8)
        caption: 'flex items-center h-8 mb-4',
        nav_button: cn(
          'h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full',
          'inline-flex items-center justify-center transition-colors',
          'text-gray-600 hover:text-gray-900'
        ),
        nav_button_previous: 'absolute right-10 top-0',
        nav_button_next: 'absolute right-0 top-0',
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'text-gray-500 w-10 font-medium text-xs text-center',
        row: 'flex w-full mt-1',
        cell: 'h-10 w-10 text-center text-sm p-0',
        day_selected: cn(
          'bg-orange-500 text-white rounded-full',
          'hover:bg-orange-600 hover:text-white',
          'focus:bg-orange-500 focus:text-white'
        ),
        day_today: 'bg-gray-100 text-gray-900 font-semibold rounded-full',
        day_outside: 'text-gray-300 opacity-50',
        day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') {
            return <ChevronLeft className="h-5 w-5" />
          }
          return <ChevronRight className="h-5 w-5" />
        },
        // Старые компоненты для совместимости
        IconLeft: () => <ChevronLeft className="h-5 w-5" />,
        IconRight: () => <ChevronRight className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
