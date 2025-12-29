/**
 * Обёртка для полей формы с единым стилем
 * Модульный компонент для всех типов полей
 */

import { ReactNode } from 'react'
import { cn, getLabelClasses } from '@/lib/design-system'

interface FormFieldWrapperProps {
  label: string
  required?: boolean
  description?: string
  error?: string
  children: ReactNode
  className?: string
  action?: ReactNode
  hint?: string
}

export function FormFieldWrapper({
  label,
  required = false,
  description,
  error,
  children,
  className,
  action,
  hint,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label и action */}
      <div className="flex items-center justify-between">
        <label className={getLabelClasses(required)}>
          {label}
        </label>
        {action}
      </div>

      {/* Description (если есть) */}
      {description && (
        <p className="text-xs text-slate-500 -mt-1">
          {description}
        </p>
      )}

      {/* Поле ввода */}
      {children}

      {/* Hint (подсказка) */}
      {hint && !error && (
        <p className="text-xs text-slate-500">
          {hint}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}




